package com.mrk.training.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Returned by GET /api/vehicles/types.
 * Full vehicle type configuration for UI display and form pre-fill.
 */
public class VehicleTypeConfigDto {

    private Long typeId;
    private String type;
    private String label;

    @JsonProperty("minHtFt")
    private Double minHtFt;

    @JsonProperty("maxHtFt")
    private Double maxHtFt;

    private Integer minWt;
    private Integer maxWt;
    private Integer engineCc;
    private Boolean isElectric;
    private Integer mileage;
    private Integer maintenanceIntervalKm;

    public VehicleTypeConfigDto() {}

    public VehicleTypeConfigDto(Long typeId, String type, String label,
                                 Double minHtFt, Double maxHtFt,
                                 Integer minWt, Integer maxWt,
                                 Integer engineCc, Boolean isElectric,
                                 Integer mileage, Integer maintenanceIntervalKm) {
        this.typeId = typeId;
        this.type = type;
        this.label = label;
        this.minHtFt = minHtFt;
        this.maxHtFt = maxHtFt;
        this.minWt = minWt;
        this.maxWt = maxWt;
        this.engineCc = engineCc;
        this.isElectric = isElectric;
        this.mileage = mileage;
        this.maintenanceIntervalKm = maintenanceIntervalKm;
    }

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
}
