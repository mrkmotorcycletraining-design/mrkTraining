package com.mrk.training.web.controller;

import com.mrk.training.dto.notification.NotificationResponse;
import com.mrk.training.security.SecurityUtils;
import com.mrk.training.service.NotificationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public List<NotificationResponse> list() {
        return notificationService.getUnread(SecurityUtils.currentUserId());
    }

    @PutMapping("/{id}/read")
    public void markRead(@PathVariable Long id) {
        notificationService.markRead(id, SecurityUtils.currentUserId());
    }
}
