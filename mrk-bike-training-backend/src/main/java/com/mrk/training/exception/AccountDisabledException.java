package com.mrk.training.exception;

public class AccountDisabledException extends RuntimeException {
    public AccountDisabledException() {
        super("Account is deactivated.");
    }
}
