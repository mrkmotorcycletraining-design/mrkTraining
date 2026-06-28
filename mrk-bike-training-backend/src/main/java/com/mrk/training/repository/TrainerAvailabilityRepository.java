package com.mrk.training.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mrk.training.model.TrainerAvailability;

public interface TrainerAvailabilityRepository extends JpaRepository<TrainerAvailability, Long> {

    @Query("SELECT a FROM TrainerAvailability a WHERE a.trainer.id = :trainerId AND a.branchId = :branchId AND a.isActive = true")
    List<TrainerAvailability> findActiveByTrainerIdAndBranchId(
            @Param("trainerId") Long trainerId,
            @Param("branchId") String branchId);

    @Query("SELECT a FROM TrainerAvailability a WHERE a.isActive = true AND a.trainer.id = :trainerId")
    List<TrainerAvailability> findActiveByTrainerId(@Param("trainerId") Long trainerId);

    @Query("""
            SELECT a FROM TrainerAvailability a
            WHERE a.isActive = true
              AND a.trainer.id = :trainerId
              AND a.branchId <> :branchId
            """)
    List<TrainerAvailability> findActiveByTrainerIdExcludingBranch(
            @Param("trainerId") Long trainerId,
            @Param("branchId") String branchId);

    @Query("SELECT a FROM TrainerAvailability a WHERE a.isActive = true")
    List<TrainerAvailability> findAllActive();
}
