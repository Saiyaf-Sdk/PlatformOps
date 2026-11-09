package com.platformops.security;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = PasswordValidator.class)
public @interface ValidPassword {
    String message() default "use 8–72 UTF-8 bytes with at least one letter and one number";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
