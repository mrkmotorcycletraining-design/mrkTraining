package com.mrk.training.exception;

public class EnrollmentLimitException extends RuntimeException {
    public EnrollmentLimitException(String message) {
        super(message);
    }
}
