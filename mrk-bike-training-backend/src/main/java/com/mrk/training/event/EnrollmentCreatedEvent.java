package com.mrk.training.event;

import com.mrk.training.model.ClientCourseEnrollment;

public record EnrollmentCreatedEvent(ClientCourseEnrollment enrollment) {}
