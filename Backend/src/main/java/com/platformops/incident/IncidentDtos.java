package com.platformops.incident;

import com.platformops.app.ApplicationDtos.AppRef;
import com.platformops.environment.EnvironmentCode;
import com.platformops.environment.EnvironmentService.EnvRef;
import com.platformops.user.UserDtos.UserRef;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public final class IncidentDtos {
    private IncidentDtos() {}

    public record IncidentResponse(Long id, String title, String description, Severity severity, IncidentStatus status,
                                   AppRef application, EnvRef environment, Long deploymentId, UserRef assignee,
                                   UserRef reportedBy, Instant createdAt, Instant acknowledgedAt, Instant resolvedAt,
                                   Instant updatedAt) {
        public static IncidentResponse from(Incident i) {
            return new IncidentResponse(i.getId(), i.getTitle(), i.getDescription(), i.getSeverity(), i.getStatus(),
                    AppRef.from(i.getApplication()), EnvRef.from(i.getEnvironment()),
                    i.getDeployment() == null ? null : i.getDeployment().getId(),
                    UserRef.from(i.getAssignee()), UserRef.from(i.getReportedBy()),
                    i.getCreatedAt(), i.getAcknowledgedAt(), i.getResolvedAt(), i.getUpdatedAt());
        }
    }

    public record CreateIncidentRequest(
            @NotBlank @Size(max = 160) String title,
            @Size(max = 2000) String description,
            @NotNull Severity severity,
            Long applicationId,
            EnvironmentCode environment,
            Long assigneeId) {}

    public record UpdateIncidentRequest(
            @Size(min = 1, max = 160) String title,
            @Size(max = 2000) String description,
            Severity severity,
            IncidentStatus status,
            Long assigneeId,
            Boolean unassign) {}
}
