package com.mrk.training.exception;

public class DuplicateUniqueIdException extends RuntimeException {
    public DuplicateUniqueIdException(String uniqueId) {
        super("Unique ID '" + uniqueId + "' is already in use.");
    }
}
