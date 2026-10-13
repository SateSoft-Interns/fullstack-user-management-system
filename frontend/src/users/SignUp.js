import { API_URL } from '../config'
import React, { useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import { FaRegIdCard, FaUserPlus } from "react-icons/fa"
import { MdPersonOutline, MdMailOutline, MdLockOutline } from "react-icons/md"
import AuthLayout, {
    AuthField, AuthMessage, AuthButton, AuthDivider,
    AUTH, accentLinkStyle, apiErrorText
} from '../components/AuthLayout'

export default function SignUp() {
    const navigate = useNavigate()

    const [form, setForm] = useState({
        fullName: "", username: "", email: "", password: "", confirm: ""
    })
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState(null)

    const onChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
        if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: "" })
        if (message) setMessage(null)
    }

    // same rules as the Spring Boot /signup endpoint
    const validate = () => {
        const e = {}
        if (!form.fullName.trim()) e.fullName = "Full name is required"
        if (!/^[A-Za-z0-9._-]{3,30}$/.test(form.username.trim()))
            e.username = "3-30 characters: letters, numbers, . _ -"
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim()))
            e.email = "Enter a valid email address"
        if (form.password.length < 6) e.password = "Password must be at least 6 characters"
        if (form.confirm !== form.password) e.confirm = "Passwords do not match"
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
            await axios.post(API_URL + "/signup", {
                fullName: form.fullName.trim(),
                username: form.username.trim(),
                email: form.email.trim(),
                password: form.password
            })
            navigate("/login", { state: { notice: "Account created. You can now sign in." } })
        } catch (err) {
            console.error(err)
            const text = apiErrorText(err, "Could not create the account.")
            // show duplicate errors under the matching field
            if (/username/i.test(text)) setErrors({ username: text })
            else if (/email/i.test(text)) setErrors({ email: text })
            else setMessage({ type: "error", text })
            setLoading(false)
        }
    }

    return (
        // wider card for Sign up only (other auth pages keep the default 448px)
        <AuthLayout subtitle="Create your account" maxWidth={650}>
            <form onSubmit={handleSubmit} noValidate>

                <AuthField
                    id="fullName" label="Full Name" icon={<FaRegIdCard size={17} />}
                    autoComplete="name" placeholder="Your full name"
                    value={form.fullName} onChange={onChange} error={errors.fullName}
                />

                <AuthField
                    id="username" label="Username" icon={<MdPersonOutline size={20} />}
                    autoComplete="username" placeholder="Choose a username"
                    value={form.username} onChange={onChange} error={errors.username}
                />

                <AuthField
                    id="email" label="Email" type="email" icon={<MdMailOutline size={20} />}
                    autoComplete="email" placeholder="you@example.com"
                    value={form.email} onChange={onChange} error={errors.email}
                />

                {/* Password + Confirm Password: side by side from 768px (md) up, stacked on phones */}
                <div className="row gx-3 auth-fields-row">
                    <div className="col-12 col-md-6">
                        <AuthField
                            id="password" label="Password" icon={<MdLockOutline size={20} />} password
                            autoComplete="new-password" placeholder="At least 6 characters"
                            value={form.password} onChange={onChange} error={errors.password}
                        />
                    </div>

                    <div className="col-12 col-md-6">
                        <AuthField
                            id="confirm" label="Confirm Password" icon={<MdLockOutline size={20} />} password
                            autoComplete="new-password" placeholder="Repeat your password"
                            value={form.confirm} onChange={onChange} error={errors.confirm}
                        />
                    </div>
                </div>

                <AuthMessage message={message} />
          
                <AuthButton loading={loading} loadingText="Creating account..." icon={<FaUserPlus size={16}  />}>
                    Create Account
                </AuthButton>
                {/* <div style={{ display: "flex", justifyContent: "center" }}>
                    <div style={{ width: "300px" }}>
                        <AuthButton
                            loading={loading}
                            loadingText="Creating account..."
                            icon={<FaUserPlus size={16} />}
                        >
                            Create Account
                        </AuthButton>
                    </div>
                </div> */}
                <AuthDivider />

                <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 14, margin: 0 }}>
                    Already have an account?{" "}
                    <Link to="/login" style={accentLinkStyle}>Sign in</Link>
                </p>
            </form>
        </AuthLayout>
    )
}