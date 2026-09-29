package com.platformops.deployment;

import com.platformops.app.Application;
import com.platformops.environment.Environment;
import com.platformops.user.User;
import jakarta.persistence.*;
import org.hibernate.annotations.DynamicUpdate;

import java.time.Instant;

/** @DynamicUpdate: the pipeline never overwrites columns it did not change (e.g. cancel_requested). */
@Entity
@DynamicUpdate
@Table(name = "deployments")
public class Deployment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id", nullable = false)
    private Application application;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "environment_id", nullable = false)
    private Environment environment;

    @Column(name = "release_version", nullable = false, length = 64)
    private String releaseVersion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DeploymentStatus status = DeploymentStatus.QUEUED;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_stage", length = 20)
    private PipelineStage currentStage;

    @Column(nullable = false)
    private int progress;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "triggered_by_id")
    private User triggeredBy;

    @Column(name = "commit_sha", length = 40)
    private String commitSha;

    @Column(name = "build_number")
    private Integer buildNumber;

    @Column(name = "image_uri", length = 255)
    private String imageUri;

    @Column(length = 500)
    private String notes;

    @Column(name = "failure_reason", length = 500)
    private String failureReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rollback_of_id")
    private Deployment rollbackOf;

    @Column(name = "cancel_requested", nullable = false)
    private boolean cancelRequested;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "finished_at")
    private Instant finishedAt;

    @Version
    private long version;

    protected Deployment() {}

    public Deployment(Application application, Environment environment, String releaseVersion, User triggeredBy,
                      String notes, Deployment rollbackOf, Instant createdAt) {
        this.application = application;
        this.environment = environment;
        this.releaseVersion = releaseVersion;
        this.triggeredBy = triggeredBy;
        this.notes = notes;
        this.rollbackOf = rollbackOf;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public Application getApplication() { return application; }
    public Environment getEnvironment() { return environment; }
    public String getReleaseVersion() { return releaseVersion; }
    public DeploymentStatus getStatus() { return status; }
    public void setStatus(DeploymentStatus status) { this.status = status; }
    public PipelineStage getCurrentStage() { return currentStage; }
    public void setCurrentStage(PipelineStage currentStage) { this.currentStage = currentStage; }
    public int getProgress() { return progress; }
    public void setProgress(int progress) { this.progress = Math.max(0, Math.min(100, progress)); }
    public User getTriggeredBy() { return triggeredBy; }
    public String getCommitSha() { return commitSha; }
    public void setCommitSha(String commitSha) { this.commitSha = commitSha; }
    public Integer getBuildNumber() { return buildNumber; }
    public void setBuildNumber(Integer buildNumber) { this.buildNumber = buildNumber; }
    public String getImageUri() { return imageUri; }
    public void setImageUri(String imageUri) { this.imageUri = imageUri; }
    public String getNotes() { return notes; }
    public String getFailureReason() { return failureReason; }
    public void setFailureReason(String failureReason) { this.failureReason = failureReason; }
    public Deployment getRollbackOf() { return rollbackOf; }
    public boolean isCancelRequested() { return cancelRequested; }
    public void setCancelRequested(boolean cancelRequested) { this.cancelRequested = cancelRequested; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }
    public Instant getFinishedAt() { return finishedAt; }
    public void setFinishedAt(Instant finishedAt) { this.finishedAt = finishedAt; }
    public long getVersion() { return version; }
}
