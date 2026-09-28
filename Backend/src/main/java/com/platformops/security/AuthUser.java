package com.platformops.security;

import com.platformops.user.Role;

/** The authenticated principal carried in the SecurityContext (built from the JWT, no DB hit). */
public record AuthUser(Long id, String email, Role role) {
    public boolean isAtLeast(Role min) {
        return rank(role) <= rank(min);
    }

    private static int rank(Role r) {
        return switch (r) {
            case ADMIN -> 0;
            case DEVOPS -> 1;
            case DEVELOPER -> 2;
            case VIEWER -> 3;
        };
    }
}
