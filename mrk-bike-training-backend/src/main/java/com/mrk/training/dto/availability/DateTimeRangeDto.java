package com.mrk.training.dto.availability;

import java.time.LocalDate;
import java.time.LocalTime;

public record DateTimeRangeDto(
        LocalDate startDate,
        LocalDate endDate,
        LocalTime startTime,
        LocalTime endTime) {}
