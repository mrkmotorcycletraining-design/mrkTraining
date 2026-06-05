package com.mrk.training.exception;

public class InvalidStartDateException extends RuntimeException {
    public InvalidStartDateException() {
        super("Enrollment start date must be a Monday.");
    }
}
