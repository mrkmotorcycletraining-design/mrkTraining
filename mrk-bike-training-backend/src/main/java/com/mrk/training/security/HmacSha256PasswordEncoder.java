package com.mrk.training.security;

import org.springframework.security.crypto.password.PasswordEncoder;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

public class HmacSha256PasswordEncoder implements PasswordEncoder {

    private final String secretKey;

    public HmacSha256PasswordEncoder(String secretKey) {
        this.secretKey = secretKey;
    }

    @Override
    public String encode(CharSequence rawPassword) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hashBytes = mac.doFinal(rawPassword.toString().getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hashBytes);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new RuntimeException("Failed to encode password", e);
        }
    }

    @Override
    public boolean matches(CharSequence rawPassword, String encodedPassword) {
        String encodedRawPassword = encode(rawPassword);
        return encodedRawPassword.equals(encodedPassword);
    }
}
