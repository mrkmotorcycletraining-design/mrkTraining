package com.mrk.training.dto.ledger;

import com.mrk.training.model.FinancialType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ExpenseRequest(
        @NotNull String branchId,
        String assetId,
        Long trainerId,
        @NotNull FinancialType type,
        @NotNull @Positive BigDecimal amount,
        @NotNull LocalDate transactionDate,
        String description) {}
