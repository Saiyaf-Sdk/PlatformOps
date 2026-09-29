package com.platformops.security;

import com.platformops.config.AppProperties;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/** Sliding-window limiter for auth endpoints, keyed by client IP (single-instance, in memory). */
@Component
public class LoginRateLimiter {

    private static final long WINDOW_MS = 60_000;
    private final Map<String, Deque<Long>> hits = new ConcurrentHashMap<>();
    private final int limit;
    private final Clock clock;

    public LoginRateLimiter(AppProperties props, Clock clock) {
        this.limit = props.security().loginRateLimitPerMinute();
        this.clock = clock;
    }

    /** Records an attempt; returns false when the caller is over the limit. */
    public boolean tryAcquire(String key) {
        long now = clock.millis();
        Deque<Long> q = hits.computeIfAbsent(key == null ? "unknown" : key, k -> new ArrayDeque<>());
        synchronized (q) {
            while (!q.isEmpty() && now - q.peekFirst() > WINDOW_MS) q.pollFirst();
            if (q.size() >= limit) return false;
            q.addLast(now);
            return true;
        }
    }

    @Scheduled(fixedDelay = 300_000)
    void evictIdle() {
        long now = clock.millis();
        hits.entrySet().removeIf(e -> {
            synchronized (e.getValue()) {
                Long last = e.getValue().peekLast();
                return last == null || now - last > WINDOW_MS;
            }
        });
    }
}
