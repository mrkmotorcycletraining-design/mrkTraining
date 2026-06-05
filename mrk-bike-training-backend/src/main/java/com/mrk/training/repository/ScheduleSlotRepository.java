package com.mrk.training.repository;

import com.mrk.training.model.ScheduleSlot;
import com.mrk.training.model.ScheduleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ScheduleSlotRepository extends JpaRepository<ScheduleSlot, Long> {

    List<ScheduleSlot> findByStatus(ScheduleStatus status);

    @Query("""
            SELECT s FROM ScheduleSlot s
            WHERE s.status IN :statuses
              AND s.startDateTime >= :from
              AND s.startDateTime < :to
              AND (:branchId IS NULL OR s.branchId = :branchId)
            """)
    List<ScheduleSlot> findOccupiedInWindow(
            @Param("statuses") List<ScheduleStatus> statuses,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("branchId") String branchId);

    List<ScheduleSlot> findByClientIdAndStatusIn(Long clientId, List<ScheduleStatus> statuses);

    List<ScheduleSlot> findByEnrollmentId(Long enrollmentId);

    List<ScheduleSlot> findByTrainerIdAndStartDateTimeBetween(
            Long trainerId, LocalDateTime from, LocalDateTime to);

    List<ScheduleSlot> findByResourceIdAndStatusAndStartDateTimeAfter(
            String resourceId, ScheduleStatus status, LocalDateTime after);

    @Query("SELECT s FROM ScheduleSlot s WHERE (:clientId IS NULL OR s.client.id = :clientId) " +
           "AND (:trainerId IS NULL OR s.trainer.id = :trainerId) " +
           "AND (:branchId IS NULL OR s.branchId = :branchId) " +
           "AND (:status IS NULL OR s.status = :status) " +
           "AND (:from IS NULL OR s.startDateTime >= :from) " +
           "AND (:to IS NULL OR s.startDateTime <= :to)")
    List<ScheduleSlot> findFiltered(
            @Param("clientId") Long clientId,
            @Param("trainerId") Long trainerId,
            @Param("branchId") String branchId,
            @Param("status") ScheduleStatus status,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);
}
