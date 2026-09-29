package com.platformops.deployment;

public enum DeploymentStatus {
    QUEUED, RUNNING, SUCCEEDED, FAILED, CANCELLED;

    public boolean isActive() { return this == QUEUED || this == RUNNING; }
}
