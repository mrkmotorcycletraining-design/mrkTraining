package com.mrk.training.service;

import com.mrk.training.dto.enrollment.ReconciliationResult;
import com.mrk.training.event.AssetSwappedEvent;
import com.mrk.training.event.BufferExhaustedEvent;
import com.mrk.training.event.SlotReassignedEvent;
import com.mrk.training.model.*;
import com.mrk.training.repository.*;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class ReconcilerService {

    private final ScheduleSlotRepository slotRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final TrainerRepository trainerRepository;
    private final TrainerAvailabilityRepository availabilityRepository;
    private final AssetRepository assetRepository;
    private final ApplicationEventPublisher events;

    public ReconcilerService(
            ScheduleSlotRepository slotRepository,
            EnrollmentRepository enrollmentRepository,
            TrainerRepository trainerRepository,
            TrainerAvailabilityRepository availabilityRepository,
            AssetRepository assetRepository,
            ApplicationEventPublisher events) {
        this.slotRepository = slotRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.trainerRepository = trainerRepository;
        this.availabilityRepository = availabilityRepository;
        this.assetRepository = assetRepository;
        this.events = events;
    }

    @Transactional
    public ReconciliationResult handleAbsence(AttendanceLog log) {
        ScheduleSlot slot = log.getSlot();
        ClientCourseEnrollment enrollment = slot.getEnrollment();
        if (enrollment == null) {
            return new ReconciliationResult(List.of(), List.of(), List.of());
        }

        int used = enrollment.getBufferDaysUsed() != null ? enrollment.getBufferDaysUsed() : 0;
        int allocated = enrollment.getBufferDaysAllocated() != null ? enrollment.getBufferDaysAllocated() : 0;
        enrollment.setBufferDaysUsed(used + 1);
        enrollmentRepository.save(enrollment);

        List<Long> newSlots = new ArrayList<>();
        if (allocated - (used + 1) > 0) {
            List<ScheduleSlot> bufferSlots = slotRepository.findByClientIdAndStatusIn(
                    enrollment.getClient().getId(), List.of(ScheduleStatus.PENDING));
            bufferSlots.stream()
                    .filter(s -> s.getType() == ScheduleType.BUFFER_SESSION)
                    .findFirst()
                    .ifPresent(buffer -> {
                        buffer.setStatus(ScheduleStatus.ACTIVE);
                        slotRepository.save(buffer);
                        newSlots.add(buffer.getId());
                    });
        } else {
            ScheduleSlot overflow = new ScheduleSlot();
            overflow.setEnrollment(enrollment);
            overflow.setClient(enrollment.getClient());
            overflow.setBranchId(slot.getBranchId());
            overflow.setTitle(slot.getTitle() + " (Overflow)");
            overflow.setStartDateTime(LocalDateTime.now().plusDays(1));
            overflow.setEndDateTime(overflow.getStartDateTime().plusHours(2));
            overflow.setType(ScheduleType.BUFFER_SESSION);
            overflow.setStatus(ScheduleStatus.PENDING);
            overflow = slotRepository.save(overflow);
            newSlots.add(overflow.getId());
            events.publishEvent(new BufferExhaustedEvent(overflow));
        }
        return new ReconciliationResult(List.of(), List.of(), newSlots);
    }

    @Transactional
    public ReconciliationResult handleTrainerAbsence(Long trainerId, LocalDate date) {
        LocalDateTime dayStart = date.atStartOfDay();
        LocalDateTime dayEnd = date.plusDays(1).atStartOfDay();
        List<ScheduleSlot> impacted = slotRepository.findByTrainerIdAndStartDateTimeBetween(
                trainerId, dayStart, dayEnd).stream()
                .filter(s -> s.getStatus() == ScheduleStatus.ACTIVE)
                .toList();

        List<Long> reassigned = new ArrayList<>();
        List<Long> cancelled = new ArrayList<>();

        for (ScheduleSlot slot : impacted) {
            TrainerProfile replacement = findReplacementTrainer(slot, date);
            if (replacement != null) {
                Long prev = slot.getTrainer() != null ? slot.getTrainer().getId() : null;
                slot.setTrainer(replacement);
                slotRepository.save(slot);
                reassigned.add(slot.getId());
                events.publishEvent(new SlotReassignedEvent(slot, prev));
            } else {
                slot.setStatus(ScheduleStatus.CANCELLED);
                slotRepository.save(slot);
                cancelled.add(slot.getId());
            }
        }
        return new ReconciliationResult(reassigned, cancelled, List.of());
    }

    @Transactional
    public ReconciliationResult handleAssetMaintenance(String assetId) {
        List<ScheduleSlot> futureSlots = slotRepository.findByResourceIdAndStatusAndStartDateTimeAfter(
                assetId, ScheduleStatus.ACTIVE, LocalDateTime.now());

        List<Long> reassigned = new ArrayList<>();
        List<Long> cancelled = new ArrayList<>();

        var asset = assetRepository.findById(assetId).orElseThrow();
        for (ScheduleSlot slot : futureSlots) {
            var replacement = assetRepository.findAll().stream()
                    .filter(a -> a.getVehicleType() != null
                            && asset.getVehicleType() != null
                            && a.getVehicleType().getTypeId().equals(asset.getVehicleType().getTypeId())
                            && a.getCurrentBranch() != null
                            && slot.getBranchId() != null
                            && a.getCurrentBranch().getId().equals(slot.getBranchId())
                            && !a.getId().equals(assetId))
                    .findFirst();
            if (replacement.isPresent()) {
                String prev = slot.getResourceId();
                slot.setResourceId(replacement.get().getId());
                slotRepository.save(slot);
                reassigned.add(slot.getId());
                events.publishEvent(new AssetSwappedEvent(slot, prev));
            } else {
                slot.setStatus(ScheduleStatus.CANCELLED);
                slotRepository.save(slot);
                cancelled.add(slot.getId());
            }
        }
        return new ReconciliationResult(reassigned, cancelled, List.of());
    }

    private TrainerProfile findReplacementTrainer(ScheduleSlot slot, LocalDate date) {
        List<TrainerProfile> trainers = trainerRepository.findAll();
        for (TrainerProfile trainer : trainers) {
            if (slot.getTrainer() != null && trainer.getId().equals(slot.getTrainer().getId())) {
                continue;
            }
            List<TrainerAvailability> avail =
                    availabilityRepository.findActiveByTrainerIdAndBranchId(trainer.getId(), slot.getBranchId());
            if (!avail.isEmpty()) {
                return trainer;
            }
        }
        return null;
    }
}
