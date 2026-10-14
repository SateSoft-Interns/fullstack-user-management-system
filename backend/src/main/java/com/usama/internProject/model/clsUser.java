package com.usama.internProject.model;
import jakarta.persistence.GenerationType;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
@JsonPropertyOrder({
    "id", "name", "username", "email",
    "gender", "phone", "network", "createdAt"
})
public class clsUser {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
    private String username;
    private String name;
    private String email;

    // 👇 NEW fields
    private String gender;
    private String phone;
    private String network;

    private LocalDateTime createdAt;
    private String addedBy;      // who added this client

   
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // ----- Getters / Setters -----

    public Long getId() { return id; }

    
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    // 👇 NEW getters / setters
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getNetwork() { return network; }
    public void setNetwork(String network) { this.network = network; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getAddedBy() { return addedBy; }
    public void setAddedBy(String addedBy) { this.addedBy = addedBy; }
}