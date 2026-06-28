package com.mrk.training.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.mrk.training.dto.scheduler.ScheduleQuery;
import com.mrk.training.dto.scheduler.TimeInterval;
import com.mrk.training.model.ScheduleSlot;
import com.mrk.training.model.ScheduleStatus;
import com.mrk.training.model.TrainerAvailability;
import com.mrk.training.repository.ScheduleSlotRepository;
import com.mrk.training.repository.TrainerAvailabilityRepository;

@Service
public class SchedulerService {

    private static final int SLOT_MINUTES = 30;
    private static final int BUFFER_MINUTES = 30;

    private final ScheduleSlotRepository slotRepository;
    private final TrainerAvailabilityRepository availabilityRepository;

    public SchedulerService(
            ScheduleSlotRepository slotRepository,
            TrainerAvailabilityRepository availabilityRepository) {
        this.slotRepository = slotRepository;
        this.availabilityRepository = availabilityRepository;
    }

    public List<TimeInterval> computeAvailableIntervals(ScheduleQuery query) {
        LocalDate windowStart = query.startDate();
        LocalDate windowEnd = windowStart.plusMonths(3);
        LocalDateTime from = windowStart.atStartOfDay();
        LocalDateTime to = windowEnd.atTime(23, 59, 59);

        List<ScheduleStatus> occupiedStatuses = List.of(ScheduleStatus.PENDING, ScheduleStatus.ACTIVE);
        List<ScheduleSlot> occupiedSlots = slotRepository.findOccupiedInWindow(
                occupiedStatuses, from, to, query.branchId());

        List<TimeInterval> occupied = occupiedSlots.stream()
                .map(s -> new TimeInterval(s.getStartDateTime(), s.getEndDateTime().plusMinutes(BUFFER_MINUTES)))
                .sorted(Comparator.comparing(TimeInterval::start))
                .toList();

        Set<String> preferred = query.preferredDays() != null
                ? new HashSet<>(query.preferredDays())
                : Set.of("Mo", "Tu", "We", "Th", "Fr", "Sa", "Su");

        List<TimeInterval> candidates = new ArrayList<>();
        LocalDate cursor = windowStart;
        int daysFound = 0;
        while (!cursor.isAfter(windowEnd) && daysFound < query.totalDays()) {
            String dayCode = dayCode(cursor.getDayOfWeek());
            if (preferred.contains(dayCode)) {
                LocalTime dayOpen = LocalTime.of(7, 0);
                LocalTime dayClose = LocalTime.of(20, 0);
                LocalDateTime slotStart = LocalDateTime.of(cursor, dayOpen);
                LocalDateTime dayEnd = LocalDateTime.of(cursor, dayClose);
                int durationMinutes = query.hoursPerDay() * 60;
                while (!slotStart.plusMinutes(durationMinutes).isAfter(dayEnd)) {
                    LocalDateTime slotEnd = slotStart.plusMinutes(durationMinutes);
                    TimeInterval candidate = new TimeInterval(slotStart, slotEnd);
                    if (!overlapsAny(candidate, occupied)) {
                        candidates.add(candidate);
                        daysFound++;
                        break;
                    }
                    slotStart = slotStart.plusMinutes(SLOT_MINUTES);
                }
            }
            cursor = cursor.plusDays(1);
        }
        return candidates;
    }

    /** Resolve trainer availability for scheduling — latest audit wins per trainer/branch. */
    public List<TrainerAvailability> resolveAvailability(Long trainerId, String branchId) {
        List<TrainerAvailability> records =
                availabilityRepository.findActiveByTrainerIdAndBranchId(trainerId, branchId);
        Map<String, TrainerAvailability> latestByKey = records.stream()
                .collect(Collectors.toMap(
                        r -> r.getNumberOfTrainingCanTake() + "|" + r.getSlotStartTime() + "|" + r.getSlotEndTime(),
                        r -> r,
                        (a, b) -> a.getAuditStartDateTime().isAfter(b.getAuditStartDateTime()) ? a : b));
        return List.copyOf(latestByKey.values());
    }

    private boolean overlapsAny(TimeInterval candidate, List<TimeInterval> occupied) {
        return occupied.stream().anyMatch(candidate::overlaps);
    }

    private String dayCode(DayOfWeek dow) {
        return switch (dow) {
            case MONDAY -> "Mo";
            case TUESDAY -> "Tu";
            case WEDNESDAY -> "We";
            case THURSDAY -> "Th";
            case FRIDAY -> "Fr";
            case SATURDAY -> "Sa";
            case SUNDAY -> "Su";
        };
    }
}
