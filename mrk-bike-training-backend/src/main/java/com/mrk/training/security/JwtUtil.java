package com.mrk.training.security;

import com.mrk.training.exception.JwtExpiredException;
import com.mrk.training.exception.JwtInvalidException;
import com.mrk.training.model.Role;
import com.mrk.training.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtil {

    private final SecretKey key;
    private final long expirationMs;

    public JwtUtil(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms}") long expirationMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String generateToken(User user) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);
        return Jwts.builder()
                .subject(String.valueOf(user.getId()))
                .claim("role", user.getRole().name())
                .claim("active", user.isActive())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key)
                .compact();
    }

    public JwtClaims validateToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            Long userId = Long.parseLong(claims.getSubject());
            Role role = Role.valueOf(claims.get("role", String.class));
            boolean active = Boolean.TRUE.equals(claims.get("active", Boolean.class));
            return new JwtClaims(userId, role, active);
        } catch (ExpiredJwtException ex) {
            throw new JwtExpiredException();
        } catch (JwtException | IllegalArgumentException ex) {
            throw new JwtInvalidException("Invalid JWT token.");
        }
    }

    public Long extractUserId(String token) {
        return validateToken(token).userId();
    }

    public Role extractRole(String token) {
        return validateToken(token).role();
    }

    public boolean isExpired(String token) {
        try {
            validateToken(token);
            return false;
        } catch (JwtExpiredException ex) {
            return true;
        }
    }
}
