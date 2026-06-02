package com.mrk.training.web.controller;

import java.net.URI;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mrk.training.dto.AssetTypeConfigDto;
import com.mrk.training.model.AssetInfo;
import com.mrk.training.model.AssetType;
import com.mrk.training.service.AssetService;
import com.mrk.training.web.request.AssetRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/vehicles")
public class AssetController {

    private final AssetService service;

    public AssetController(AssetService service) {
        this.service = service;
    }

    /**
     * GET /api/vehicles/types
     * Returns all configured asset types with their default height/weight requirements.
     * Kept on this controller so the UI only needs one base URL for vehicle operations.
     */
    @GetMapping("/types")
    public List<AssetTypeConfigDto> listTypes() {
        return service.listTypeConfigs();
    }

    @PostMapping
    public ResponseEntity<AssetInfo> create(@Valid @RequestBody AssetRequest req) {
        AssetInfo saved = service.create(req);
        return ResponseEntity.created(URI.create("/api/vehicles/" + saved.getId())).body(saved);
    }

    @GetMapping
    public List<AssetInfo> list() {
        return service.listAll();
    }
}
