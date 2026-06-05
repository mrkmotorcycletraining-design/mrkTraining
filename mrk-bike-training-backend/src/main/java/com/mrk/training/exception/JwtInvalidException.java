package com.mrk.training.exception;

public class JwtInvalidException extends RuntimeException {
    public JwtInvalidException(String message) {
        super(message);
    }
}
