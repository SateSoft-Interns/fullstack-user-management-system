import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { IoMdLogIn } from "react-icons/io"
import { MdPersonOutline, MdLockOutline } from "react-icons/md"
import AuthLayout, {
    AuthField, AuthMessage, AuthButton, AuthDivider,
    AUTH, linkStyle, accentLinkStyle, apiErrorText
} from '../components/AuthLayout'

export default function LogIn({ onLogin }) {
    const location = useLocation()

    const [form, setForm] = useState({ username: "", password: "", remember: false })
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)
    // success notice coming from Sign up / Reset password
    const [message, setMessage] = useState(
        location.state?.notice ? { type: "success", text: location.state.notice } : null
    )

    const onChange = (e) => {
        const { name, value, type, checked } = e.target
        setForm({ ...form, [name]: type === "checkbox" ? checked : value })
        if (errors[name]) setErrors({ ...errors, [name]: "" })
        if (message) setMessage(null)
    }

    const validate = () => {
        const e = {}
        if (!form.username.trim()) e.username = "Username or email is required"
        if (!form.password) e.password = "Password is required"
        return e
    }

    const handleSubmit = async (ev) => {
        ev.preventDefault()
        const e = validate()
        setErrors(e)
        if (Object.keys(e).length) return

        setLoading(true)
        setMessage(null)
        try {
            // App.js calls POST /login and switches to the main app on success
            await onLogin({
                username: form.username,
                password: form.password,
                remember: form.remember
            })
        } catch (err) {
            console.error(err)
            const text = err.response?.status === 401
                ? "Invalid username or password."
                : apiErrorText(err, "Login failed. Please try again.")
            setMessage({ type: "error", text })
            setLoading(false)
        }
    }

    return (
        <AuthLayout subtitle="Sign in to continue">
            <form onSubmit={handleSubmit} noValidate>

                <AuthField
                    id="username" label="Username" icon={<MdPersonOutline size={20} />}
                    autoComplete="username" placeholder="Username or email"
                    value={form.username} onChange={onChange} error={errors.username}
                />

                <AuthField
                    id="password" label="Password" icon={<MdLockOutline size={20} />} password
                    autoComplete="current-password" placeholder="Password"
                    value={form.password} onChange={onChange} error={errors.password}
                />

                {/* Remember me + Forgot password */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: AUTH.text, fontSize: 14, margin: 0, cursor: 'pointer' }}>
                        <input
                            type="checkbox" name="remember"
                            checked={form.remember} onChange={onChange}
                            style={{ width: 16, height: 16, cursor: 'pointer' }}
                        />
                        Remember me
                    </label>
                    <Link to="/forgot-password" style={linkStyle}>Forgot Password?</Link>
                </div>

                <AuthMessage message={message} />

                <AuthButton loading={loading} loadingText="Signing in..." icon={<IoMdLogIn size={20} />}>
                    Sign In
                </AuthButton>

                <AuthDivider />

                <p style={{ textAlign: 'center', color:'#6b7280', fontSize: 14, margin: 0 }}>
                    Don't have an account?{" "}
                    <Link to="/signup" style={accentLinkStyle}>Create account</Link>
                </p>
            </form>
        </AuthLayout>
    )
}