package com.platformops.deployment;

import com.platformops.app.Application;
import com.platformops.app.ApplicationRepository;
import com.platformops.audit.AuditService;
import com.platformops.common.ApiException;
import com.platformops.common.PageResponse;
import com.platformops.common.Pages;
import com.platformops.common.Specs;
import com.platformops.common.Texts;
import com.platformops.deployment.DeploymentDtos.*;
import com.platformops.environment.Environment;
import com.platformops.environment.EnvironmentCode;
import com.platformops.environment.EnvironmentService;
import com.platformops.event.LiveEvent;
import com.platformops.security.AuthUser;
import com.platformops.security.CurrentUser;
import com.platformops.user.Role;
import com.platformops.user.User;
import com.platformops.user.UserRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Clock;
import java.util.EnumSet;
import java.util.List;

@Service
public class DeploymentService {

    private static final EnumSet<DeploymentStatus> ACTIVE = EnumSet.of(DeploymentStatus.QUEUED, DeploymentStatus.RUNNING);

    private final DeploymentRepository repo;
    private final DeploymentLogRepository logs;
    private final ApplicationRepository apps;
    private final EnvironmentService envs;
    private final UserRepository users;
    private final PipelineRunner runner;
    private final AuditService audit;
    private final ApplicationEventPublisher events;
    private final Clock clock;

