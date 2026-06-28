package com.mrk.training.dto.availability;

import java.time.LocalDate;
import java.util.List;

/**
 * Response for trainer availability check.
 * Each entry represents a trainer (or combination of trainers) that can cover
 * the requested date-time ranges.
 */
public record TrainerAvailabilityResponse(
        List<TrainerCoverageGroup> groups) {

    /**
     * A group of trainer assignments that together cover the requested date range.
     * If a single trainer covers all days, the segments list will have one entry.
     * If multiple trainers are needed, each segment shows which trainer covers which days.
     */
    public record TrainerCoverageGroup(
            /** true if a single trainer covers all requested days */
            boolean fullCoverage,
            /** priority: full coverage groups rank higher */
            int priority,
            List<TrainerSegment> segments,
            /** total days covered across all segments */
            int totalDaysCovered,
            /** total days requested */
            int totalDaysRequested) {}

    public record TrainerSegment(
            Long trainerId,
            String trainerName,
            String trainerUsername,
            /** days this trainer covers */
            List<LocalDate> coveredDates,
            /** remaining capacity (how many more clients they can take) */
            int remainingCapacity) {}
}
