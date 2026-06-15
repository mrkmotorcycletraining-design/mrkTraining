package com.mrk.training.model;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "vehicles")
public class AssetInfo {

    @Id
    private String id;

    @ManyToOne
    @JoinColumn(name = "type_id", nullable = false)
    private VehicleTypeConfig vehicleType;

    private String name;
    private String color;

    @Column(name = "next_maintenance_date")
    private LocalDate nextMaintenanceDate;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "client_vehicle")
    private Boolean clientVehicle;

    @Column(name = "client_vehicle_details")
    private String clientVehicleDetails;

    @ManyToOne
    @JoinColumn(name = "current_branch_id")
    private Branch currentBranch;

    public AssetInfo() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public VehicleTypeConfig getVehicleType() { return vehicleType; }
    public void setVehicleType(VehicleTypeConfig vehicleType) { this.vehicleType = vehicleType; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public LocalDate getNextMaintenanceDate() { return nextMaintenanceDate; }
    public void setNextMaintenanceDate(LocalDate nextMaintenanceDate) { this.nextMaintenanceDate = nextMaintenanceDate; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public Boolean getClientVehicle() { return clientVehicle; }
    public void setClientVehicle(Boolean clientVehicle) { this.clientVehicle = clientVehicle; }
    public String getClientVehicleDetails() { return clientVehicleDetails; }
    public void setClientVehicleDetails(String clientVehicleDetails) { this.clientVehicleDetails = clientVehicleDetails; }
    public Branch getCurrentBranch() { return currentBranch; }
    public void setCurrentBranch(Branch currentBranch) { this.currentBranch = currentBranch; }
}
