package com.platformops.user;

import com.platformops.common.PageResponse;
import com.platformops.user.UserDtos.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "People & access")
public class UserController {

    private final UserService users;

    public UserController(UserService users) {
        this.users = users;
    }

    /** Everyone signed in can list people (needed for assignee pickers); only admins change them. */
    @GetMapping
    public PageResponse<UserResponse> list(@RequestParam(required = false) String q,
                                           @RequestParam(required = false) Role role,
                                           @RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "50") int size) {
        return users.search(q, role, page, size);
    }

    @GetMapping("/{id}")
    public UserResponse get(@PathVariable Long id) {
        return users.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse create(@Valid @RequestBody CreateUserRequest req) {
        return users.create(req);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse update(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest req) {
        return users.update(id, req);
    }

    @PostMapping("/{id}/unlock")
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse unlock(@PathVariable Long id) {
        return users.unlock(id);
    }
}
