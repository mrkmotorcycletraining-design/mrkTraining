package com.mrk.training.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.mrk.training.model.ClientProfile;

@Repository
public interface ClientRepository extends JpaRepository<ClientProfile, Long> {

    boolean existsByUsername(String username);

    Optional<ClientProfile> findByUsername(String username);
}
