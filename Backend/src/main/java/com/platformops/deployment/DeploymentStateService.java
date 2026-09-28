package com.platformops.deployment;

import com.platformops.app.AppStatus;
import com.platformops.app.Application;
import com.platformops.audit.AuditService;
import com.platformops.common.Texts;
import com.platformops.deployment.DeploymentDtos.DeploymentResponse;
import com.platformops.deployment.DeploymentDtos.LogResponse;
import com.platformops.deployment.pipeline.PipelineContext;
import com.platformops.environment.Environment;
import com.platformops.environment.EnvironmentCode;
import com.platformops.environment.EnvironmentService.EnvironmentResponse;
import com.platformops.environment.EnvironmentStatus;
import com.platformops.event.LiveEvent;
import com.platformops.incident.IncidentService;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.EnumSet;

/**
 * Every state change of a running deployment, each in its own short transaction so the
 * UI (and anyone reading the DB) sees progress as it happens. Live events go out after commit.
 */
@Service
public class DeploymentStateService {

    public record StartInfo(Long id, String appName, String repoUrl, String version, EnvironmentCode env,
                            String cluster, String namespace, int buildNumber) {}

    private final DeploymentRepository repo;
    private final DeploymentLogRepository logs;
    private final IncidentService incidents;
    private final AuditService audit;
    private final ApplicationEventPublisher events;
    private final Clock clock;

    public DeploymentStateService(DeploymentRepository repo, DeploymentLogRepository logs, IncidentService incidents,
                                  AuditService audit, ApplicationEventPublisher events, Clock clock) {
        this.repo = repo;
        this.logs = logs;
        this.incidents = incidents;
        this.audit = audit;
        this.events = events;
        this.clock = clock;
    }

    /** QUEUED → RUNNING. Returns null if the deployment is no longer queued (e.g. cancelled). */
    @Transactional
    public StartInfo start(Long id) {
        Deployment d = repo.findDetailed(id).orElse(null);
        if (d == null || d.getStatus() != DeploymentStatus.QUEUED) return null;
        d.setStatus(DeploymentStatus.RUNNING);
        d.setStartedAt(clock.instant());
        d.setBuildNumber(repo.maxBuildNumber() + 1);
        d.setCurrentStage(PipelineStage.BUILD);
        publish(d);
        Environment e = d.getEnvironment();
        Application a = d.getApplication();
        return new StartInfo(d.getId(), a.getName(), a.getRepoUrl(), d.getReleaseVersion(), e.getCode(),
                e.getCluster(), e.getNamespace(), d.getBuildNumber());
    }

    @Transactional
    public void stageStarted(Long id, PipelineStage stage) {
        Deployment d = load(id);
        d.setCurrentStage(stage);
        d.setProgress(stage.from());
        log(d.getId(), stage, DeploymentLog.Level.INFO, "▶ " + stage.label());
        publish(d);
    }

    @Transactional
    public void stageCompleted(Long id, PipelineStage stage, String commitSha, String imageUri) {
        Deployment d = load(id);
        d.setProgress(stage.to());
        if (commitSha != null) d.setCommitSha(commitSha);
        if (imageUri != null) d.setImageUri(imageUri);
        publish(d);
    }

    @Transactional
    public void log(Long deploymentId, PipelineStage stage, DeploymentLog.Level level, String message) {
        DeploymentLog l = logs.save(new DeploymentLog(deploymentId, stage, level, Texts.truncate(message, 1000), clock.instant()));
        events.publishEvent(LiveEvent.of("deployment.log", LogResponse.from(l)));
    }

    @Transactional(readOnly = true)
    public boolean isCancelRequested(Long id) {
        return repo.findById(id).map(Deployment::isCancelRequested).orElse(true);
    }

