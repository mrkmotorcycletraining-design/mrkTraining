package com.mrk.training.web.request;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class AssetRequest {

    @NotBlank(message = "Vehicle ID is required (e.g. MH051234)")
    @Size(max = 255)
    private String id;

    @NotNull(message = "Vehicle type is required")
    private Long typeId;

    @Size(max = 255)
    private String name;

    @Size(max = 100)
    private String color;

    private LocalDate nextMaintenanceDate;

    private Boolean clientVehicle;

    @Size(max = 255)
    private String clientVehicleDetails;

    private String currentBranchId;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public Long getTypeId() { return typeId; }
    public void setTypeId(Long typeId) { this.typeId = typeId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public LocalDate getNextMaintenanceDate() { return nextMaintenanceDate; }
    public void setNextMaintenanceDate(LocalDate nextMaintenanceDate) { this.nextMaintenanceDate = nextMaintenanceDate; }
    public Boolean getClientVehicle() { return clientVehicle; }
    public void setClientVehicle(Boolean clientVehicle) { this.clientVehicle = clientVehicle; }
    public String getClientVehicleDetails() { return clientVehicleDetails; }
    public void setClientVehicleDetails(String clientVehicleDetails) { this.clientVehicleDetails = clientVehicleDetails; }
    public String getCurrentBranchId() { return currentBranchId; }
    public void setCurrentBranchId(String currentBranchId) { this.currentBranchId = currentBranchId; }
}
