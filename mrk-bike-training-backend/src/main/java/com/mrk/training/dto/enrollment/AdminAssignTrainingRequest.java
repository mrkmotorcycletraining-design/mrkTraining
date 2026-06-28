package com.mrk.training.dto.enrollment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * Request for admin-assigned training. The admin specifies exact date-time ranges
 * and optionally a trainer. All operations happen in a single transaction:
 * 1. Create enrollment in client_course_enrollments
 * 2. Create schedule_slots for each day in the ranges
 * 3. Reduce client's allowed_num_of_trainings by 1
 */
public record AdminAssignTrainingRequest(
        @NotNull Long clientId,
        @NotBlank String courseId,
        @NotBlank String branchId,
        @NotBlank String assetType,
        /** Vehicle ID to assign (optional — can be resolved later) */
        String vehicleId,
        /** Trainer ID to assign (optional — can be assigned later) */
        Long trainerId,
        @NotNull @Positive Integer hoursPerDay,
        /** Optional amount paid */
        BigDecimal totalAmountPaid,
        /** The date-time ranges admin selected */
        @NotEmpty List<DateTimeRangeSlot> slots) {

    public record DateTimeRangeSlot(
            @NotNull LocalDate startDate,
            @NotNull LocalDate endDate,
            @NotNull LocalTime startTime,
            @NotNull LocalTime endTime) {}
}
