package com.platformops;

import com.fasterxml.jackson.databind.JsonNode;
import com.platformops.user.Role;
import com.platformops.user.User;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class IncidentUserAuditTest extends ApiTestBase {

    @Test
    void incidentLifecycle() throws Exception {
        String ops = tokenFor(Role.DEVOPS);
        long app = createApp(ops, unique("inc"));
        var created = postJson("/api/v1/incidents", ops, Map.of("title", "Checkout latency", "severity", "SEV3",
                "applicationId", app, "environment", "PRODUCTION"));
        created.andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andExpect(jsonPath("$.application.id").value(app))
                .andExpect(jsonPath("$.environment.code").value("PRODUCTION"));
        long id = read(created).get("id").asLong();

        patchJson("/api/v1/incidents/" + id, ops, Map.of("status", "ACKNOWLEDGED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACKNOWLEDGED"))
                .andExpect(jsonPath("$.assignee").exists())
                .andExpect(jsonPath("$.acknowledgedAt").exists());

        patchJson("/api/v1/incidents/" + id, ops, Map.of("status", "RESOLVED", "severity", "SEV4"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVED"))
                .andExpect(jsonPath("$.severity").value("SEV4"))
                .andExpect(jsonPath("$.resolvedAt").exists());

        patchJson("/api/v1/incidents/" + id, ops, Map.of("status", "ACKNOWLEDGED"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("invalid_transition"));
    }

    @Test
    void developersReportButCannotResolve() throws Exception {
        String dev = tokenFor(Role.DEVELOPER);
        var r = postJson("/api/v1/incidents", dev, Map.of("title", "Flaky tests", "severity", "SEV4"));
        r.andExpect(status().isCreated());
        long id = read(r).get("id").asLong();
        patchJson("/api/v1/incidents/" + id, dev, Map.of("status", "RESOLVED")).andExpect(status().isForbidden());
    }

    @Test
    void adminManagesPeopleWithGuardrails() throws Exception {
        User admin = createUser(Role.ADMIN);
        String t = login(admin.getEmail(), PASSWORD).get("accessToken").asText();
        String email = unique("new") + "@test.dev";

        var created = postJson("/api/v1/users", t, Map.of("email", email, "fullName", "New Person", "password", "Welcome123", "role", "DEVELOPER"));
        created.andExpect(status().isCreated()).andExpect(jsonPath("$.role").value("DEVELOPER"));
        long id = read(created).get("id").asLong();

        postJson("/api/v1/users", t, Map.of("email", email, "fullName", "Dup", "password", "Welcome123", "role", "VIEWER"))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("email_taken"));
        postJson("/api/v1/users", t, Map.of("email", unique("weak") + "@test.dev", "fullName", "Weak", "password", "short", "role", "VIEWER"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors.password").exists());

        patchJson("/api/v1/users/" + id, t, Map.of("role", "DEVOPS")).andExpect(jsonPath("$.role").value("DEVOPS"));
        patchJson("/api/v1/users/" + admin.getId(), t, Map.of("enabled", false))
                .andExpect(status().isConflict());

        // non-admins can't manage people
        postJson("/api/v1/users", tokenFor(Role.DEVOPS), Map.of("email", unique("x") + "@test.dev", "fullName", "X", "password", "Welcome123", "role", "VIEWER"))
                .andExpect(status().isForbidden());
    }

    @Test
    void everyChangeLandsInTheAuditLog() throws Exception {
        String ops = tokenFor(Role.DEVOPS);
        String name = unique("audited");
        createApp(ops, name);
        JsonNode page = read(get("/api/v1/audit-events?action=APPLICATION_CREATED&q=" + name, ops).andExpect(status().isOk()));
        assertThat(page.get("totalElements").asInt()).isEqualTo(1);
        assertThat(page.get("content").get(0).get("details").asText()).contains(name);

        get("/api/v1/audit-events", tokenFor(Role.DEVELOPER)).andExpect(status().isForbidden());
    }

    @Test
    void failedLoginsAreAuditedEvenThoughTheRequestFails() throws Exception {
        User u = createUser(Role.VIEWER);
        postJson("/api/v1/auth/login", null, Map.of("email", u.getEmail(), "password", "wrong-pass1")).andExpect(status().isUnauthorized());
        JsonNode page = read(get("/api/v1/audit-events?action=LOGIN_FAILED&actorId=" + u.getId(), tokenFor(Role.ADMIN)));
        assertThat(page.get("totalElements").asInt()).isGreaterThanOrEqualTo(1);
    }

    @Test
    void dashboardSummaryHasEverySection() throws Exception {
        String t = tokenFor(Role.VIEWER);
        get("/api/v1/dashboard/summary?tzOffsetMinutes=330", t)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.kpis.applications").isNumber())
                .andExpect(jsonPath("$.kpis.healthyPercent").isNumber())
                .andExpect(jsonPath("$.deployVolume.length()").value(14))
                .andExpect(jsonPath("$.environments.length()").value(3))
                .andExpect(jsonPath("$.environments[0].code").value("DEV"))
                .andExpect(jsonPath("$.recentDeployments").isArray());
    }

    @Test
    void environmentsAreListedInPipelineOrder() throws Exception {
        get("/api/v1/environments", tokenFor(Role.VIEWER))
                .andExpect(jsonPath("$[0].code").value("DEV"))
                .andExpect(jsonPath("$[1].code").value("STAGING"))
                .andExpect(jsonPath("$[2].code").value("PRODUCTION"))
                .andExpect(jsonPath("$[2].requiresApproval").value(true));
    }

    @Test
    void healthAndDocsArePublic() throws Exception {
        get("/actuator/health", null).andExpect(status().isOk());
        get("/v3/api-docs", null).andExpect(status().isOk());
        get("/api/v1/nope", tokenFor(Role.VIEWER)).andExpect(status().isNotFound());
    }
}
