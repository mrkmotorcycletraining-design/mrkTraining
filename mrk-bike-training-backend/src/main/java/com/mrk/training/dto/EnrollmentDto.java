package com.mrk.training.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class EnrollmentDto {
    private Long id;
    private Long clientId;
    private String courseId;
    private String branchId;
    private Long trainerId;
    private String assetId;
    private BigDecimal totalAmountPaid;
    private LocalDate enrollmentDate;
    private String status;
    private Integer bufferDaysAllocated;
    private Integer bufferDaysUsed;

    public EnrollmentDto() {}
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }
    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }
    public String getBranchId() { return branchId; }
    public void setBranchId(String branchId) { this.branchId = branchId; }
    public Long getTrainerId() { return trainerId; }
    public void setTrainerId(Long trainerId) { this.trainerId = trainerId; }
    public String getAssetId() { return assetId; }
    public void setAssetId(String assetId) { this.assetId = assetId; }
    public BigDecimal getTotalAmountPaid() { return totalAmountPaid; }
    public void setTotalAmountPaid(BigDecimal totalAmountPaid) { this.totalAmountPaid = totalAmountPaid; }
    public LocalDate getEnrollmentDate() { return enrollmentDate; }
    public void setEnrollmentDate(LocalDate enrollmentDate) { this.enrollmentDate = enrollmentDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getBufferDaysAllocated() { return bufferDaysAllocated; }
    public void setBufferDaysAllocated(Integer bufferDaysAllocated) { this.bufferDaysAllocated = bufferDaysAllocated; }
    public Integer getBufferDaysUsed() { return bufferDaysUsed; }
    public void setBufferDaysUsed(Integer bufferDaysUsed) { this.bufferDaysUsed = bufferDaysUsed; }
}
