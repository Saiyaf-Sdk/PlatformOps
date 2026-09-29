package com.platformops.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.ThreadPoolExecutor;

@Configuration
public class AsyncConfig {

    /** Dedicated, bounded pool for running deployment pipelines. */
    @Bean(name = "pipelineExecutor")
    ThreadPoolTaskExecutor pipelineExecutor(AppProperties props) {
        ThreadPoolTaskExecutor ex = new ThreadPoolTaskExecutor();
        ex.setCorePoolSize(props.pipeline().workerThreads());
        ex.setMaxPoolSize(props.pipeline().workerThreads());
        ex.setQueueCapacity(500);
        ex.setThreadNamePrefix("pipeline-");
        ex.setWaitForTasksToCompleteOnShutdown(true);
        ex.setAwaitTerminationSeconds(20);
        ex.setRejectedExecutionHandler(new ThreadPoolExecutor.AbortPolicy());
        ex.initialize();
        return ex;
    }
}
