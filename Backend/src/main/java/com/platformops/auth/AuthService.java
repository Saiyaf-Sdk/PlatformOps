package com.platformops.auth;

import com.platformops.audit.AuditService;
import com.platformops.auth.AuthDtos.LoginRequest;
import com.platformops.auth.AuthDtos.SignupRequest;
import com.platformops.auth.AuthDtos.TokenResponse;
import com.platformops.common.ApiException;
import com.platformops.common.RequestContext;
import com.platformops.config.AppProperties;
import com.platformops.security.JwtService;
import com.platformops.security.LoginRateLimiter;
import com.platformops.user.Role;
import com.platformops.user.User;
import com.platformops.user.UserDtos.UserResponse;
import com.platformops.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;

/**
 * Login / refresh / logout. Deliberately NOT one big transaction: failed-attempt counters and
 * audit entries must be persisted even when the request ends in a 401.
 */
@Service
public class AuthService {

    private static final String INVALID = "Invalid email or password";

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final RefreshTokenService refreshTokens;
    private final LoginRateLimiter rateLimiter;
    private final AuditService audit;
    private final AppProperties props;
    private final Clock clock;
    private final String dummyHash;

    public AuthService(UserRepository users, PasswordEncoder encoder, JwtService jwt, RefreshTokenService refreshTokens,
                       LoginRateLimiter rateLimiter, AuditService audit, AppProperties props, Clock clock) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
        this.refreshTokens = refreshTokens;
        this.rateLimiter = rateLimiter;
        this.audit = audit;
        this.props = props;
        this.clock = clock;
        this.dummyHash = encoder.encode("timing-equaliser-" + System.nanoTime());
    }

    public TokenResponse login(LoginRequest req) {
        String ip = RequestContext.clientIp();
        if (!rateLimiter.tryAcquire("login:" + ip)) {
            throw ApiException.tooManyRequests("Too many sign-in attempts. Wait a minute and try again.");
        }
        String email = req.email().trim().toLowerCase(Locale.ROOT);
        Instant now = clock.instant();
        User user = users.findByEmailIgnoreCase(email).orElse(null);

        if (user == null) {
            encoder.matches(req.password(), dummyHash); // same cost as a real check: no user enumeration by timing
            audit.recordIndependent(null, email, "LOGIN_FAILED", "USER", null, "Unknown email");
            throw ApiException.unauthorized("invalid_credentials", INVALID);
        }
        if (user.isLocked(now)) {
            long mins = Math.max(1, Duration.between(now, user.getLockedUntil()).toMinutes() + 1);
            audit.recordIndependent(user.getId(), user.getEmail(), "LOGIN_BLOCKED", "USER", user.getId(), "Account locked");
            throw new ApiException(HttpStatus.LOCKED, "account_locked",
                    "Too many failed attempts. Try again in " + mins + " minute" + (mins == 1 ? "" : "s") + ".");
        }
        if (!encoder.matches(req.password(), user.getPasswordHash())) {
            int attempts = user.getFailedAttempts() + 1;
            if (attempts >= props.security().maxFailedLogins()) {
                user.setFailedAttempts(0);
                user.setLockedUntil(now.plus(props.security().lockoutDuration()));
                audit.recordIndependent(user.getId(), user.getEmail(), "ACCOUNT_LOCKED", "USER", user.getId(),
                        "Locked after " + attempts + " failed attempts");
            } else {
                user.setFailedAttempts(attempts);
            }
            users.save(user);
            audit.recordIndependent(user.getId(), user.getEmail(), "LOGIN_FAILED", "USER", user.getId(), "Wrong password");
            throw ApiException.unauthorized("invalid_credentials", INVALID);
        }
        if (!user.isEnabled()) {
            audit.recordIndependent(user.getId(), user.getEmail(), "LOGIN_BLOCKED", "USER", user.getId(), "Account disabled");
            throw ApiException.unauthorized("account_disabled", "This account has been disabled. Contact an administrator.");
        }

        user.setFailedAttempts(0);
        user.setLockedUntil(null);
        user.setLastLoginAt(now);
        user = users.save(user);
        audit.recordIndependent(user.getId(), user.getEmail(), "LOGIN", "USER", user.getId(), "Signed in");
        return tokensFor(user);
    }

    public TokenResponse signup(SignupRequest req) {
        String email = req.email().trim().toLowerCase(Locale.ROOT);
        if (users.findByEmailIgnoreCase(email).isPresent()) {
            throw ApiException.badRequest("email_taken", "That email is already in use.");
        }
        User user = new User(email, req.fullName().trim(), encoder.encode(req.password()), Role.DEVELOPER);
        user.setEnabled(true);
        user.setFailedAttempts(0);
        user = users.save(user);
        
        audit.recordIndependent(user.getId(), email, "SIGNUP", "USER", user.getId(), "Account created via signup");
        return tokensFor(user);
    }

    public TokenResponse refresh(String rawRefreshToken) {
        if (!rateLimiter.tryAcquire("refresh:" + RequestContext.clientIp())) {
            throw ApiException.tooManyRequests("Too many requests. Slow down.");
        }
        var result = refreshTokens.rotate(rawRefreshToken);
        return switch (result.outcome()) {
            case OK -> {
                User u = result.user();
                var access = jwt.issueAccessToken(u);
                yield new TokenResponse("Bearer", access.token(), access.expiresAt(),
                        result.next().rawToken(), result.next().expiresAt(), UserResponse.from(u));
            }
            case REUSED -> {
                audit.recordIndependent(result.user().getId(), result.user().getEmail(), "TOKEN_REUSE_DETECTED", "USER",
                        result.user().getId(), "Refresh token reused; all sessions revoked");
                throw ApiException.unauthorized("session_revoked", "Your session was revoked for security. Please sign in again.");
            }
            case USER_DISABLED -> throw ApiException.unauthorized("account_disabled", "This account has been disabled.");
            case UNKNOWN, EXPIRED -> throw ApiException.unauthorized("invalid_refresh_token", "Your session has expired. Please sign in again.");
        };
    }

    public void logout(String rawRefreshToken) {
        if (rawRefreshToken != null && !rawRefreshToken.isBlank()) refreshTokens.revoke(rawRefreshToken);
    }

    private TokenResponse tokensFor(User user) {
        var access = jwt.issueAccessToken(user);
        var refresh = refreshTokens.issue(user);
        return new TokenResponse("Bearer", access.token(), access.expiresAt(), refresh.rawToken(), refresh.expiresAt(),
                UserResponse.from(user));
    }
}
