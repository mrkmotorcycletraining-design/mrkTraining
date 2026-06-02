package com.mrk.training.repository;

import com.mrk.training.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    boolean existsByEmailUsername(String emailUsername);

    Optional<User> findByEmailUsername(String emailUsername);
}
