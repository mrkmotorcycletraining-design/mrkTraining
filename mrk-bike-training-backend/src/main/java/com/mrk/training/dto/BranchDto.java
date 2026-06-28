package com.mrk.training.dto;

public class BranchDto {
    private String id;
    private String name;
    private String locationAddress;
    private String operatingDays;
    private String operatingTime;

    public BranchDto() {}
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getLocationAddress() { return locationAddress; }
    public void setLocationAddress(String locationAddress) { this.locationAddress = locationAddress; }
    public String getOperatingDays() { return operatingDays; }
    public void setOperatingDays(String operatingDays) { this.operatingDays = operatingDays; }
    public String getOperatingTime() { return operatingTime; }
    public void setOperatingTime(String operatingTime) { this.operatingTime = operatingTime; }
}
