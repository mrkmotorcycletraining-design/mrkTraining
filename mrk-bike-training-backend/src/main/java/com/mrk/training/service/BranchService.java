package com.mrk.training.service;

import com.mrk.training.model.Branch;
import com.mrk.training.repository.BranchRepository;
import org.springframework.stereotype.Service;

import java.util.List;

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
}
