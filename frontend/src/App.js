import { API_URL } from './config'
import './App.css';
import "../node_modules/bootstrap/dist/css/bootstrap.min.css"
import { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from './layout/Navbar';
import Home from './pages/Home';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AddUser from './users/AddUser';
import EditUser from './users/EditUser';
import ViewUser from './users/ViewUser';
import RecentlyDeleted from './users/RecentlyDeleted';
import Graphs from './users/Graphs';
import LogIn from './users/LogIn';
import SignUp from './users/SignUp';
import ForgotPassword from './users/ForgotPassword';
import ResetPassword from './users/ResetPassword';
import VerifyOtp from './users/VerifyOtp';
import { getAuthUser, saveAuthUser, clearAuthUser } from './utils/auth';
import './utils/axiosAuth';   // sends "restoredBy" with every restore request
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Sidebar starts open on desktop/laptop, closed on tablet/mobile
const initialSidebarState = () =>
  typeof window !== 'undefined' && window.innerWidth >= 992;

function App() {
  // Single source of truth for the sidebar
  const [open, setOpen] = useState(initialSidebarState);

  // null = logged out. Restored from storage so a refresh keeps you signed in.
  const [user, setUser] = useState(getAuthUser);

  // Set after the password was correct and a code was emailed:
  // { username, email (masked), remember }. null = no code pending.
  const [pendingOtp, setPendingOtp] = useState(null);

  // Drives the layout: body.sidebar-is-open .main-content { margin-left: 207px }
  // Only while logged in (the auth pages have no sidebar).
  useEffect(() => {
    document.body.classList.toggle('sidebar-is-open', Boolean(user) && open);
    return () => document.body.classList.remove('sidebar-is-open');
  }, [open, user]);

  // STEP 1: Spring Boot checks the (hashed) password and emails a 6-digit code.
  // Errors are thrown so the LogIn page can show them.
  const handleLogin = async ({ username, password, remember }) => {
    const res = await axios.post(API_URL + "/login", {
      username: username.trim(),
      password
    });

    if (res.data?.otpRequired) {
      // not signed in yet -> show the "enter your code" screen
      setPendingOtp({
        username: res.data.username,
        email: res.data.email,
        remember: Boolean(remember)
      });
      return;
    }

    // (fallback) backend without OTP: sign in straight away
    saveAuthUser(res.data, remember);
    setUser(res.data);
  };

  // STEP 2: check the code; on success the account is saved and the user is signed in.
  // Errors are thrown so the VerifyOtp page can show them.
  const handleVerifyOtp = async (otp) => {
    const res = await axios.post(API_URL + "/login/verify-otp", {
      username: pendingOtp.username,
      otp
    });
    saveAuthUser(res.data, pendingOtp.remember);
    setUser(res.data);
    setPendingOtp(null);
  };

  const handleResendOtp = async () => {
    await axios.post(API_URL + "/login/resend-otp", {
      username: pendingOtp.username
    });
  };

  const handleLogout = () => {
    clearAuthUser();
    setUser(null);
    setPendingOtp(null);
  };

  return (
   
    <div className="App">

      <Router>
        {user ? (
          <>
            {/* ===== Logged in: sidebar + navbar + pages ===== */}
        
            <Navbar open={open} setOpen={setOpen} onLogout={handleLogout} />
            <main className="main-content">
              <Routes>
                <Route exact path="/" element={<Home />} />
                <Route exact path="/add" element={<AddUser />} />
                <Route exact path="/edit/:id" element={<EditUser />} />
                <Route exact path="/find/:id" element={<ViewUser />} />
                <Route exact path="/RecentlyDeleted/" element={<RecentlyDeleted />} />
                <Route exact path="/dashboard" element={<Graphs />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                {/* already signed in -> the auth pages are not needed */}
                <Route path="/login" element={<Navigate to="/" replace />} />
                <Route path="/signup" element={<Navigate to="/" replace />} />
                <Route path="/forgot-password" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </>
        ) : pendingOtp ? (
          /* ===== Password OK, waiting for the emailed code ===== */
          <VerifyOtp
            email={pendingOtp.email}
            onVerify={handleVerifyOtp}
            onResend={handleResendOtp}
            onCancel={() => setPendingOtp(null)}
          />
        ) : (
          /* ===== Logged out: ONLY the auth pages, no navbar / sidebar ===== */
          <Routes>
            <Route path="/login" element={<LogIn onLogin={handleLogin} />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        )}
      </Router>
    </div>
   
  );

}

export default App;