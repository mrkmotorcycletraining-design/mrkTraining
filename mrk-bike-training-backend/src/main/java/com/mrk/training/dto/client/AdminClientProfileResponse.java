package com.mrk.training.dto.client;

import java.time.LocalDate;

public record AdminClientProfileResponse(
        Long id,
        String name,
        String emailUsername,
        String uniqueId,
        Integer allowedNumOfTrainings,
        boolean active,
        Integer heightCm,
        Integer weightKg,
        LocalDate dateOfBirth,
        String profilePicture) {}
