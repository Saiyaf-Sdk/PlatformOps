package com.platformops.deployment.pipeline;

/** Container registry (Amazon ECR). Pushes the image and returns its URI. */
public interface ImageRegistry {
    String push(PipelineContext ctx, String commitSha);
}
