package com.platformops.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;
import java.util.List;

/** All custom settings under the "app." prefix, validated at startup (fail fast). */
@Validated
@ConfigurationProperties(prefix = "app")
public record AppProperties(
        @Valid @NotNull Jwt jwt,
        @Valid @NotNull Security security,
        @Valid @NotNull Cors cors,
        @Valid @NotNull Pipeline pipeline,
        @Valid @NotNull Seed seed
) {
    public record Jwt(@NotBlank String secret, @NotBlank String issuer, @NotNull Duration accessTokenTtl, @NotNull Duration refreshTokenTtl) {}

    public record Security(@Min(1) int maxFailedLogins, @NotNull Duration lockoutDuration, @Min(1) int loginRateLimitPerMinute) {}

    public record Cors(@NotNull List<String> allowedOrigins) {}

    public record Pipeline(@NotNull Duration stageDelay,
                           @DecimalMin("0.0") @DecimalMax("1.0") double failureRate,
                           @Min(1) int workerThreads) {}

    public record Seed(boolean enabled) {}
}
