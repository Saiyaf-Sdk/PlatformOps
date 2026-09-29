package com.platformops.user;

import com.platformops.audit.AuditService;
import com.platformops.auth.RefreshTokenService;
import com.platformops.common.ApiException;
import com.platformops.common.PageResponse;
import com.platformops.common.Pages;
import com.platformops.common.Specs;
import com.platformops.security.CurrentUser;
import com.platformops.user.UserDtos.*;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class UserService {

    private final UserRepository repo;
    private final PasswordEncoder encoder;
    private final AuditService audit;
    private final RefreshTokenService refreshTokens;

    public UserService(UserRepository repo, PasswordEncoder encoder, AuditService audit, RefreshTokenService refreshTokens) {
        this.repo = repo;
        this.encoder = encoder;
        this.audit = audit;
        this.refreshTokens = refreshTokens;
    }

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> search(String q, Role role, int page, int size) {
        Specification<User> spec = Specification.where(Specs.<User>containsAny(q, "email", "fullName"))
                .and(Specs.eq("role", role));
        return PageResponse.of(repo.findAll(spec, Pages.of(page, size, Sort.by("fullName", "id"))), UserResponse::from);
    }

    @Transactional(readOnly = true)
    public UserResponse get(Long id) {
        return UserResponse.from(find(id));
    }

    @Transactional
    public UserResponse create(CreateUserRequest req) {
        String email = req.email().trim().toLowerCase(Locale.ROOT);
        if (repo.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("email_taken", "A user with this email already exists");
        }
        User u = repo.save(new User(email, req.fullName().trim(), encoder.encode(req.password()), req.role()));
        audit.record("USER_CREATED", "USER", u.getId(), u.getEmail() + " as " + u.getRole());
        return UserResponse.from(u);
    }

    @Transactional
    public UserResponse update(Long id, UpdateUserRequest req) {
        User u = find(id);
        Long me = CurrentUser.require().id();
        boolean demotingOrDisablingAdmin = u.getRole() == Role.ADMIN && u.isEnabled()
                && ((req.role() != null && req.role() != Role.ADMIN) || Boolean.FALSE.equals(req.enabled()));
        if (demotingOrDisablingAdmin && repo.countByRoleAndEnabledTrue(Role.ADMIN) <= 1) {
            throw ApiException.conflict("last_admin", "You can't remove the last active administrator");
        }
        if (u.getId().equals(me) && (Boolean.FALSE.equals(req.enabled()) || (req.role() != null && req.role() != u.getRole()))) {
            throw ApiException.conflict("self_change", "You can't change your own role or disable yourself");
        }
        StringBuilder changes = new StringBuilder();
        if (req.fullName() != null && !req.fullName().isBlank()) { u.setFullName(req.fullName().trim()); changes.append("name "); }
        boolean roleChanged = req.role() != null && req.role() != u.getRole();
        if (roleChanged) { changes.append("role ").append(u.getRole()).append("→").append(req.role()).append(' '); u.setRole(req.role()); }
        if (req.enabled() != null && req.enabled() != u.isEnabled()) {
            u.setEnabled(req.enabled());
            changes.append(req.enabled() ? "enabled " : "disabled ");
            if (!req.enabled()) refreshTokens.revokeAll(u.getId());
        }
        if (roleChanged) refreshTokens.revokeAll(u.getId()); // role lives in the JWT: force a fresh sign-in
        audit.record("USER_UPDATED", "USER", u.getId(), u.getEmail() + ": " + changes.toString().trim());
        return UserResponse.from(u);
    }

    @Transactional
    public UserResponse unlock(Long id) {
        User u = find(id);
        u.setLockedUntil(null);
        u.setFailedAttempts(0);
        audit.record("USER_UNLOCKED", "USER", u.getId(), u.getEmail());
        return UserResponse.from(u);
    }

    @Transactional
    public void changeOwnPassword(Long id, ChangePasswordRequest req) {
        User u = find(id);
        if (!encoder.matches(req.currentPassword(), u.getPasswordHash())) {
            throw ApiException.badRequest("wrong_password", "Your current password is incorrect");
        }
        if (encoder.matches(req.newPassword(), u.getPasswordHash())) {
            throw ApiException.badRequest("same_password", "Choose a password you haven't used here");
        }
        u.setPasswordHash(encoder.encode(req.newPassword()));
        refreshTokens.revokeAll(u.getId());
        audit.record("PASSWORD_CHANGED", "USER", u.getId(), u.getEmail());
    }

    User find(Long id) {
        return repo.findById(id).orElseThrow(() -> ApiException.notFound("User", id));
    }
}
