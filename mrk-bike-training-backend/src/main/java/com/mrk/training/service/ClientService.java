package com.mrk.training.service;

import com.mrk.training.dto.client.AdminClientProfileResponse;
import com.mrk.training.dto.client.ClientCreateRequest;
import com.mrk.training.dto.client.ClientProfileResponse;
import com.mrk.training.dto.client.ClientUpdateRequest;
import com.mrk.training.exception.DuplicateUniqueIdException;
import com.mrk.training.exception.DuplicateUsernameException;
import com.mrk.training.model.ClientProfile;
import com.mrk.training.model.Role;
import com.mrk.training.model.ScheduleStatus;
import com.mrk.training.model.User;
import com.mrk.training.repository.ClientRepository;
import com.mrk.training.repository.ScheduleSlotRepository;
import com.mrk.training.repository.UserRepository;
import com.mrk.training.web.request.ClientRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

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
        if (userRepo.existsByEmailUsername(req.emailUsername())) {
            throw new DuplicateUsernameException(req.emailUsername());
        }
        if (clientRepo.existsByUniqueId(req.uniqueId())) {
            throw new DuplicateUniqueIdException(req.uniqueId());
        }

        User user = new User();
        user.setEmailUsername(req.emailUsername());
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        user.setRole(Role.CLIENT);
        user.setActive(true);
        user = userRepo.save(user);

        ClientProfile profile = new ClientProfile();
        profile.setUser(user);
        profile.setName(req.name());
        profile.setUniqueId(req.uniqueId());
        profile.setAllowedNumOfTrainings(req.allowedNumOfTrainings());
        profile.setHeightCm(req.heightCm());
        profile.setWeightKg(req.weightKg());
        profile = clientRepo.save(profile);
        return toAdminDto(profile);
    }

    @Transactional
    public com.mrk.training.dto.ClientDto createLegacy(ClientRequest req) {
        ClientCreateRequest create = new ClientCreateRequest(
                req.getName(),
                req.getEmailUsername(),
                req.getEmailUsername(),
                req.getPasswordHash(),
                1,
                req.getHeightCm(),
                req.getWeightKg());
        AdminClientProfileResponse admin = create(create);
        com.mrk.training.dto.ClientDto dto = new com.mrk.training.dto.ClientDto();
        dto.setId(admin.id());
        dto.setName(admin.name());
        dto.setEmailUsername(admin.emailUsername());
        dto.setHeightCm(admin.heightCm());
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
        return toClientDto(clientRepo.findById(userId).orElseThrow(() -> new IllegalArgumentException("Client not found.")));
    }

    @Transactional
    public ClientProfileResponse updateMe(Long userId, ClientUpdateRequest req) {
        ClientProfile profile = clientRepo.findById(userId).orElseThrow();
        if (req.heightCm() != null) profile.setHeightCm(req.heightCm());
        if (req.weightKg() != null) profile.setWeightKg(req.weightKg());
        if (req.dateOfBirth() != null) profile.setDateOfBirth(req.dateOfBirth());
        if (req.profilePicture() != null) profile.setProfilePicture(req.profilePicture());
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
        profile.getUser().setActive(false);
        userRepo.save(profile.getUser());
        slotRepository.findFiltered(id, null, null, ScheduleStatus.PENDING, null, null)
                .forEach(s -> {
                    s.setStatus(ScheduleStatus.CANCELLED);
                    slotRepository.save(s);
                });
    }

    @Transactional
    public void resetPassword(Long id, String newPassword) {
        ClientProfile profile = clientRepo.findById(id).orElseThrow();
        profile.getUser().setPasswordHash(passwordEncoder.encode(newPassword));
        userRepo.save(profile.getUser());
    }

    @Transactional
    public void changePassword(Long userId, String currentPassword, String newPassword) {
        ClientProfile profile = clientRepo.findById(userId).orElseThrow();
        if (!passwordEncoder.matches(currentPassword, profile.getUser().getPasswordHash())) {
            throw new IllegalArgumentException("Current password is incorrect.");
        }
        profile.getUser().setPasswordHash(passwordEncoder.encode(newPassword));
        userRepo.save(profile.getUser());
    }

    private AdminClientProfileResponse toAdminDto(ClientProfile p) {
        return new AdminClientProfileResponse(
                p.getId(),
                p.getName(),
                p.getUser() != null ? p.getUser().getEmailUsername() : null,
                p.getUniqueId(),
                p.getAllowedNumOfTrainings(),
                p.getUser() != null && p.getUser().isActive(),
                p.getHeightCm(),
                p.getWeightKg(),
                p.getDateOfBirth(),
                p.getProfilePicture());
    }

    private ClientProfileResponse toClientDto(ClientProfile p) {
        return new ClientProfileResponse(
                p.getId(),
                p.getName(),
                p.getUser() != null ? p.getUser().getEmailUsername() : null,
                p.getHeightCm(),
                p.getWeightKg(),
                p.getDateOfBirth(),
                p.getProfilePicture());
    }
}