    public DeploymentService(DeploymentRepository repo, DeploymentLogRepository logs, ApplicationRepository apps,
                             EnvironmentService envs, UserRepository users, PipelineRunner runner, AuditService audit,
                             ApplicationEventPublisher events, Clock clock) {
        this.repo = repo;
        this.logs = logs;
        this.apps = apps;
        this.envs = envs;
        this.users = users;
        this.runner = runner;
        this.audit = audit;
        this.events = events;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public PageResponse<DeploymentResponse> search(Long applicationId, EnvironmentCode environment, DeploymentStatus status,
                                                   String q, boolean activeOnly, int page, int size) {
        Specification<Deployment> spec = Specification.where(Specs.<Deployment>eqPath("application", "id", applicationId))
                .and(Specs.eqPath("environment", "code", environment))
                .and(Specs.eq("status", status))
                .and(Specs.containsAny(q, "releaseVersion"));
        if (activeOnly) spec = spec.and((root, cq, cb) -> root.get("status").in(ACTIVE));
        return PageResponse.of(repo.findAll(spec, Pages.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt", "id"))),
                DeploymentResponse::from);
    }

    @Transactional(readOnly = true)
    public DeploymentResponse get(Long id) {
        return DeploymentResponse.from(find(id));
    }

    @Transactional(readOnly = true)
    public List<LogResponse> logs(Long id) {
        find(id);
        return logs.findByDeploymentIdOrderByIdAsc(id).stream().map(LogResponse::from).toList();
    }

    @Transactional
    public DeploymentResponse create(CreateDeploymentRequest req) {
        AuthUser me = CurrentUser.require();
        Application app = apps.findByIdForUpdate(req.applicationId())
                .orElseThrow(() -> ApiException.notFound("Application", req.applicationId()));
        Environment env = envs.find(req.environment());
        String version = req.version().trim();
        boolean force = Boolean.TRUE.equals(req.force());

        checkCanDeployTo(me, env.getCode());
        if (force && me.role() != Role.ADMIN) {
            throw ApiException.forbidden("Only administrators can skip the promotion rules");
        }
        if (repo.existsByApplicationIdAndEnvironmentIdAndStatusIn(app.getId(), env.getId(), ACTIVE)) {
            throw ApiException.conflict("deployment_in_progress",
                    app.getName() + " is already being deployed to " + env.getDisplayName() + ". Wait for it or cancel it.");
        }
        if (env.getCode() == EnvironmentCode.PRODUCTION && !force
                && !repo.existsByApplicationIdAndEnvironmentCodeAndReleaseVersionAndStatus(app.getId(), EnvironmentCode.STAGING, version, DeploymentStatus.SUCCEEDED)) {
            throw ApiException.unprocessable("promotion_required",
                    version + " hasn't passed Staging yet. Deploy it to Staging first, then promote to Production.");
        }

        Deployment d = repo.save(new Deployment(app, env, version, users.getReferenceById(me.id()),
                Texts.blankToNull(req.notes()), null, clock.instant()));
        audit.record("DEPLOYMENT_REQUESTED", "DEPLOYMENT", d.getId(),
                app.getName() + " " + version + " → " + env.getCode() + (force ? " (forced)" : ""));
        return queue(d);
    }

    @Transactional
    public DeploymentResponse rollback(Long id, RollbackRequest req) {
        AuthUser me = CurrentUser.require();
        Deployment target = find(id);
        Application app = apps.findByIdForUpdate(target.getApplication().getId()).orElseThrow();
        Environment env = target.getEnvironment();
        checkCanDeployTo(me, env.getCode());
        if (target.getStatus().isActive()) {
            throw ApiException.conflict("deployment_in_progress", "Cancel the running deployment instead of rolling it back");
        }
        if (repo.existsByApplicationIdAndEnvironmentIdAndStatusIn(app.getId(), env.getId(), ACTIVE)) {
            throw ApiException.conflict("deployment_in_progress", app.getName() + " is already being deployed to " + env.getDisplayName());
        }
        Deployment previous = repo.previousWithStatus(app.getId(), env.getId(), target.getId(), target.getReleaseVersion(),
                        DeploymentStatus.SUCCEEDED, PageRequest.of(0, 1))
                .stream().findFirst()
                .orElseThrow(() -> ApiException.unprocessable("no_previous_release",
                        "There is no earlier successful release of " + app.getName() + " on " + env.getDisplayName() + " to roll back to"));

        String notes = "Rollback of #" + target.getId() + " (" + target.getReleaseVersion() + ")"
                + (req != null && Texts.blankToNull(req.reason()) != null ? ": " + req.reason().trim() : "");
        User actor = users.getReferenceById(me.id());
        Deployment d = repo.save(new Deployment(app, env, previous.getReleaseVersion(), actor, Texts.truncate(notes, 500), target, clock.instant()));
        audit.record("DEPLOYMENT_ROLLBACK", "DEPLOYMENT", d.getId(),
                app.getName() + " " + target.getReleaseVersion() + " → " + previous.getReleaseVersion() + " on " + env.getCode());
        return queue(d);
    }

    @Transactional
    public DeploymentResponse cancel(Long id) {
        AuthUser me = CurrentUser.require();
        Deployment d = find(id);
        checkCanDeployTo(me, d.getEnvironment().getCode());
        if (!d.getStatus().isActive()) {
            throw ApiException.conflict("not_running", "Deployment #" + id + " has already finished (" + d.getStatus() + ")");
        }
        int cancelledNow = repo.cancelIfQueued(id, clock.instant(), DeploymentStatus.CANCELLED, DeploymentStatus.QUEUED);
        if (cancelledNow == 0) repo.requestCancel(id); // running: the pipeline stops at the next safe point
        audit.record("DEPLOYMENT_CANCEL_REQUESTED", "DEPLOYMENT", id, d.getApplication().getName() + " " + d.getReleaseVersion());
        DeploymentResponse res = DeploymentResponse.from(find(id));
        events.publishEvent(LiveEvent.of("deployment.updated", res));
        return res;
    }

    private DeploymentResponse queue(Deployment d) {
        DeploymentResponse res = DeploymentResponse.from(d);
        events.publishEvent(LiveEvent.of("deployment.created", res));
        Long id = d.getId();
        // Start only after commit, so the pipeline thread is guaranteed to see the row.
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                runner.submit(id);
            }
        });
        return res;
    }

    private void checkCanDeployTo(AuthUser me, EnvironmentCode code) {
        if (me.role() == Role.VIEWER) throw ApiException.forbidden("Viewers can't deploy");
        if (me.role() == Role.DEVELOPER && code == EnvironmentCode.PRODUCTION) {
            throw new ApiException(HttpStatus.FORBIDDEN, "forbidden", "Developers can deploy to Dev and Staging. Ask DevOps to promote to Production.");
        }
    }

    private Deployment find(Long id) {
        return repo.findDetailed(id).orElseThrow(() -> ApiException.notFound("Deployment", id));
    }
}
