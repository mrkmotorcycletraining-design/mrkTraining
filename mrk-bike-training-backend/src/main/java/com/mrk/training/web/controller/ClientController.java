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

import com.mrk.training.dto.client.AdminClientProfileResponse;
import com.mrk.training.dto.client.ClientCreateRequest;
import com.mrk.training.dto.client.ClientProfileResponse;
import com.mrk.training.dto.client.ClientUpdateRequest;
import com.mrk.training.dto.client.PasswordChangeRequest;
import com.mrk.training.dto.client.PasswordResetRequest;
import com.mrk.training.dto.client.TrainingsAllowanceUpdateRequest;
import com.mrk.training.security.SecurityUtils;
import com.mrk.training.service.ClientService;
import com.mrk.training.web.request.ClientRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/clients")
public class ClientController {

    private final ClientService service;

    public ClientController(ClientService service) {
        this.service = service;
    }

    @PostMapping
    //    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<AdminClientProfileResponse> create(@Valid @RequestBody ClientCreateRequest req) {
        AdminClientProfileResponse saved = service.create(req);
        return ResponseEntity.created(URI.create("/api/clients/" + saved.id())).body(saved);
    }

    @PostMapping("/legacy")
    //    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<com.mrk.training.dto.ClientDto> createLegacy(@Valid @RequestBody ClientRequest req) {
        com.mrk.training.dto.ClientDto saved = service.createLegacy(req);
        return ResponseEntity.created(URI.create("/api/clients/" + saved.getId())).body(saved);
    }

    @GetMapping
    //    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public List<AdminClientProfileResponse> list() {
        return service.listAllAdmin();
    }

    @GetMapping("/{id}")
    //    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public AdminClientProfileResponse get(@PathVariable Long id) {
        return service.getAdmin(id);
    }

    @GetMapping("/me")
    //    @PreAuthorize("hasRole('CLIENT')")
    public ClientProfileResponse me() {
        return service.getMe(SecurityUtils.currentUserId());
    }

    @PutMapping("/me")
    //    @PreAuthorize("hasRole('CLIENT')")
    public ClientProfileResponse updateMe(@RequestBody ClientUpdateRequest req) {
        return service.updateMe(SecurityUtils.currentUserId(), req);
    }

    @PutMapping("/me/password")
    //    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody PasswordChangeRequest request) {
        service.changePassword(
                SecurityUtils.currentUserId(),
                request.currentPassword(),
                request.newPassword());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/trainings-allowance")
    //    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Void> updateAllowance(@PathVariable Long id, @Valid @RequestBody TrainingsAllowanceUpdateRequest request) {
        service.updateTrainingsAllowance(id, request.allowedNumOfTrainings());
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

    @DeleteMapping("/{id}")
    //    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/reset-password")
    //    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Void> resetPassword(@PathVariable Long id, @Valid @RequestBody PasswordResetRequest request) {
        service.resetPassword(id, request.password());
        return ResponseEntity.noContent().build();
    }
}
