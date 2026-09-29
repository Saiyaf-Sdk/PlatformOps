package com.platformops.event;

import java.time.Instant;

/**
 * Something the UI should hear about in real time. Published through Spring's event bus and
 * forwarded to SSE subscribers only after the surrounding transaction commits.
 */
public record LiveEvent(String type, Object payload, Instant at) {
    public static LiveEvent of(String type, Object payload) {
        return new LiveEvent(type, payload, Instant.now());
    }
}
