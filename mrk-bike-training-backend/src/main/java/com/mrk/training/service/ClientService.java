package com.mrk.training.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mrk.training.dto.client.AdminClientProfileResponse;
import com.mrk.training.dto.client.ClientCreateRequest;
import com.mrk.training.dto.client.ClientProfileResponse;
import com.mrk.training.dto.client.ClientUpdateRequest;
import com.mrk.training.exception.DuplicateUsernameException;
import com.mrk.training.model.ClientProfile;
import com.mrk.training.model.Role;
import com.mrk.training.model.ScheduleStatus;
import com.mrk.training.model.User;
import com.mrk.training.repository.ClientRepository;
import com.mrk.training.repository.ScheduleSlotRepository;
import com.mrk.training.repository.UserRepository;
import com.mrk.training.web.request.ClientRequest;

@Service
public class ClientService {

    private final ClientRepository clientRepo;
    private final UserRepository userRepo;
    private final ScheduleSlotRepository slotRepository;
    private final PasswordEncoder passwordEncoder;

    public ClientService(
            ClientRepository clientRepo,
            UserRepository userRepo,
            ScheduleSlotRepository slotRepository,
            PasswordEncoder passwordEncoder) {
        this.clientRepo = clientRepo;
        this.userRepo = userRepo;
        this.slotRepository = slotRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public AdminClientProfileResponse create(ClientCreateRequest req) {
        if (userRepo.existsByUsername(req.username())) {
            throw new DuplicateUsernameException(req.username());
        }

        User user = new User();
        user.setUsername(req.username());
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        user.setRole(Role.CLIENT);
        user.setActive(true);
        user = userRepo.save(user);

        ClientProfile profile = new ClientProfile();
        profile.setUsername(req.username());
        profile.setName(req.name());
        profile.setEmail(req.email());
        profile.setAllowedNumOfTrainings(req.allowedNumOfTrainings());
        profile.setHeightFt(req.heightFt());
        profile.setWeightKg(req.weightKg());
        profile = clientRepo.save(profile);

        // Set user reference for DTO mapping
        profile.setUser(user);
        return toAdminDto(profile);
    }

    @Transactional
    public com.mrk.training.dto.ClientDto createLegacy(ClientRequest req) {
        ClientCreateRequest create = new ClientCreateRequest(
                req.getName(),
                req.getUsername(),
                req.getEmail(),
                req.getPassword(),
                1,
                req.getHeightFt(),
                req.getWeightKg());
        AdminClientProfileResponse admin = create(create);
        com.mrk.training.dto.ClientDto dto = new com.mrk.training.dto.ClientDto();
        dto.setId(admin.id());
        dto.setName(admin.name());
        dto.setUsername(admin.username());
        dto.setHeightFt(admin.heightFt());
        dto.setWeightKg(admin.weightKg());
        return dto;
    }

    public List<AdminClientProfileResponse> listAllAdmin() {
        return clientRepo.findAll().stream().map(this::toAdminDto).collect(Collectors.toList());
    }

    public AdminClientProfileResponse getAdmin(Long id) {
        return toAdminDto(clientRepo.findById(id).orElseThrow(() -> new IllegalArgumentException("Client not found.")));
    }

    public ClientProfileResponse getMe(Long userId) {
        User user = userRepo.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found."));
        ClientProfile profile = clientRepo.findByUsername(user.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Client not found."));
        return toClientDto(profile);
    }

    @Transactional
    public ClientProfileResponse updateMe(Long userId, ClientUpdateRequest req) {
        User user = userRepo.findById(userId).orElseThrow();
        ClientProfile profile = clientRepo.findByUsername(user.getUsername()).orElseThrow();
        if (req.heightFt() != null) profile.setHeightFt(req.heightFt());
        if (req.weightKg() != null) profile.setWeightKg(req.weightKg());
        if (req.dateOfBirth() != null) profile.setDateOfBirth(req.dateOfBirth());
        if (req.profilePicture() != null) profile.setProfilePicture(req.profilePicture());
        if (req.email() != null) profile.setEmail(req.email());
        return toClientDto(clientRepo.save(profile));
    }

    @Transactional
    public void updateTrainingsAllowance(Long id, int allowance) {
        ClientProfile profile = clientRepo.findById(id).orElseThrow();
        profile.setAllowedNumOfTrainings(allowance);
        clientRepo.save(profile);
    }

    @Transactional
    public void deactivate(Long id) {
        ClientProfile profile = clientRepo.findById(id).orElseThrow();
        User user = userRepo.findByUsername(profile.getUsername()).orElseThrow();
        user.setActive(false);
        userRepo.save(user);
        slotRepository.findFiltered(id, null, null, ScheduleStatus.PENDING, null, null)
                .forEach(s -> {
                    s.setStatus(ScheduleStatus.CANCELLED);
                    slotRepository.save(s);
                });
    }

    @Transactional
    public void activate(Long id) {
        ClientProfile profile = clientRepo.findById(id).orElseThrow();
        User user = userRepo.findByUsername(profile.getUsername()).orElseThrow();
        user.setActive(true);
        userRepo.save(user);
    }

    @Transactional
    public void resetPassword(Long id, String newPassword) {
        ClientProfile profile = clientRepo.findById(id).orElseThrow();
        User user = userRepo.findByUsername(profile.getUsername()).orElseThrow();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepo.save(user);
    }

    @Transactional
    public void changePassword(Long userId, String currentPassword, String newPassword) {
        User user = userRepo.findById(userId).orElseThrow();
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is incorrect.");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepo.save(user);
    }

    private AdminClientProfileResponse toAdminDto(ClientProfile p) {
        User user = p.getUser();
        if (user == null) {
            user = userRepo.findByUsername(p.getUsername()).orElse(null);
        }
        return new AdminClientProfileResponse(
                p.getId(),
                p.getName(),
                p.getUsername(),
                p.getEmail(),
                p.getAllowedNumOfTrainings(),
                user != null && user.isActive(),
                p.getHeightFt(),
                p.getWeightKg(),
                p.getDateOfBirth(),
                p.getProfilePicture());
    }

    private ClientProfileResponse toClientDto(ClientProfile p) {
        return new ClientProfileResponse(
                p.getId(),
                p.getName(),
                p.getUsername(),
                p.getEmail(),
                p.getHeightFt(),
                p.getWeightKg(),
                p.getDateOfBirth(),
                p.getProfilePicture());
    }
}
