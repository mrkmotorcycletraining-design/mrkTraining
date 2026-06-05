package com.mrk.training.dto.client;

import jakarta.validation.constraints.NotBlank;

public record PasswordResetRequest(
    @NotBlank String password
) {
}
