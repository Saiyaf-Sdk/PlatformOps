package com.platformops.deployment.pipeline;

/** CI server (Jenkins). Builds and tests the release; returns the commit that was built. */
public interface BuildServer {
    record BuildResult(String commitSha) {}

    BuildResult build(PipelineContext ctx);
}
