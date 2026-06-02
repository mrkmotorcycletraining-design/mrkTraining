package com.mrk.training.web.controller;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mrk.training.model.Branch;
import com.mrk.training.service.BranchService;
import com.mrk.training.web.request.BranchRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/branches")
public class BranchController {

    private final BranchService service;

    public BranchController(BranchService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<Branch> create(@Valid @RequestBody BranchRequest req) {
        Branch b = new Branch();
        b.setId(req.getId().trim());
        b.setName(req.getName().trim());
        b.setLocationAddress(req.getLocationAddress() != null ? req.getLocationAddress().trim() : null);
        Branch saved = service.create(b);
        return ResponseEntity.created(URI.create("/api/branches/" + saved.getId())).body(saved);
    }

    @GetMapping
    public List<Branch> list() {
        return service.listAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Branch> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.findById(id));
    }
}
