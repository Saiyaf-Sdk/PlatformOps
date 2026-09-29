package com.platformops.app;

import com.platformops.app.ApplicationDtos.*;
import com.platformops.audit.AuditService;
import com.platformops.common.ApiException;
import com.platformops.common.PageResponse;
import com.platformops.common.Pages;
import com.platformops.common.Specs;
import com.platformops.common.Texts;
import com.platformops.deployment.DeploymentRepository;
import com.platformops.deployment.DeploymentStatus;
import com.platformops.event.LiveEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;

@Service
public class ApplicationService {

    private final ApplicationRepository repo;
    private final DeploymentRepository deployments;
    private final AuditService audit;
    private final ApplicationEventPublisher events;

    public ApplicationService(ApplicationRepository repo, DeploymentRepository deployments, AuditService audit, ApplicationEventPublisher events) {
        this.repo = repo;
        this.deployments = deployments;
        this.audit = audit;
        this.events = events;
    }

    @Transactional(readOnly = true)
    public PageResponse<ApplicationResponse> search(String q, AppStatus status, String runtime, String team, int page, int size) {
        Specification<Application> spec = Specification.where(Specs.<Application>containsAny(q, "name", "description", "ownerTeam"))
                .and(Specs.eq("status", status))
                .and(Specs.containsAny(runtime, "runtime"))
                .and(Specs.containsAny(team, "ownerTeam"));
        return PageResponse.of(repo.findAll(spec, Pages.of(page, size, Sort.by("name"))), ApplicationResponse::from);
    }

    @Transactional(readOnly = true)
    public ApplicationStats stats() {
        return new ApplicationStats(repo.count(), repo.countByStatus(AppStatus.HEALTHY),
                repo.countByStatus(AppStatus.WARNING), repo.countByStatus(AppStatus.CRITICAL));
    }

    @Transactional(readOnly = true)
    public ApplicationResponse get(Long id) {
        return ApplicationResponse.from(find(id));
    }

    @Transactional
    public ApplicationResponse create(CreateApplicationRequest req) {
        if (repo.existsByNameIgnoreCase(req.name())) {
            throw ApiException.conflict("name_taken", "An application named '" + req.name() + "' already exists");
        }
        Application a = repo.save(new Application(req.name(), req.description().trim(), req.runtime().trim(),
                req.ownerTeam().trim(), req.repoUrl().trim()));
        audit.record("APPLICATION_CREATED", "APPLICATION", a.getId(), a.getName() + " (" + a.getRuntime() + ", " + a.getOwnerTeam() + ")");
        events.publishEvent(LiveEvent.of("application.created", ApplicationResponse.from(a)));
        return ApplicationResponse.from(a);
    }

    @Transactional
    public ApplicationResponse update(Long id, UpdateApplicationRequest req) {
        Application a = find(id);
        if (req.description() != null) a.setDescription(req.description().trim());
        if (req.runtime() != null) a.setRuntime(req.runtime().trim());
        if (req.ownerTeam() != null) a.setOwnerTeam(req.ownerTeam().trim());
        if (Texts.blankToNull(req.repoUrl()) != null) a.setRepoUrl(req.repoUrl().trim());
        if (req.status() != null) a.setStatus(req.status());
        repo.saveAndFlush(a);
        audit.record("APPLICATION_UPDATED", "APPLICATION", a.getId(), a.getName());
        events.publishEvent(LiveEvent.of("application.updated", ApplicationResponse.from(a)));
        return ApplicationResponse.from(a);
    }

    @Transactional
    public void delete(Long id) {
        Application a = find(id);
        if (deployments.existsByApplicationIdAndStatusIn(id, EnumSet.of(DeploymentStatus.QUEUED, DeploymentStatus.RUNNING))) {
            throw ApiException.conflict("deployment_in_progress", "Wait for the running deployment of " + a.getName() + " to finish");
        }
        repo.delete(a);
        audit.record("APPLICATION_DELETED", "APPLICATION", id, a.getName());
        events.publishEvent(LiveEvent.of("application.deleted", new AppRef(id, a.getName())));
    }

    public Application find(Long id) {
        return repo.findById(id).orElseThrow(() -> ApiException.notFound("Application", id));
    }
}
