package com.platformops.audit;

import com.platformops.common.PageResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/audit-events")
@Tag(name = "Audit log")
public class AuditController {

    private final AuditService audit;

    public AuditController(AuditService audit) {
        this.audit = audit;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','DEVOPS')")
    public PageResponse<AuditService.AuditResponse> list(@RequestParam(required = false) String q,
                                                         @RequestParam(required = false) String action,
                                                         @RequestParam(required = false) String entityType,
                                                         @RequestParam(required = false) Long actorId,
                                                         @RequestParam(defaultValue = "0") int page,
                                                         @RequestParam(defaultValue = "25") int size) {
        return audit.search(q, action, entityType, actorId, page, size);
    }
}
