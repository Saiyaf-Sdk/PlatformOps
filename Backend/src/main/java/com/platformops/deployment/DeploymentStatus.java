package com.platformops.deployment;

public enum DeploymentStatus {
    PENDING_APPROVAL, REJECTED, QUEUED, RUNNING, SUCCEEDED, FAILED, CANCELLED;

    public boolean isActive() { return this == PENDING_APPROVAL || this == QUEUED || this == RUNNING; }
}
