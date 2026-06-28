package com.mrk.training.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.mrk.training.dto.availability.DateTimeRangeDto;
import com.mrk.training.dto.availability.TrainerAvailabilityRequest;
import com.mrk.training.dto.availability.TrainerAvailabilityResponse;
import com.mrk.training.dto.availability.TrainerAvailabilityResponse.TrainerCoverageGroup;
import com.mrk.training.dto.availability.TrainerAvailabilityResponse.TrainerSegment;
import com.mrk.training.dto.availability.VehicleAvailabilityRequest;
import com.mrk.training.dto.availability.VehicleAvailabilityResponse;
import com.mrk.training.dto.availability.VehicleAvailabilityResponse.VehicleDayStatus;
import com.mrk.training.model.AssetInfo;
import com.mrk.training.model.ScheduleSlot;
import com.mrk.training.model.ScheduleStatus;
import com.mrk.training.model.TrainerAvailability;
import com.mrk.training.model.TrainerProfile;
import com.mrk.training.repository.AssetRepository;
import com.mrk.training.repository.ScheduleSlotRepository;
import com.mrk.training.repository.TrainerAvailabilityRepository;
import com.mrk.training.repository.TrainerRepository;

@Service
public class AvailabilityService {

    private final TrainerAvailabilityRepository trainerAvailRepo;
    private final ScheduleSlotRepository slotRepo;
    private final AssetRepository assetRepo;
    private final TrainerRepository trainerRepo;

    public AvailabilityService(
            TrainerAvailabilityRepository trainerAvailRepo,
            ScheduleSlotRepository slotRepo,
            AssetRepository assetRepo,
            TrainerRepository trainerRepo) {
        this.trainerAvailRepo = trainerAvailRepo;
        this.slotRepo = slotRepo;
        this.assetRepo = assetRepo;
        this.trainerRepo = trainerRepo;
    }

    /**
     * Find available trainers for a branch within given date-time ranges.
     */
    public TrainerAvailabilityResponse checkTrainerAvailability(TrainerAvailabilityRequest request) {
        String branchId = request.branchId();
        List<LocalDate> allRequestedDates = expandDates(request.ranges());
        int totalDaysRequested = allRequestedDates.size();

        // Get all active trainer availability records for this branch
        List<TrainerAvailability> branchAvailabilities = trainerAvailRepo.findAllActive().stream()
                .filter(a -> a.getBranchId().equals(branchId))
                .toList();

        // Group by trainer
        Map<Long, List<TrainerAvailability>> byTrainer = branchAvailabilities.stream()
                .collect(Collectors.groupingBy(a -> a.getTrainer().getId()));

        // For each trainer, determine which requested days they can cover
        Map<Long, List<LocalDate>> trainerCoveredDays = new LinkedHashMap<>();

        for (var entry : byTrainer.entrySet()) {
            Long trainerId = entry.getKey();
            List<TrainerAvailability> availabilities = entry.getValue();

            List<LocalDate> covered = new ArrayList<>();
            for (LocalDate date : allRequestedDates) {
                if (canTrainerCoverDay(trainerId, branchId, date, request.ranges(), availabilities)) {
                    covered.add(date);
                }
            }
            if (!covered.isEmpty()) {
                trainerCoveredDays.put(trainerId, covered);
            }
        }

        // Build coverage groups
        List<TrainerCoverageGroup> groups = new ArrayList<>();

        // First: trainers with full coverage (highest priority)
        for (var entry : trainerCoveredDays.entrySet()) {
            if (entry.getValue().size() == totalDaysRequested) {
                TrainerProfile trainer = trainerRepo.findById(entry.getKey()).orElse(null);
                if (trainer == null) continue;
                int capacity = getMinRemainingCapacity(entry.getKey(), branchId, entry.getValue(), request.ranges());
                TrainerSegment segment = new TrainerSegment(
                        entry.getKey(),
                        trainer.getName(),
                        trainer.getUser() != null ? trainer.getUser().getUsername() : "",
                        entry.getValue(),
                        capacity);
                groups.add(new TrainerCoverageGroup(true, 1, List.of(segment), totalDaysRequested, totalDaysRequested));
            }
        }

        // Second: build combination groups for partial coverage
        // Simple approach: find pairs/groups that together cover all days
        List<Long> partialTrainers = trainerCoveredDays.entrySet().stream()
                .filter(e -> e.getValue().size() < totalDaysRequested && !e.getValue().isEmpty())
                .map(Map.Entry::getKey)
                .toList();

        // Try to find combinations of 2 trainers that cover all days
        for (int i = 0; i < partialTrainers.size(); i++) {
            for (int j = i + 1; j < partialTrainers.size(); j++) {
                Long t1 = partialTrainers.get(i);
                Long t2 = partialTrainers.get(j);
                Set<LocalDate> combined = new HashSet<>(trainerCoveredDays.get(t1));
                combined.addAll(trainerCoveredDays.get(t2));
                if (combined.size() >= totalDaysRequested) {
                    // Split days: t1 gets its days, t2 gets remaining
                    List<LocalDate> t1Days = trainerCoveredDays.get(t1);
                    List<LocalDate> t2Days = trainerCoveredDays.get(t2).stream()
                            .filter(d -> !t1Days.contains(d))
                            .toList();

                    TrainerProfile trainer1 = trainerRepo.findById(t1).orElse(null);
                    TrainerProfile trainer2 = trainerRepo.findById(t2).orElse(null);
                    if (trainer1 == null || trainer2 == null) continue;

                    List<TrainerSegment> segments = List.of(
                            new TrainerSegment(t1, trainer1.getName(),
                                    trainer1.getUser() != null ? trainer1.getUser().getUsername() : "",
                                    t1Days, getMinRemainingCapacity(t1, branchId, t1Days, request.ranges())),
                            new TrainerSegment(t2, trainer2.getName(),
                                    trainer2.getUser() != null ? trainer2.getUser().getUsername() : "",
                                    t2Days, getMinRemainingCapacity(t2, branchId, t2Days, request.ranges()))
                    );
                    groups.add(new TrainerCoverageGroup(false, 2, segments,
                            t1Days.size() + t2Days.size(), totalDaysRequested));
                }
            }
        }

        // Also add individual partial trainers as standalone entries
        for (Long trainerId : partialTrainers) {
            TrainerProfile trainer = trainerRepo.findById(trainerId).orElse(null);
            if (trainer == null) continue;
            List<LocalDate> days = trainerCoveredDays.get(trainerId);
            int capacity = getMinRemainingCapacity(trainerId, branchId, days, request.ranges());
            TrainerSegment segment = new TrainerSegment(
                    trainerId, trainer.getName(),
                    trainer.getUser() != null ? trainer.getUser().getUsername() : "",
                    days, capacity);
            groups.add(new TrainerCoverageGroup(false, 3, List.of(segment), days.size(), totalDaysRequested));
        }

        // Sort by priority (full coverage first)
        groups.sort(Comparator.comparingInt(TrainerCoverageGroup::priority));

        return new TrainerAvailabilityResponse(groups);
    }

