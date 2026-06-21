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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mrk.training.dto.VehicleTypeConfigDto;
import com.mrk.training.model.AssetInfo;
import com.mrk.training.service.AssetService;
import com.mrk.training.service.ReconcilerService;
import com.mrk.training.web.request.AssetRequest;
import com.mrk.training.web.request.VehicleTypeConfigRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping({"/api/vehicles", "/api/assets"})
public class AssetController {

    private final AssetService service;
    private final ReconcilerService reconcilerService;

    public AssetController(AssetService service, ReconcilerService reconcilerService) {
        this.service = service;
        this.reconcilerService = reconcilerService;
    }

    /**
     * GET /api/vehicles/types
     * Returns all vehicle type configurations from the database.
     * Optional status param: true/false/All (default All).
     */
    @GetMapping("/types")
    public List<VehicleTypeConfigDto> listTypes(@RequestParam(required = false, defaultValue = "All") String status) {
        return service.listTypeConfigs(status);
    }

    /**
     * POST /api/vehicles/types
     * Creates a new vehicle type configuration.
     */
    @PostMapping("/types")
    public ResponseEntity<VehicleTypeConfigDto> createType(@Valid @RequestBody VehicleTypeConfigRequest req) {
        VehicleTypeConfigDto saved = service.createTypeConfig(req);
        return ResponseEntity.created(URI.create("/api/vehicles/types/" + saved.getTypeId())).body(saved);
    }

    @PostMapping
    public ResponseEntity<AssetInfo> create(@Valid @RequestBody AssetRequest req) {
        AssetInfo saved = service.create(req);
        return ResponseEntity.created(URI.create("/api/vehicles/" + saved.getId())).body(saved);
    }

    @GetMapping
    public List<AssetInfo> list(
            @RequestParam(required = false) String branchId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false, defaultValue = "All") String status) {
        List<AssetInfo> results;
        if (branchId != null && type != null) {
            results = service.listByBranchAndType(branchId, type);
        } else if (branchId != null) {
            results = service.listByBranch(branchId);
        } else {
            results = service.listAll();
        }
        if (!"All".equalsIgnoreCase(status)) {
            results = results.stream()
                    .filter(a -> status.equalsIgnoreCase(a.getStatus()))
                    .toList();
        }
        return results;
    }

    @GetMapping("/{id}")
    public AssetInfo get(@PathVariable String id) {
        return service.findById(id);
    }

    @PutMapping("/{id}")
    public AssetInfo update(@PathVariable String id, @Valid @RequestBody AssetRequest req) {
        return service.update(id, req);
    }

    @PutMapping("/{id}/maintenance")
    public ResponseEntity<Void> setMaintenance(@PathVariable String id) {
        reconcilerService.handleAssetMaintenance(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable String id) {
        service.setStatus(id, "INACTIVE");
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/activate")
    public ResponseEntity<Void> activate(@PathVariable String id) {
        service.setStatus(id, "ACTIVE");
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/switch-branch")
    public ResponseEntity<Void> switchBranch(@PathVariable String id, @RequestBody java.util.Map<String, String> body) {
        service.switchBranch(id, body.get("branchId"));
        return ResponseEntity.noContent().build();
    }
}
