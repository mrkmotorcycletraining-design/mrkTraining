package com.mrk.training.web.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class BranchRequest {

    @NotBlank(message = "Branch ID is required (e.g. 400001_MumbaiFort)")
    @Size(max = 255)
    @Pattern(regexp = "^[A-Za-z0-9_\\-]+$",
             message = "Branch ID may only contain letters, digits, underscores and hyphens")
    private String id;

    @NotBlank(message = "Branch name is required")
    @Size(max = 255)
    private String name;

    @NotBlank(message = "Branch address is required")
    @Size(max = 1000)
    private String locationAddress;

    /** Comma-separated 2-letter day codes: Mo,Tu,We,Th,Fr */
    @Size(max = 255)
    private String operatingDays;

    /** Comma-separated time ranges: 07:00 AM-10:00 AM,05:00 PM-10:00 PM */
    @Size(max = 512)
    private String operatingTime;

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
