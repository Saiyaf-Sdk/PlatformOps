package com.platformops.deployment;

import com.platformops.app.ApplicationDtos.AppRef;
import com.platformops.environment.EnvironmentCode;
import com.platformops.environment.EnvironmentService.EnvRef;
import com.platformops.user.UserDtos.UserRef;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public final class DeploymentDtos {
    private DeploymentDtos() {}

    /** Semantic version, optional leading "v", optional pre-release/build suffix: v2.1.0, 1.4.0-rc1 */
    public static final String VERSION_RULE = "^v?\\d{1,4}\\.\\d{1,4}\\.\\d{1,4}([-+.][0-9A-Za-z.-]{1,40})?$";

    public record DeploymentResponse(Long id, AppRef application, EnvRef environment, String version,
                                     DeploymentStatus status, PipelineStage currentStage, int progress,
                                     UserRef triggeredBy, String commitSha, Integer buildNumber, String imageUri,
                                     String notes, String failureReason, Long rollbackOfId, boolean cancelRequested,
                                     Instant createdAt, Instant startedAt, Instant finishedAt, Long durationSeconds) {
        public static DeploymentResponse from(Deployment d) {
            Long duration = d.getStartedAt() == null ? null
                    : java.time.Duration.between(d.getStartedAt(), d.getFinishedAt() != null ? d.getFinishedAt() : Instant.now()).toSeconds();
            return new DeploymentResponse(d.getId(), AppRef.from(d.getApplication()), EnvRef.from(d.getEnvironment()),
                    d.getReleaseVersion(), d.getStatus(), d.getCurrentStage(), d.getProgress(), UserRef.from(d.getTriggeredBy()),
                    d.getCommitSha(), d.getBuildNumber(), d.getImageUri(), d.getNotes(), d.getFailureReason(),
                    d.getRollbackOf() == null ? null : d.getRollbackOf().getId(), d.isCancelRequested(),
                    d.getCreatedAt(), d.getStartedAt(), d.getFinishedAt(), duration);
        }
    }

    public record LogResponse(Long id, Long deploymentId, PipelineStage stage, DeploymentLog.Level level, String message, Instant at) {
        public static LogResponse from(DeploymentLog l) {
            return new LogResponse(l.getId(), l.getDeploymentId(), l.getStage(), l.getLevel(), l.getMessage(), l.getCreatedAt());
        }
    }

    public record CreateDeploymentRequest(
            @NotNull Long applicationId,
            @NotNull EnvironmentCode environment,
            @NotBlank @Pattern(regexp = VERSION_RULE, message = "use a semantic version like v2.1.0 or 1.4.0-rc1") String version,
            @Size(max = 500) String notes,
            /** Admins only: skip the "must pass staging first" promotion rule. */
            Boolean force) {}

    public record RollbackRequest(@Size(max = 500) String reason) {}
}
