package com.mrk.training.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "asset_type_config")
public class AssetTypeConfig {

    @Id
    @Column(length = 255, nullable = false)
    private String type;

    private Integer minHeightReq;
    private Integer maxWeightReq;

    @Column(length = 255)
    private String description;

    public AssetTypeConfig() {}

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Integer getMinHeightReq() { return minHeightReq; }
    public void setMinHeightReq(Integer minHeightReq) { this.minHeightReq = minHeightReq; }
    public Integer getMaxWeightReq() { return maxWeightReq; }
    public void setMaxWeightReq(Integer maxWeightReq) { this.maxWeightReq = maxWeightReq; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
