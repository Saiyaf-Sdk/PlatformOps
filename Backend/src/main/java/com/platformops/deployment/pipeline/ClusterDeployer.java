package com.platformops.deployment.pipeline;

/** Kubernetes (k3s) — roll the image out, then verify it is healthy. */
public interface ClusterDeployer {
    record RolloutResult(int replicas) {}

    RolloutResult rollout(PipelineContext ctx, String imageUri);

    void verify(PipelineContext ctx, RolloutResult rollout);
}
