package com.platformops.incident;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.Optional;

public interface IncidentRepository extends JpaRepository<Incident, Long>, JpaSpecificationExecutor<Incident> {

    @Override
    @org.springframework.lang.NonNull
    @EntityGraph(attributePaths = {"application", "environment", "assignee", "reportedBy"})
    Page<Incident> findAll(@org.springframework.lang.Nullable Specification<Incident> spec, @org.springframework.lang.NonNull Pageable pageable);

    @EntityGraph(attributePaths = {"application", "environment", "assignee", "reportedBy", "deployment"})
    @Query("select i from Incident i where i.id = :id")
    Optional<Incident> findDetailed(@Param("id") Long id);

    long countByStatusIn(Collection<IncidentStatus> statuses);

    long countByStatusInAndAssigneeIsNull(Collection<IncidentStatus> statuses);
}
