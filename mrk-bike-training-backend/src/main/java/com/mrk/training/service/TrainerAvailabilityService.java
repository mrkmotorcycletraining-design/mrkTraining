package com.mrk.training.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mrk.training.dto.trainer.TrainerAvailabilityRequest;
import com.mrk.training.exception.AvailabilityConflictException;
import com.mrk.training.model.TrainerAvailability;
import com.mrk.training.model.TrainerProfile;
import com.mrk.training.repository.TrainerAvailabilityRepository;
import com.mrk.training.repository.TrainerRepository;

@Service
public class TrainerAvailabilityService {

    private static final int GAP_MINUTES = 30;

    private final TrainerAvailabilityRepository availabilityRepository;
    private final TrainerRepository trainerRepository;

    public TrainerAvailabilityService(
            TrainerAvailabilityRepository availabilityRepository,
            TrainerRepository trainerRepository) {
        this.availabilityRepository = availabilityRepository;
        this.trainerRepository = trainerRepository;
    }

    @Transactional
    public TrainerAvailability addSlot(TrainerAvailabilityRequest req) {
        validateInterBranchGap(req);
        TrainerProfile trainer = trainerRepository.findById(req.trainerId())
                .orElseThrow(() -> new IllegalArgumentException("Trainer not found: " + req.trainerId()));

        TrainerAvailability slot = new TrainerAvailability();
        slot.setTrainer(trainer);
        slot.setBranchId(req.branchId());
        slot.setNumberOfTrainingCanTake(req.numberOfTrainingCanTake());
        slot.setSlotStartTime(req.slotStartTime());
        slot.setSlotEndTime(req.slotEndTime());
        slot.setEffectiveFrom(req.effectiveFrom());
        slot.setEffectiveTo(req.effectiveTo());
        slot.setPreferredDays(req.preferredDays());
        slot.setActive(true);
        slot.setAuditStartDateTime(LocalDateTime.now());
        return availabilityRepository.save(slot);
    }

    @Transactional
    public void removeSlot(Long availabilityId) {
        TrainerAvailability slot = availabilityRepository.findById(availabilityId)
                .orElseThrow(() -> new IllegalArgumentException("Availability slot not found."));
        slot.setActive(false);
        availabilityRepository.save(slot);
    }

    public List<TrainerAvailability> getActiveSlots(Long trainerId) {
        return availabilityRepository.findActiveByTrainerId(trainerId);
    }

    public List<TrainerAvailability> getAllActiveSlots() {
        return availabilityRepository.findAllActive();
    }

    @Transactional
    public TrainerAvailability markAbsence(Long trainerId, LocalDate date) {
        TrainerProfile trainer = trainerRepository.findById(trainerId)
                .orElseThrow(() -> new IllegalArgumentException("Trainer not found: " + trainerId));
        TrainerAvailability absence = new TrainerAvailability();
        absence.setTrainer(trainer);
        absence.setBranchId("_ABSENCE_");
        absence.setNumberOfTrainingCanTake(0);
        absence.setSlotStartTime(LocalTime.MIDNIGHT);
        absence.setSlotEndTime(LocalTime.MIDNIGHT);
        absence.setEffectiveFrom(date);
        absence.setEffectiveTo(date);
        absence.setActive(true);
        absence.setAuditStartDateTime(LocalDateTime.now());
        return availabilityRepository.save(absence);
    }

    private void validateInterBranchGap(TrainerAvailabilityRequest req) {
        List<TrainerAvailability> otherBranch =
                availabilityRepository.findActiveByTrainerIdExcludingBranch(req.trainerId(), req.branchId());
        for (TrainerAvailability existing : otherBranch) {
            LocalTime newEndPlusGap = req.slotEndTime().plusMinutes(GAP_MINUTES);
            LocalTime existingEndPlusGap = existing.getSlotEndTime().plusMinutes(GAP_MINUTES);
            boolean overlap = req.slotStartTime().isBefore(existingEndPlusGap)
                    && newEndPlusGap.isAfter(existing.getSlotStartTime());
            if (overlap) {
                throw new AvailabilityConflictException(
                        "Trainer must have at least 30 minutes between slots at different branches.");
            }
        }
    }

}
