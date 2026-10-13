import { API_URL } from '../config'
import React, { useState } from 'react'
import { FaIdCard } from "react-icons/fa"
import { MdVisibility, MdVisibilityOff } from "react-icons/md"

// ---- shared dark theme for Login / Sign up / Forgot / Reset pages ----
export const AUTH = {
 page: '#f1f5f9',
    card: '#ffff',
    border: '#374151',
    text: '#1c448e',
    muted: '#9ca3af',
    input: '#e8f0fe',
    inputText: '#111827',
    icon: '#6b7280',
    link: '#1c448e',
    error: '#ff0000',
    orange: 'linear-gradient(135deg, blue, #2a61fa)'
}

const labelStyle = { display: 'block', textAlign: 'left', color: AUTH.text, fontSize: 13, fontWeight: 600, marginBottom: 8 }
const errorStyle = { color: AUTH.error, fontSize: 12, textAlign: 'left', marginTop: 6, wordBreak: 'break-word' }
const leftIcon = { position: 'absolute', left: 12, top: 0, height: 42, display: 'flex', alignItems: 'center', color: AUTH.icon }
const inputStyle = (hasError) => ({
    width: '100%', height: 42, borderRadius: 8,
    border: `1px solid ${hasError ? AUTH.error : '#cbd5e1'}`,
    background: AUTH.input, color: AUTH.inputText,
    padding: '0 42px 0 42px', fontSize: 14, outline: 'none'
})

export const linkStyle = { color: AUTH.link, fontSize: 14, fontWeight: 600, textDecoration: 'none' }
export const accentLinkStyle = { color: '#1c448e', fontWeight: 700, textDecoration: 'none' }

/* Full-screen page + logo + title + card.
   maxWidth: card width. Defaults to 448 so Login / Forgot / Reset stay unchanged.
   The Sign up page passes a larger value. */
export default function AuthLayout({ title = "Manage Client", subtitle, maxWidth = 448, children }) {
    return (
        <div style={{
            position: 'fixed', inset: 0, overflowY: 'auto', overflowX: 'hidden', background: AUTH.page,
            display: 'flex', justifyContent: 'center', padding: '56px 16px', zIndex: 2000
        }}>

            <style>{`
                .auth-input { box-sizing: border-box; }
                .auth-input:focus { border-color: #2e0bf5 !important; box-shadow: 0 0 0 3px rgba(7, 3, 238, 0.25); }
                .auth-input::placeholder { color: #94a3b8; }
                .auth-btn:hover:not(:disabled) { filter: brightness(1.08); }
                /* keep columns from overflowing the card on narrow screens */
                .auth-fields-row > * { min-width: 0; }
            `}</style>

            <div style={{ width: '100%', maxWidth, margin: 'auto 0' }}>
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: '50%', background: AUTH.orange,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', boxShadow: '0 8px 24px rgba(17, 0, 255, 0.35)'
                    }}>
                        <FaIdCard size={30} />
                    </div>
                    <h1 style={{ color: '#2c51f5', fontWeight: 800, fontSize: 32, margin: '22px 0 6px' }}>{title}</h1>
                    {subtitle && <p style={{ color: AUTH.muted, fontSize: 14, margin: 0 }}>{subtitle}</p>}
                </div>

                <div style={{ background: AUTH.card, borderRadius: 10, padding: 32, boxShadow: '0 10px 40px rgba(0,0,0,.35)' }}>
                    {children}
                </div>
            </div>
        </div>
    )
}

/* Label + icon + input (+ show/hide eye when password) + error text */
export function AuthField({ id, label, icon, type = "text", password = false, error, ...rest }) {
    const [show, setShow] = useState(false)
    const inputType = password ? (show ? "text" : "password") : type

    return (
        <div style={{ marginBottom: 20 }}>
            <label htmlFor={id} style={labelStyle}>{label}</label>
            <div style={{ position: 'relative' }}>
                <span style={leftIcon}>{icon}</span>
                <input
                    id={id} name={id} type={inputType}
                    className="auth-input" style={inputStyle(error)}
                    {...rest}
                />
                {password && (
                    <button
                        type="button"
                        onClick={() => setShow(!show)}
                        aria-label={show ? "Hide password" : "Show password"}
                        style={{
                            position: 'absolute', right: 6, top: 0, height: 42, width: 36,
                            border: 0, background: 'transparent', color: AUTH.icon,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                        }}
                    >
                        {show ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                    </button>
                )}
            </div>
            {error && <div style={errorStyle}>{error}</div>}
        </div>
    )
}

/* error | info | success box */
export function AuthMessage({ message }) {
    if (!message) return null
    const palette = {
        error: { bg: 'rgba(248,113,113,.12)', color: AUTH.error, border: 'rgba(248,113,113,.35)' },
        info: { bg: 'rgba(59,130,246,.12)', color: '#93c5fd', border: 'rgba(59,130,246,.35)' },
        success: { bg: 'rgba(34,197,94,.12)', color: '#86efac', border: 'rgba(34,197,94,.35)' }
    }[message.type] || {}

    return (
        <div style={{
            marginBottom: 18, padding: '10px 14px', borderRadius: 8, fontSize: 13, textAlign: 'left',
            background: palette.bg, color: palette.color, border: `1px solid ${palette.border}`
        }}>
            {message.text}
        </div>
    )
}

/* orange submit button */
export function AuthButton({ loading, loadingText, icon, children }) {
    return (
        <button
            type="submit" disabled={loading} className="auth-btn"
            style={{
                width: '100%', height: 42, border: 0, borderRadius: 8, background: AUTH.orange,
                color: '#fff', fontWeight: 700, fontSize: 14, cursor: loading ? 'default' : 'pointer',
                opacity: loading ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}
        >
            {icon} {loading ? loadingText : children}
        </button>
    )
}

export function AuthDivider() {
    return <div style={{ borderTop: `1px solid #013699`, margin: '24px 0'}} />
}

/* turns an axios error into a readable sentence */
export const apiErrorText = (err, fallback = "Something went wrong. Please try again.") => {
    if (!err.response) return `Cannot reach the server at ${API_URL}. Is the backend running?`
    const data = err.response.data
    if (typeof data === 'string' && data.trim()) return data
    return data?.message || fallback
}