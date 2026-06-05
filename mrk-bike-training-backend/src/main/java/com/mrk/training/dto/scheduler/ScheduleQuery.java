package com.mrk.training.dto.scheduler;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;
import java.util.List;

public record ScheduleQuery(
        @NotBlank String branchId,
        String assetType,
        @NotNull LocalDate startDate,
        List<String> preferredDays,
        @Positive int hoursPerDay,
        @Positive int totalDays) {}
