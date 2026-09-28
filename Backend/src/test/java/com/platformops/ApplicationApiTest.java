package com.platformops;

import com.platformops.user.Role;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ApplicationApiTest extends ApiTestBase {

    @Test
    void devopsCanRegisterListUpdateAndDelete() throws Exception {
        String t = tokenFor(Role.DEVOPS);
        String name = unique("svc");
        long id = createApp(t, name);

        get("/api/v1/applications?q=" + name, t)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].name").value(name))
                .andExpect(jsonPath("$.content[0].status").value("HEALTHY"));

        patchJson("/api/v1/applications/" + id, t, Map.of("ownerTeam", "Core Team", "status", "WARNING"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ownerTeam").value("Core Team"))
                .andExpect(jsonPath("$.status").value("WARNING"));

        call(delete("/api/v1/applications/" + id), t, null).andExpect(status().isNoContent());
        get("/api/v1/applications/" + id, t).andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("not_found"));
    }

    @Test
    void duplicateNamesAreRejected() throws Exception {
        String t = tokenFor(Role.DEVOPS);
        String name = unique("dup");
        createApp(t, name);
        postJson("/api/v1/applications", t, Map.of("name", name, "description", "x", "runtime", "Go",
                "ownerTeam", "A", "repoUrl", "org/x"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("name_taken"));
    }

    @Test
    void namesMustBeKubernetesSafe() throws Exception {
        String t = tokenFor(Role.DEVOPS);
        postJson("/api/v1/applications", t, Map.of("name", "Bad Name!", "description", "x", "runtime", "Go",
                "ownerTeam", "A", "repoUrl", "not a repo"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.name").exists())
                .andExpect(jsonPath("$.errors.repoUrl").exists());
    }

    @Test
    void viewersAreReadOnly() throws Exception {
        String viewer = tokenFor(Role.VIEWER);
        get("/api/v1/applications", viewer).andExpect(status().isOk());
        postJson("/api/v1/applications", viewer, Map.of("name", unique("nope"), "description", "x", "runtime", "Go",
                "ownerTeam", "A", "repoUrl", "org/x"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("forbidden"));
    }

    @Test
    void developersCanRegisterButNotDelete() throws Exception {
        String dev = tokenFor(Role.DEVELOPER);
        long id = createApp(dev, unique("devsvc"));
        call(delete("/api/v1/applications/" + id), dev, null).andExpect(status().isForbidden());
    }

    @Test
    void filtersByStatusAndRuntime() throws Exception {
        String t = tokenFor(Role.DEVOPS);
        String name = unique("gosvc");
        postJson("/api/v1/applications", t, Map.of("name", name, "description", "x", "runtime", "Go 1.22",
                "ownerTeam", "A", "repoUrl", "org/" + name)).andExpect(status().isCreated());
        get("/api/v1/applications?runtime=go&q=" + name, t).andExpect(jsonPath("$.totalElements").value(1));
        get("/api/v1/applications?runtime=python&q=" + name, t).andExpect(jsonPath("$.totalElements").value(0));
        get("/api/v1/applications?status=NOT_A_STATUS", t).andExpect(status().isBadRequest());
    }

    @Test
    void pageSizeIsClamped() throws Exception {
        String t = tokenFor(Role.VIEWER);
        get("/api/v1/applications?size=100000", t).andExpect(jsonPath("$.size").value(100));
    }
}
