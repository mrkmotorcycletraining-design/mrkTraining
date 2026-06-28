package com.mrk.training.model;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "courses")
public class Course {

    @Id
    private String id; // user-defined e.g., MOTO_PREMIUM

    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "category")
    private CourseCategory category;

    @Column(name = "hours_per_day")
    private Integer hoursPerDay;

    @Column(name = "total_days")
    private Integer totalDays;

    @Column(name = "preferred_days_of_week", columnDefinition = "text")
    private String preferredDaysOfWeek; // JSON array or CSV

    @Column(name = "buffer_days")
    private Integer bufferDays = 0;

    @Column(name = "template_image", columnDefinition = "bytea")
    private byte[] templateImage;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "start_time")
    private String startTime;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "end_time")
    private String endTime;

    @Column(name = "status")
    private String status = "ACTIVE";

    public Course() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public CourseCategory getCategory() { return category; }
    public void setCategory(CourseCategory category) { this.category = category; }
    public Integer getHoursPerDay() { return hoursPerDay; }
    public void setHoursPerDay(Integer hoursPerDay) { this.hoursPerDay = hoursPerDay; }
    public Integer getTotalDays() { return totalDays; }
    public void setTotalDays(Integer totalDays) { this.totalDays = totalDays; }
    public String getPreferredDaysOfWeek() { return preferredDaysOfWeek; }
    public void setPreferredDaysOfWeek(String preferredDaysOfWeek) { this.preferredDaysOfWeek = preferredDaysOfWeek; }
    public Integer getBufferDays() { return bufferDays; }
    public void setBufferDays(Integer bufferDays) { this.bufferDays = bufferDays; }
    public byte[] getTemplateImage() { return templateImage; }
    public void setTemplateImage(byte[] templateImage) { this.templateImage = templateImage; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
