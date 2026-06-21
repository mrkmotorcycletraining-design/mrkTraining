package com.mrk.training.web.controller;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mrk.training.dto.TrainerDto;
import com.mrk.training.dto.client.PasswordResetRequest;
import com.mrk.training.model.Role;
import com.mrk.training.security.SecurityUtils;
import com.mrk.training.service.TrainerService;
import com.mrk.training.web.request.TrainerRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/trainers")
public class TrainerController {

    private final TrainerService service;

    public TrainerController(TrainerService service) {
        this.service = service;
    }

    @PostMapping
    //    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<TrainerDto> create(@Valid @RequestBody TrainerRequest req) {
        TrainerDto saved = service.create(req);
        return ResponseEntity.created(URI.create("/api/trainers/" + saved.getId())).body(saved);
    }

    @GetMapping
    //    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public List<TrainerDto> list() {
        return service.listAll();
    }

    @GetMapping("/{id}")
    //    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN','TRAINER')")
    public TrainerDto get(@PathVariable Long id) {
        if (SecurityUtils.currentRole() == Role.TRAINER
                && !SecurityUtils.currentUserId().equals(id)) {
            throw new org.springframework.security.access.AccessDeniedException("Access denied.");
        }
        return service.getById(id);
    }

    @GetMapping("/me")
    //    @PreAuthorize("hasRole('TRAINER')")
    public TrainerDto me() {
        return service.getMe(SecurityUtils.currentUserId());
    }

    @DeleteMapping("/{id}")
    //    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/deactivate")
    //    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/activate")
    //    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Void> activate(@PathVariable Long id) {
        service.activate(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/reset-password")
    //    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Void> resetPassword(@PathVariable Long id, @Valid @RequestBody PasswordResetRequest request) {
        service.resetPassword(id, request.password());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/switch-branch")
    public ResponseEntity<Void> switchBranch(@PathVariable Long id, @RequestBody java.util.Map<String, String> body) {
        service.switchBranch(id, body.get("branchId"));
        return ResponseEntity.noContent().build();
    }
}
