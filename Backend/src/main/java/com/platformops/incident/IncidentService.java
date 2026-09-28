package com.platformops.incident;

import com.platformops.app.Application;
import com.platformops.app.ApplicationService;
import com.platformops.audit.AuditService;
import com.platformops.common.ApiException;
import com.platformops.common.PageResponse;
import com.platformops.common.Pages;
import com.platformops.common.Specs;
import com.platformops.deployment.Deployment;
import com.platformops.environment.Environment;
import com.platformops.environment.EnvironmentService;
import com.platformops.event.LiveEvent;
import com.platformops.incident.IncidentDtos.*;
import com.platformops.security.CurrentUser;
import com.platformops.user.User;
import com.platformops.user.UserRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;

@Service
public class IncidentService {

    private final IncidentRepository repo;
    private final ApplicationService apps;
    private final EnvironmentService envs;
    private final UserRepository users;
    private final AuditService audit;
    private final ApplicationEventPublisher events;
    private final Clock clock;

    public IncidentService(IncidentRepository repo, ApplicationService apps, EnvironmentService envs, UserRepository users,
                           AuditService audit, ApplicationEventPublisher events, Clock clock) {
        this.repo = repo;
        this.apps = apps;
        this.envs = envs;
        this.users = users;
        this.audit = audit;
        this.events = events;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public PageResponse<IncidentResponse> search(String q, IncidentStatus status, Severity severity, Long applicationId,
                                                 boolean openOnly, int page, int size) {
        Specification<Incident> spec = Specification.where(Specs.<Incident>containsAny(q, "title", "description"))
                .and(Specs.eq("status", status))
                .and(Specs.eq("severity", severity))
                .and(Specs.eqPath("application", "id", applicationId));
        if (openOnly) spec = spec.and((root, cq, cb) -> cb.notEqual(root.get("status"), IncidentStatus.RESOLVED));
        var sort = Sort.by(Sort.Order.asc("severity"), Sort.Order.desc("createdAt"));
        return PageResponse.of(repo.findAll(spec, Pages.of(page, size, sort)), IncidentResponse::from);
    }

    @Transactional(readOnly = true)
    public IncidentResponse get(Long id) {
        return IncidentResponse.from(find(id));
    }

    @Transactional
    public IncidentResponse create(CreateIncidentRequest req) {
        var me = CurrentUser.require();
        Application app = req.applicationId() == null ? null : apps.find(req.applicationId());
        Environment env = req.environment() == null ? null : envs.find(req.environment());
        Incident i = new Incident(req.title().trim(), trimOrNull(req.description()), req.severity(), app, env, null,
                users.getReferenceById(me.id()), clock.instant());
        if (req.assigneeId() != null) i.setAssignee(activeUser(req.assigneeId()));
        i = repo.save(i);
        audit.record("INCIDENT_OPENED", "INCIDENT", i.getId(), i.getSeverity() + " · " + i.getTitle());
        IncidentResponse res = IncidentResponse.from(repo.findDetailed(i.getId()).orElseThrow());
        events.publishEvent(LiveEvent.of("incident.created", res));
        return res;
    }

    /** Opened automatically by the pipeline when a production rollout fails. */
    @Transactional
    public Incident openForFailedDeployment(Deployment d, String reason) {
        Instant now = clock.instant();
        Incident i = new Incident(
                "Production deployment failed: " + d.getApplication().getName() + " " + d.getReleaseVersion(),
                reason + "\n\nOpened automatically by the release pipeline. Consider rolling back.",
                Severity.SEV2, d.getApplication(), d.getEnvironment(), d, null, now);
        i = repo.save(i);
        audit.recordAs(null, "pipeline", "INCIDENT_OPENED", "INCIDENT", i.getId(), "SEV2 · auto-opened for deployment #" + d.getId());
        events.publishEvent(LiveEvent.of("incident.created", IncidentResponse.from(i)));
        return i;
    }

    @Transactional
    public IncidentResponse update(Long id, UpdateIncidentRequest req) {
        Incident i = find(id);
        Instant now = clock.instant();
        StringBuilder changes = new StringBuilder();
        if (req.title() != null) { i.setTitle(req.title().trim()); changes.append("title; "); }
        if (req.description() != null) { i.setDescription(trimOrNull(req.description())); changes.append("description; "); }
        if (req.severity() != null && req.severity() != i.getSeverity()) {
            changes.append("severity ").append(i.getSeverity()).append("→").append(req.severity()).append("; ");
            i.setSeverity(req.severity());
        }
        if (Boolean.TRUE.equals(req.unassign())) {
            i.setAssignee(null);
            changes.append("unassigned; ");
        } else if (req.assigneeId() != null) {
            User a = activeUser(req.assigneeId());
            i.setAssignee(a);
            changes.append("assigned to ").append(a.getFullName()).append("; ");
        }
        if (req.status() != null && req.status() != i.getStatus()) {
            transition(i, req.status(), now);
            changes.append("status → ").append(req.status()).append("; ");
        }
        repo.saveAndFlush(i);
        String action = req.status() == IncidentStatus.RESOLVED ? "INCIDENT_RESOLVED"
                : req.status() == IncidentStatus.ACKNOWLEDGED ? "INCIDENT_ACKNOWLEDGED" : "INCIDENT_UPDATED";
        audit.record(action, "INCIDENT", i.getId(), changes.toString().trim());
        IncidentResponse res = IncidentResponse.from(i);
        events.publishEvent(LiveEvent.of("incident.updated", res));
        return res;
    }

    private void transition(Incident i, IncidentStatus to, Instant now) {
        switch (to) {
            case ACKNOWLEDGED -> {
                if (i.getStatus() == IncidentStatus.RESOLVED) {
                    throw ApiException.conflict("invalid_transition", "Reopen the incident instead of acknowledging a resolved one");
                }
                i.setAcknowledgedAt(now);
                if (i.getAssignee() == null) i.setAssignee(users.getReferenceById(CurrentUser.require().id()));
            }
            case RESOLVED -> {
                if (i.getAcknowledgedAt() == null) i.setAcknowledgedAt(now);
                i.setResolvedAt(now);
            }
            case OPEN -> { // reopen
                i.setResolvedAt(null);
            }
        }
        i.setStatus(to);
    }

    private User activeUser(Long id) {
        User u = users.findById(id).orElseThrow(() -> ApiException.notFound("User", id));
        if (!u.isEnabled()) throw ApiException.unprocessable("user_disabled", u.getFullName() + " is disabled and can't be assigned");
        return u;
    }

    private Incident find(Long id) {
        return repo.findDetailed(id).orElseThrow(() -> ApiException.notFound("Incident", id));
    }

    private static String trimOrNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
