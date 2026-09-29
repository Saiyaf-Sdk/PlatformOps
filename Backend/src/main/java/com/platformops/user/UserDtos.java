package com.platformops.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public final class UserDtos {
    private UserDtos() {}

    public static final String PASSWORD_RULE = "^(?=.*[A-Za-z])(?=.*\\d).{8,72}$";
    public static final String PASSWORD_MESSAGE = "must be 8–72 characters and contain a letter and a number";

    public record UserResponse(Long id, String email, String fullName, Role role, boolean enabled,
                               boolean locked, Instant lastLoginAt, Instant createdAt) {
        public static UserResponse from(User u) {
            return new UserResponse(u.getId(), u.getEmail(), u.getFullName(), u.getRole(), u.isEnabled(),
                    u.isLocked(Instant.now()), u.getLastLoginAt(), u.getCreatedAt());
        }
    }

    /** Lightweight reference used inside other resources (assignee, triggeredBy…). */
    public record UserRef(Long id, String fullName, String email) {
        public static UserRef from(User u) {
            return u == null ? null : new UserRef(u.getId(), u.getFullName(), u.getEmail());
        }
    }

    public record CreateUserRequest(
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(min = 2, max = 120) String fullName,
            @NotBlank @Pattern(regexp = PASSWORD_RULE, message = PASSWORD_MESSAGE) String password,
            @NotNull Role role) {}

    public record UpdateUserRequest(
            @Size(min = 2, max = 120) String fullName,
            Role role,
            Boolean enabled) {}

    public record ChangePasswordRequest(
            @NotBlank String currentPassword,
            @NotBlank @Pattern(regexp = PASSWORD_RULE, message = PASSWORD_MESSAGE) String newPassword) {}
}
