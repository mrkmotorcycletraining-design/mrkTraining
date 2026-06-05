package com.mrk.training.event;

import com.mrk.training.model.ScheduleSlot;

public record AssetSwappedEvent(ScheduleSlot slot, String previousAssetId) {}
