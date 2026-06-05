package com.mrk.training.repository;

import com.mrk.training.model.AssetInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssetRepository extends JpaRepository<AssetInfo, String> {

    List<AssetInfo> findByCurrentBranchId(String branchId);

    List<AssetInfo> findByType(String type);

    List<AssetInfo> findByCurrentBranchIdAndType(String branchId, String type);
}
