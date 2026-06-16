package com.mrk.training.web.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class VehicleTypeConfigRequest {

    @NotBlank(message = "Type code is required")
    @Size(max = 255)
    private String type;

    @Size(max = 255)
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
