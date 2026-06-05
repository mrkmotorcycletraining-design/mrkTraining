package com.mrk.training.event;

import com.mrk.training.model.ScheduleSlot;

public record BufferExhaustedEvent(ScheduleSlot overflowSlot) {}
