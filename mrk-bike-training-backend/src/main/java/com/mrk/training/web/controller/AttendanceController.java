package com.mrk.training.web.controller;

import com.mrk.training.model.AttendanceLog;
import com.mrk.training.model.AttendanceStatus;
import com.mrk.training.model.PersonType;
import com.mrk.training.model.ScheduleSlot;
import com.mrk.training.repository.AttendanceLogRepository;
import com.mrk.training.repository.ScheduleSlotRepository;
import com.mrk.training.service.ReconcilerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/attendance")
//    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
public class AttendanceController {

    private final AttendanceLogRepository attendanceRepository;
    private final ScheduleSlotRepository slotRepository;
    private final ReconcilerService reconcilerService;

    public AttendanceController(
            AttendanceLogRepository attendanceRepository,
            ScheduleSlotRepository slotRepository,
            ReconcilerService reconcilerService) {
        this.attendanceRepository = attendanceRepository;
        this.slotRepository = slotRepository;
        this.reconcilerService = reconcilerService;
    }

    @PostMapping
    public ResponseEntity<AttendanceLog> record(@RequestBody AttendanceLogRequest request) {
        ScheduleSlot slot = slotRepository.findById(request.slotId())
                .orElseThrow(() -> new IllegalArgumentException("Slot not found."));
        AttendanceLog log = new AttendanceLog();
        log.setSlot(slot);
        log.setPersonId(request.personId());
        log.setPersonType(request.personType());
        log.setDateTime(request.dateTime() != null ? request.dateTime() : java.time.LocalDateTime.now());
        log.setStatus(request.status());
        log = attendanceRepository.save(log);

        if (request.status() == AttendanceStatus.ABSENT) {
            if (request.personType() == PersonType.TRAINER) {
                reconcilerService.handleTrainerAbsence(Long.parseLong(request.personId()), log.getDateTime().toLocalDate());
            } else {
                reconcilerService.handleAbsence(log);
            }
        }
        return ResponseEntity.ok(log);
    }

    @GetMapping
    public List<AttendanceLog> list(
            @RequestParam(required = false) Long slotId,
            @RequestParam(required = false) String personId) {
        if (slotId != null) {
            return attendanceRepository.findBySlotId(slotId);
        }
        if (personId != null) {
            return attendanceRepository.findByPersonId(personId);
        }
        return attendanceRepository.findAll();
    }

    public record AttendanceLogRequest(
            Long slotId,
            String personId,
            PersonType personType,
            java.time.LocalDateTime dateTime,
            AttendanceStatus status) {}
}
