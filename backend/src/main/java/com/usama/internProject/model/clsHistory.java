package com.usama.internProject.model;
import jakarta.persistence.GenerationType;
import java.time.Duration;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "deleted_user_history")
public class clsHistory {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private long id;

	private long originalId;
	private String name;
	private String username;
	private String email;
	private String gender;
	private String phone;
	private String network;

	private String reason; // why they were deleted
	private String deletedBy; // who deleted them
	private LocalDateTime deletedAt; // when deleted // when deleted

	// 👇 NEW — restore tracking
	private boolean restored = false;
	private LocalDateTime restoredAt;
	private String restoreRemarks;

	private String restoredBy; // who restored them
	private String addedBy;      // who originally added this client

	
	@PrePersist
	protected void onCreate() {
		this.deletedAt = LocalDateTime.now();
	}

	// ---------- Getter: computed duration ----------
	@JsonProperty("restoreDuration")
	public String getRestoreDuration() {
		if (deletedAt == null || restoredAt == null)
			return null;

		long seconds = Duration.between(deletedAt, restoredAt).getSeconds();
		long days = seconds / 86400;
		long hours = (seconds % 86400) / 3600;
		long minutes = (seconds % 3600) / 60;
		long secs = seconds % 60;

		StringBuilder sb = new StringBuilder();
		if (days > 0)
			sb.append(days).append("d ");
		if (hours > 0)
			sb.append(hours).append("h ");
		if (minutes > 0)
			sb.append(minutes).append("m ");
		if (secs > 0 && days == 0)
			sb.append(secs).append("s");

		return sb.length() == 0 ? "0s" : sb.toString().trim();
	}

	// ---------- Getters / Setters ----------

	public long getId() {
		return id;
	}

	public long getOriginalId() {
		return originalId;
	}

	public void setOriginalId(long originalId) {
		this.originalId = originalId;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getUsername() {
		return username;
	}

	public void setUsername(String username) {
		this.username = username;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getGender() {
		return gender;
	}

	public void setGender(String gender) {
		this.gender = gender;
	}

	public String getPhone() {
		return phone;
	}

	public void setPhone(String phone) {
		this.phone = phone;
	}

	public String getNetwork() {
		return network;
	}

	public void setNetwork(String network) {
		this.network = network;
	}

	public String getReason() {
		return reason;
	}

	public void setReason(String reason) {
		this.reason = reason;
	}

	public LocalDateTime getDeletedAt() {
		return deletedAt;
	}

	public void setDeletedAt(LocalDateTime deletedAt) {
		this.deletedAt = deletedAt;
	}

	// 👇 NEW getters / setters
	public boolean isRestored() {
		return restored;
	}

	public void setRestored(boolean restored) {
		this.restored = restored;
	}

	public LocalDateTime getRestoredAt() {
		return restoredAt;
	}

	public void setRestoredAt(LocalDateTime restoredAt) {
		this.restoredAt = restoredAt;
	}

	public String getRestoreRemarks() {
		return restoreRemarks;
	}

	public void setRestoreRemarks(String restoreRemarks) {
		this.restoreRemarks = restoreRemarks;
	}

	public String getDeletedBy() {
		return deletedBy;
	}

	public void setDeletedBy(String deletedBy) {
		this.deletedBy = deletedBy;
	}

	public String getRestoredBy() {
		return restoredBy;
	}

	public void setRestoredBy(String restoredBy) {
		this.restoredBy = restoredBy;
	}
	public String getAddedBy() { return addedBy; }
	public void setAddedBy(String addedBy) { this.addedBy = addedBy; }
}