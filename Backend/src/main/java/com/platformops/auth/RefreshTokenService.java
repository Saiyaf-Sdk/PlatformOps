package com.platformops.auth;

import com.platformops.common.RequestContext;
import com.platformops.config.AppProperties;
import com.platformops.user.User;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;

/** Opaque, rotating refresh tokens with reuse detection. */
@Service
public class RefreshTokenService {

    public enum Outcome { OK, UNKNOWN, EXPIRED, REUSED, USER_DISABLED }

    public record Issued(String rawToken, Instant expiresAt) {}

    public record RotationResult(Outcome outcome, User user, Issued next) {}

    private final RefreshTokenRepository repo;
    private final AppProperties props;
    private final Clock clock;

    public RefreshTokenService(RefreshTokenRepository repo, AppProperties props, Clock clock) {
        this.repo = repo;
        this.props = props;
        this.clock = clock;
    }

    @Transactional
    public Issued issue(User user) {
        Instant now = clock.instant();
        String raw = TokenHasher.newOpaqueToken();
        Instant exp = now.plus(props.jwt().refreshTokenTtl());
        repo.save(new RefreshToken(user, TokenHasher.sha256(raw), now, exp, RequestContext.userAgent(), RequestContext.clientIp()));
        return new Issued(raw, exp);
    }

    /**
     * Validates and rotates in one locked transaction. A token that was already used (revoked)
     * signals theft: every session for that user is revoked.
     */
    @Transactional
    public RotationResult rotate(String rawToken) {
        Instant now = clock.instant();
        var found = repo.findForUpdate(TokenHasher.sha256(rawToken));
        if (found.isEmpty()) return new RotationResult(Outcome.UNKNOWN, null, null);
        RefreshToken token = found.get();
        User user = token.getUser();
        if (token.getRevokedAt() != null) {
            repo.revokeAllForUser(user.getId(), now);
            return new RotationResult(Outcome.REUSED, user, null);
        }
        if (!token.getExpiresAt().isAfter(now)) return new RotationResult(Outcome.EXPIRED, user, null);
        if (!user.isEnabled()) {
            token.setRevokedAt(now);
            return new RotationResult(Outcome.USER_DISABLED, user, null);
        }
        token.setRevokedAt(now);
        return new RotationResult(Outcome.OK, user, issue(user));
    }

    @Transactional
    public void revoke(String rawToken) {
        repo.findByTokenHash(TokenHasher.sha256(rawToken)).ifPresent(t -> {
            if (t.getRevokedAt() == null) t.setRevokedAt(clock.instant());
        });
    }

    @Transactional
    public int revokeAll(Long userId) {
        return repo.revokeAllForUser(userId, clock.instant());
    }

    @Scheduled(cron = "0 17 3 * * *")
    @Transactional
    public void purgeExpired() {
        repo.deleteExpiredBefore(clock.instant().minus(Duration.ofDays(1)));
    }
}
