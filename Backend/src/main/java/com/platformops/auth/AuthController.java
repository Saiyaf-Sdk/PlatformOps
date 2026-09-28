package com.platformops.auth;

import com.platformops.audit.AuditService;
import com.platformops.auth.AuthDtos.LoginRequest;
import com.platformops.auth.AuthDtos.RefreshRequest;
import com.platformops.auth.AuthDtos.TokenResponse;
import com.platformops.security.CurrentUser;
import com.platformops.user.UserDtos.ChangePasswordRequest;
import com.platformops.user.UserDtos.UserResponse;
import com.platformops.user.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication")
public class AuthController {

    private final AuthService auth;
    private final UserService users;
    private final RefreshTokenService refreshTokens;
    private final AuditService audit;

    public AuthController(AuthService auth, UserService users, RefreshTokenService refreshTokens, AuditService audit) {
        this.auth = auth;
        this.users = users;
        this.refreshTokens = refreshTokens;
        this.audit = audit;
    }

    @Operation(summary = "Sign in with email + password; returns an access token (15 min) and a rotating refresh token")
    @PostMapping("/login")
    public TokenResponse login(@Valid @RequestBody LoginRequest req) {
        return auth.login(req);
    }

    @Operation(summary = "Exchange a refresh token for a new token pair (the old refresh token is revoked)")
    @PostMapping("/refresh")
    public TokenResponse refresh(@Valid @RequestBody RefreshRequest req) {
        return auth.refresh(req.refreshToken());
    }

    @Operation(summary = "Revoke a refresh token")
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody(required = false) RefreshRequest req) {
        auth.logout(req == null ? null : req.refreshToken());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Revoke every session of the current user")
    @PostMapping("/logout-all")
    public ResponseEntity<Void> logoutAll() {
        var me = CurrentUser.require();
        refreshTokens.revokeAll(me.id());
        audit.recordIndependent(me.id(), me.email(), "LOGOUT_ALL", "USER", me.id(), "All sessions revoked");
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public UserResponse me() {
        return users.get(CurrentUser.require().id());
    }

    @PutMapping("/password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest req) {
        users.changeOwnPassword(CurrentUser.require().id(), req);
        return ResponseEntity.noContent().build();
    }
}
