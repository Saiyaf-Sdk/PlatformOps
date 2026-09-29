package com.platformops.deployment.pipeline;

import com.platformops.deployment.DeploymentLog.Level;
import com.platformops.environment.EnvironmentCode;

/**
 * Everything an adapter needs to run one stage, plus callbacks to stream logs
 * and to honour cancellation between steps.
 */
public record PipelineContext(
        Long deploymentId,
        String appName,
        String repoUrl,
        String version,
        EnvironmentCode environment,
        String cluster,
        String namespace,
        int buildNumber,
        StageLogger logger,
        CancellationCheck cancellation
) {
    @FunctionalInterface
    public interface StageLogger {
        void log(Level level, String message);
    }

    @FunctionalInterface
    public interface CancellationCheck {
        /** Throws {@link PipelineCancelledException} if the user asked to stop. */
        void check();
    }

    public void info(String msg) { logger.log(Level.INFO, msg); }
    public void warn(String msg) { logger.log(Level.WARN, msg); }
    public void error(String msg) { logger.log(Level.ERROR, msg); }
}
