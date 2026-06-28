package com.mrk.training.web.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mrk.training.dto.enrollment.EnrollmentRequest;
import com.mrk.training.model.ClientCourseEnrollment;
import com.mrk.training.model.EnrollmentStatus;
import com.mrk.training.model.Role;
import com.mrk.training.model.ScheduleSlot;
import com.mrk.training.repository.EnrollmentRepository;
import com.mrk.training.repository.ScheduleSlotRepository;
import com.mrk.training.security.SecurityUtils;
import com.mrk.training.service.EnrollmentEngine;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/enrollments")
public class EnrollmentController {

    private final EnrollmentEngine enrollmentEngine;
    private final EnrollmentRepository enrollmentRepository;
    private final ScheduleSlotRepository slotRepository;

    public EnrollmentController(
            EnrollmentEngine enrollmentEngine,
            EnrollmentRepository enrollmentRepository,
            ScheduleSlotRepository slotRepository) {
        this.enrollmentEngine = enrollmentEngine;
        this.enrollmentRepository = enrollmentRepository;
        this.slotRepository = slotRepository;
    }

    @PostMapping
    //    @PreAuthorize("hasAnyRole('CLIENT','ADMIN','SUPER_ADMIN')")
    public ClientCourseEnrollment submit(@Valid @RequestBody EnrollmentRequest request) {
        return enrollmentEngine.submitEnrollment(request);
    }

    @PostMapping("/admin-assign")
    //    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ClientCourseEnrollment adminAssign(
            @Valid @RequestBody com.mrk.training.dto.enrollment.AdminAssignTrainingRequest request) {
        return enrollmentEngine.adminAssignTraining(request);
    }

    @GetMapping
    //    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public List<ClientCourseEnrollment> listAll(
            @RequestParam(required = false) Long clientId,
            @RequestParam(required = false) EnrollmentStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return enrollmentRepository.findFiltered(clientId, status, from, to);
    }

    @GetMapping("/{id}/slots")
    //    @PreAuthorize("hasAnyRole('CLIENT','ADMIN','SUPER_ADMIN')")
    public List<ScheduleSlot> enrollmentSlots(@PathVariable Long id) {
        ClientCourseEnrollment enrollment = enrollmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Enrollment not found."));
        if (SecurityUtils.currentRole() == Role.CLIENT
                && !enrollment.getClient().getId().equals(SecurityUtils.currentUserId())) {
            throw new org.springframework.security.access.AccessDeniedException("Access denied.");
        }
        return slotRepository.findByEnrollmentId(id);
    }

    @GetMapping("/mine")
    //    @PreAuthorize("hasRole('CLIENT')")
    public List<ClientCourseEnrollment> mine() {
        return enrollmentRepository.findByClientId(SecurityUtils.currentUserId());
    }

    @GetMapping("/{id}")
    //    @PreAuthorize("hasAnyRole('CLIENT','ADMIN','SUPER_ADMIN')")
    public ResponseEntity<ClientCourseEnrollment> get(@PathVariable Long id) {
        ClientCourseEnrollment enrollment = enrollmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Enrollment not found."));
        if (SecurityUtils.currentRole() == Role.CLIENT
                && !enrollment.getClient().getId().equals(SecurityUtils.currentUserId())) {
            throw new org.springframework.security.access.AccessDeniedException("Access denied.");
        }
        return ResponseEntity.ok(enrollment);
    }

    @PutMapping("/{id}/pause")
    //    @PreAuthorize("hasAnyRole('CLIENT','ADMIN','SUPER_ADMIN')")
    public ClientCourseEnrollment pause(@PathVariable Long id) {
        return enrollmentEngine.pauseEnrollment(id, SecurityUtils.currentUserId());
    }
}
