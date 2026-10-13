package com.usama.internProject.contruller;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.usama.internProject.model.clsLoginEvent;
import com.usama.internProject.model.clsSignUp;
import com.usama.internProject.repository.clsLoginEventRepository;
import com.usama.internProject.repository.clsLoginRepository;

@RestController
public class clsAuthContruller {

    // ---- OTP settings ----
    private static final int OTP_VALID_MINUTES = 5;     // code lifetime
    private static final int OTP_MAX_ATTEMPTS  = 5;     // wrong guesses allowed
    private static final int OTP_RESEND_SECONDS = 30;   // wait before a new code can be sent

    @Autowired
    private clsLoginRepository _LoginRepository;

    // one row per successful login (used for the login-activity chart)
    @Autowired
    private clsLoginEventRepository _LoginEventRepository;

    private final BCryptPasswordEncoder _Encoder = new BCryptPasswordEncoder();
    private final SecureRandom _Random = new SecureRandom();

    // null when mail is not configured, so the app still starts
    @Autowired(required = false)
    private JavaMailSender _MailSender;

    // "From" address: app.mail.from if set, otherwise spring.mail.username
    @Value("${app.mail.from:${spring.mail.username:}}")
    private String mailFrom;

    // where the reset link points to (your React app)
    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    // ---------------- SIGN UP ----------------
    @PostMapping("/signup")
    public ResponseEntity<?> signUp(@RequestBody clsSignUp account) {

        String fullName = account.getFullName() == null ? "" : account.getFullName().trim();
        String username = account.getUsername() == null ? "" : account.getUsername().trim();
        String email    = account.getEmail()    == null ? "" : account.getEmail().trim();
        String password = account.getPassword() == null ? "" : account.getPassword();

        if (fullName.isEmpty())
            return ResponseEntity.badRequest().body("Full name is required");

        // no "@" allowed, so a username can never be mistaken for an email at login
        if (!username.matches("^[A-Za-z0-9._-]{3,30}$"))
            return ResponseEntity.badRequest()
                    .body("Username must be 3-30 characters (letters, numbers, . _ -)");

        if (!email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$"))
            return ResponseEntity.badRequest().body("Enter a valid email address");

        if (password.length() < 6)
            return ResponseEntity.badRequest().body("Password must be at least 6 characters");

        if (_LoginRepository.existsByUsernameIgnoreCase(username))
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Username " + username + " already exists!");

        if (_LoginRepository.existsByEmailIgnoreCase(email))
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Email " + email + " already exists!");

        clsSignUp newAccount = new clsSignUp();
        newAccount.setFullName(fullName);
        newAccount.setUsername(username);
        newAccount.setEmail(email);
        newAccount.setPassword(_Encoder.encode(password));   // hashed

        return ResponseEntity.status(HttpStatus.CREATED).body(_LoginRepository.save(newAccount));
    }

    // =====================================================
    //  LOG IN  (step 1 of 2: password, then an emailed code)
    // =====================================================
    @PostMapping("/login")
    public ResponseEntity<?> logIn(@RequestBody Map<String, String> body) {

        String id = body.get("username") == null ? "" : body.get("username").trim();
        String password = body.get("password") == null ? "" : body.get("password");

        if (id.isEmpty() || password.isEmpty())
            return ResponseEntity.badRequest().body("Username and password are required");

        Optional<clsSignUp> found =
                _LoginRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase(id, id);

        if (found.isEmpty() || !_Encoder.matches(password, found.get().getPassword()))
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid username or password");

        clsSignUp account = found.get();

        // password is correct -> email a 6-digit code; the user is NOT logged in yet
        issueOtp(account);

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("otpRequired", true);
        res.put("username", account.getUsername());
        res.put("email", maskEmail(account.getEmail()));
        res.put("expiresInMinutes", OTP_VALID_MINUTES);
        return ResponseEntity.ok(res);
    }

    // ---------------- LOG IN (step 2 of 2: verify the code) ----------------
    @PostMapping("/login/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> body) {

        String id  = body.get("username") == null ? "" : body.get("username").trim();
        String otp = body.get("otp") == null ? "" : body.get("otp").trim();

        if (id.isEmpty() || !otp.matches("\\d{6}"))
            return ResponseEntity.badRequest().body("Enter the 6-digit code");

        Optional<clsSignUp> found =
                _LoginRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase(id, id);

        if (found.isEmpty() || found.get().getOtpHash() == null)
            return ResponseEntity.badRequest().body("No active code. Please log in again.");

        clsSignUp account = found.get();

        if (account.getOtpExpiry() == null || account.getOtpExpiry().isBefore(LocalDateTime.now()))
            return ResponseEntity.badRequest().body("This code has expired. Tap \"Resend code\" to get a new one.");

        int attempts = account.getOtpAttempts() == null ? 0 : account.getOtpAttempts();

        if (attempts >= OTP_MAX_ATTEMPTS) {
            clearOtp(account);
            _LoginRepository.save(account);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body("Too many wrong attempts. Please log in again.");
        }

        boolean ok = MessageDigest.isEqual(
                sha256(otp).getBytes(StandardCharsets.UTF_8),
                account.getOtpHash().getBytes(StandardCharsets.UTF_8));

        if (!ok) {
            attempts++;
            account.setOtpAttempts(attempts);

            if (attempts >= OTP_MAX_ATTEMPTS) {
                clearOtp(account);
                _LoginRepository.save(account);
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                        .body("Too many wrong attempts. Please log in again.");
            }

            _LoginRepository.save(account);
            int left = OTP_MAX_ATTEMPTS - attempts;
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Incorrect code. " + left + " attempt" + (left == 1 ? "" : "s") + " left.");
        }

        // correct code: one use only
        clearOtp(account);
        _LoginRepository.save(account);

        // record this successful login (feeds the login-activity chart)
        _LoginEventRepository.save(new clsLoginEvent(account.getId(), LocalDateTime.now()));

        return ResponseEntity.ok(account);   // password and OTP fields are never included
    }

    // ---------------- RESEND CODE ----------------
    @PostMapping("/login/resend-otp")
    public ResponseEntity<?> resendOtp(@RequestBody Map<String, String> body) {

        String id = body.get("username") == null ? "" : body.get("username").trim();

        Optional<clsSignUp> found = id.isEmpty()
                ? Optional.empty()
                : _LoginRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase(id, id);

        // only works for someone who already passed the password step
        if (found.isEmpty() || found.get().getOtpHash() == null)
            return ResponseEntity.badRequest().body("Please log in again.");

        clsSignUp account = found.get();

        // cooldown: a code was sent at (expiry - lifetime)
        if (account.getOtpExpiry() != null) {
            LocalDateTime sentAt = account.getOtpExpiry().minusMinutes(OTP_VALID_MINUTES);
            if (LocalDateTime.now().isBefore(sentAt.plusSeconds(OTP_RESEND_SECONDS)))
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                        .body("Please wait a few seconds before requesting another code.");
        }

        issueOtp(account);
        return ResponseEntity.ok("A new code has been sent.");
    }

    // ---------------- LOGIN ACTIVITY (by day of week) ----------------
    @GetMapping("/login-activity")
    public List<Map<String, Object>> loginActivity() {
        int[] counts = new int[7];   // index 0 = Monday ... 6 = Sunday

        for (clsLoginEvent e : _LoginEventRepository.findAll()) {
            if (e.getLoggedInAt() != null)
                counts[e.getLoggedInAt().getDayOfWeek().getValue() - 1]++;
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("day", DayOfWeek.of(i + 1).getDisplayName(TextStyle.FULL, Locale.ENGLISH));
            row.put("Logins", counts[i]);
            result.add(row);
        }
        return result;
    }

    // ---------------- FORGOT PASSWORD ----------------
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {

        String email = body.get("email") == null ? "" : body.get("email").trim();

        _LoginRepository.findByEmailIgnoreCase(email).ifPresentOrElse(account -> {
            byte[] bytes = new byte[32];
            new SecureRandom().nextBytes(bytes);
            String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

            // only the HASH of the token is stored
            account.setResetTokenHash(sha256(token));
            account.setResetTokenExpiry(LocalDateTime.now().plusMinutes(30));
            _LoginRepository.save(account);

            String link = frontendUrl + "/reset-password?token=" + token;

            if (_MailSender == null) {
                // mail not configured: dev fallback, link is printed here
                System.out.println("PASSWORD RESET LINK (mail not configured) for "
                        + account.getEmail() + " -> " + link);
                return;
            }

            try {
                sendResetEmail(account.getEmail(), link);
                System.out.println("Reset email sent to " + account.getEmail());
            } catch (MailException ex) {
                // the user still gets the generic answer; the real reason is logged here
                System.out.println("Could not send reset email: " + ex.getMessage());
                System.out.println("DEV fallback - reset link: " + link);   // remove before deploying
            }
        }, () -> System.out.println("Forgot password: no account found for '" + email + "'"));

        // Same answer whether or not the email exists (so nobody can probe for accounts)
        return ResponseEntity.ok("If an account with that email exists, a reset link has been sent.");
    }

    // ---------------- RESET PASSWORD ----------------
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {

        String token = body.get("token") == null ? "" : body.get("token").trim();
        String newPassword = body.get("newPassword") == null ? "" : body.get("newPassword");

        if (newPassword.length() < 6)
            return ResponseEntity.badRequest().body("Password must be at least 6 characters");

        Optional<clsSignUp> found = token.isEmpty()
                ? Optional.empty()
                : _LoginRepository.findByResetTokenHash(sha256(token));

        if (found.isEmpty()
                || found.get().getResetTokenExpiry() == null
                || found.get().getResetTokenExpiry().isBefore(LocalDateTime.now()))
            return ResponseEntity.badRequest().body("This reset link is invalid or has expired");

        clsSignUp account = found.get();
        account.setPassword(_Encoder.encode(newPassword));
        account.setResetTokenHash(null);          // one use only
        account.setResetTokenExpiry(null);
        _LoginRepository.save(account);

        return ResponseEntity.ok("Password updated");
    }

    // ---------------- LoadLoginUsers ----------------
    @GetMapping("/LoginUser")
    List<clsSignUp> getAllLogInUser() {
        return _LoginRepository.findAll();
    }

    // ---------------- helpers ----------------

    // creates a new 6-digit code, stores only its hash, and emails it
    private void issueOtp(clsSignUp account) {
        String otp = String.format("%06d", _Random.nextInt(1_000_000));

        account.setOtpHash(sha256(otp));
        account.setOtpExpiry(LocalDateTime.now().plusMinutes(OTP_VALID_MINUTES));
        account.setOtpAttempts(0);
        _LoginRepository.save(account);

        if (_MailSender == null) {
            // mail not configured: dev fallback, code is printed here
            System.out.println("LOGIN CODE (mail not configured) for " + account.getEmail() + " -> " + otp);
            return;
        }

        try {
            sendOtpEmail(account.getEmail(), otp);
            System.out.println("Login code sent to " + account.getEmail());
        } catch (MailException ex) {
            System.out.println("Could not send login code: " + ex.getMessage());
            System.out.println("DEV fallback - login code: " + otp);   // remove before deploying
        }
    }

    private void clearOtp(clsSignUp account) {
        account.setOtpHash(null);
        account.setOtpExpiry(null);
        account.setOtpAttempts(0);
    }

    // osama@gmail.com -> o****@gmail.com
    private static String maskEmail(String email) {
        if (email == null) return "";
        int at = email.indexOf('@');
        if (at <= 1) return email;
        return email.charAt(0) + "*".repeat(Math.min(at - 1, 6)) + email.substring(at);
    }

    private void sendOtpEmail(String to, String otp) {
        SimpleMailMessage msg = new SimpleMailMessage();
        if (mailFrom != null && !mailFrom.isBlank()) msg.setFrom(mailFrom);
        msg.setTo(to);
        msg.setSubject("Your Manage Clients login code");
        msg.setText(
                "Hello,\n\n"
              + "Your login code is: " + otp + "\n\n"
              + "It is valid for " + OTP_VALID_MINUTES + " minutes. "
              + "Do not share this code with anyone.\n\n"
              + "If you did not try to sign in, you can ignore this email.");
        _MailSender.send(msg);
    }

    private void sendResetEmail(String to, String link) {
        SimpleMailMessage msg = new SimpleMailMessage();
        if (mailFrom != null && !mailFrom.isBlank()) msg.setFrom(mailFrom);
        msg.setTo(to);
        msg.setSubject("Reset your Manage Clients password");
        msg.setText(
                "Hello,\n\n"
              + "We received a request to reset your password.\n"
              + "Click the link below to choose a new password (valid for 30 minutes):\n\n"
              + link + "\n\n"
              + "If you did not ask for this, you can ignore this email.");
        _MailSender.send(msg);
    }

    private static String sha256(String value) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}