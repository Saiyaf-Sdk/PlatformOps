package com.platformops.user;

/**
 * ADMIN     – everything, including people & access
 * DEVOPS    – manage applications, deploy anywhere, run incidents, read audit log
 * DEVELOPER – register applications, deploy to DEV and STAGING, report incidents
 * VIEWER    – read-only
 */
public enum Role {
    ADMIN, DEVOPS, DEVELOPER, VIEWER;

    public String authority() { return "ROLE_" + name(); }
}
