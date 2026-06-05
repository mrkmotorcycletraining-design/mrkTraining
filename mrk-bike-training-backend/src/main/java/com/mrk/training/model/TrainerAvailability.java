package com.mrk.training.model;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "trainer_availability")
public class TrainerAvailability {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "trainer_id", nullable = false)
    private TrainerProfile trainer;

    @Column(name = "branch_id", nullable = false)
    private String branchId;

    @Column(name = "available_days", nullable = false)
    private String availableDays;

    @Column(name = "slot_start_time", nullable = false)
    private LocalTime slotStartTime;

    @Column(name = "slot_end_time", nullable = false)
    private LocalTime slotEndTime;

    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;

    @Column(name = "effective_to")
    private LocalDate effectiveTo;

    @Column(name = "is_active")
    private boolean isActive = true;

    @Column(name = "audit_start_date_time", nullable = false)
    private LocalDateTime auditStartDateTime;

    public TrainerAvailability() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public TrainerProfile getTrainer() { return trainer; }
    public void setTrainer(TrainerProfile trainer) { this.trainer = trainer; }
    public String getBranchId() { return branchId; }
    public void setBranchId(String branchId) { this.branchId = branchId; }
    public String getAvailableDays() { return availableDays; }
    public void setAvailableDays(String availableDays) { this.availableDays = availableDays; }
    public LocalTime getSlotStartTime() { return slotStartTime; }
    public void setSlotStartTime(LocalTime slotStartTime) { this.slotStartTime = slotStartTime; }
    public LocalTime getSlotEndTime() { return slotEndTime; }
    public void setSlotEndTime(LocalTime slotEndTime) { this.slotEndTime = slotEndTime; }
    public LocalDate getEffectiveFrom() { return effectiveFrom; }
    public void setEffectiveFrom(LocalDate effectiveFrom) { this.effectiveFrom = effectiveFrom; }
    public LocalDate getEffectiveTo() { return effectiveTo; }
    public void setEffectiveTo(LocalDate effectiveTo) { this.effectiveTo = effectiveTo; }
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
    public LocalDateTime getAuditStartDateTime() { return auditStartDateTime; }
    public void setAuditStartDateTime(LocalDateTime auditStartDateTime) { this.auditStartDateTime = auditStartDateTime; }
}
