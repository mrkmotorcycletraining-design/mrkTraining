package com.mrk.training.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mrk.training.model.VehicleTypeConfig;

public interface VehicleTypeConfigRepository extends JpaRepository<VehicleTypeConfig, Long> {

    Optional<VehicleTypeConfig> findByType(String type);
}
