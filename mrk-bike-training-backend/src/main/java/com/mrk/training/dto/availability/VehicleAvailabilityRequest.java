package com.mrk.training.dto.availability;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record VehicleAvailabilityRequest(
        @NotBlank String branchId,
        @NotBlank String vehicleType,
        @NotBlank String vehicleName,
        @NotEmpty List<DateTimeRangeDto> ranges) {}
