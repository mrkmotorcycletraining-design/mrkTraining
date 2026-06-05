package com.mrk.training.dto.enrollment;

import java.util.List;

public record ReconciliationResult(
        List<Long> reassignedSlotIds,
        List<Long> cancelledSlotIds,
        List<Long> newBufferSlotIds) {}
