package com.platformops.incident;

import com.platformops.common.PageResponse;
import com.platformops.incident.IncidentDtos.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/incidents")
@Tag(name = "Incidents")
public class IncidentController {

    private final IncidentService incidents;

    public IncidentController(IncidentService incidents) {
        this.incidents = incidents;
    }

    @GetMapping
    public PageResponse<IncidentResponse> list(@RequestParam(required = false) String q,
                                               @RequestParam(required = false) IncidentStatus status,
                                               @RequestParam(required = false) Severity severity,
                                               @RequestParam(required = false) Long applicationId,
                                               @RequestParam(defaultValue = "false") boolean openOnly,
                                               @RequestParam(defaultValue = "0") int page,
                                               @RequestParam(defaultValue = "25") int size) {
        return incidents.search(q, status, severity, applicationId, openOnly, page, size);
    }

    @GetMapping("/{id}")
    public IncidentResponse get(@PathVariable Long id) {
        return incidents.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','DEVOPS','DEVELOPER')")
    public IncidentResponse create(@Valid @RequestBody CreateIncidentRequest req) {
        return incidents.create(req);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DEVOPS')")
    public IncidentResponse update(@PathVariable Long id, @Valid @RequestBody UpdateIncidentRequest req) {
        return incidents.update(id, req);
    }
}
