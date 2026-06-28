package com.mrk.training.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.mrk.training.dto.VehicleTypeConfigDto;
import com.mrk.training.model.AssetInfo;
import com.mrk.training.model.Branch;
import com.mrk.training.model.VehicleTypeConfig;
import com.mrk.training.repository.AssetRepository;
import com.mrk.training.repository.BranchRepository;
import com.mrk.training.repository.VehicleTypeConfigRepository;
import com.mrk.training.web.request.AssetRequest;
import com.mrk.training.web.request.VehicleTypeConfigRequest;

@Service
public class AssetService {

    private final AssetRepository repo;
    private final BranchRepository branchRepo;
    private final VehicleTypeConfigRepository typeConfigRepo;

    public AssetService(AssetRepository repo, BranchRepository branchRepo,
                        VehicleTypeConfigRepository typeConfigRepo) {
        this.repo = repo;
        this.branchRepo = branchRepo;
        this.typeConfigRepo = typeConfigRepo;
    }

    /**
     * Returns all vehicle type configurations from the database.
     * Supports optional status filtering (true/false/All).
     */
    public List<VehicleTypeConfigDto> listTypeConfigs(String status) {
        return typeConfigRepo.findAll().stream()
                .filter(c -> {
                    if ("All".equalsIgnoreCase(status)) return true;
                    return Boolean.parseBoolean(status) == Boolean.TRUE.equals(c.getStatus());
                })
                .map(c -> new VehicleTypeConfigDto(
                        c.getTypeId(), c.getType(), c.getLabel(),
                        c.getMinHtFt(), c.getMaxHtFt(),
                        c.getMinWt(), c.getMaxWt(),
                        c.getEngineCc(), c.getIsElectric(),
                        c.getMileage(), c.getMaintenanceIntervalKm(),
                        c.getStatus()))
                .toList();
    }

    /**
     * Create a new vehicle type configuration.
     */
    public VehicleTypeConfigDto createTypeConfig(VehicleTypeConfigRequest req) {
        if (typeConfigRepo.findByType(req.getType().trim().toUpperCase()).isPresent()) {
            throw new IllegalArgumentException("Vehicle type '" + req.getType() + "' already exists.");
        }

        VehicleTypeConfig config = new VehicleTypeConfig();
        config.setType(req.getType().trim().toUpperCase());
        config.setLabel(req.getLabel());
        config.setMinHtFt(req.getMinHtFt());
        config.setMaxHtFt(req.getMaxHtFt());
        config.setMinWt(req.getMinWt());
        config.setMaxWt(req.getMaxWt());
        config.setEngineCc(req.getEngineCc());
        config.setIsElectric(Boolean.TRUE.equals(req.getIsElectric()));
        config.setMileage(req.getMileage());
        config.setMaintenanceIntervalKm(req.getMaintenanceIntervalKm());

        VehicleTypeConfig saved = typeConfigRepo.save(config);
        return new VehicleTypeConfigDto(
                saved.getTypeId(), saved.getType(), saved.getLabel(),
                saved.getMinHtFt(), saved.getMaxHtFt(),
                saved.getMinWt(), saved.getMaxWt(),
                saved.getEngineCc(), saved.getIsElectric(),
                saved.getMileage(), saved.getMaintenanceIntervalKm(),
                saved.getStatus());
    }

