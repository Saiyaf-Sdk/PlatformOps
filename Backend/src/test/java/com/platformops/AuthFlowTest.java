package com.platformops;

import com.fasterxml.jackson.databind.JsonNode;
import com.platformops.user.Role;
import com.platformops.user.User;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthFlowTest extends ApiTestBase {

    @Test
    void loginReturnsTokensAndMeWorks() throws Exception {
        User u = createUser(Role.DEVOPS);
        JsonNode tokens = login(u.getEmail(), PASSWORD);
        assertThat(tokens.get("tokenType").asText()).isEqualTo("Bearer");
        assertThat(tokens.get("refreshToken").asText()).hasSizeGreaterThan(40);

        get("/api/v1/auth/me", tokens.get("accessToken").asText())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(u.getEmail()))
                .andExpect(jsonPath("$.role").value("DEVOPS"))
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    void emailIsCaseInsensitive() throws Exception {
        User u = createUser(Role.VIEWER);
        login(u.getEmail().toUpperCase(), PASSWORD);
    }

    @Test
    void wrongPasswordAndUnknownEmailLookTheSame() throws Exception {
        User u = createUser(Role.VIEWER);
        postJson("/api/v1/auth/login", null, Map.of("email", u.getEmail(), "password", "nope-12345"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("invalid_credentials"));
        postJson("/api/v1/auth/login", null, Map.of("email", "ghost@test.dev", "password", "nope-12345"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("invalid_credentials"));
    }

    @Test
    void accountLocksAfterRepeatedFailures() throws Exception {
        User u = createUser(Role.VIEWER);
        for (int i = 0; i < 5; i++) {
            postJson("/api/v1/auth/login", null, Map.of("email", u.getEmail(), "password", "wrong-pass1"))
                    .andExpect(status().isUnauthorized());
        }
        // even the right password is refused while locked
        postJson("/api/v1/auth/login", null, Map.of("email", u.getEmail(), "password", PASSWORD))
                .andExpect(status().isLocked())
                .andExpect(jsonPath("$.code").value("account_locked"));
    }

    @Test
    void refreshRotatesAndDetectsReuse() throws Exception {
        User u = createUser(Role.DEVELOPER);
        String first = login(u.getEmail(), PASSWORD).get("refreshToken").asText();

        JsonNode rotated = read(postJson("/api/v1/auth/refresh", null, Map.of("refreshToken", first)).andExpect(status().isOk()));
        String second = rotated.get("refreshToken").asText();
        assertThat(second).isNotEqualTo(first);

        // replaying the old token = theft signal → every session revoked
        postJson("/api/v1/auth/refresh", null, Map.of("refreshToken", first))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("session_revoked"));
        postJson("/api/v1/auth/refresh", null, Map.of("refreshToken", second))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void logoutRevokesRefreshToken() throws Exception {
        User u = createUser(Role.DEVELOPER);
        String refresh = login(u.getEmail(), PASSWORD).get("refreshToken").asText();
        postJson("/api/v1/auth/logout", null, Map.of("refreshToken", refresh)).andExpect(status().isNoContent());
        postJson("/api/v1/auth/refresh", null, Map.of("refreshToken", refresh)).andExpect(status().isUnauthorized());
    }

    @Test
    void protectedEndpointsNeedAValidToken() throws Exception {
        get("/api/v1/applications", null)
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("unauthorized"));
        get("/api/v1/applications", "not.a.jwt").andExpect(status().isUnauthorized());
    }

    @Test
    void disabledUserCannotSignIn() throws Exception {
        User u = createUser(Role.DEVELOPER);
        u.setEnabled(false);
        users.save(u);
        postJson("/api/v1/auth/login", null, Map.of("email", u.getEmail(), "password", PASSWORD))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("account_disabled"));
    }

    @Test
    void validationErrorsAreDescriptive() throws Exception {
        postJson("/api/v1/auth/login", null, Map.of("email", "not-an-email", "password", ""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("validation_failed"))
                .andExpect(jsonPath("$.errors.email").exists())
                .andExpect(jsonPath("$.errors.password").exists());
    }

    @Test
    void changePasswordRevokesOtherSessions() throws Exception {
        User u = createUser(Role.DEVOPS);
        JsonNode t = login(u.getEmail(), PASSWORD);
        call(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/v1/auth/password"),
                t.get("accessToken").asText(), Map.of("currentPassword", PASSWORD, "newPassword", "Brand-new-99"))
                .andExpect(status().isNoContent());
        postJson("/api/v1/auth/refresh", null, Map.of("refreshToken", t.get("refreshToken").asText()))
                .andExpect(status().isUnauthorized());
        login(u.getEmail(), "Brand-new-99");
    }
}
