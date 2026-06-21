package com.mrk.training.dto;

public class ClientDto {
    private Long id;
    private String name;
    private String username;
    private Double heightFt;
    private Integer weightKg;

    public ClientDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public Double getHeightFt() { return heightFt; }
    public void setHeightFt(Double heightFt) { this.heightFt = heightFt; }
    public Integer getWeightKg() { return weightKg; }
    public void setWeightKg(Integer weightKg) { this.weightKg = weightKg; }
}
