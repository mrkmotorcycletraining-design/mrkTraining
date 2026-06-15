package com.mrk.training.web.controller;

import com.mrk.training.dto.VehicleTypeConfigDto;
import com.mrk.training.model.AssetInfo;
import com.mrk.training.service.AssetService;
import com.mrk.training.service.ReconcilerService;
import com.mrk.training.web.request.AssetRequest;
import com.mrk.training.web.request.VehicleTypeConfigRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

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
     */
    @GetMapping("/types")
    public List<VehicleTypeConfigDto> listTypes() {
        return service.listTypeConfigs();
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
            @RequestParam(required = false) String type) {
        if (branchId != null && type != null) {
            return service.listByBranchAndType(branchId, type);
        }
        if (branchId != null) {
            return service.listByBranch(branchId);
        }
        return service.listAll();
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
}
