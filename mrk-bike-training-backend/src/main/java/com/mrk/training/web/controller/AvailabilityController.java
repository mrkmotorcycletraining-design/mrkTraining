package com.mrk.training.web.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mrk.training.dto.availability.TrainerAvailabilityRequest;
import com.mrk.training.dto.availability.TrainerAvailabilityResponse;
import com.mrk.training.dto.availability.VehicleAvailabilityRequest;
import com.mrk.training.dto.availability.VehicleAvailabilityResponse;
import com.mrk.training.service.AvailabilityService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/availability")
public class AvailabilityController {

    private final AvailabilityService service;

    public AvailabilityController(AvailabilityService service) {
        this.service = service;
    }

    /**
     * Check trainer availability for a branch within given date-time ranges.
     * Returns groups of trainers that can cover the requested schedule.
     */
    @PostMapping("/trainers")
    public TrainerAvailabilityResponse checkTrainers(@Valid @RequestBody TrainerAvailabilityRequest request) {
        return service.checkTrainerAvailability(request);
    }

    /**
     * Check vehicle availability for a branch, type, and name within given date-time ranges.
     * Returns per-day availability status.
     */
    @PostMapping("/vehicles")
    public VehicleAvailabilityResponse checkVehicles(@Valid @RequestBody VehicleAvailabilityRequest request) {
        return service.checkVehicleAvailability(request);
    }
}
