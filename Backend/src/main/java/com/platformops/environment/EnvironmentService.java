package com.platformops.environment;

import com.platformops.common.ApiException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class EnvironmentService {

    public record EnvironmentResponse(Long id, EnvironmentCode code, String displayName, String cluster, String namespace,
                                      EnvironmentStatus status, int healthScore, int podsRunning, String currentVersion,
                                      Instant lastDeployedAt, boolean requiresApproval) {
        public static EnvironmentResponse from(Environment e) {
            return new EnvironmentResponse(e.getId(), e.getCode(), e.getDisplayName(), e.getCluster(), e.getNamespace(),
                    e.getStatus(), e.getHealthScore(), e.getPodsRunning(), e.getCurrentVersion(), e.getLastDeployedAt(),
                    e.isRequiresApproval());
        }
    }

    public record EnvRef(Long id, EnvironmentCode code, String displayName) {
        public static EnvRef from(Environment e) {
            return e == null ? null : new EnvRef(e.getId(), e.getCode(), e.getDisplayName());
        }
    }

    private final EnvironmentRepository repo;

    public EnvironmentService(EnvironmentRepository repo) {
        this.repo = repo;
    }

    @Transactional(readOnly = true)
    public List<EnvironmentResponse> list() {
        return repo.findAllByOrderBySortOrderAsc().stream().map(EnvironmentResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public EnvironmentResponse get(EnvironmentCode code) {
        return EnvironmentResponse.from(find(code));
    }

    public Environment find(EnvironmentCode code) {
        return repo.findByCode(code).orElseThrow(() -> ApiException.notFound("Environment", code));
    }
}
