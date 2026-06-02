package com.mrk.training.repository;

import com.mrk.training.model.AssetInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AssetRepository extends JpaRepository<AssetInfo, String> {
}
