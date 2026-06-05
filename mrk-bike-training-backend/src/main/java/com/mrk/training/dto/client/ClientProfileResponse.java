package com.mrk.training.dto.client;

import java.time.LocalDate;

public record ClientProfileResponse(
        Long id,
        String name,
        String emailUsername,
        Integer heightCm,
        Integer weightKg,
        LocalDate dateOfBirth,
        String profilePicture) {}
