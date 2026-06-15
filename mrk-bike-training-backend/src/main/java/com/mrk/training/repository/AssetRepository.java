package com.mrk.training.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.mrk.training.model.AssetInfo;

@Repository
public interface AssetRepository extends JpaRepository<AssetInfo, String> {

    List<AssetInfo> findByCurrentBranchId(String branchId);

    List<AssetInfo> findByVehicleType_Type(String type);

    List<AssetInfo> findByCurrentBranchIdAndVehicleType_Type(String branchId, String type);
}
