package com.platformops.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Reads "Authorization: Bearer <jwt>". For the SSE stream only, browsers' EventSource
 * cannot set headers, so an "access_token" query parameter is accepted on that one path.
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    public static final String STREAM_PATH = "/api/v1/events/stream";
    private final JwtService jwt;

    public JwtAuthenticationFilter(JwtService jwt) {
        this.jwt = jwt;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) throws ServletException, IOException {
        String token = null;
        String header = req.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.regionMatches(true, 0, "Bearer ", 0, 7)) {
            token = header.substring(7).trim();
        } else if (STREAM_PATH.equals(req.getRequestURI())) {
            token = req.getParameter("access_token");
        }

        if (token != null && !token.isEmpty() && SecurityContextHolder.getContext().getAuthentication() == null) {
            jwt.parseAccessToken(token).ifPresent(user -> {
                var auth = new UsernamePasswordAuthenticationToken(user, null,
                        List.of(new SimpleGrantedAuthority(user.role().authority())));
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(req));
                SecurityContextHolder.getContext().setAuthentication(auth);
            });
        }
        chain.doFilter(req, res);
    }
}
