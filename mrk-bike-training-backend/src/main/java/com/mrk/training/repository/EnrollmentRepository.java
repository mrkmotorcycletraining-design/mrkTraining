package com.mrk.training.repository;

import com.mrk.training.model.ClientCourseEnrollment;
import com.mrk.training.model.EnrollmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface EnrollmentRepository extends JpaRepository<ClientCourseEnrollment, Long> {

    List<ClientCourseEnrollment> findByClientId(Long clientId);

    List<ClientCourseEnrollment> findByClientIdAndStatus(Long clientId, EnrollmentStatus status);

    @Query("""
            SELECT e FROM ClientCourseEnrollment e
            WHERE (:clientId IS NULL OR e.client.id = :clientId)
              AND (:status IS NULL OR e.status = :status)
              AND (:from IS NULL OR e.enrollmentDate >= :from)
              AND (:to IS NULL OR e.enrollmentDate <= :to)
            """)
    List<ClientCourseEnrollment> findFiltered(
            @Param("clientId") Long clientId,
            @Param("status") EnrollmentStatus status,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);
}