    /**
     * Create a new vehicle.
     * Validates: ID uniqueness, type existence, and branch existence.
     */
    public AssetInfo create(AssetRequest req) {
        if (repo.existsById(req.getId())) {
            throw new IllegalArgumentException("Vehicle with ID '" + req.getId() + "' already exists.");
        }

        VehicleTypeConfig typeConfig = typeConfigRepo.findById(req.getTypeId())
                .orElseThrow(() -> new IllegalArgumentException("Vehicle type not found with ID: " + req.getTypeId()));

        AssetInfo v = new AssetInfo();
        v.setId(req.getId());
        v.setVehicleType(typeConfig);
        v.setName(req.getName());
        v.setColor(req.getColor());
        v.setNextMaintenanceDate(req.getNextMaintenanceDate());
        v.setStatus("ACTIVE");
        v.setClientVehicle(Boolean.TRUE.equals(req.getClientVehicle()));
        v.setClientVehicleDetails(req.getClientVehicleDetails());

        if (req.getCurrentBranchId() != null && !req.getCurrentBranchId().isBlank()) {
            Branch branch = branchRepo.findById(req.getCurrentBranchId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Branch not found: '" + req.getCurrentBranchId() + "'"));
            v.setCurrentBranch(branch);
        }

        return repo.save(v);
    }

    public List<AssetInfo> listAll() {
        return repo.findAll();
    }

    public List<AssetInfo> listByBranch(String branchId) {
        return repo.findByCurrentBranchId(branchId);
    }

    public List<AssetInfo> listByBranchAndType(String branchId, String type) {
        return repo.findByCurrentBranchIdAndVehicleType_Type(branchId, type);
    }

    public AssetInfo findById(String id) {
        return repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found: " + id));
    }

    public AssetInfo update(String id, AssetRequest req) {
        AssetInfo v = findById(id);
        if (req.getTypeId() != null) {
            VehicleTypeConfig typeConfig = typeConfigRepo.findById(req.getTypeId())
                    .orElseThrow(() -> new IllegalArgumentException("Vehicle type not found."));
            v.setVehicleType(typeConfig);
        }
        if (req.getName() != null) v.setName(req.getName());
        if (req.getColor() != null) v.setColor(req.getColor());
        if (req.getNextMaintenanceDate() != null) v.setNextMaintenanceDate(req.getNextMaintenanceDate());
        if (req.getCurrentBranchId() != null && !req.getCurrentBranchId().isBlank()) {
            Branch branch = branchRepo.findById(req.getCurrentBranchId())
                    .orElseThrow(() -> new IllegalArgumentException("Branch not found."));
            v.setCurrentBranch(branch);
        }
        return repo.save(v);
    }

    public void setStatus(String id, String status) {
        AssetInfo v = findById(id);
        v.setStatus(status);
        repo.save(v);
    }

    public void delete(String id) {
        if (!repo.existsById(id)) {
            throw new IllegalArgumentException("Vehicle not found: " + id);
        }
        repo.deleteById(id);
    }

    public void switchBranch(String id, String branchId) {
        AssetInfo v = findById(id);
        Branch branch = branchRepo.findById(branchId)
                .orElseThrow(() -> new IllegalArgumentException("Branch not found: " + branchId));
        v.setCurrentBranch(branch);
        repo.save(v);
    }

    /**
     * Deactivate a vehicle type config and all linked vehicles.
     * Returns the list of vehicles that were deactivated.
     */
    public List<AssetInfo> deactivateTypeConfig(Long typeId) {
        VehicleTypeConfig config = typeConfigRepo.findById(typeId)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle type config not found: " + typeId));
        config.setStatus(false);
        typeConfigRepo.save(config);

        // Deactivate all linked vehicles
        List<AssetInfo> linkedVehicles = repo.findByVehicleType_TypeId(typeId);
        for (AssetInfo v : linkedVehicles) {
            v.setStatus("INACTIVE");
        }
        repo.saveAll(linkedVehicles);
        return linkedVehicles.stream().filter(v -> "INACTIVE".equals(v.getStatus())).toList();
    }

    /**
     * Activate a vehicle type config (does NOT auto-activate vehicles).
     */
    public void activateTypeConfig(Long typeId) {
        VehicleTypeConfig config = typeConfigRepo.findById(typeId)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle type config not found: " + typeId));
        config.setStatus(true);
        typeConfigRepo.save(config);
    }

    /**
     * Delete a vehicle type config. Fails if any active/non-deleted vehicles still reference it.
     */
    public void deleteTypeConfig(Long typeId) {
        VehicleTypeConfig config = typeConfigRepo.findById(typeId)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle type config not found: " + typeId));

        List<AssetInfo> linkedVehicles = repo.findByVehicleType_TypeId(typeId);
        if (!linkedVehicles.isEmpty()) {
            throw new IllegalArgumentException(
                    "Cannot delete this vehicle type. There are " + linkedVehicles.size()
                    + " vehicle(s) linked to it. Please deactivate or delete them first.");
        }

        typeConfigRepo.delete(config);
    }

    /**
     * Get vehicles linked to a type config that are now inactive.
     */
    public List<AssetInfo> getDeactivatedVehiclesByType(Long typeId) {
        return repo.findByVehicleType_TypeId(typeId).stream()
                .filter(v -> "INACTIVE".equals(v.getStatus()))
                .toList();
    }
}
