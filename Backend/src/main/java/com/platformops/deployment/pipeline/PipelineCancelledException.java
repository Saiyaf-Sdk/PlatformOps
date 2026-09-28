package com.platformops.deployment.pipeline;

public class PipelineCancelledException extends RuntimeException {
    public PipelineCancelledException() {
        super("Cancelled by user");
    }
}
