package com.mrk.training.exception;

public class DuplicateUsernameException extends RuntimeException {
    public DuplicateUsernameException(String username) {
        super("Username '" + username + "' is already taken. Please choose another username.");
    }
}
