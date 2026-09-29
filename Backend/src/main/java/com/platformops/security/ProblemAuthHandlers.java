package com.platformops.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/** 401/403 raised by the security filter chain, rendered in the same problem+json shape as the API. */
@Component
public class ProblemAuthHandlers {

    private final ObjectMapper mapper;

    public ProblemAuthHandlers(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    private void write(HttpServletRequest req, HttpServletResponse res, HttpStatus status, String code, String detail) throws IOException {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("type", "https://platformops.dev/errors/" + code);
        body.put("title", status.getReasonPhrase());
        body.put("status", status.value());
        body.put("detail", detail);
        body.put("code", code);
        body.put("timestamp", Instant.now().toString());
        body.put("path", req.getRequestURI());
        res.setStatus(status.value());
        res.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        mapper.writeValue(res.getOutputStream(), body);
    }

    public AuthenticationEntryPoint entryPoint() {
        return (req, res, ex) -> write(req, res, HttpStatus.UNAUTHORIZED, "unauthorized", "Authentication required");
    }

    public AccessDeniedHandler accessDenied() {
        return (req, res, ex) -> write(req, res, HttpStatus.FORBIDDEN, "forbidden", "You don't have permission to do that");
    }
}
