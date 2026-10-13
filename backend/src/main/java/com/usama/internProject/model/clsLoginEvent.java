package com.usama.internProject.model;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;      // use javax.persistence.* if you're on Spring Boot 2
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class clsLoginEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long accountId;
    private LocalDateTime loggedInAt;

    public clsLoginEvent() {}

    public clsLoginEvent(Long accountId, LocalDateTime loggedInAt) {
        this.accountId = accountId;
        this.loggedInAt = loggedInAt;
    }

    public Long getId() { return id; }
    public Long getAccountId() { return accountId; }
    public LocalDateTime getLoggedInAt() { return loggedInAt; }
}