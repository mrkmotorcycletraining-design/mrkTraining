package com.mrk.training.dto.client;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record ClientCreateRequest(
        @NotBlank String name,
        @NotBlank String emailUsername,
        @NotBlank String uniqueId,
        @NotBlank String password,
        @NotNull @Positive Integer allowedNumOfTrainings,
        Integer heightCm,
        Integer weightKg) {}
