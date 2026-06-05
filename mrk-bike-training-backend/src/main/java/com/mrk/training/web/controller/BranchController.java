package com.mrk.training.web.controller;

import com.mrk.training.model.Branch;
import com.mrk.training.service.BranchService;
import com.mrk.training.web.request.BranchRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/branches")
public class BranchController {

    private final BranchService service;

    public BranchController(BranchService service) {
        this.service = service;
    }

    @PostMapping
//    //    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
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
