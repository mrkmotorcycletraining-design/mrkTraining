package com.mrk.training.dto.client;

import java.time.LocalDate;

public record AdminClientProfileResponse(
        Long id,
        String name,
        String username,
        String email,
        Integer allowedNumOfTrainings,
        boolean active,
        Double heightFt,
        Integer weightKg,
        LocalDate dateOfBirth,
        String profilePicture) {}
