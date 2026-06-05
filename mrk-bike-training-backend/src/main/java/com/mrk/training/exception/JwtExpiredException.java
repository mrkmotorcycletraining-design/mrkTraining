package com.mrk.training.exception;

public class JwtExpiredException extends RuntimeException {
    public JwtExpiredException() {
        super("JWT token has expired.");
    }
}
