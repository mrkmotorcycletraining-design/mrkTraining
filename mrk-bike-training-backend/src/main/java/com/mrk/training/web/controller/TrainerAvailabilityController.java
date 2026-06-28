package com.mrk.training.web.controller;

import com.mrk.training.dto.trainer.TrainerAvailabilityRequest;
import com.mrk.training.model.Role;
import com.mrk.training.model.TrainerAvailability;
import com.mrk.training.security.SecurityUtils;
import com.mrk.training.service.TrainerAvailabilityService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/trainer-availability")
public class TrainerAvailabilityController {

    private final TrainerAvailabilityService service;

    public TrainerAvailabilityController(TrainerAvailabilityService service) {
        this.service = service;
    }

    @PostMapping
    //    @PreAuthorize("hasAnyRole('TRAINER','ADMIN','SUPER_ADMIN')")
    public TrainerAvailability add(@Valid @RequestBody TrainerAvailabilityRequest req) {
        enforceTrainerOwnership(req.trainerId());
        return service.addSlot(req);
    }

    @GetMapping
    //    @PreAuthorize("hasAnyRole('TRAINER','ADMIN','SUPER_ADMIN')")
    public List<TrainerAvailability> list(@RequestParam(required = false) Long trainerId) {
        Long id = resolveTrainerId(trainerId);
        if (id == null) {
            return service.getAllActiveSlots();
        }
        return service.getActiveSlots(id);
    }

    @DeleteMapping("/{id}")
    //    @PreAuthorize("hasAnyRole('TRAINER','ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Void> remove(@PathVariable Long id) {
        service.removeSlot(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/absence")
    //    @PreAuthorize("hasAnyRole('TRAINER','ADMIN','SUPER_ADMIN')")
    public TrainerAvailability markAbsence(
            @RequestParam Long trainerId,
            @RequestParam LocalDate date) {
        enforceTrainerOwnership(trainerId);
        return service.markAbsence(trainerId, date);
    }

    private Long resolveTrainerId(Long trainerId) {
        if (SecurityUtils.currentRole() == Role.TRAINER) {
            return SecurityUtils.currentUserId();
        }
        // Admin/SuperAdmin: if no trainerId provided, return null to fetch all
        return trainerId;
    }

    private void enforceTrainerOwnership(Long trainerId) {
        if (SecurityUtils.currentRole() == Role.TRAINER
                && !SecurityUtils.currentUserId().equals(trainerId)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Trainers may only manage their own availability.");
        }
    }
}
