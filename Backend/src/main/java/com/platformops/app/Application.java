package com.platformops.app;

import jakarta.persistence.*;

import java.time.Instant;

/** A deployable service registered on the platform. */
@Entity
@Table(name = "applications")
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 63)
    private String name;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(nullable = false, length = 60)
    private String runtime;

    @Column(name = "owner_team", nullable = false, length = 80)
    private String ownerTeam;

    @Column(name = "repo_url", nullable = false, length = 255)
    private String repoUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AppStatus status = AppStatus.HEALTHY;

    @Column(name = "current_version", length = 64)
    private String currentVersion;

    @Column(name = "last_deployed_at")
    private Instant lastDeployedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    private long version;

    protected Application() {}

    public Application(String name, String description, String runtime, String ownerTeam, String repoUrl) {
        this.name = name;
        this.description = description;
        this.runtime = runtime;
        this.ownerTeam = ownerTeam;
        this.repoUrl = repoUrl;
    }

    @PrePersist
    void onCreate() { createdAt = updatedAt = Instant.now(); }

    @PreUpdate
    void onUpdate() { updatedAt = Instant.now(); }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getRuntime() { return runtime; }
    public void setRuntime(String runtime) { this.runtime = runtime; }
    public String getOwnerTeam() { return ownerTeam; }
    public void setOwnerTeam(String ownerTeam) { this.ownerTeam = ownerTeam; }
    public String getRepoUrl() { return repoUrl; }
    public void setRepoUrl(String repoUrl) { this.repoUrl = repoUrl; }
    public AppStatus getStatus() { return status; }
    public void setStatus(AppStatus status) { this.status = status; }
    public String getCurrentVersion() { return currentVersion; }
    public void setCurrentVersion(String currentVersion) { this.currentVersion = currentVersion; }
    public Instant getLastDeployedAt() { return lastDeployedAt; }
    public void setLastDeployedAt(Instant lastDeployedAt) { this.lastDeployedAt = lastDeployedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public long getVersion() { return version; }
}
