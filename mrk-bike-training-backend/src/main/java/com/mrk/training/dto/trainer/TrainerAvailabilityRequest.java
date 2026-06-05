package com.mrk.training.dto.trainer;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record TrainerAvailabilityRequest(
        @NotNull Long trainerId,
        @NotBlank String branchId,
        @NotBlank String availableDays,
        @NotNull LocalTime slotStartTime,
        @NotNull LocalTime slotEndTime,
        @NotNull LocalDate effectiveFrom,
        LocalDate effectiveTo) {}
