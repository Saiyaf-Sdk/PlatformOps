package com.platformops.environment;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "environments")
public class Environment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EnvironmentCode code;

    @Column(name = "display_name", nullable = false, length = 60)
    private String displayName;

    @Column(nullable = false, length = 80)
    private String cluster;

    @Column(nullable = false, length = 63)
    private String namespace;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EnvironmentStatus status = EnvironmentStatus.HEALTHY;

    @Column(name = "health_score", nullable = false)
    private int healthScore = 100;

    @Column(name = "pods_running", nullable = false)
    private int podsRunning;

    @Column(name = "current_version", length = 64)
    private String currentVersion;

    @Column(name = "last_deployed_at")
    private Instant lastDeployedAt;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "requires_approval", nullable = false)
    private boolean requiresApproval;

    @Version
    private long version;

    protected Environment() {}

    public Environment(EnvironmentCode code, String displayName, String cluster, String namespace, int sortOrder, boolean requiresApproval) {
        this.code = code;
        this.displayName = displayName;
        this.cluster = cluster;
        this.namespace = namespace;
        this.sortOrder = sortOrder;
        this.requiresApproval = requiresApproval;
    }

    public Long getId() { return id; }
    public EnvironmentCode getCode() { return code; }
    public String getDisplayName() { return displayName; }
    public String getCluster() { return cluster; }
    public String getNamespace() { return namespace; }
    public EnvironmentStatus getStatus() { return status; }
    public void setStatus(EnvironmentStatus status) { this.status = status; }
    public int getHealthScore() { return healthScore; }
    public void setHealthScore(int healthScore) { this.healthScore = Math.max(0, Math.min(100, healthScore)); }
    public int getPodsRunning() { return podsRunning; }
    public void setPodsRunning(int podsRunning) { this.podsRunning = Math.max(0, podsRunning); }
    public String getCurrentVersion() { return currentVersion; }
    public void setCurrentVersion(String currentVersion) { this.currentVersion = currentVersion; }
    public Instant getLastDeployedAt() { return lastDeployedAt; }
    public void setLastDeployedAt(Instant lastDeployedAt) { this.lastDeployedAt = lastDeployedAt; }
    public int getSortOrder() { return sortOrder; }
    public boolean isRequiresApproval() { return requiresApproval; }
    public long getVersion() { return version; }
}
