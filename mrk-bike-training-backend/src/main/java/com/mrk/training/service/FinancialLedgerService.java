package com.mrk.training.service;

import com.mrk.training.dto.ledger.ExpenseRequest;
import com.mrk.training.dto.ledger.LedgerSummaryResponse;
import com.mrk.training.event.EnrollmentCreatedEvent;
import com.mrk.training.model.AssetInfo;
import com.mrk.training.model.Branch;
import com.mrk.training.model.FinancialLedger;
import com.mrk.training.model.FinancialType;
import com.mrk.training.repository.AssetRepository;
import com.mrk.training.repository.BranchRepository;
import com.mrk.training.repository.FinancialLedgerRepository;
import com.mrk.training.repository.TrainerRepository;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class FinancialLedgerService {

    private final FinancialLedgerRepository ledgerRepository;
    private final BranchRepository branchRepository;
    private final AssetRepository assetRepository;
    private final TrainerRepository trainerRepository;

    public FinancialLedgerService(
            FinancialLedgerRepository ledgerRepository,
            BranchRepository branchRepository,
            AssetRepository assetRepository,
            TrainerRepository trainerRepository) {
        this.ledgerRepository = ledgerRepository;
        this.branchRepository = branchRepository;
        this.assetRepository = assetRepository;
        this.trainerRepository = trainerRepository;
    }

    @EventListener
    @Transactional
    public void autoLogIncome(EnrollmentCreatedEvent event) {
        var enrollment = event.enrollment();
        if (enrollment.getTotalAmountPaid() == null
                || enrollment.getTotalAmountPaid().compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }
        FinancialLedger entry = new FinancialLedger();
        if (enrollment.getBranch() != null) {
            entry.setBranch(enrollment.getBranch());
        }
        if (enrollment.getAsset() != null) {
            entry.setAsset(enrollment.getAsset());
        }
        if (enrollment.getTrainer() != null) {
            entry.setTrainer(enrollment.getTrainer());
        }
        entry.setType(FinancialType.INCOME_ENROLLMENT);
        entry.setAmount(enrollment.getTotalAmountPaid());
        entry.setTransactionDate(LocalDate.now());
        ledgerRepository.save(entry);
    }

    @Transactional
    public FinancialLedger addExpense(ExpenseRequest request, Long adminId) {
        FinancialLedger entry = new FinancialLedger();
        Branch branch = branchRepository.findById(request.branchId())
                .orElseThrow(() -> new IllegalArgumentException("Branch not found."));
        entry.setBranch(branch);
        if (request.assetId() != null) {
            AssetInfo asset = assetRepository.findById(request.assetId()).orElse(null);
            entry.setAsset(asset);
        }
        if (request.trainerId() != null) {
            trainerRepository.findById(request.trainerId()).ifPresent(entry::setTrainer);
        }
        entry.setType(request.type());
        entry.setAmount(request.amount());
        entry.setTransactionDate(request.transactionDate());
        return ledgerRepository.save(entry);
    }

    public LedgerSummaryResponse getSummary(String branchId, LocalDate from, LocalDate to) {
        List<FinancialLedger> entries = ledgerRepository.findInRange(branchId, from, to);
        BigDecimal income = BigDecimal.ZERO;
        BigDecimal expense = BigDecimal.ZERO;
        Map<String, LedgerSummaryResponse.BranchLedgerSummary> byBranch = new HashMap<>();

        for (FinancialLedger e : entries) {
            String bid = e.getBranch() != null ? e.getBranch().getId() : "unknown";
            var summary = byBranch.computeIfAbsent(bid,
                    k -> new LedgerSummaryResponse.BranchLedgerSummary(BigDecimal.ZERO, BigDecimal.ZERO));

            if (e.getType() == FinancialType.INCOME_ENROLLMENT) {
                income = income.add(e.getAmount());
                byBranch.put(bid, new LedgerSummaryResponse.BranchLedgerSummary(
                        summary.income().add(e.getAmount()), summary.expense()));
            } else {
                expense = expense.add(e.getAmount());
                byBranch.put(bid, new LedgerSummaryResponse.BranchLedgerSummary(
                        summary.income(), summary.expense().add(e.getAmount())));
            }
        }
        return new LedgerSummaryResponse(income, expense, byBranch);
    }
}
