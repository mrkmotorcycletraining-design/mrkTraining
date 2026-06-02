package com.mrk.training.web.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class TrainerRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Must be a valid email address")
    @Size(max = 255)
    private String emailUsername;

    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 255, message = "Password must be at least 6 characters")
    private String passwordHash;

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

    public String getEmailUsername() { return emailUsername; }
    public void setEmailUsername(String emailUsername) { this.emailUsername = emailUsername; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }
    public BigDecimal getSalary() { return salary; }
    public void setSalary(BigDecimal salary) { this.salary = salary; }
    public String getBranchId() { return branchId; }
    public void setBranchId(String branchId) { this.branchId = branchId; }
}
