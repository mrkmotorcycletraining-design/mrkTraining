package com.mrk.training.web.controller;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mrk.training.dto.TrainerDto;
import com.mrk.training.service.TrainerService;
import com.mrk.training.web.request.TrainerRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/trainers")
public class TrainerController {

    private final TrainerService service;

    public TrainerController(TrainerService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<TrainerDto> create(@Valid @RequestBody TrainerRequest req) {
        TrainerDto saved = service.create(req);
        return ResponseEntity.created(URI.create("/api/trainers/" + saved.getId())).body(saved);
    }

    @GetMapping
    public List<TrainerDto> list() {
        return service.listAll();
    }
}
