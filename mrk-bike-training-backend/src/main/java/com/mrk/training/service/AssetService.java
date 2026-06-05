package com.mrk.training.service;

import com.mrk.training.dto.AssetTypeConfigDto;
import com.mrk.training.model.AssetInfo;
import com.mrk.training.model.Branch;
import com.mrk.training.repository.AssetRepository;
import com.mrk.training.repository.BranchRepository;
import com.mrk.training.web.request.AssetRequest;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

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

    public List<AssetInfo> listByBranch(String branchId) {
        return repo.findByCurrentBranchId(branchId);
    }

    public List<AssetInfo> listByBranchAndType(String branchId, String type) {
        return repo.findByCurrentBranchIdAndType(branchId, type);
    }

    public AssetInfo findById(String id) {
        return repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Asset not found: " + id));
    }

    public AssetInfo update(String id, AssetRequest req) {
        AssetInfo a = findById(id);
        if (req.getType() != null && !req.getType().isBlank()) {
            a.setType(req.getType().trim());
        }
        if (req.getName() != null) a.setName(req.getName());
        if (req.getCc() != null) a.setCc(req.getCc());
        if (req.getColor() != null) a.setColor(req.getColor());
        if (req.getNextMaintenanceDate() != null) a.setNextMaintenanceDate(req.getNextMaintenanceDate());
        if (req.getMinHeightReq() != null) a.setMinHeightReq(req.getMinHeightReq());
        if (req.getMinWeightReq() != null) a.setMinWeightReq(req.getMinWeightReq());
        if (req.getCurrentBranchId() != null && !req.getCurrentBranchId().isBlank()) {
            Branch branch = branchRepo.findById(req.getCurrentBranchId())
                    .orElseThrow(() -> new IllegalArgumentException("Branch not found."));
            a.setCurrentBranch(branch);
        }
        return repo.save(a);
    }
}
