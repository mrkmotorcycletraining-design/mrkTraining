package com.mrk.training.dto.availability;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

public record TrainerAvailabilityRequest(
        @NotBlank String branchId,
        @NotEmpty List<DateTimeRangeDto> ranges) {}
