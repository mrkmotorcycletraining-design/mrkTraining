package com.mrk.training.dto.auth;

import jakarta.validation.constraints.NotBlank;

public record PasswordTestRequest(
    @NotBlank String password,
    String existingHash
) {
}