    @Transactional
    public void succeed(Long id, int replicas) {
        Deployment d = load(id);
        Instant now = clock.instant();
        d.setStatus(DeploymentStatus.SUCCEEDED);
        d.setProgress(100);
        d.setFinishedAt(now);

        Application a = d.getApplication();
        Environment e = d.getEnvironment();
        a.setLastDeployedAt(now);
        e.setCurrentVersion(d.getReleaseVersion());
        e.setLastDeployedAt(now);
        e.setPodsRunning(Math.max(e.getPodsRunning(), replicas * 4));
        if (e.getCode() == EnvironmentCode.PRODUCTION) {
            a.setCurrentVersion(d.getReleaseVersion());
            a.setStatus(AppStatus.HEALTHY);
            e.setHealthScore(Math.min(100, e.getHealthScore() + 4));
            if (e.getHealthScore() >= 97) e.setStatus(EnvironmentStatus.HEALTHY);
        }
        log(d.getId(), PipelineStage.VERIFY, DeploymentLog.Level.INFO, "✔ Deployment succeeded");
        audit.recordAs(d.getTriggeredBy() == null ? null : d.getTriggeredBy().getId(), "pipeline",
                "DEPLOYMENT_SUCCEEDED", "DEPLOYMENT", d.getId(), a.getName() + " " + d.getReleaseVersion() + " → " + e.getCode());
        publish(d);
        events.publishEvent(LiveEvent.of("environment.updated", EnvironmentResponse.from(e)));
    }

    @Transactional
    public void fail(Long id, String reason) {
        Deployment d = load(id);
        if (!d.getStatus().isActive()) return;
        Instant now = clock.instant();
        d.setStatus(DeploymentStatus.FAILED);
        d.setFailureReason(Texts.truncate(reason, 500));
        d.setFinishedAt(now);
        log(d.getId(), d.getCurrentStage() == null ? PipelineStage.BUILD : d.getCurrentStage(), DeploymentLog.Level.ERROR, "✖ " + reason);

        Environment e = d.getEnvironment();
        Application a = d.getApplication();
        if (e.getCode() == EnvironmentCode.PRODUCTION && d.getCurrentStage() != null
                && EnumSet.of(PipelineStage.DEPLOY, PipelineStage.VERIFY).contains(d.getCurrentStage())) {
            a.setStatus(AppStatus.CRITICAL);
            e.setHealthScore(e.getHealthScore() - 4);
            e.setStatus(e.getHealthScore() < 90 ? EnvironmentStatus.DOWN : EnvironmentStatus.DEGRADED);
            incidents.openForFailedDeployment(d, reason);
            events.publishEvent(LiveEvent.of("environment.updated", EnvironmentResponse.from(e)));
        } else if (e.getCode() == EnvironmentCode.PRODUCTION && a.getStatus() == AppStatus.HEALTHY) {
            a.setStatus(AppStatus.WARNING); // failed before touching the cluster: prod still runs the old version
        }
        audit.recordAs(d.getTriggeredBy() == null ? null : d.getTriggeredBy().getId(), "pipeline",
                "DEPLOYMENT_FAILED", "DEPLOYMENT", d.getId(), a.getName() + " " + d.getReleaseVersion() + " → " + e.getCode() + ": " + reason);
        publish(d);
    }

    @Transactional
    public void cancelled(Long id) {
        Deployment d = load(id);
        if (!d.getStatus().isActive()) return;
        d.setStatus(DeploymentStatus.CANCELLED);
        d.setFinishedAt(clock.instant());
        log(d.getId(), d.getCurrentStage() == null ? PipelineStage.BUILD : d.getCurrentStage(), DeploymentLog.Level.WARN, "■ Cancelled by user");
        publish(d);
    }

    public PipelineContext.StageLogger loggerFor(Long id, PipelineStage[] current) {
        return (level, msg) -> log(id, current[0], level, msg);
    }

    private Deployment load(Long id) {
        return repo.findDetailed(id).orElseThrow(() -> new IllegalStateException("Deployment " + id + " vanished"));
    }

    private void publish(Deployment d) {
        events.publishEvent(LiveEvent.of("deployment.updated", DeploymentResponse.from(d)));
    }
}
