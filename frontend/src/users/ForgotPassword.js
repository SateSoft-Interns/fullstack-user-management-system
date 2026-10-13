import { API_URL } from '../config'
import React, { useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { MdMailOutline, MdArrowBack, MdSend } from "react-icons/md"
import AuthLayout, {
    AuthField, AuthMessage, AuthButton, AuthDivider,
    AUTH, accentLinkStyle, apiErrorText
} from '../components/AuthLayout'

export default function ForgotPassword() {
    const [email, setEmail] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState(null)

    const handleSubmit = async (ev) => {
        ev.preventDefault()

        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
            setError("Enter a valid email address")
            return
        }

        setLoading(true)
        setMessage(null)
        try {
            const res = await axios.post(API_URL + "/forgot-password", { email: email.trim() })
            // the server answers the same way whether or not the email exists
            setMessage({
                type: "success",
                text: typeof res.data === "string" && res.data
                    ? res.data
                    : "If an account with that email exists, a reset link has been sent."
            })
        } catch (err) {
            console.error(err)
            setMessage({ type: "error", text: apiErrorText(err) })
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthLayout subtitle="Reset your password">
            <p style={{ color: AUTH.muted, fontSize: 14, textAlign: 'left', marginTop: 0, marginBottom: 22 }}>
                Enter the email you signed up with and we'll send you a link to choose a new password.
            </p>

            <form onSubmit={handleSubmit} noValidate>
                <AuthField
                    id="email" label="Email" type="email" icon={<MdMailOutline size={20} />}
                    autoComplete="email" placeholder="you@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); setMessage(null) }}
                    error={error}
                />

                <AuthMessage message={message} />

                <AuthButton loading={loading} loadingText="Sending..." icon={<MdSend size={18} />}>
                    Send Reset Link
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