package com.mrk.training.web.controller;

import com.mrk.training.dto.auth.JwtResponse;
import com.mrk.training.dto.auth.LoginRequest;
import com.mrk.training.dto.auth.PasswordTestRequest;
import com.mrk.training.dto.auth.PasswordTestResponse;
import com.mrk.training.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final PasswordEncoder passwordEncoder;

    public AuthController(AuthService authService, PasswordEncoder passwordEncoder) {
        this.authService = authService;
        this.passwordEncoder = passwordEncoder;
    }

    @Operation(summary = "Login and receive JWT")
    @PostMapping("/login")
    public ResponseEntity<JwtResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @Operation(summary = "Test password hashing and verification")
    @PostMapping("/test-password")
    public ResponseEntity<PasswordTestResponse> testPassword(@Valid @RequestBody PasswordTestRequest request) {
        String generatedHash = passwordEncoder.encode(request.password());
        boolean matches = request.existingHash() != null 
            ? passwordEncoder.matches(request.password(), request.existingHash())
            : false;
        
        PasswordTestResponse response = new PasswordTestResponse(
            request.password(),
            generatedHash,
            request.existingHash(),
            matches,
            "HmacSha256PasswordEncoder with secret key from app.password.secret"
        );
        return ResponseEntity.ok(response);
    }
}
