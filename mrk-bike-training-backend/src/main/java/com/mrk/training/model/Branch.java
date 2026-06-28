package com.mrk.training.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "branches")
public class Branch {

    @Id
    private String id; // e.g., 400001_MumbaiFort

    private String name;

    @Column(name = "location_address", length = 1000)
    private String locationAddress;

    /** Comma-separated 2-letter day codes: Mo,Tu,We,Th,Fr,Sa,Su */
    @Column(name = "operating_days")
    private String operatingDays;

    /** Comma-separated time ranges in 12h format: 07:00 AM-10:00 AM,05:00 PM-10:00 PM */
    @Column(name = "operating_time", length = 512)
    private String operatingTime;

    public Branch() {}

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
