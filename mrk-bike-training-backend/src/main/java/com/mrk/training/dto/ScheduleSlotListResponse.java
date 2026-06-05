package com.mrk.training.dto;

import java.util.List;

public class ScheduleSlotListResponse {
    private List<ScheduleSlotDto> slots;
    private int total;
    private boolean hasData;

    public ScheduleSlotListResponse() {
        this.hasData = false;
    }

    public ScheduleSlotListResponse(List<ScheduleSlotDto> slots) {
        this.slots = slots;
        this.total = slots != null ? slots.size() : 0;
        this.hasData = this.total > 0;
    }

    public static ScheduleSlotListResponse empty() {
        return new ScheduleSlotListResponse();
    }

    public List<ScheduleSlotDto> getSlots() {
        return slots;
    }

    public void setSlots(List<ScheduleSlotDto> slots) {
        this.slots = slots;
        this.total = slots != null ? slots.size() : 0;
        this.hasData = this.total > 0;
    }

    public int getTotal() {
        return total;
    }

    public void setTotal(int total) {
        this.total = total;
    }

    public boolean isHasData() {
        return hasData;
    }

    public void setHasData(boolean hasData) {
        this.hasData = hasData;
    }
}
