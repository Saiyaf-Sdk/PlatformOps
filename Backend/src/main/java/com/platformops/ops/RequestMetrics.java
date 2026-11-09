package com.platformops.ops;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentLinkedDeque;

/** Bounded, five-minute measurements of this API process; never stores request bodies or tokens. */
@Component
public class RequestMetrics extends OncePerRequestFilter {
    private record Sample(long at, double ms, int status) {}
    private final ConcurrentLinkedDeque<Sample> samples = new ConcurrentLinkedDeque<>();
    private final long started = System.currentTimeMillis();
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) throws ServletException, IOException {
        long start = System.nanoTime();
        try { chain.doFilter(req, res); }
        finally {
            if (req.getRequestURI().startsWith("/api/") && !req.getRequestURI().contains("/events/stream")) {
                samples.add(new Sample(System.currentTimeMillis(), (System.nanoTime() - start) / 1_000_000.0, res.getStatus()));
                trim();
            }
        }
    }
    private void trim() {
        long cutoff = System.currentTimeMillis() - 300_000;
        while (!samples.isEmpty() && (samples.size() > 5000 || samples.peekFirst().at < cutoff)) samples.pollFirst();
    }
    public record Measurement(int requests, double requestsPerMinute, double errorPercent, double p95LatencyMs, long windowSeconds, Instant measuredAt) {}
    public synchronized Measurement measurement() {
        trim();
        List<Sample> values = List.copyOf(samples);
        long seconds = Math.max(1, Math.min(300, (System.currentTimeMillis() - started) / 1000));
        double[] times = values.stream().mapToDouble(Sample::ms).sorted().toArray();
        double p95 = times.length == 0 ? 0 : times[Math.min(times.length - 1, (int)Math.ceil(times.length * .95) - 1)];
        long failures = values.stream().filter(s -> s.status >= 500).count();
        return new Measurement(values.size(), values.size() * 60.0 / seconds, values.isEmpty() ? 0 : failures * 100.0 / values.size(), p95, seconds, Instant.now());
    }
}
