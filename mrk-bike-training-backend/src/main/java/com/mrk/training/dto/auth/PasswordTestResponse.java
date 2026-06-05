package com.mrk.training.dto.auth;

public record PasswordTestResponse(
    String password,
    String generatedHash,
    String providedHash,
    boolean matches,
    String encoderInfo
) {
}
