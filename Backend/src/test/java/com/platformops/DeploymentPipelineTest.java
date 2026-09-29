package com.platformops;

import com.fasterxml.jackson.databind.JsonNode;
import com.platformops.user.Role;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class DeploymentPipelineTest extends ApiTestBase {

    private long deploy(String token, long appId, String env, String version) throws Exception {
        var r = postJson("/api/v1/deployments", token, Map.of("applicationId", appId, "environment", env, "version", version));
        r.andExpect(status().isAccepted());
        return read(r).get("id").asLong();
    }

    private JsonNode waitFinished(String token, long id) {
        final JsonNode[] last = new JsonNode[1];
        await().atMost(Duration.ofSeconds(20)).pollInterval(Duration.ofMillis(100)).until(() -> {
            last[0] = read(get("/api/v1/deployments/" + id, token));
            String s = last[0].get("status").asText();
            return !s.equals("QUEUED") && !s.equals("RUNNING");
        });
        return last[0];
    }

    @Test
    void releaseRunsThroughAllStagesAndPromotesToProduction() throws Exception {
        String t = tokenFor(Role.DEVOPS);
        long app = createApp(t, unique("rel"));

        JsonNode dev = waitFinished(t, deploy(t, app, "DEV", "v1.0.0"));
        assertThat(dev.get("status").asText()).isEqualTo("SUCCEEDED");
        assertThat(dev.get("progress").asInt()).isEqualTo(100);
        assertThat(dev.get("imageUri").asText()).contains(":v1.0.0");
        assertThat(dev.get("commitSha").asText()).hasSize(40);

        // production is blocked until staging has passed
        postJson("/api/v1/deployments", t, Map.of("applicationId", app, "environment", "PRODUCTION", "version", "v1.0.0"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("promotion_required"));

        assertThat(waitFinished(t, deploy(t, app, "STAGING", "v1.0.0")).get("status").asText()).isEqualTo("SUCCEEDED");
        long prodId = deploy(t, app, "PRODUCTION", "v1.0.0");
        assertThat(waitFinished(t, prodId).get("status").asText()).isEqualTo("SUCCEEDED");

        get("/api/v1/applications/" + app, t)
                .andExpect(jsonPath("$.currentVersion").value("v1.0.0"))
                .andExpect(jsonPath("$.status").value("HEALTHY"));

        JsonNode logs = read(get("/api/v1/deployments/" + prodId + "/logs", t));
        assertThat(logs.size()).isGreaterThan(5);
        assertThat(logs.toString()).contains("BUILD", "IMAGE", "DEPLOY", "VERIFY");
    }

    @Test
    void failedProductionRolloutOpensIncidentAndCanRollBack() throws Exception {
        String t = tokenFor(Role.DEVOPS);
        long app = createApp(t, unique("boom"));
        for (String v : new String[]{"v2.0.0", "v2.0.1-fail"}) {
            waitFinished(t, deploy(t, app, "STAGING", v));
        }
        // staging run of the -fail build fails too, so force isn't possible for DevOps; stage a good one first
        waitFinished(t, deploy(t, app, "PRODUCTION", "v2.0.0"));

        String admin = tokenFor(Role.ADMIN);
        var forced = postJson("/api/v1/deployments", admin, Map.of("applicationId", app, "environment", "PRODUCTION",
                "version", "v2.0.1-fail", "force", true));
        forced.andExpect(status().isAccepted());
        long badId = read(forced).get("id").asLong();
        JsonNode bad = waitFinished(admin, badId);
        assertThat(bad.get("status").asText()).isEqualTo("FAILED");
        assertThat(bad.get("failureReason").asText()).contains("Health checks failed");

        get("/api/v1/applications/" + app, t).andExpect(jsonPath("$.status").value("CRITICAL"));
        get("/api/v1/incidents?openOnly=true&applicationId=" + app, t)
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].severity").value("SEV2"))
                .andExpect(jsonPath("$.content[0].deploymentId").value(badId));

        var rb = postJson("/api/v1/deployments/" + badId + "/rollback", t, Map.of("reason", "smoke tests red"));
        rb.andExpect(status().isAccepted()).andExpect(jsonPath("$.version").value("v2.0.0"))
                .andExpect(jsonPath("$.rollbackOfId").value(badId));
        assertThat(waitFinished(t, read(rb).get("id").asLong()).get("status").asText()).isEqualTo("SUCCEEDED");
        get("/api/v1/applications/" + app, t)
                .andExpect(jsonPath("$.status").value("HEALTHY"))
                .andExpect(jsonPath("$.currentVersion").value("v2.0.0"));
    }

    @Test
    void onlyAdminsMayForce() throws Exception {
        String t = tokenFor(Role.DEVOPS);
        long app = createApp(t, unique("force"));
        postJson("/api/v1/deployments", t, Map.of("applicationId", app, "environment", "PRODUCTION", "version", "v1.0.0", "force", true))
                .andExpect(status().isForbidden());
    }

    @Test
    void developersCannotDeployToProduction() throws Exception {
        String dev = tokenFor(Role.DEVELOPER);
        long app = createApp(dev, unique("devapp"));
        assertThat(waitFinished(dev, deploy(dev, app, "DEV", "v0.1.0")).get("status").asText()).isEqualTo("SUCCEEDED");
        postJson("/api/v1/deployments", dev, Map.of("applicationId", app, "environment", "PRODUCTION", "version", "v0.1.0"))
                .andExpect(status().isForbidden());
    }

    @Test
    void viewersCannotDeploy() throws Exception {
        String ops = tokenFor(Role.DEVOPS);
        long app = createApp(ops, unique("view"));
        postJson("/api/v1/deployments", tokenFor(Role.VIEWER), Map.of("applicationId", app, "environment", "DEV", "version", "v1.0.0"))
                .andExpect(status().isForbidden());
    }

    @Test
    void buildFailureIsReportedWithoutIncident() throws Exception {
        String t = tokenFor(Role.DEVOPS);
        long app = createApp(t, unique("bf"));
        JsonNode d = waitFinished(t, deploy(t, app, "DEV", "v1.0.0-build-fail"));
        assertThat(d.get("status").asText()).isEqualTo("FAILED");
        assertThat(d.get("currentStage").asText()).isEqualTo("BUILD");
        get("/api/v1/incidents?applicationId=" + app, t).andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void invalidVersionsAndUnknownAppsAreRejected() throws Exception {
        String t = tokenFor(Role.DEVOPS);
        long app = createApp(t, unique("val"));
        postJson("/api/v1/deployments", t, Map.of("applicationId", app, "environment", "DEV", "version", "latest"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors.version").exists());
        postJson("/api/v1/deployments", t, Map.of("applicationId", 999999, "environment", "DEV", "version", "v1.0.0"))
                .andExpect(status().isNotFound());
        postJson("/api/v1/deployments", t, Map.of("applicationId", app, "environment", "MOON", "version", "v1.0.0"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void cannotRollBackWithoutAnEarlierRelease() throws Exception {
        String t = tokenFor(Role.DEVOPS);
        long app = createApp(t, unique("norb"));
        long id = deploy(t, app, "DEV", "v1.0.0");
        waitFinished(t, id);
        postJson("/api/v1/deployments/" + id + "/rollback", t, null)
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("no_previous_release"));
    }

    @Test
    void finishedDeploymentsCannotBeCancelled() throws Exception {
        String t = tokenFor(Role.DEVOPS);
        long app = createApp(t, unique("cx"));
        long id = deploy(t, app, "DEV", "v1.0.0");
        waitFinished(t, id);
        postJson("/api/v1/deployments/" + id + "/cancel", t, null)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("not_running"));
    }
}
