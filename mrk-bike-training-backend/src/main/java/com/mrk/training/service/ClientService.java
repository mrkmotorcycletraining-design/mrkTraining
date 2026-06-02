package com.mrk.training.service;

import com.mrk.training.dto.ClientDto;
import com.mrk.training.model.ClientProfile;
import com.mrk.training.model.Role;
import com.mrk.training.model.User;
import com.mrk.training.repository.ClientRepository;
import com.mrk.training.repository.UserRepository;
import com.mrk.training.web.request.ClientRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ClientService {

    private final ClientRepository clientRepo;
    private final UserRepository userRepo;

    public ClientService(ClientRepository clientRepo, UserRepository userRepo) {
        this.clientRepo = clientRepo;
        this.userRepo = userRepo;
    }

    @Transactional
    public ClientDto create(ClientRequest req) {
        if (userRepo.existsByEmailUsername(req.getEmailUsername())) {
            throw new IllegalArgumentException("Email '" + req.getEmailUsername() + "' is already registered.");
        }

        User user = new User();
        user.setEmailUsername(req.getEmailUsername());
        // In production, hash the password with BCrypt here
        user.setPasswordHash(req.getPasswordHash());
        user.setRole(Role.CLIENT);
        user.setActive(true);
        user = userRepo.save(user);

        ClientProfile profile = new ClientProfile();
        profile.setUser(user);
        profile.setId(user.getId());
        profile.setName(req.getName());
        profile.setHeightCm(req.getHeightCm());
        profile.setWeightKg(req.getWeightKg());
        profile = clientRepo.save(profile);

        return toDto(profile);
    }

    public List<ClientDto> listAll() {
        return clientRepo.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    private ClientDto toDto(ClientProfile p) {
        ClientDto dto = new ClientDto();
        dto.setId(p.getId());
        dto.setName(p.getName());
        dto.setEmailUsername(p.getUser() != null ? p.getUser().getEmailUsername() : null);
        dto.setHeightCm(p.getHeightCm());
        dto.setWeightKg(p.getWeightKg());
        return dto;
    }
}
