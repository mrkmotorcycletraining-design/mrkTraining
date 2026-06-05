package com.mrk.training.dto.client;

import jakarta.validation.constraints.NotNull;

public record TrainingsAllowanceUpdateRequest(
    @NotNull Integer allowedNumOfTrainings
) {
}
