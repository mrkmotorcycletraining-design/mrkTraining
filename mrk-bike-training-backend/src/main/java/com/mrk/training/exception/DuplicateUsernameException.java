package com.mrk.training.exception;

public class DuplicateUsernameException extends RuntimeException {
    public DuplicateUsernameException(String username) {
        super("Email '" + username + "' is already registered.");
    }
}
