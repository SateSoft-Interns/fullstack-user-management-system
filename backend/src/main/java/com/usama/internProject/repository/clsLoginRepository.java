package com.usama.internProject.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.usama.internProject.model.clsSignUp;

public interface clsLoginRepository extends JpaRepository<clsSignUp, Long> {

    boolean existsByUsernameIgnoreCase(String username);

    boolean existsByEmailIgnoreCase(String email);

    Optional<clsSignUp> findByUsernameIgnoreCaseOrEmailIgnoreCase(String username, String email);

    // NEW: used by /forgot-password
    Optional<clsSignUp> findByEmailIgnoreCase(String email);

    // NEW: used by /reset-password
    Optional<clsSignUp> findByResetTokenHash(String resetTokenHash);
}