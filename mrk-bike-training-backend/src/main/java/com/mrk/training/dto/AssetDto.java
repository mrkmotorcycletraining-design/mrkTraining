package com.mrk.training.dto;

public class AssetDto {
    private String id;
    private String type;
    private String name;
    private Integer cc;
    private String color;
    private String currentBranchId;

    public AssetDto() {}
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
    public String getCurrentBranchId() { return currentBranchId; }
    public void setCurrentBranchId(String currentBranchId) { this.currentBranchId = currentBranchId; }
}
