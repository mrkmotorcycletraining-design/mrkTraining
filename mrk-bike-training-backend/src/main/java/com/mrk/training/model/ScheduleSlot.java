package com.mrk.training.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "schedule_slots")
public class ScheduleSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "enrollment_id")
    private ClientCourseEnrollment enrollment;

    @Column(name = "resource_id")
    private String resourceId;

    @ManyToOne
    @JoinColumn(name = "trainer_id")
    private TrainerProfile trainer;

    @ManyToOne
    @JoinColumn(name = "client_id")
    private ClientProfile client;

    @Column(name = "branch_id")
    private String branchId;

    private String title;

    @Column(name = "start_date_time")
    private LocalDateTime startDateTime;

    @Column(name = "end_date_time")
    private LocalDateTime endDateTime;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "schedule_type_enum")
    private ScheduleType type;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "schedule_status_enum")
    private ScheduleStatus status;

    @Column(name = "rejection_reason")
    private String rejectionReason;

    public ScheduleSlot() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public ClientCourseEnrollment getEnrollment() { return enrollment; }
    public void setEnrollment(ClientCourseEnrollment enrollment) { this.enrollment = enrollment; }
    public String getResourceId() { return resourceId; }
    public void setResourceId(String resourceId) { this.resourceId = resourceId; }
    public TrainerProfile getTrainer() { return trainer; }
    public void setTrainer(TrainerProfile trainer) { this.trainer = trainer; }
    public ClientProfile getClient() { return client; }
    public void setClient(ClientProfile client) { this.client = client; }
    public String getBranchId() { return branchId; }
    public void setBranchId(String branchId) { this.branchId = branchId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public LocalDateTime getStartDateTime() { return startDateTime; }
    public void setStartDateTime(LocalDateTime startDateTime) { this.startDateTime = startDateTime; }
    public LocalDateTime getEndDateTime() { return endDateTime; }
    public void setEndDateTime(LocalDateTime endDateTime) { this.endDateTime = endDateTime; }
    public ScheduleType getType() { return type; }
    public void setType(ScheduleType type) { this.type = type; }
    public ScheduleStatus getStatus() { return status; }
    public void setStatus(ScheduleStatus status) { this.status = status; }
    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
}
