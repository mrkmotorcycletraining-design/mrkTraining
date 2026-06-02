package com.mrk.training.service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mrk.training.dto.TrainerDto;
import com.mrk.training.model.Branch;
import com.mrk.training.model.Role;
import com.mrk.training.model.TrainerProfile;
import com.mrk.training.model.User;
import com.mrk.training.repository.BranchRepository;
import com.mrk.training.repository.TrainerRepository;
import com.mrk.training.repository.UserRepository;
import com.mrk.training.web.request.TrainerRequest;

@Service
public class TrainerService {

    private final TrainerRepository trainerRepo;
    private final UserRepository userRepo;
    private final BranchRepository branchRepo;

    public TrainerService(TrainerRepository trainerRepo, UserRepository userRepo,
                          BranchRepository branchRepo) {
        this.trainerRepo = trainerRepo;
        this.userRepo = userRepo;
        this.branchRepo = branchRepo;
    }

    @Transactional
    public TrainerDto create(TrainerRequest req) {
        if (userRepo.existsByEmailUsername(req.getEmailUsername())) {
            throw new IllegalArgumentException("Email '" + req.getEmailUsername() + "' is already registered.");
        }

        User user = new User();
        user.setEmailUsername(req.getEmailUsername());
        user.setPasswordHash(req.getPasswordHash()); // hash with BCrypt in production
        user.setRole(Role.TRAINER);
        user.setActive(true);
        user = userRepo.save(user);

        TrainerProfile profile = new TrainerProfile();
        profile.setUser(user);
        profile.setId(user.getId());
        profile.setName(req.getName());
        profile.setStartDate(req.getStartDate() != null ? LocalDate.parse(req.getStartDate()) : LocalDate.now());
        profile.setSalary(req.getSalary());
        profile.setAvailable(true);

        if (req.getBranchId() != null && !req.getBranchId().isBlank()) {
            Branch branch = branchRepo.findById(req.getBranchId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Branch not found: '" + req.getBranchId() + "'"));
            profile.setBranch(branch);
        }

        profile = trainerRepo.save(profile);
        return toDto(profile);
    }

    public List<TrainerDto> listAll() {
        return trainerRepo.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    private TrainerDto toDto(TrainerProfile p) {
        TrainerDto dto = new TrainerDto();
        dto.setId(p.getId());
        dto.setName(p.getName());
        dto.setEmailUsername(p.getUser() != null ? p.getUser().getEmailUsername() : null);
        dto.setStartDate(p.getStartDate() != null ? p.getStartDate().toString() : null);
        dto.setSalary(p.getSalary());
        dto.setAvailable(p.isAvailable());
        if (p.getBranch() != null) {
            dto.setBranchId(p.getBranch().getId());
            dto.setBranchName(p.getBranch().getName());
        }
        return dto;
    }
}
