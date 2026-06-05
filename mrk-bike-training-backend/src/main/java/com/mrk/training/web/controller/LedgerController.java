package com.mrk.training.web.controller;

import com.mrk.training.dto.ledger.ExpenseRequest;
import com.mrk.training.dto.ledger.LedgerSummaryResponse;
import com.mrk.training.model.FinancialLedger;
import com.mrk.training.security.SecurityUtils;
import com.mrk.training.service.FinancialLedgerService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/ledger")
public class LedgerController {

    private final FinancialLedgerService ledgerService;

    public LedgerController(FinancialLedgerService ledgerService) {
        this.ledgerService = ledgerService;
    }

    @PostMapping("/expense")
    //    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public FinancialLedger addExpense(@Valid @RequestBody ExpenseRequest request) {
        return ledgerService.addExpense(request, SecurityUtils.currentUserId());
    }

    @GetMapping("/summary")
    //    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public LedgerSummaryResponse summary(
            @RequestParam(required = false) String branchId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ledgerService.getSummary(branchId, from, to);
    }
}
