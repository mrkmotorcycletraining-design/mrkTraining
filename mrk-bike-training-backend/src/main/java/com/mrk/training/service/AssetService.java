package com.mrk.training.service;

import java.util.Arrays;
import java.util.List;

import org.springframework.stereotype.Service;

import com.mrk.training.dto.AssetTypeConfigDto;
import com.mrk.training.model.AssetInfo;
import com.mrk.training.model.Branch;
import com.mrk.training.repository.AssetRepository;
import com.mrk.training.repository.BranchRepository;
import com.mrk.training.web.request.AssetRequest;

@Service
public class AssetService {

    private final AssetRepository repo;
    private final BranchRepository branchRepo;

    public AssetService(AssetRepository repo, BranchRepository branchRepo) {
        this.repo = repo;
        this.branchRepo = branchRepo;
    }

    /**
     * Returns all asset type configurations with default height/weight suggestions.
     * Exposed via GET /api/vehicles/types — part of the vehicle controller.
     */
    public List<AssetTypeConfigDto> listTypeConfigs() {
        return Arrays.asList(
            new AssetTypeConfigDto("NON_GEARED",  "Non-Geared (Scooter/Activa)", 145, 40),
            new AssetTypeConfigDto("GEARED",      "Geared Motorcycle",            155, 50),
            new AssetTypeConfigDto("CRUISER",     "Cruiser",                      160, 55),
            new AssetTypeConfigDto("SPORTS",      "Sports Bike",                  160, 55),
            new AssetTypeConfigDto("OWN_ASSET",   "Client's Own Vehicle",         null, null),
            new AssetTypeConfigDto("CLASSROOM",   "Classroom / Training Room",    null, null)
        );
    }

    /**
     * Create a new asset (vehicle / classroom).
     * Validates: ID uniqueness and branch existence.
     */
    public AssetInfo create(AssetRequest req) {
        if (repo.existsById(req.getId())) {
            throw new IllegalArgumentException("Asset with ID '" + req.getId() + "' already exists.");
        }

        if (req.getType() == null || req.getType().isBlank()) {
            throw new IllegalArgumentException("Asset type is required.");
        }

        AssetInfo a = new AssetInfo();
        a.setId(req.getId());
        a.setType(req.getType().trim());
        a.setName(req.getName());
        a.setCc(req.getCc());
        a.setColor(req.getColor());
        a.setNextMaintenanceDate(req.getNextMaintenanceDate());
        a.setMinHeightReq(req.getMinHeightReq());
        a.setMinWeightReq(req.getMinWeightReq());
        a.setClientVehicle(Boolean.TRUE.equals(req.getClientVehicle()));
        a.setClientVehicleDetails(req.getClientVehicleDetails());

        if (req.getCurrentBranchId() != null && !req.getCurrentBranchId().isBlank()) {
            Branch branch = branchRepo.findById(req.getCurrentBranchId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Branch not found: '" + req.getCurrentBranchId() + "'"));
            a.setCurrentBranch(branch);
        }

        return repo.save(a);
    }

    public List<AssetInfo> listAll() {
        return repo.findAll();
    }
}
