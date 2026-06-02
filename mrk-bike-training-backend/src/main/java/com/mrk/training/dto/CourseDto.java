package com.mrk.training.dto;

public class CourseDto {
    private String id;
    private String name;
    private String category;
    private Integer hoursPerDay;
    private Integer totalDays;
    private String preferredDaysOfWeek;

    public CourseDto() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public Integer getHoursPerDay() { return hoursPerDay; }
    public void setHoursPerDay(Integer hoursPerDay) { this.hoursPerDay = hoursPerDay; }
    public Integer getTotalDays() { return totalDays; }
    public void setTotalDays(Integer totalDays) { this.totalDays = totalDays; }
    public String getPreferredDaysOfWeek() { return preferredDaysOfWeek; }
    public void setPreferredDaysOfWeek(String preferredDaysOfWeek) { this.preferredDaysOfWeek = preferredDaysOfWeek; }
}
