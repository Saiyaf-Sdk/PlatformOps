package com.platformops.app;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public final class ApplicationDtos {
    private ApplicationDtos() {}

    /** DNS-1123 label: what Kubernetes will accept as a Deployment/Service name. */
    public static final String NAME_RULE = "^[a-z]([-a-z0-9]{0,61}[a-z0-9])?$";
    public static final String REPO_RULE = "^(https://[\\w.-]+/[\\w.-]+/[\\w.-]+(\\.git)?|[\\w.-]+/[\\w.-]+)$";

    public record ApplicationResponse(Long id, String name, String description, String runtime, String ownerTeam,
                                      String repoUrl, AppStatus status, String currentVersion, Instant lastDeployedAt,
                                      Instant createdAt, Instant updatedAt) {
        public static ApplicationResponse from(Application a) {
            return new ApplicationResponse(a.getId(), a.getName(), a.getDescription(), a.getRuntime(), a.getOwnerTeam(),
                    a.getRepoUrl(), a.getStatus(), a.getCurrentVersion(), a.getLastDeployedAt(), a.getCreatedAt(), a.getUpdatedAt());
        }
    }

    public record AppRef(Long id, String name) {
        public static AppRef from(Application a) { return a == null ? null : new AppRef(a.getId(), a.getName()); }
    }

    public record CreateApplicationRequest(
            @NotBlank @Pattern(regexp = NAME_RULE, message = "use lowercase letters, numbers and dashes (max 63), starting with a letter") String name,
            @NotBlank @Size(max = 500) String description,
            @NotBlank @Size(max = 60) String runtime,
            @NotBlank @Size(max = 80) String ownerTeam,
            @NotBlank @Size(max = 255) @Pattern(regexp = REPO_RULE, message = "use owner/repo or an https git URL") String repoUrl) {}

    public record UpdateApplicationRequest(
            @Size(min = 1, max = 500) String description,
            @Size(min = 1, max = 60) String runtime,
            @Size(min = 1, max = 80) String ownerTeam,
            @Size(max = 255) @Pattern(regexp = REPO_RULE, message = "use owner/repo or an https git URL") String repoUrl,
            AppStatus status) {}

    public record ApplicationStats(long total, long healthy, long warning, long critical) {}
}
