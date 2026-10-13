package com.usama.internProject.contruller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import com.usama.internProject.Exaption.clsError;
import com.usama.internProject.model.clsHistory;
import com.usama.internProject.model.clsUser;
import com.usama.internProject.repository.clsHistoryRepository;
import com.usama.internProject.repository.clsUserRepository;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class clsUserContruller {

    @Autowired
    private clsUserRepository _UserRepository;

    @Autowired
    private clsHistoryRepository _HistoryRepository;

    // ---------------- CREATE ----------------
    @PostMapping("/user")
    @ResponseStatus(code = HttpStatus.CREATED)
    clsUser CreateNewUser(
            @RequestBody clsUser newUser,
            @RequestParam(required = false, defaultValue = "Unknown") String addedBy) {
        newUser.setAddedBy(addedBy);
        return _UserRepository.save(newUser);
    }

    // ---------------- READ ALL ----------------
    @GetMapping("/users")
    List<clsUser> getAllUsers() {
        return _UserRepository.findAll();
    }

    // ---------------- READ ONE ----------------
    @GetMapping("/find/{id}")
    public clsUser getUserById(@PathVariable Long id) {
        return _UserRepository.findById(id).orElseThrow(() -> new clsError(id));
    }

    // ---------------- UPDATE ----------------
    @PutMapping("/update/{id}")
    public clsUser UpdateUser(@RequestBody clsUser NewUser, @PathVariable Long id) {
        return _UserRepository.findById(id).map(user -> {
            user.setName(NewUser.getName());
            user.setUsername(NewUser.getUsername());
            user.setEmail(NewUser.getEmail());
            user.setGender(NewUser.getGender());
            user.setPhone(NewUser.getPhone());
            user.setNetwork(NewUser.getNetwork());
            return _UserRepository.save(user);
        }).orElseThrow(() -> new clsError(id));
    }

    // ---------------- DELETE (logs to history) ----------------
    @DeleteMapping("/delete/{id}")
    public String DeleteById(
            @PathVariable long id,
            @RequestParam(required = false, defaultValue = "No reason given") String reason,
            @RequestParam(required = false, defaultValue = "Unknown") String deletedBy) {

        clsUser u = _UserRepository.findById(id).orElseThrow(() -> new clsError(id));

        // 1. Archive the user into history
        clsHistory h = new clsHistory();
        h.setOriginalId(u.getId());
        h.setName(u.getName());
        h.setUsername(u.getUsername());
        h.setEmail(u.getEmail());
        h.setGender(u.getGender());
        h.setPhone(u.getPhone());
        h.setNetwork(u.getNetwork());
        h.setReason(reason);
        h.setDeletedBy(deletedBy);
        h.setAddedBy(u.getAddedBy());        // keep who originally added the client
        _HistoryRepository.save(h);

        // 2. Remove from student
        _UserRepository.deleteById(id);

        return "User With Id " + id + " Have been Deleted Successfully.";
    }

    // =====================================================
    //  HISTORY ENDPOINTS
    // =====================================================

    // GET all deleted users, newest first
    @GetMapping("/history")
    public List<clsHistory> getHistory() {
        return _HistoryRepository.findAll(Sort.by(Sort.Direction.DESC, "deletedAt"));
    }

    // RESTORE a deleted user (puts back into student, marks history row as restored)
    @PostMapping("/restore/{archiveId}")
    public clsUser restoreUser(
            @PathVariable Long archiveId,
            @RequestParam(required = false, defaultValue = "Restored by admin") String remarks,
            @RequestParam(required = false, defaultValue = "Unknown") String restoredBy) {

        clsHistory h = _HistoryRepository.findById(archiveId)
                .orElseThrow(() -> new clsError(archiveId));

        Long originalId = h.getOriginalId();

        // Safety check: don't restore if that id is somehow taken
        if (_UserRepository.existsById(originalId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A user with id " + originalId + " already exists.");
        }

        _UserRepository.insertWithId(
                originalId, h.getName(), h.getUsername(), h.getEmail(),
                h.getGender(), h.getPhone(), h.getNetwork());

        // insertWithId does not copy "addedBy", so put it back here
        clsUser restored = _UserRepository.findById(originalId)
                .orElseThrow(() -> new clsError(originalId));
        restored.setAddedBy(h.getAddedBy());
        _UserRepository.save(restored);

        h.setRestored(true);
        h.setRestoredAt(java.time.LocalDateTime.now());
        h.setRestoreRemarks(remarks);
        h.setRestoredBy(restoredBy);
        _HistoryRepository.save(h);

        return _UserRepository.findById(originalId).orElseThrow(() -> new clsError(originalId));
    }

    // PERMANENTLY remove one history row
    @DeleteMapping("/history/{archiveId}")
    public String purgeOne(@PathVariable Long archiveId) {
        if (!_HistoryRepository.existsById(archiveId)) throw new clsError(archiveId);
        _HistoryRepository.deleteById(archiveId);
        return "History entry deleted.";
    }

    // CLEAR entire history
    @DeleteMapping("/history/all")
    public String purgeAll() {
        _HistoryRepository.deleteAll();
        return "History cleared.";
    }
}