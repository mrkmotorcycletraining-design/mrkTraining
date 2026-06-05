package com.mrk.training.web.controller;

import com.mrk.training.dto.scheduler.AvailableIntervalsResponse;
import com.mrk.training.dto.scheduler.ScheduleQuery;
import com.mrk.training.service.SchedulerService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/scheduler")
public class SchedulerController {

    private final SchedulerService schedulerService;

    public SchedulerController(SchedulerService schedulerService) {
        this.schedulerService = schedulerService;
    }

    @PostMapping("/available-intervals")
    //    @PreAuthorize("hasAnyRole('CLIENT','ADMIN','SUPER_ADMIN')")
    public AvailableIntervalsResponse availableIntervals(@Valid @RequestBody ScheduleQuery query) {
        return new AvailableIntervalsResponse(schedulerService.computeAvailableIntervals(query));
    }
}
