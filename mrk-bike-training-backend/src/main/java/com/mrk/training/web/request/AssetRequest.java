package com.mrk.training.web.request;

import java.time.LocalDate;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AssetRequest {

    @NotBlank(message = "Asset ID is required (e.g. MH051234)")
    @Size(max = 255)
    private String id;

    @NotBlank(message = "Asset type is required")
    private String type; // validated as enum in service

    @Size(max = 255)
    private String name;

    @Min(value = 0, message = "CC must be a positive number")
    private Integer cc;

    @Size(max = 100)
    private String color;

    private LocalDate nextMaintenanceDate;

    @Min(value = 0, message = "Min height must be positive")
    private Integer minHeightReq;

    @Min(value = 0, message = "Min weight must be positive")
    private Integer minWeightReq;

    private Boolean clientVehicle;

    @Size(max = 255)
    private String clientVehicleDetails;

    private String currentBranchId;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Integer getCc() { return cc; }
    public void setCc(Integer cc) { this.cc = cc; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public LocalDate getNextMaintenanceDate() { return nextMaintenanceDate; }
    public void setNextMaintenanceDate(LocalDate nextMaintenanceDate) { this.nextMaintenanceDate = nextMaintenanceDate; }
    public Integer getMinHeightReq() { return minHeightReq; }
    public void setMinHeightReq(Integer minHeightReq) { this.minHeightReq = minHeightReq; }
    public Integer getMinWeightReq() { return minWeightReq; }
    public void setMinWeightReq(Integer minWeightReq) { this.minWeightReq = minWeightReq; }
    public Boolean getClientVehicle() { return clientVehicle; }
    public void setClientVehicle(Boolean clientVehicle) { this.clientVehicle = clientVehicle; }
    public String getClientVehicleDetails() { return clientVehicleDetails; }
    public void setClientVehicleDetails(String clientVehicleDetails) { this.clientVehicleDetails = clientVehicleDetails; }
    public String getCurrentBranchId() { return currentBranchId; }
    public void setCurrentBranchId(String currentBranchId) { this.currentBranchId = currentBranchId; }
}
