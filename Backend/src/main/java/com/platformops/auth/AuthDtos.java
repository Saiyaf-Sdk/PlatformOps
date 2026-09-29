package com.platformops.auth;

import com.platformops.user.UserDtos.UserResponse;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public final class AuthDtos {
    private AuthDtos() {}

    public record LoginRequest(@NotBlank @Email @Size(max = 254) String email,
                               @NotBlank @Size(max = 128) String password) {}

    public record RefreshRequest(@NotBlank @Size(max = 200) String refreshToken) {}

    public record TokenResponse(String tokenType, String accessToken, Instant accessTokenExpiresAt,
                                String refreshToken, Instant refreshTokenExpiresAt, UserResponse user) {}
}
