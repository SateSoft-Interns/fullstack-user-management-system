package com.usama.internProject.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.usama.internProject.model.clsUser;

public interface clsUserRepository extends JpaRepository<clsUser, Long> {

    // Search by email
    List<clsUser> findByEmail(String email);

    // Search by name
    List<clsUser> findByName(String name);

    // Complex queries
    List<clsUser> findByNameContainingIgnoreCase(String name);

    // Restore a user with their ORIGINAL id
    @Modifying
    @Transactional
    @Query(value = """
        INSERT INTO users (id, name, username, email, gender, phone, network, created_at)
        VALUES (:id, :name, :username, :email, :gender, :phone, :network, CURRENT_TIMESTAMP)
        """, nativeQuery = true)
    void insertWithId(@Param("id") Long id,
                      @Param("name") String name,
                      @Param("username") String username,
                      @Param("email") String email,
                      @Param("gender") String gender,
                      @Param("phone") String phone,
                      @Param("network") String network);
}