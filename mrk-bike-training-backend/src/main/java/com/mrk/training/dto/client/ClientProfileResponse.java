package com.mrk.training.dto.client;

import java.time.LocalDate;

public record ClientProfileResponse(
        Long id,
        String name,
        String username,
        String email,
        Double heightFt,
        Integer weightKg,
        LocalDate dateOfBirth,
        String profilePicture) {}
