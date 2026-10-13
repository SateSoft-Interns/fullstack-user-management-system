import React, { useState } from 'react'
import axios from 'axios'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { MdLockOutline, MdArrowBack, MdCheck } from "react-icons/md"
import AuthLayout, {
    AuthField, AuthMessage, AuthButton, AuthDivider,
    accentLinkStyle, apiErrorText
} from '../components/AuthLayout'
import { API_URL } from '../config'

// Opened from the reset link:  /reset-password?token=...
export default function ResetPassword() {
    const navigate = useNavigate()
    const [params] = useSearchParams()
    const token = params.get("token") || ""

    const [form, setForm] = useState({ password: "", confirm: "" })
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState(
        token ? null : { type: "error", text: "This reset link is missing its token. Please request a new one." }
    )

    const onChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
        if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: "" })
        if (message && token) setMessage(null)
    }

    const handleSubmit = async (ev) => {
        ev.preventDefault()

        const e = {}
        if (form.password.length < 6) e.password = "Password must be at least 6 characters"
        if (form.confirm !== form.password) e.confirm = "Passwords do not match"
        setErrors(e)
        if (Object.keys(e).length || !token) return

        setLoading(true)
        setMessage(null)
        try {
            await axios.post(`${API_URL}/reset-password`, {
                token,
                newPassword: form.password
            })
            navigate("/login", { state: { notice: "Password updated. You can now sign in." } })
        } catch (err) {
            console.error(err)
            setMessage({ type: "error", text: apiErrorText(err, "Could not reset the password.") })
            setLoading(false)
        }
    }

    return (
        <AuthLayout subtitle="Choose a new password">
            <form onSubmit={handleSubmit} noValidate>
                <AuthField
                    id="password" label="New Password" icon={<MdLockOutline size={20} />} password
                    autoComplete="new-password" placeholder="At least 6 characters"
                    value={form.password} onChange={onChange} error={errors.password}
                />

                <AuthField
                    id="confirm" label="Confirm New Password" icon={<MdLockOutline size={20} />} password
                    autoComplete="new-password" placeholder="Repeat your new password"
                    value={form.confirm} onChange={onChange} error={errors.confirm}
                />

                <AuthMessage message={message} />

                <AuthButton loading={loading} loadingText="Saving..." icon={<MdCheck size={18} />}>
                    Update Password
                </AuthButton>

                <AuthDivider />

                <p style={{ textAlign: 'center', margin: 0, fontSize: 14 }}>
                    <Link to="/login" style={{ ...accentLinkStyle, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <MdArrowBack size={18} /> Back to sign in
                    </Link>
                </p>
            </form>
        </AuthLayout>
    )
}