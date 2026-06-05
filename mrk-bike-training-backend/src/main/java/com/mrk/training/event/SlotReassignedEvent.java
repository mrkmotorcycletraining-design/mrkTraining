package com.mrk.training.event;

import com.mrk.training.model.ScheduleSlot;

public record SlotReassignedEvent(ScheduleSlot slot, Long previousTrainerId) {}
