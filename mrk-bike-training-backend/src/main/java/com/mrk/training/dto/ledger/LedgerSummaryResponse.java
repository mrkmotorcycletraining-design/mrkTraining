package com.mrk.training.dto.ledger;

import java.math.BigDecimal;
import java.util.Map;

public record LedgerSummaryResponse(
        BigDecimal totalIncome,
        BigDecimal totalExpense,
        Map<String, BranchLedgerSummary> byBranch) {

    public record BranchLedgerSummary(
            BigDecimal income,
            BigDecimal expense) {}
}
