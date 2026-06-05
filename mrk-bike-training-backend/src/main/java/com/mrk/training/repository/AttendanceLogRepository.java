package com.mrk.training.repository;

import com.mrk.training.model.AttendanceLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AttendanceLogRepository extends JpaRepository<AttendanceLog, Long> {

    List<AttendanceLog> findBySlotId(Long slotId);

    List<AttendanceLog> findByPersonId(String personId);
}
