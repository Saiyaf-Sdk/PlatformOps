package com.platformops.deployment;

/** Stages every release passes through, with the progress range each one covers. */
public enum PipelineStage {
    BUILD("Jenkins build & test", 0, 30),
    IMAGE("Push image to Amazon ECR", 30, 50),
    DEPLOY("Roll out to Kubernetes", 50, 85),
    VERIFY("Health checks & smoke tests", 85, 100);

    private final String label;
    private final int from;
    private final int to;

    PipelineStage(String label, int from, int to) {
        this.label = label;
        this.from = from;
        this.to = to;
    }

    public String label() { return label; }
    public int from() { return from; }
    public int to() { return to; }
}
