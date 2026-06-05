package com.mrk.training.dto.enrollment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record EnrollmentRequest(
        Long clientId,
        @NotBlank String courseId,
        @NotBlank String branchId,
        String assetType,
        @NotNull LocalDate startDate,
        List<String> preferredDays,
        @Positive int hoursPerDay,
        BigDecimal totalAmountPaid) {}
