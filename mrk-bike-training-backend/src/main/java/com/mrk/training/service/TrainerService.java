package com.mrk.training.service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mrk.training.dto.TrainerDto;
import com.mrk.training.exception.DuplicateUsernameException;
import com.mrk.training.model.Role;
import com.mrk.training.model.TrainerProfile;
import com.mrk.training.model.User;
import com.mrk.training.repository.TrainerRepository;
import com.mrk.training.repository.UserRepository;
import com.mrk.training.web.request.TrainerRequest;

@Service
public class TrainerService {

    private final TrainerRepository trainerRepo;
    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;

    public TrainerService(
            TrainerRepository trainerRepo,
            UserRepository userRepo,
            PasswordEncoder passwordEncoder) {
        this.trainerRepo = trainerRepo;
        this.userRepo = userRepo;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public TrainerDto create(TrainerRequest req) {
        if (userRepo.existsByUsername(req.getUsername())) {
            throw new DuplicateUsernameException(req.getUsername());
        }

        User user = new User();
        user.setUsername(req.getUsername());
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setRole(Role.TRAINER);
        user.setActive(true);
        user = userRepo.save(user);

        TrainerProfile profile = new TrainerProfile();
        profile.setUser(user);
        profile.setName(req.getName());
        profile.setStartDate(req.getStartDate() != null ? LocalDate.parse(req.getStartDate()) : LocalDate.now());
        profile.setSalary(req.getSalary());
        profile.setAvailable(true);
        profile.setPreferredDays(req.getPreferredDays());
        profile.setPreferredTime(req.getPreferredTime());
        profile.setPreferredLocations(req.getPreferredLocations());
        profile = trainerRepo.save(profile);
        return toDto(profile);
    }

    public List<TrainerDto> listAll() {
        return trainerRepo.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    public TrainerDto getById(Long id) {
        return toDto(trainerRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Trainer not found: " + id)));
    }

    public TrainerDto getMe(Long userId) {
        return getById(userId);
    }

    @Transactional
    public void delete(Long id) {
        TrainerProfile profile = trainerRepo.findById(id).orElseThrow(() -> new IllegalArgumentException("Trainer not found"));
        User user = profile.getUser();
        trainerRepo.delete(profile);
        if (user != null) {
            userRepo.delete(user);
        }
    }

    @Transactional
    public void deactivate(Long id) {
        TrainerProfile profile = trainerRepo.findById(id).orElseThrow(() -> new IllegalArgumentException("Trainer not found"));
        if (profile.getUser() != null) {
            profile.getUser().setActive(false);
            userRepo.save(profile.getUser());
        }
    }

    @Transactional
    public void activate(Long id) {
        TrainerProfile profile = trainerRepo.findById(id).orElseThrow(() -> new IllegalArgumentException("Trainer not found"));
        if (profile.getUser() != null) {
            profile.getUser().setActive(true);
            userRepo.save(profile.getUser());
        }
    }

    @Transactional
    public void resetPassword(Long id, String newPassword) {
        TrainerProfile profile = trainerRepo.findById(id).orElseThrow(() -> new IllegalArgumentException("Trainer not found"));
        if (profile.getUser() != null) {
            profile.getUser().setPasswordHash(passwordEncoder.encode(newPassword));
            userRepo.save(profile.getUser());
        }
    }

    @Transactional
    public void switchBranch(Long id, String branchId) {
        TrainerProfile profile = trainerRepo.findById(id).orElseThrow(() -> new IllegalArgumentException("Trainer not found"));
        // Update preferred locations to the new branch
        profile.setPreferredLocations(branchId);
        trainerRepo.save(profile);
    }

    private TrainerDto toDto(TrainerProfile p) {
        TrainerDto dto = new TrainerDto();
        dto.setId(p.getId());
        dto.setName(p.getName());
        dto.setUsername(p.getUser() != null ? p.getUser().getUsername() : null);
        dto.setStartDate(p.getStartDate() != null ? p.getStartDate().toString() : null);
        dto.setSalary(p.getSalary());
        dto.setAvailable(p.isAvailable());
        dto.setPreferredDays(p.getPreferredDays());
        dto.setPreferredTime(p.getPreferredTime());
        dto.setPreferredLocations(p.getPreferredLocations());
        return dto;
    }
}
