package com.mrk.training.dto.slot;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SlotApproveRequest(
        @NotBlank String assetId,
        @NotNull Long trainerId) {}
