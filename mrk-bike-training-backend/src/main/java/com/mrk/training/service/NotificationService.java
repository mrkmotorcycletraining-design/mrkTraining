package com.mrk.training.service;

import com.mrk.training.dto.notification.NotificationResponse;
import com.mrk.training.event.*;
import com.mrk.training.model.Notification;
import com.mrk.training.model.Role;
import com.mrk.training.repository.NotificationRepository;
import com.mrk.training.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final JavaMailSender mailSender;

    public NotificationService(
            NotificationRepository notificationRepository,
            UserRepository userRepository,
            @Autowired(required = false) JavaMailSender mailSender) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.mailSender = mailSender;
    }

    @Transactional
    public void notify(Long userId, String message) {
        Notification n = new Notification();
        n.setUserId(userId);
        n.setMessage(message);
        n.setRead(false);
        n.setCreatedAt(LocalDateTime.now());
        notificationRepository.save(n);

        if (mailSender != null) {
            userRepository.findById(userId).ifPresent(user -> {
                try {
                    SimpleMailMessage mail = new SimpleMailMessage();
                    mail.setTo(user.getEmailUsername());
                    mail.setSubject("MRK Bike Training");
                    mail.setText(message);
                    mailSender.send(mail);
                } catch (Exception ignored) {
                    // SMTP optional
                }
            });
        }
    }

    public List<NotificationResponse> getUnread(Long userId) {
        return notificationRepository.findByUserIdOrderByIsReadAscCreatedAtDesc(userId).stream()
                .map(n -> new NotificationResponse(n.getId(), n.getMessage(), n.isRead(), n.getCreatedAt()))
                .toList();
    }

    @Transactional
    public void markRead(Long notificationId, Long userId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found."));
        if (!n.getUserId().equals(userId)) {
            throw new org.springframework.security.access.AccessDeniedException("Not your notification.");
        }
        n.setRead(true);
        notificationRepository.save(n);
    }

    @org.springframework.context.event.EventListener
    public void onEnrollmentCreated(EnrollmentCreatedEvent event) {
        Long clientUserId = event.enrollment().getClient().getId();
        notify(clientUserId, "Your training enrollment has been submitted.");
        notifyAdmins("New enrollment submitted by client " + clientUserId);
    }

    @org.springframework.context.event.EventListener
    public void onSlotApproved(SlotApprovedEvent event) {
        if (event.slot().getClient() != null) {
            notify(event.slot().getClient().getId(),
                    "Your training slot on " + event.slot().getStartDateTime() + " has been approved.");
        }
    }

    @org.springframework.context.event.EventListener
    public void onSlotRejected(SlotRejectedEvent event) {
        if (event.slot().getClient() != null) {
            String msg = "Your training slot was rejected.";
            if (event.reason() != null) {
                msg += " Reason: " + event.reason();
            }
            notify(event.slot().getClient().getId(), msg);
        }
    }

    @org.springframework.context.event.EventListener
    public void onSlotReassigned(SlotReassignedEvent event) {
        if (event.slot().getClient() != null) {
            notify(event.slot().getClient().getId(), "Your training slot trainer was reassigned.");
        }
        notifyAdmins("Slot " + event.slot().getId() + " trainer reassigned.");
    }

    @org.springframework.context.event.EventListener
    public void onBufferExhausted(BufferExhaustedEvent event) {
        if (event.overflowSlot().getClient() != null) {
            notify(event.overflowSlot().getClient().getId(),
                    "Buffer exhausted — new overflow slot scheduled for "
                            + event.overflowSlot().getStartDateTime());
        }
        notifyAdmins("Buffer exhausted for client — overflow slot created.");
    }

    @org.springframework.context.event.EventListener
    public void onAssetSwapped(AssetSwappedEvent event) {
        if (event.slot().getClient() != null) {
            notify(event.slot().getClient().getId(), "Your training asset was swapped due to maintenance.");
        }
        notifyAdmins("Asset swapped on slot " + event.slot().getId());
    }

    private void notifyAdmins(String message) {
        userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.ADMIN || u.getRole() == Role.SUPER_ADMIN)
                .forEach(u -> notify(u.getId(), message));
    }
}
