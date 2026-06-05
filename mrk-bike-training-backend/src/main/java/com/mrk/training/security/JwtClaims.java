package com.mrk.training.security;

import com.mrk.training.model.Role;

public record JwtClaims(Long userId, Role role, boolean active) {}
