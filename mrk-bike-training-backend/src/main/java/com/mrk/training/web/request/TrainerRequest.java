package com.mrk.training.web.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class TrainerRequest {

    @NotBlank(message = "Username is required")
    @Size(max = 255)
    private String username;

    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 255, message = "Password must be at least 6 characters")
    private String password;

    @NotBlank(message = "Name is required")
    @Size(max = 255)
    private String name;

    /** ISO date string yyyy-MM-dd, optional */
    @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$",
             message = "Start date must be in yyyy-MM-dd format")
    private String startDate;

    @DecimalMin(value = "0.0", inclusive = true, message = "Salary must be a positive value")
    private BigDecimal salary;

    /** Optional — FK to branches.id */
    private String branchId;

    /** Comma-separated 2-letter day codes: Mo,Tu,We,Th,Fr,Sa,Su */
    private String preferredDays;

    /** Preferred time in HH:mm format, optional */
    private String preferredTime;

    /** Comma-separated branch IDs or location names, optional */
    private String preferredLocations;

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }
    public BigDecimal getSalary() { return salary; }
    public void setSalary(BigDecimal salary) { this.salary = salary; }
    public String getBranchId() { return branchId; }
    public void setBranchId(String branchId) { this.branchId = branchId; }
    public String getPreferredDays() { return preferredDays; }
    public void setPreferredDays(String preferredDays) { this.preferredDays = preferredDays; }
    public String getPreferredTime() { return preferredTime; }
    public void setPreferredTime(String preferredTime) { this.preferredTime = preferredTime; }
    public String getPreferredLocations() { return preferredLocations; }
    public void setPreferredLocations(String preferredLocations) { this.preferredLocations = preferredLocations; }
}
