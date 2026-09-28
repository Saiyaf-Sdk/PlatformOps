package com.platformops.security;

import com.platformops.config.AppProperties;
import com.platformops.user.Role;
import com.platformops.user.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Clock;
import java.time.Instant;
import java.util.Arrays;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;

@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);
    static final String DEV_SECRET_MARKER = "ZGV2LW9ubHktcGxhdGZvcm1vcHMtc2VjcmV0";

    private final SecretKey key;
    private final AppProperties.Jwt cfg;
    private final Clock clock;

    public JwtService(AppProperties props, Clock clock, Environment env) {
        this.cfg = props.jwt();
        this.clock = clock;
        byte[] bytes;
        try {
            bytes = Decoders.BASE64.decode(cfg.secret());
        } catch (RuntimeException e) {
            throw new IllegalStateException("app.jwt.secret (JWT_SECRET) must be Base64-encoded", e);
        }
        if (bytes.length < 32) {
            throw new IllegalStateException("app.jwt.secret (JWT_SECRET) must decode to at least 256 bits (32 bytes)");
        }
        boolean prod = Arrays.asList(env.getActiveProfiles()).contains("prod");
        if (cfg.secret().startsWith(DEV_SECRET_MARKER)) {
            if (prod) throw new IllegalStateException("Refusing to start in prod with the development JWT secret. Set JWT_SECRET.");
            log.warn("Using the built-in DEVELOPMENT JWT secret. Set JWT_SECRET before deploying anywhere real.");
        }
        this.key = Keys.hmacShaKeyFor(bytes);
    }

    public record IssuedToken(String token, Instant expiresAt) {}

    public IssuedToken issueAccessToken(User user) {
        Instant now = clock.instant();
        Instant exp = now.plus(cfg.accessTokenTtl());
        String token = Jwts.builder()
                .id(UUID.randomUUID().toString())
                .issuer(cfg.issuer())
                .subject(String.valueOf(user.getId()))
                .claim("email", user.getEmail())
                .claim("role", user.getRole().name())
                .claim("typ", "access")
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .signWith(key, Jwts.SIG.HS256)
                .compact();
        return new IssuedToken(token, exp);
    }

    /** Returns the principal for a valid, unexpired access token; empty for anything else. */
    public Optional<AuthUser> parseAccessToken(String token) {
        try {
            Claims c = Jwts.parser()
                    .verifyWith(key)
                    .requireIssuer(cfg.issuer())
                    .clock(() -> Date.from(clock.instant()))
                    .clockSkewSeconds(30)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            if (!"access".equals(c.get("typ", String.class))) return Optional.empty();
            return Optional.of(new AuthUser(Long.valueOf(c.getSubject()), c.get("email", String.class),
                    Role.valueOf(c.get("role", String.class))));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
