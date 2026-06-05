package com.mrk.training.model;

import jakarta.persistence.*;

@Entity
@Table(name = "courses")
public class Course {

    @Id
    private String id; // user-defined e.g., MOTO_PREMIUM

    private String name;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "course_category_enum")
    private CourseCategory category;

    @Column(name = "hours_per_day")
    private Integer hoursPerDay;

    @Column(name = "total_days")
    private Integer totalDays;

    @Column(name = "preferred_days_of_week", columnDefinition = "text")
    private String preferredDaysOfWeek; // JSON array or CSV

    @Column(name = "buffer_days")
    private Integer bufferDays = 0;

    @Column(name = "image_url")
    private String imageUrl;

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
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
}
