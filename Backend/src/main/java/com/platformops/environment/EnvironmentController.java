package com.platformops.environment;

import com.platformops.environment.EnvironmentService.EnvironmentResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/environments")
@Tag(name = "Environments")
public class EnvironmentController {

    private final EnvironmentService envs;

    public EnvironmentController(EnvironmentService envs) {
        this.envs = envs;
    }

    @GetMapping
    public List<EnvironmentResponse> list() {
        return envs.list();
    }

    @GetMapping("/{code}")
    public EnvironmentResponse get(@PathVariable EnvironmentCode code) {
        return envs.get(code);
    }
}
