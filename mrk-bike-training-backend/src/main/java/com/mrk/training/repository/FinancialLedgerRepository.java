package com.mrk.training.repository;

import com.mrk.training.model.FinancialLedger;
import com.mrk.training.model.FinancialType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface FinancialLedgerRepository extends JpaRepository<FinancialLedger, Long> {

    @Query("""
            SELECT f FROM FinancialLedger f
            WHERE (:branchId IS NULL OR f.branch.id = :branchId)
              AND f.transactionDate >= :from
              AND f.transactionDate <= :to
            """)
    List<FinancialLedger> findInRange(
            @Param("branchId") String branchId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    List<FinancialLedger> findByTypeAndTransactionDateBetween(
            FinancialType type, LocalDate from, LocalDate to);
}
