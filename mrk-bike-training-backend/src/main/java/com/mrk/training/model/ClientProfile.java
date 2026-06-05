package com.mrk.training.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "client_profiles")
public class ClientProfile {

    @Id
    private Long id;

    @OneToOne
    @MapsId
    @JoinColumn(name = "id")
    @JsonIgnore
    private User user;

    private String name;

    @Column(name = "unique_id", unique = true)
    private String uniqueId;

    @Column(name = "allowed_num_of_trainings")
    private Integer allowedNumOfTrainings = 1;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "profile_picture")
    private String profilePicture;

    @Column(name = "height_cm")
    private Integer heightCm;

    @Column(name = "weight_kg")
    private Integer weightKg;

    public ClientProfile() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getUniqueId() { return uniqueId; }
    public void setUniqueId(String uniqueId) { this.uniqueId = uniqueId; }
    public Integer getAllowedNumOfTrainings() { return allowedNumOfTrainings; }
    public void setAllowedNumOfTrainings(Integer allowedNumOfTrainings) { this.allowedNumOfTrainings = allowedNumOfTrainings; }
    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
    public String getProfilePicture() { return profilePicture; }
    public void setProfilePicture(String profilePicture) { this.profilePicture = profilePicture; }
    public Integer getHeightCm() { return heightCm; }
    public void setHeightCm(Integer heightCm) { this.heightCm = heightCm; }
    public Integer getWeightKg() { return weightKg; }
    public void setWeightKg(Integer weightKg) { this.weightKg = weightKg; }
}
