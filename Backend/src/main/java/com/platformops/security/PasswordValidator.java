package com.platformops.security;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.nio.charset.StandardCharsets;

public class PasswordValidator implements ConstraintValidator<ValidPassword, String> {
    public boolean isValid(String value, ConstraintValidatorContext context) {
        return value != null && value.matches("(?s)^(?=.*[A-Za-z])(?=.*\\d).{8,72}$")
                && value.getBytes(StandardCharsets.UTF_8).length <= 72;
    }
}
