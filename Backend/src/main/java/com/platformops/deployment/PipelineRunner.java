package com.platformops.deployment;

import com.platformops.deployment.pipeline.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.task.TaskRejectedException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Component;

import java.util.EnumSet;

/** Drives a deployment through BUILD → IMAGE → DEPLOY → VERIFY on the pipeline thread pool. */
@Component
public class PipelineRunner {

    private static final Logger log = LoggerFactory.getLogger(PipelineRunner.class);

    private final DeploymentStateService state;
    private final DeploymentRepository repo;
    private final BuildServer buildServer;
    private final ImageRegistry registry;
    private final ClusterDeployer cluster;
    private final ThreadPoolTaskExecutor executor;

    public PipelineRunner(DeploymentStateService state, DeploymentRepository repo, BuildServer buildServer,
                          ImageRegistry registry, ClusterDeployer cluster,
                          @Qualifier("pipelineExecutor") ThreadPoolTaskExecutor executor) {
        this.state = state;
        this.repo = repo;
        this.buildServer = buildServer;
        this.registry = registry;
        this.cluster = cluster;
        this.executor = executor;
    }

    public void submit(Long deploymentId) {
        try {
            executor.execute(() -> run(deploymentId));
        } catch (TaskRejectedException e) {
            log.error("Pipeline queue full, rejecting deployment {}", deploymentId);
            state.fail(deploymentId, "Pipeline is at capacity. Try again in a moment.");
        }
    }

    void run(Long id) {
        DeploymentStateService.StartInfo info;
        try {
            info = state.start(id);
        } catch (RuntimeException e) {
            log.error("Could not start deployment {}", id, e);
            safeFail(id, "Internal error while starting the pipeline");
            return;
        }
        if (info == null) return; // cancelled before it started

        PipelineStage[] current = {PipelineStage.BUILD};
        PipelineContext ctx = new PipelineContext(info.id(), info.appName(), info.repoUrl(), info.version(), info.env(),
                info.cluster(), info.namespace(), info.buildNumber(), state.loggerFor(id, current),
                () -> { if (state.isCancelRequested(id)) throw new PipelineCancelledException(); });
        try {
            current[0] = PipelineStage.BUILD;
            retry(() -> state.stageStarted(id, PipelineStage.BUILD));
            var build = buildServer.build(ctx);
            retry(() -> state.stageCompleted(id, PipelineStage.BUILD, build.commitSha(), null));

            current[0] = PipelineStage.IMAGE;
            retry(() -> state.stageStarted(id, PipelineStage.IMAGE));
            String image = registry.push(ctx, build.commitSha());
            retry(() -> state.stageCompleted(id, PipelineStage.IMAGE, null, image));

            current[0] = PipelineStage.DEPLOY;
            retry(() -> state.stageStarted(id, PipelineStage.DEPLOY));
            var rollout = cluster.rollout(ctx, image);
            retry(() -> state.stageCompleted(id, PipelineStage.DEPLOY, null, null));

            current[0] = PipelineStage.VERIFY;
            retry(() -> state.stageStarted(id, PipelineStage.VERIFY));
            cluster.verify(ctx, rollout);
            ctx.cancellation().check();
            retry(() -> state.succeed(id, rollout.replicas()));
        } catch (PipelineCancelledException e) {
            retry(() -> state.cancelled(id));
        } catch (PipelineStepException e) {
            retry(() -> state.fail(id, e.getMessage()));
        } catch (RuntimeException e) {
            log.error("Pipeline crashed for deployment {}", id, e);
            safeFail(id, "Internal pipeline error: " + e.getClass().getSimpleName());
        }
    }

    /** State writes can collide with a concurrent edit of the same app/environment row; retry briefly. */
    private static void retry(Runnable op) {
        for (int attempt = 1; ; attempt++) {
            try {
                op.run();
                return;
            } catch (OptimisticLockingFailureException e) {
                if (attempt >= 4) throw e;
                try { Thread.sleep(25L * attempt); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); throw e; }
            }
        }
    }

    private void safeFail(Long id, String reason) {
        try {
            retry(() -> state.fail(id, reason));
        } catch (RuntimeException ex) {
            log.error("Could not mark deployment {} as failed", id, ex);
        }
    }

    /** Anything still "running" after a restart was interrupted — say so instead of leaving it stuck. */
    @EventListener(ApplicationReadyEvent.class)
    public void recoverInterrupted() {
        var stuck = repo.findByStatusIn(EnumSet.of(DeploymentStatus.QUEUED, DeploymentStatus.RUNNING));
        for (Deployment d : stuck) {
            safeFail(d.getId(), "Interrupted by a platform restart — redeploy to try again");
        }
        if (!stuck.isEmpty()) log.warn("Marked {} interrupted deployment(s) as failed", stuck.size());
    }

}
