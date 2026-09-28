package com.platformops.security;

import com.platformops.common.ApiException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

public final class CurrentUser {
    private CurrentUser() {}

    public static Optional<AuthUser> get() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AuthUser u) return Optional.of(u);
        return Optional.empty();
    }

    public static AuthUser require() {
        return get().orElseThrow(() -> ApiException.unauthorized("unauthorized", "Authentication required"));
    }
}
