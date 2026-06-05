package com.mrk.training.repository;

import com.mrk.training.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserIdOrderByIsReadAscCreatedAtDesc(Long userId);
}
