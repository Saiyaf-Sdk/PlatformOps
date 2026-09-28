package com.platformops.deployment.pipeline;

/** A stage failed for a reason worth showing the user (build broke, health check failed…). */
public class PipelineStepException extends RuntimeException {
    public PipelineStepException(String message) {
        super(message);
    }
}
