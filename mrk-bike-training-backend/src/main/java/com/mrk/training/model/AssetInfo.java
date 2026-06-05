package com.mrk.training.model;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "assets")
public class AssetInfo {

    @Id
    private String id; // bike plate or classroom id

    @Column(nullable = false)
    private String type; // kept as String — asset_type_config is a separate lookup table,
                         // and assets.type is a free-form VARCHAR in the schema (not a PG enum)

    private String name;
    private Integer cc;
    private String color;

    @Column(name = "next_maintenance_date")
    private LocalDate nextMaintenanceDate;

    @Column(name = "min_height_req")
    private Integer minHeightReq;

    @Column(name = "min_weight_req")
    private Integer minWeightReq;

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
    public Branch getCurrentBranch() { return currentBranch; }
    public void setCurrentBranch(Branch currentBranch) { this.currentBranch = currentBranch; }
}
