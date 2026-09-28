package com.platformops;

import com.platformops.seed.DemoDataSeeder;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.TestPropertySource;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Runs against its own fresh database with seeding switched on. */
@TestPropertySource(properties = {
        "app.seed.enabled=true",
        "spring.datasource.url=jdbc:h2:mem:seeded;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH;DB_CLOSE_DELAY=-1"
})
class DemoSeedTest extends ApiTestBase {

    @Test
    void seededPlatformIsUsable() throws Exception {
        String t = login(DemoDataSeeder.ADMIN_EMAIL, DemoDataSeeder.ADMIN_PASSWORD).get("accessToken").asText();
        get("/api/v1/applications", t).andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(6));
        get("/api/v1/incidents?openOnly=true", t).andExpect(jsonPath("$.totalElements").value(2));
        get("/api/v1/dashboard/summary", t)
                .andExpect(jsonPath("$.kpis.applications").value(6))
                .andExpect(jsonPath("$.kpis.openIncidents").value(2))
                .andExpect(jsonPath("$.recentDeployments.length()").value(8));
        get("/api/v1/users", t).andExpect(jsonPath("$.totalElements").value(6));
        login("nimal@platformops.dev", DemoDataSeeder.DEMO_PASSWORD);
    }
}
