package com.platformops.environment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EnvironmentRepository extends JpaRepository<Environment, Long> {
    Optional<Environment> findByCode(EnvironmentCode code);
    List<Environment> findAllByOrderBySortOrderAsc();
}
