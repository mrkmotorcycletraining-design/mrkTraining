package com.mrk.training.dto.client;

import java.time.LocalDate;

public record ClientUpdateRequest(
        Double heightFt,
        Integer weightKg,
        LocalDate dateOfBirth,
        String profilePicture,
        String email) {}
