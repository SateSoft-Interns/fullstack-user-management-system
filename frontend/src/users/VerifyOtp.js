import React, { useEffect, useState } from 'react'
import { MdOutlineMarkEmailRead, MdPassword } from "react-icons/md"
import { FaCheckCircle } from "react-icons/fa"
import AuthLayout, {
    AuthField, AuthMessage, AuthButton, AuthDivider,
    accentLinkStyle, apiErrorText
} from '../components/AuthLayout'

import { MdOutlineVerifiedUser } from "react-icons/md";
const RESEND_SECONDS = 30

/*
  Props
    email     masked email to show, e.g. "o****@gmail.com"
    onVerify  async (code) => void    -> throws on a wrong code
    onResend  async () => void        -> throws if it can't resend
    onCancel  () => void              -> back to the login form
*/
export default function VerifyOtp({ email, onVerify, onResend, onCancel }) {
    const [code, setCode] = useState("")
    const [error, setError] = useState("")
    const [message, setMessage] = useState(null)
    const [loading, setLoading] = useState(false)
    const [wait, setWait] = useState(RESEND_SECONDS)

    // resend cooldown timer
    useEffect(() => {
        if (wait <= 0) return
        const t = setTimeout(() => setWait(w => w - 1), 1000)
        return () => clearTimeout(t)
    }, [wait])

    const onChange = (e) => {
        // digits only, max 6
        setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
        if (error) setError("")
        if (message) setMessage(null)
    }

    const handleSubmit = async (ev) => {
        ev.preventDefault()
        if (code.length !== 6) {
            setError("Enter the 6-digit code")
            return
        }
        setLoading(true)
        setMessage(null)
        try {
            await onVerify(code)          // on success App switches to the logged-in pages
        } catch (err) {
            setError(apiErrorText(err, "Could not verify the code."))
            setLoading(false)
        }
    }

    const handleResend = async () => {
        if (wait > 0) return
        setError("")
        setMessage(null)
        try {
            await onResend()
            setCode("")
            setWait(RESEND_SECONDS)
            setMessage({ type: "success", text: "A new code has been sent to your email." })
        } catch (err) {
            setMessage({ type: "error", text: apiErrorText(err, "Could not resend the code.") })
        }
    }

    return (
        <AuthLayout title="Verify your email" subtitle={`We sent a 6-digit code to ${email}`}>
            <form onSubmit={handleSubmit} noValidate>

                <AuthField
                    id="otp" label="Verification Code" icon={<MdOutlineVerifiedUser size={20} />}
                    inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                    // placeholder="______" autoFocus
                    value={code} onChange={onChange} error={error}
                />

                <AuthMessage message={message} />

                <AuthButton loading={loading} loadingText="Verifying..." icon={<FaCheckCircle size={16} />}>
                    Verify &amp; Sign In
                </AuthButton>

                <AuthDivider />
                {/* <div style={{ borderTop: `1px solid transparent`, margin: '24px 0'}} /> */}

                <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 14, margin: '0 0 10px' }}>
                    Didn&apos;t get the code?{" "}
                    {wait > 0 ? (
                        <span style={{ opacity: 0.8, color: 'blue' }}>Resend in {wait}s</span>
                    ) : (
                        <button
                            type="button" onClick={handleResend}
                            style={{ ...accentLinkStyle, background: 'none', border: 0, padding: 0, cursor: 'pointer' }}
                        >
                            {/* <MdOutlineMarkEmailRead size={16} style={{ marginRight: 4 }} /> */}
                            Resend code
                        </button>
                    )}
                </p>

                <p style={{ textAlign: 'center', margin: 0 }}>
                    <button
                        type="button" onClick={onCancel}
                        style={{ ...accentLinkStyle, background: 'none', border: 0, padding: 0, cursor: 'pointer' }}
                    >
                        Back to Sign in
                        {/* Sign In */}
                    </button>
                </p>
            </form>
        </AuthLayout>
    )
}