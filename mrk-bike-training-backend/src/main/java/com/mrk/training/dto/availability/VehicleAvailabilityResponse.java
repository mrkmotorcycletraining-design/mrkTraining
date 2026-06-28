package com.mrk.training.dto.availability;

import java.time.LocalDate;
import java.util.List;

/**
 * Response for vehicle availability check.
 */
public record VehicleAvailabilityResponse(
        /** overall status: AVAILABLE, PARTIAL, NOT_AVAILABLE */
        String status,
        List<VehicleDayStatus> days,
        /** message describing availability */
        String message) {

    public record VehicleDayStatus(
            LocalDate date,
            boolean available,
            /** the specific vehicle ID available on this day (null if none) */
            String vehicleId,
            String vehicleName,
            String vehicleColor) {}
}