    /**
     * Check vehicle availability for given branch, type, name, and date-time ranges.
     */
    public VehicleAvailabilityResponse checkVehicleAvailability(VehicleAvailabilityRequest request) {
        // Find all vehicles matching type + name at the branch
        List<AssetInfo> matchingVehicles = assetRepo.findByCurrentBranchIdAndVehicleType_Type(
                        request.branchId(), request.vehicleType()).stream()
                .filter(v -> request.vehicleName().equalsIgnoreCase(v.getName()))
                .filter(v -> !"INACTIVE".equalsIgnoreCase(v.getStatus()))
                .toList();

        if (matchingVehicles.isEmpty()) {
            return new VehicleAvailabilityResponse("NOT_AVAILABLE", List.of(),
                    "No vehicles named '" + request.vehicleName() + "' of type '" + request.vehicleType() + "' at this branch.");
        }

        List<LocalDate> allDates = expandDates(request.ranges());
        List<VehicleDayStatus> dayStatuses = new ArrayList<>();
        int availableDays = 0;

        for (LocalDate date : allDates) {
            LocalTime startTime = getTimeForDate(date, request.ranges(), true);
            LocalTime endTime = getTimeForDate(date, request.ranges(), false);
            LocalDateTime slotStart = LocalDateTime.of(date, startTime);
            LocalDateTime slotEnd = LocalDateTime.of(date, endTime);

            // Check each vehicle to see if it's free at this time
            AssetInfo freeVehicle = null;
            for (AssetInfo vehicle : matchingVehicles) {
                boolean occupied = isVehicleOccupied(vehicle.getId(), slotStart, slotEnd);
                if (!occupied) {
                    freeVehicle = vehicle;
                    break;
                }
            }

            if (freeVehicle != null) {
                availableDays++;
                dayStatuses.add(new VehicleDayStatus(date, true,
                        freeVehicle.getId(), freeVehicle.getName(), freeVehicle.getColor()));
            } else {
                dayStatuses.add(new VehicleDayStatus(date, false, null, null, null));
            }
        }

        String status;
        String message;
        if (availableDays == allDates.size()) {
            status = "AVAILABLE";
            message = "Vehicle is available for all selected days.";
        } else if (availableDays > 0) {
            status = "PARTIAL";
            message = "Vehicle available for " + availableDays + "/" + allDates.size() + " days. Some days have no free vehicle.";
        } else {
            status = "NOT_AVAILABLE";
            message = "No matching vehicle is available for the selected time period.";
        }

        return new VehicleAvailabilityResponse(status, dayStatuses, message);
    }

    // ─── Private helpers ───────────────────────────────────────────────

