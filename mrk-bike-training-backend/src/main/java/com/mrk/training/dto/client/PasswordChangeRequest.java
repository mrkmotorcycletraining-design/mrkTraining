package com.mrk.training.dto.client;

import jakarta.validation.constraints.NotBlank;

public record PasswordChangeRequest(
    @NotBlank String currentPassword,
    @NotBlank String newPassword
) {
}
