package com.platformops.common;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

public final class RequestContext {
    private RequestContext() {}

    public static HttpServletRequest current() {
        var attrs = RequestContextHolder.getRequestAttributes();
        return attrs instanceof ServletRequestAttributes sra ? sra.getRequest() : null;
    }

    /**
     * Client IP. Behind a proxy set server.forward-headers-strategy=framework (FORWARD_HEADERS_STRATEGY)
     * so Spring rewrites the remote address from X-Forwarded-For; raw headers are never trusted here.
     */
    public static String clientIp(HttpServletRequest req) {
        if (req == null) return null;
        String ip = req.getRemoteAddr();
        return ip != null && ip.length() > 64 ? ip.substring(0, 64) : ip;
    }

    public static String clientIp() { return clientIp(current()); }

    public static String userAgent() {
        HttpServletRequest req = current();
        if (req == null) return null;
        String ua = req.getHeader("User-Agent");
        return ua == null ? null : (ua.length() > 255 ? ua.substring(0, 255) : ua);
    }
}
