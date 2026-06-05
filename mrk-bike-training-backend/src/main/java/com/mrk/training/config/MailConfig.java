package com.mrk.training.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;

/**
 * Email is optional — NotificationService injects JavaMailSender only when configured.
 * Set spring.mail.host (and related props) to enable SMTP delivery.
 */
@Configuration
@ConditionalOnProperty(name = "spring.mail.host")
public class MailConfig {
}
