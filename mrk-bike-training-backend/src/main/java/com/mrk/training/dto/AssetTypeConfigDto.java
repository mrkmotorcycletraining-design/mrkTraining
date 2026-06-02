package com.mrk.training.dto;

/**
 * Returned by GET /api/vehicles/types.
 * Carries the type name plus sensible default height/weight requirements
 * so the UI can pre-fill those fields when the user picks a type.
 */
public class AssetTypeConfigDto {

    private String type;
    private String label;
    private Integer defaultMinHeightCm;
    private Integer defaultMinWeightKg;

    public AssetTypeConfigDto() {}

    public AssetTypeConfigDto(String type, String label,
                               Integer defaultMinHeightCm, Integer defaultMinWeightKg) {
        this.type = type;
        this.label = label;
        this.defaultMinHeightCm = defaultMinHeightCm;
        this.defaultMinWeightKg = defaultMinWeightKg;
    }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public Integer getDefaultMinHeightCm() { return defaultMinHeightCm; }
    public void setDefaultMinHeightCm(Integer defaultMinHeightCm) { this.defaultMinHeightCm = defaultMinHeightCm; }
    public Integer getDefaultMinWeightKg() { return defaultMinWeightKg; }
    public void setDefaultMinWeightKg(Integer defaultMinWeightKg) { this.defaultMinWeightKg = defaultMinWeightKg; }
}
