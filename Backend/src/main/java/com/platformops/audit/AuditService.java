package com.platformops.audit;

import com.platformops.common.PageResponse;
import com.platformops.common.Pages;
import com.platformops.common.RequestContext;
import com.platformops.common.Specs;
import com.platformops.common.Texts;
import com.platformops.security.AuthUser;
import com.platformops.security.CurrentUser;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;

@Service
public class AuditService {

    private final AuditEventRepository repo;
    private final Clock clock;

    public AuditService(AuditEventRepository repo, Clock clock) {
        this.repo = repo;
        this.clock = clock;
    }

    public record AuditResponse(Long id, Long actorId, String actorEmail, String action, String entityType,
                                String entityId, String details, String ipAddress, Instant createdAt) {
        static AuditResponse from(AuditEvent e) {
            return new AuditResponse(e.getId(), e.getActorId(), e.getActorEmail(), e.getAction(), e.getEntityType(),
                    e.getEntityId(), e.getDetails(), e.getIpAddress(), e.getCreatedAt());
        }
    }

    /** Records an event as part of the caller's transaction (rolled back together). */
    @Transactional(propagation = Propagation.REQUIRED)
    public void record(String action, String entityType, Object entityId, String details) {
        AuthUser u = CurrentUser.get().orElse(null);
        save(u == null ? null : u.id(), u == null ? "system" : u.email(), action, entityType, entityId, details);
    }

    /** Records an event that must survive even if the surrounding operation fails (e.g. failed logins). */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordIndependent(Long actorId, String actorEmail, String action, String entityType, Object entityId, String details) {
        save(actorId, actorEmail, action, entityType, entityId, details);
    }

    /** Records an event on behalf of a known actor (used by background jobs). */
    @Transactional(propagation = Propagation.REQUIRED)
    public void recordAs(Long actorId, String actorEmail, String action, String entityType, Object entityId, String details) {
        save(actorId, actorEmail, action, entityType, entityId, details);
    }

    private void save(Long actorId, String actorEmail, String action, String entityType, Object entityId, String details) {
        repo.save(new AuditEvent(actorId, Texts.truncate(actorEmail, 254), action, entityType,
                entityId == null ? null : Texts.truncate(String.valueOf(entityId), 64),
                Texts.truncate(details, 2000), RequestContext.clientIp(), clock.instant()));
    }

    @Transactional(readOnly = true)
    public PageResponse<AuditResponse> search(String q, String action, String entityType, Long actorId, int page, int size) {
        Specification<AuditEvent> spec = Specification.where(Specs.<AuditEvent>containsAny(q, "details", "actorEmail", "action", "entityId"))
                .and(Specs.eq("action", Texts.blankToNull(action)))
                .and(Specs.eq("entityType", Texts.blankToNull(entityType)))
                .and(Specs.eq("actorId", actorId));
        return PageResponse.of(repo.findAll(spec, Pages.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt", "id"))), AuditResponse::from);
    }
}