    private boolean canTrainerCoverDay(Long trainerId, String branchId, LocalDate date,
                                       List<DateTimeRangeDto> ranges, List<TrainerAvailability> availabilities) {
        LocalTime requestedStart = getTimeForDate(date, ranges, true);
        LocalTime requestedEnd = getTimeForDate(date, ranges, false);

        // Check if trainer has an availability record covering this date and time
        boolean hasAvailability = availabilities.stream().anyMatch(a ->
                !date.isBefore(a.getEffectiveFrom())
                && (a.getEffectiveTo() == null || !date.isAfter(a.getEffectiveTo()))
                && !requestedStart.isBefore(a.getSlotStartTime())
                && !requestedEnd.isAfter(a.getSlotEndTime())
        );
        if (!hasAvailability) return false;

        // Check capacity: count existing slots for this trainer on this day at this branch
        LocalDateTime dayStart = LocalDateTime.of(date, requestedStart);
        LocalDateTime dayEnd = LocalDateTime.of(date, requestedEnd);
        List<ScheduleSlot> existingSlots = slotRepo.findByTrainerIdAndStartDateTimeBetween(
                trainerId, date.atStartOfDay(), date.plusDays(1).atStartOfDay());
        long occupiedCount = existingSlots.stream()
                .filter(s -> s.getBranchId() != null && s.getBranchId().equals(branchId))
                .filter(s -> s.getStatus() == ScheduleStatus.PENDING || s.getStatus() == ScheduleStatus.ACTIVE)
                .count();

        // Get max capacity from availability records
        int maxCapacity = availabilities.stream()
                .filter(a -> !date.isBefore(a.getEffectiveFrom())
                        && (a.getEffectiveTo() == null || !date.isAfter(a.getEffectiveTo())))
                .mapToInt(TrainerAvailability::getNumberOfTrainingCanTake)
                .max()
                .orElse(0);

        return occupiedCount < maxCapacity;
    }

    private int getMinRemainingCapacity(Long trainerId, String branchId, List<LocalDate> dates,
                                        List<DateTimeRangeDto> ranges) {
        int minCapacity = Integer.MAX_VALUE;
        List<TrainerAvailability> availabilities = trainerAvailRepo.findActiveByTrainerIdAndBranchId(trainerId, branchId);

        for (LocalDate date : dates) {
            List<ScheduleSlot> existing = slotRepo.findByTrainerIdAndStartDateTimeBetween(
                    trainerId, date.atStartOfDay(), date.plusDays(1).atStartOfDay());
            long occupied = existing.stream()
                    .filter(s -> branchId.equals(s.getBranchId()))
                    .filter(s -> s.getStatus() == ScheduleStatus.PENDING || s.getStatus() == ScheduleStatus.ACTIVE)
                    .count();

            int maxCap = availabilities.stream()
                    .filter(a -> !date.isBefore(a.getEffectiveFrom())
                            && (a.getEffectiveTo() == null || !date.isAfter(a.getEffectiveTo())))
                    .mapToInt(TrainerAvailability::getNumberOfTrainingCanTake)
                    .max()
                    .orElse(0);

            int remaining = (int) (maxCap - occupied);
            minCapacity = Math.min(minCapacity, remaining);
        }
        return Math.max(0, minCapacity);
    }

    private boolean isVehicleOccupied(String vehicleId, LocalDateTime start, LocalDateTime end) {
        List<ScheduleSlot> slots = slotRepo.findByResourceIdAndStatusAndStartDateTimeAfter(
                vehicleId, ScheduleStatus.ACTIVE, start.minusDays(1));
        // Also check PENDING
        List<ScheduleSlot> pendingSlots = slotRepo.findByResourceIdAndStatusAndStartDateTimeAfter(
                vehicleId, ScheduleStatus.PENDING, start.minusDays(1));

        return hasOverlap(slots, start, end) || hasOverlap(pendingSlots, start, end);
    }

    private boolean hasOverlap(List<ScheduleSlot> slots, LocalDateTime start, LocalDateTime end) {
        return slots.stream().anyMatch(s ->
                s.getStartDateTime().isBefore(end) && s.getEndDateTime().isAfter(start));
    }

    private List<LocalDate> expandDates(List<DateTimeRangeDto> ranges) {
        List<LocalDate> dates = new ArrayList<>();
        for (DateTimeRangeDto range : ranges) {
            LocalDate cursor = range.startDate();
            while (!cursor.isAfter(range.endDate())) {
                if (!dates.contains(cursor)) {
                    dates.add(cursor);
                }
                cursor = cursor.plusDays(1);
            }
        }
        dates.sort(Comparator.naturalOrder());
        return dates;
    }

    private LocalTime getTimeForDate(LocalDate date, List<DateTimeRangeDto> ranges, boolean isStart) {
        for (DateTimeRangeDto range : ranges) {
            if (!date.isBefore(range.startDate()) && !date.isAfter(range.endDate())) {
                return isStart ? range.startTime() : range.endTime();
            }
        }
        return isStart ? LocalTime.of(7, 0) : LocalTime.of(20, 0);
    }
}
