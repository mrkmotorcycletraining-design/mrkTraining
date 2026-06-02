package com.mrk.training.model;

import java.time.LocalDateTime;

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
@Table(name = "attendance_logs")
public class AttendanceLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "slot_id")
    private ScheduleSlot slot;

    @Column(name = "person_id")
    private String personId; // client or trainer id as string

    @Enumerated(EnumType.STRING)
    @Column(name = "person_type", columnDefinition = "person_type_enum")
    private PersonType personType;

    @Column(name = "date_time")
    private LocalDateTime dateTime;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "attendance_status_enum")
    private AttendanceStatus status;

    public AttendanceLog() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public ScheduleSlot getSlot() { return slot; }
    public void setSlot(ScheduleSlot slot) { this.slot = slot; }
    public String getPersonId() { return personId; }
    public void setPersonId(String personId) { this.personId = personId; }
    public PersonType getPersonType() { return personType; }
    public void setPersonType(PersonType personType) { this.personType = personType; }
    public LocalDateTime getDateTime() { return dateTime; }
    public void setDateTime(LocalDateTime dateTime) { this.dateTime = dateTime; }
    public AttendanceStatus getStatus() { return status; }
    public void setStatus(AttendanceStatus status) { this.status = status; }
}
