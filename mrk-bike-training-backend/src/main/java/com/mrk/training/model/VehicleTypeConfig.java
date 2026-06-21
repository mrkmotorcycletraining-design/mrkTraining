package com.mrk.training.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "vehicle_type_config")
public class VehicleTypeConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "type_id")
    private Long typeId;

    @Column(nullable = false, unique = true)
    private String type;

    private String label;

    @Column(name = "min_ht_ft")
    private Double minHtFt;

    @Column(name = "max_ht_ft")
    private Double maxHtFt;

    @Column(name = "min_wt")
    private Integer minWt;

    @Column(name = "max_wt")
    private Integer maxWt;

    @Column(name = "engine_cc")
    private Integer engineCc;

    @Column(name = "is_electric")
    private Boolean isElectric;

    private Integer mileage;

    @Column(name = "maintenance_interval_km")
    private Integer maintenanceIntervalKm;

    @Column(name = "status")
    private Boolean status = true;

    public VehicleTypeConfig() {}

    public Long getTypeId() { return typeId; }
    public void setTypeId(Long typeId) { this.typeId = typeId; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public Double getMinHtFt() { return minHtFt; }
    public void setMinHtFt(Double minHtFt) { this.minHtFt = minHtFt; }
    public Double getMaxHtFt() { return maxHtFt; }
    public void setMaxHtFt(Double maxHtFt) { this.maxHtFt = maxHtFt; }
    public Integer getMinWt() { return minWt; }
    public void setMinWt(Integer minWt) { this.minWt = minWt; }
    public Integer getMaxWt() { return maxWt; }
    public void setMaxWt(Integer maxWt) { this.maxWt = maxWt; }
    public Integer getEngineCc() { return engineCc; }
    public void setEngineCc(Integer engineCc) { this.engineCc = engineCc; }
    public Boolean getIsElectric() { return isElectric; }
    public void setIsElectric(Boolean isElectric) { this.isElectric = isElectric; }
    public Integer getMileage() { return mileage; }
    public void setMileage(Integer mileage) { this.mileage = mileage; }
    public Integer getMaintenanceIntervalKm() { return maintenanceIntervalKm; }
    public void setMaintenanceIntervalKm(Integer maintenanceIntervalKm) { this.maintenanceIntervalKm = maintenanceIntervalKm; }
    public Boolean getStatus() { return status; }
    public void setStatus(Boolean status) { this.status = status; }
}
