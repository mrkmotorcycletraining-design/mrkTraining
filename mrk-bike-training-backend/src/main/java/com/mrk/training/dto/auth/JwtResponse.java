package com.mrk.training.dto.auth;

public record JwtResponse(String token, String role, Long userId) {}
