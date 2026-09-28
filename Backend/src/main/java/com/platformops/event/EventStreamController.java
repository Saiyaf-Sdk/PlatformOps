package com.platformops.event;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/v1/events")
@Tag(name = "Live events")
public class EventStreamController {

    private final LiveEventService live;

    public EventStreamController(LiveEventService live) {
        this.live = live;
    }

    @Operation(summary = "Server-Sent Events stream (deployment.*, incident.*, application.*, environment.*)")
    @GetMapping(path = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(HttpServletResponse response) {
        response.setHeader("Cache-Control", "no-cache");
        response.setHeader("X-Accel-Buffering", "no"); // stop Nginx buffering the stream
        return live.subscribe();
    }
}
