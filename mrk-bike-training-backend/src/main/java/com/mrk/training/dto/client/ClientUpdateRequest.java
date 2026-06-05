package com.mrk.training.dto.client;

import java.time.LocalDate;

public record ClientUpdateRequest(
        Integer heightCm,
        Integer weightKg,
        LocalDate dateOfBirth,
        String profilePicture) {}
