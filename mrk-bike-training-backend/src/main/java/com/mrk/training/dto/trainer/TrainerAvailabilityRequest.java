package com.mrk.training.dto.trainer;

import java.time.LocalDate;
import java.time.LocalTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record TrainerAvailabilityRequest(
        @NotNull Long trainerId,
        @NotBlank String branchId,
        @NotNull Integer numberOfTrainingCanTake,
        @NotNull LocalTime slotStartTime,
        @NotNull LocalTime slotEndTime,
        @NotNull LocalDate effectiveFrom,
        LocalDate effectiveTo,
        String preferredDays) {}
