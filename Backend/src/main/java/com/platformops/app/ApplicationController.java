package com.platformops.app;

import com.platformops.app.ApplicationDtos.*;
import com.platformops.common.PageResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/applications")
@Tag(name = "Applications")
public class ApplicationController {

    private final ApplicationService apps;

    public ApplicationController(ApplicationService apps) {
        this.apps = apps;
    }

    @GetMapping
    public PageResponse<ApplicationResponse> list(@RequestParam(required = false) String q,
                                                  @RequestParam(required = false) AppStatus status,
                                                  @RequestParam(required = false) String runtime,
                                                  @RequestParam(required = false) String team,
                                                  @RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "50") int size) {
        return apps.search(q, status, runtime, team, page, size);
    }

    @GetMapping("/stats")
    public ApplicationStats stats() {
        return apps.stats();
    }

    @GetMapping("/{id}")
    public ApplicationResponse get(@PathVariable Long id) {
        return apps.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','DEVOPS','DEVELOPER')")
    public ApplicationResponse create(@Valid @RequestBody CreateApplicationRequest req) {
        return apps.create(req);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DEVOPS')")
    public ApplicationResponse update(@PathVariable Long id, @Valid @RequestBody UpdateApplicationRequest req) {
        return apps.update(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DEVOPS')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        apps.delete(id);
        return ResponseEntity.noContent().build();
    }
}
