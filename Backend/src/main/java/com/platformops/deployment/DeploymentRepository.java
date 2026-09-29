package com.platformops.deployment;

import com.platformops.environment.EnvironmentCode;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface DeploymentRepository extends JpaRepository<Deployment, Long>, JpaSpecificationExecutor<Deployment> {

    @Override
    @EntityGraph(attributePaths = {"application", "environment", "triggeredBy"})
    Page<Deployment> findAll(Specification<Deployment> spec, Pageable pageable);

    @EntityGraph(attributePaths = {"application", "environment", "triggeredBy", "rollbackOf"})
    @Query("select d from Deployment d where d.id = :id")
    Optional<Deployment> findDetailed(@Param("id") Long id);

    boolean existsByApplicationIdAndStatusIn(Long applicationId, Collection<DeploymentStatus> statuses);

    boolean existsByApplicationIdAndEnvironmentIdAndStatusIn(Long applicationId, Long environmentId, Collection<DeploymentStatus> statuses);

    boolean existsByApplicationIdAndEnvironmentCodeAndReleaseVersionAndStatus(Long applicationId, EnvironmentCode code,
                                                                                String releaseVersion, DeploymentStatus status);

    @Query("""
            select d from Deployment d
            where d.application.id = :appId and d.environment.id = :envId and d.status = :status
              and d.id < :beforeId and d.releaseVersion <> :version
            order by d.id desc
            """)
    List<Deployment> previousWithStatus(@Param("appId") Long appId, @Param("envId") Long envId,
                                        @Param("beforeId") Long beforeId, @Param("version") String version,
                                        @Param("status") DeploymentStatus status, Pageable pageable);

    List<Deployment> findByStatusIn(Collection<DeploymentStatus> statuses);

    long countByStatusIn(Collection<DeploymentStatus> statuses);

    long countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(Instant from, Instant to);

    @Query("select d.createdAt from Deployment d where d.createdAt >= :since")
    List<Instant> createdSince(@Param("since") Instant since);

    /** Sets only the flag (no version bump) so a running pipeline is never disturbed mid-write. */
    @Modifying(clearAutomatically = true)
    @Query("update Deployment d set d.cancelRequested = true where d.id = :id")
    int requestCancel(@Param("id") Long id);

    /** Atomically cancels a deployment that has not started; bumps the version so a racing start() loses. */
    @Modifying(clearAutomatically = true)
    @Query("""
            update Deployment d set d.status = :cancelled, d.finishedAt = :now, d.cancelRequested = true, d.version = d.version + 1
            where d.id = :id and d.status = :queued
            """)
    int cancelIfQueued(@Param("id") Long id, @Param("now") Instant now,
                       @Param("cancelled") DeploymentStatus cancelled, @Param("queued") DeploymentStatus queued);

    @Query("select coalesce(max(d.buildNumber), 0) from Deployment d")
    int maxBuildNumber();
}
