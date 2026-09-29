package com.platformops.deployment;

import com.platformops.common.PageResponse;
import com.platformops.deployment.DeploymentDtos.*;
import com.platformops.environment.EnvironmentCode;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/deployments")
@Tag(name = "Deployments")
public class DeploymentController {

    private final DeploymentService deployments;

    public DeploymentController(DeploymentService deployments) {
        this.deployments = deployments;
    }

    @GetMapping
    public PageResponse<DeploymentResponse> list(@RequestParam(required = false) Long applicationId,
                                                 @RequestParam(required = false) EnvironmentCode environment,
                                                 @RequestParam(required = false) DeploymentStatus status,
                                                 @RequestParam(required = false) String q,
                                                 @RequestParam(defaultValue = "false") boolean activeOnly,
                                                 @RequestParam(defaultValue = "0") int page,
                                                 @RequestParam(defaultValue = "25") int size) {
        return deployments.search(applicationId, environment, status, q, activeOnly, page, size);
    }

    @GetMapping("/{id}")
    public DeploymentResponse get(@PathVariable Long id) {
        return deployments.get(id);
    }

    @GetMapping("/{id}/logs")
    public List<LogResponse> logs(@PathVariable Long id) {
        return deployments.logs(id);
    }

    @Operation(summary = "Start a deployment. Production requires the same version to have succeeded in Staging.")
    @PostMapping
    @ResponseStatus(HttpStatus.ACCEPTED)
    @PreAuthorize("hasAnyRole('ADMIN','DEVOPS','DEVELOPER')")
    public DeploymentResponse create(@Valid @RequestBody CreateDeploymentRequest req) {
        return deployments.create(req);
    }

    @Operation(summary = "Redeploy the previous successful version of this app to the same environment")
    @PostMapping("/{id}/rollback")
    @ResponseStatus(HttpStatus.ACCEPTED)
    @PreAuthorize("hasAnyRole('ADMIN','DEVOPS','DEVELOPER')")
    public DeploymentResponse rollback(@PathVariable Long id, @Valid @RequestBody(required = false) RollbackRequest req) {
        return deployments.rollback(id, req);
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN','DEVOPS','DEVELOPER')")
    public DeploymentResponse cancel(@PathVariable Long id) {
        return deployments.cancel(id);
    }
}
