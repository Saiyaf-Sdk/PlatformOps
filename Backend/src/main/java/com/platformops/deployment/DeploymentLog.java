package com.platformops.deployment;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "deployment_logs")
public class DeploymentLog {

    public enum Level { INFO, WARN, ERROR }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "deployment_id", nullable = false)
    private Long deploymentId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PipelineStage stage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Level level;

    @Column(nullable = false, length = 1000)
    private String message;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected DeploymentLog() {}

    public DeploymentLog(Long deploymentId, PipelineStage stage, Level level, String message, Instant createdAt) {
        this.deploymentId = deploymentId;
        this.stage = stage;
        this.level = level;
        this.message = message;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public Long getDeploymentId() { return deploymentId; }
    public PipelineStage getStage() { return stage; }
    public Level getLevel() { return level; }
    public String getMessage() { return message; }
    public Instant getCreatedAt() { return createdAt; }
}
