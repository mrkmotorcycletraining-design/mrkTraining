package com.mrk.training.model;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "client_course_enrollments")
public class ClientCourseEnrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "client_id")
    private ClientProfile client;

    @ManyToOne
    @JoinColumn(name = "course_id")
    private Course course;

    @ManyToOne
    @JoinColumn(name = "branch_id")
    private Branch branch;

    @ManyToOne
    @JoinColumn(name = "trainer_id")
    private TrainerProfile trainer;

    @ManyToOne
    @JoinColumn(name = "asset_id")
    private AssetInfo asset;

    @Column(name = "total_amount_paid")
    private BigDecimal totalAmountPaid;

    @Column(name = "enrollment_date")
    private LocalDate enrollmentDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private EnrollmentStatus status;

    @Column(name = "buffer_days_allocated")
    private Integer bufferDaysAllocated;

    @Column(name = "buffer_days_used")
    private Integer bufferDaysUsed;

    public ClientCourseEnrollment() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public ClientProfile getClient() { return client; }
    public void setClient(ClientProfile client) { this.client = client; }
    public Course getCourse() { return course; }
    public void setCourse(Course course) { this.course = course; }
    public Branch getBranch() { return branch; }
    public void setBranch(Branch branch) { this.branch = branch; }
    public TrainerProfile getTrainer() { return trainer; }
    public void setTrainer(TrainerProfile trainer) { this.trainer = trainer; }
    public AssetInfo getAsset() { return asset; }
    public void setAsset(AssetInfo asset) { this.asset = asset; }
    public BigDecimal getTotalAmountPaid() { return totalAmountPaid; }
    public void setTotalAmountPaid(BigDecimal totalAmountPaid) { this.totalAmountPaid = totalAmountPaid; }
    public LocalDate getEnrollmentDate() { return enrollmentDate; }
    public void setEnrollmentDate(LocalDate enrollmentDate) { this.enrollmentDate = enrollmentDate; }
    public EnrollmentStatus getStatus() { return status; }
    public void setStatus(EnrollmentStatus status) { this.status = status; }
    public Integer getBufferDaysAllocated() { return bufferDaysAllocated; }
    public void setBufferDaysAllocated(Integer bufferDaysAllocated) { this.bufferDaysAllocated = bufferDaysAllocated; }
    public Integer getBufferDaysUsed() { return bufferDaysUsed; }
    public void setBufferDaysUsed(Integer bufferDaysUsed) { this.bufferDaysUsed = bufferDaysUsed; }
}
