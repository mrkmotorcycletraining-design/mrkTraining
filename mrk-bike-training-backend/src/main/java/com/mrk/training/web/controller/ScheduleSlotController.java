package com.mrk.training.web.controller;

import com.mrk.training.dto.ScheduleSlotDto;
import com.mrk.training.dto.ScheduleSlotListResponse;
import com.mrk.training.dto.slot.SlotApproveRequest;
import com.mrk.training.dto.slot.SlotRejectRequest;
import com.mrk.training.model.*;
import com.mrk.training.repository.AttendanceLogRepository;
import com.mrk.training.repository.ScheduleSlotRepository;
import com.mrk.training.security.SecurityUtils;
import com.mrk.training.service.EnrollmentEngine;
import com.mrk.training.service.ReconcilerService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/slots")
public class ScheduleSlotController {

    private final ScheduleSlotRepository slotRepository;
    private final EnrollmentEngine enrollmentEngine;
    private final AttendanceLogRepository attendanceRepository;
    private final ReconcilerService reconcilerService;

    public ScheduleSlotController(
            ScheduleSlotRepository slotRepository,
            EnrollmentEngine enrollmentEngine,
            AttendanceLogRepository attendanceRepository,
            ReconcilerService reconcilerService) {
        this.slotRepository = slotRepository;
        this.enrollmentEngine = enrollmentEngine;
        this.attendanceRepository = attendanceRepository;
        this.reconcilerService = reconcilerService;
    }

    @GetMapping
    public ScheduleSlotListResponse list(
            @RequestParam(required = false) String clientId,
            @RequestParam(required = false) String trainerId,
            @RequestParam(required = false) String branchId,
            @RequestParam(required = false) ScheduleStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        Long resolvedClientId = "me".equalsIgnoreCase(clientId)
                ? SecurityUtils.currentUserId() : parseLong(clientId);
        Long resolvedTrainerId = "me".equalsIgnoreCase(trainerId)
                ? SecurityUtils.currentUserId() : parseLong(trainerId);
        List<ScheduleSlot> slots = slotRepository.findFiltered(resolvedClientId, resolvedTrainerId, branchId, status, from, to);
        
        if (slots == null || slots.isEmpty()) {
            return ScheduleSlotListResponse.empty();
        }
        
        List<ScheduleSlotDto> slotDtos = slots.stream().map(slot -> {
            ScheduleSlotDto dto = new ScheduleSlotDto();
            dto.setId(slot.getId());
            dto.setEnrollmentId(slot.getEnrollment().getId());
            dto.setResourceId(slot.getResourceId());
            dto.setTrainerId(slot.getTrainer().getId());
            dto.setClientId(slot.getClient().getId());
            dto.setBranchId(slot.getBranchId());
            dto.setTitle(slot.getTitle());
            dto.setStartDateTime(slot.getStartDateTime());
            dto.setEndDateTime(slot.getEndDateTime());
            dto.setType(slot.getType() != null ? slot.getType().name() : null);
            dto.setStatus(slot.getStatus() != null ? slot.getStatus().name() : null);
            return dto;
        }).toList();
        
        return new ScheduleSlotListResponse(slotDtos);
    }

    private Long parseLong(String value) {
        if (value == null || value.isBlank()) return null;
        return Long.parseLong(value);
    }

    @GetMapping("/pending")
    //    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public List<ScheduleSlot> pending() {
        return slotRepository.findByStatus(ScheduleStatus.PENDING);
    }

    @PutMapping("/{id}/approve")
    //    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ScheduleSlot approve(@PathVariable Long id, @RequestBody SlotApproveRequest body) {
        return enrollmentEngine.approveSlot(id, SecurityUtils.currentUserId(), body.assetId(), body.trainerId());
    }

    @PutMapping("/{id}/reject")
    //    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ScheduleSlot reject(@PathVariable Long id, @RequestBody(required = false) SlotRejectRequest body) {
        String reason = body != null ? body.reason() : null;
        return enrollmentEngine.rejectSlot(id, SecurityUtils.currentUserId(), reason);
    }

    @PostMapping("/{id}/absence")
    //    @PreAuthorize("hasAnyRole('CLIENT','TRAINER','ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Void> recordAbsence(@PathVariable Long id) {
        ScheduleSlot slot = slotRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Slot not found."));
        AttendanceLog log = new AttendanceLog();
        log.setSlot(slot);
        log.setPersonId(String.valueOf(SecurityUtils.currentUserId()));
        log.setPersonType(PersonType.CLIENT);
        log.setDateTime(LocalDateTime.now());
        log.setStatus(AttendanceStatus.ABSENT);
        attendanceRepository.save(log);
        reconcilerService.handleAbsence(log);
        return ResponseEntity.noContent().build();
    }
}
