package com.mrk.training.web.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mrk.training.model.AssetTypeConfig;
import com.mrk.training.repository.AssetTypeConfigRepository;

@RestController
@RequestMapping("/api/asset-types")
public class AssetTypeConfigController {

    private final AssetTypeConfigRepository repo;

    public AssetTypeConfigController(AssetTypeConfigRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<AssetTypeConfig> list() {
        return repo.findAll();
    }
}
