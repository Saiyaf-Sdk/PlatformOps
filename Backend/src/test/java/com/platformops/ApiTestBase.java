package com.platformops;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.platformops.user.Role;
import com.platformops.user.User;
import com.platformops.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class ApiTestBase {

    protected static final String PASSWORD = "Test@12345";

    @Autowired protected MockMvc mvc;
    @Autowired protected ObjectMapper json;
    @Autowired protected UserRepository users;
    @Autowired protected PasswordEncoder encoder;

    protected static String unique(String prefix) {
        return prefix + "-" + UUID.randomUUID().toString().substring(0, 8);
    }

    protected User createUser(Role role) {
        String email = unique(role.name().toLowerCase()) + "@test.dev";
        return users.save(new User(email, "Test " + role, encoder.encode(PASSWORD), role));
    }

    protected JsonNode login(String email, String password) throws Exception {
        String body = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", email, "password", password))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(body);
    }

    /** Creates a user with the role and returns a valid access token for them. */
    protected String tokenFor(Role role) throws Exception {
        User u = createUser(role);
        return login(u.getEmail(), PASSWORD).get("accessToken").asText();
    }

    protected ResultActions call(MockHttpServletRequestBuilder req, String token, Object body) throws Exception {
        if (token != null) req.header("Authorization", "Bearer " + token);
        if (body != null) req.contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body));
        return mvc.perform(req);
    }

    protected ResultActions get(String url, String token) throws Exception {
        return call(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get(url), token, null);
    }

    protected ResultActions postJson(String url, String token, Object body) throws Exception {
        return call(post(url), token, body);
    }

    protected ResultActions patchJson(String url, String token, Object body) throws Exception {
        return call(patch(url), token, body);
    }

    protected JsonNode read(ResultActions r) throws Exception {
        return json.readTree(r.andReturn().getResponse().getContentAsString());
    }

    /** Registers an application as a DevOps user and returns its id. */
    protected long createApp(String token, String name) throws Exception {
        var r = postJson("/api/v1/applications", token, Map.of(
                "name", name, "description", "Test service", "runtime", "Java 21 / Spring Boot",
                "ownerTeam", "Platform Team", "repoUrl", "org/" + name));
        r.andExpect(status().isCreated());
        return read(r).get("id").asLong();
    }
}
