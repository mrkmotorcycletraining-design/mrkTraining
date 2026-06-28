package com.mrk.training.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.mrk.training.model.Branch;
import com.mrk.training.repository.BranchRepository;

@Service
public class BranchService {

    private final BranchRepository repo;

    public BranchService(BranchRepository repo) {
        this.repo = repo;
    }

    /**
     * Create a new branch.
     * Throws IllegalArgumentException if the ID already exists.
     */
    public Branch create(Branch b) {
        if (repo.existsById(b.getId())) {
            throw new IllegalArgumentException("Branch with ID '" + b.getId() + "' already exists.");
        }
        return repo.save(b);
    }

    public List<Branch> listAll() {
        return repo.findAll();
    }

    public Branch findById(String id) {
        return repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Branch not found: " + id));
    }

    /**
     * Update an existing branch's name, address, operating days, and/or operating time.
     */
    public Branch update(String id, String name, String locationAddress,
                         String operatingDays, String operatingTime) {
        Branch branch = findById(id);
        if (name != null && !name.isBlank()) {
            branch.setName(name.trim());
        }
        if (locationAddress != null && !locationAddress.isBlank()) {
            branch.setLocationAddress(locationAddress.trim());
        }
        branch.setOperatingDays(operatingDays);
        branch.setOperatingTime(operatingTime);
        return repo.save(branch);
    }
}
