package com.mrk.training.dto.scheduler;

import java.time.LocalDateTime;

public record TimeInterval(LocalDateTime start, LocalDateTime end) {

    public boolean overlaps(TimeInterval other) {
        return start.isBefore(other.end) && end.isAfter(other.start);
    }
}
