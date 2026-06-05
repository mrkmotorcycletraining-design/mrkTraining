package com.mrk.training.dto.auth;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank String emailUsername,
        @NotBlank String password) {}
