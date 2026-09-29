package com.platformops.event;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;

/** Fan-out of LiveEvents to connected browsers over Server-Sent Events. */
@Service
public class LiveEventService {

    private static final Logger log = LoggerFactory.getLogger(LiveEventService.class);
    private static final long TIMEOUT_MS = 30 * 60 * 1000L; // clients reconnect automatically
    private static final int MAX_SUBSCRIBERS = 500;

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();
    private final AtomicLong sequence = new AtomicLong();

    public SseEmitter subscribe() {
        if (emitters.size() >= MAX_SUBSCRIBERS) {
            SseEmitter e = new SseEmitter(0L);
            e.complete();
            return e;
        }
        SseEmitter emitter = new SseEmitter(TIMEOUT_MS);
        emitters.add(emitter);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> { emitters.remove(emitter); emitter.complete(); });
        emitter.onError(e -> emitters.remove(emitter));
        try {
            emitter.send(SseEmitter.event().name("ready").data("{\"ok\":true}", MediaType.APPLICATION_JSON).reconnectTime(3000));
        } catch (IOException e) {
            emitters.remove(emitter);
        }
        return emitter;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onLiveEvent(LiveEvent event) {
        broadcast(event);
    }

    public void broadcast(LiveEvent event) {
        String id = String.valueOf(sequence.incrementAndGet());
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().id(id).name(event.type()).data(event, MediaType.APPLICATION_JSON));
            } catch (IOException | IllegalStateException e) {
                emitters.remove(emitter);
                log.debug("Dropped SSE subscriber: {}", e.getMessage());
            }
        }
    }

    @Scheduled(fixedRate = 20_000)
    void heartbeat() {
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().comment("keep-alive"));
            } catch (IOException | IllegalStateException e) {
                emitters.remove(emitter);
            }
        }
    }

    public int subscriberCount() {
        return emitters.size();
    }
}
