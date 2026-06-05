package com.mrk.training.service;

import com.mrk.training.dto.auth.JwtResponse;
import com.mrk.training.dto.auth.LoginRequest;
import com.mrk.training.exception.AccountDisabledException;
import com.mrk.training.model.User;
import com.mrk.training.repository.UserRepository;
import com.mrk.training.security.JwtUtil;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public JwtResponse login(LoginRequest request) {
        User user = userRepository.findByEmailUsername(request.emailUsername())
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));
        if (!user.isActive()) {
            throw new AccountDisabledException();
        }
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid credentials");
        }
        String token = jwtUtil.generateToken(user);
        return new JwtResponse(token, user.getRole().name(), user.getId());
    }
}
