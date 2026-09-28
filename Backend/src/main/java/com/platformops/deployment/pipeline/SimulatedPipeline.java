package com.platformops.deployment.pipeline;

import com.platformops.config.AppProperties;
import com.platformops.environment.EnvironmentCode;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.HexFormat;
import java.util.Locale;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Realistic stand-in for Jenkins, ECR and k3s. Timing comes from app.pipeline.stage-delay,
 * random failures from app.pipeline.failure-rate. For demos and tests, a version containing
 * "build-fail" fails the build and one containing "fail" fails verification — deterministically.
 *
 * Swap in real adapters by providing other beans for BuildServer / ImageRegistry / ClusterDeployer.
 */
@Component
public class SimulatedPipeline implements BuildServer, ImageRegistry, ClusterDeployer {

    private static final String REGISTRY = "123456789012.dkr.ecr.ap-south-1.amazonaws.com";
    private final Duration stageDelay;
    private final double failureRate;

    public SimulatedPipeline(AppProperties props) {
        this.stageDelay = props.pipeline().stageDelay();
        this.failureRate = props.pipeline().failureRate();
    }

    @Override
    public BuildResult build(PipelineContext ctx) {
        String sha = HexFormat.of().formatHex(randomBytes(20));
        ctx.info("Jenkins job " + ctx.appName() + " #" + ctx.buildNumber() + " started");
        step(ctx);
        ctx.info("Checked out " + ctx.repoUrl() + " @ " + sha.substring(0, 7));
        step(ctx);
        ctx.info("Compiling and running unit tests…");
        step(ctx);
        if (versionHas(ctx, "build-fail")) {
            ctx.error("Test suite failed: 3 of 412 tests failing");
            throw new PipelineStepException("Build #" + ctx.buildNumber() + " failed: unit tests are red");
        }
        maybeFail(ctx, 0.3, "Build agent ran out of disk space");
        ctx.info("412 tests passed · coverage 81.4%");
        return new BuildResult(sha);
    }

    @Override
    public String push(PipelineContext ctx, String commitSha) {
        String uri = REGISTRY + "/" + ctx.appName() + ":" + ctx.version();
        ctx.info("docker build -t " + ctx.appName() + ":" + ctx.version() + " .");
        step(ctx);
        ctx.info("Scanning image for CVEs… 0 critical, 0 high");
        step(ctx);
        ctx.info("Pushed " + uri);
        return uri;
    }

    @Override
    public RolloutResult rollout(PipelineContext ctx, String imageUri) {
        int replicas = switch (ctx.environment()) {
            case DEV -> 2;
            case STAGING -> 3;
            case PRODUCTION -> 6;
        };
        ctx.info("kubectl -n " + ctx.namespace() + " set image deployment/" + ctx.appName() + " app=" + imageUri);
        step(ctx);
        for (int i = 1; i <= replicas; i += Math.max(1, replicas / 3)) {
            ctx.info("Rolling update: " + Math.min(i, replicas) + "/" + replicas + " pods ready");
            step(ctx);
        }
        maybeFail(ctx, 1.0, "Rollout stalled: new pods stuck in CrashLoopBackOff");
        ctx.info("deployment/" + ctx.appName() + " successfully rolled out on " + ctx.cluster());
        return new RolloutResult(replicas);
    }

    @Override
    public void verify(PipelineContext ctx, RolloutResult rollout) {
        ctx.info("Probing /actuator/health on " + rollout.replicas() + " replicas");
        step(ctx);
        if (versionHas(ctx, "fail")) {
            ctx.error("Smoke test POST /checkout returned 503 (3/3 attempts)");
            throw new PipelineStepException("Health checks failed after rollout — smoke tests returned 503");
        }
        maybeFail(ctx, 1.0, "Error rate 7.2% above the 2% SLO during canary analysis");
        ctx.info("p95 latency 142 ms · error rate 0.04% · all checks green");
        if (ctx.environment() == EnvironmentCode.PRODUCTION) ctx.info("Release " + ctx.version() + " is live 🚀");
    }

    private void maybeFail(PipelineContext ctx, double weight, String reason) {
        if (failureRate > 0 && ThreadLocalRandom.current().nextDouble() < failureRate * weight / 2.3) {
            ctx.error(reason);
            throw new PipelineStepException(reason);
        }
    }

    private static boolean versionHas(PipelineContext ctx, String marker) {
        return ctx.version().toLowerCase(Locale.ROOT).contains(marker);
    }

    private void step(PipelineContext ctx) {
        ctx.cancellation().check();
        long ms = stageDelay.toMillis() / 3;
        if (ms <= 0) return;
        long jitter = ThreadLocalRandom.current().nextLong(Math.max(1, ms / 2));
        try {
            Thread.sleep(ms + jitter);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new PipelineCancelledException();
        }
        ctx.cancellation().check();
    }

    private static byte[] randomBytes(int n) {
        byte[] b = new byte[n];
        ThreadLocalRandom.current().nextBytes(b);
        return b;
    }
}
