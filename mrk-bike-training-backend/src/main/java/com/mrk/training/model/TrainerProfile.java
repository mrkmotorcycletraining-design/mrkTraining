package com.mrk.training.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "trainer_profiles")
public class TrainerProfile {

    @Id
    private Long id; // shared FK to users.id

    @OneToOne
    @MapsId
    @JoinColumn(name = "id")
    @JsonIgnore
    private User user;

    private String name;

    @Column(name = "start_date")
    private LocalDate startDate;

    private BigDecimal salary;

    @Column(name = "is_available")
    private boolean isAvailable = true;

    // NOTE: trainer_profiles table has no branch_id column — branch is resolved
    // via the schedule_slot or enrollment context, not stored on the trainer directly.

    public TrainerProfile() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public BigDecimal getSalary() { return salary; }
    public void setSalary(BigDecimal salary) { this.salary = salary; }
    public boolean isAvailable() { return isAvailable; }
    public void setAvailable(boolean available) { isAvailable = available; }
}
