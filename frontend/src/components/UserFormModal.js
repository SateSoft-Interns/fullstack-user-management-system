import { API_URL } from '../config'
import React, { useEffect, useState } from 'react'
import { MdClose } from 'react-icons/md'

// Uganda network prefixes
const NETWORK_PREFIXES = {
    "077": "MTN", "078": "MTN", "076": "MTN", "039": "MTN",
    "070": "Airtel", "075": "Airtel", "074": "Airtel", "020": "Airtel"
};

const detectNetwork = (number) => {
    if (!number || number.length < 3) return "";
    return NETWORK_PREFIXES[number.substring(0, 3)] || "";
};

const EMPTY = { name: "", username: "", email: "", phone: "", network: "", gender: "" };

/**
 * Shared Add / Edit user modal.
 *  - mode "add":  empty form
 *  - mode "edit": pre-filled from `initialUser`
 * onSubmit(user) must return a promise; the modal stays open if it throws.
 */
export default function UserFormModal({ mode = "add", initialUser, onSubmit, onClose }) {
    const isEdit = mode === "edit";
    const [user, setUser] = useState(EMPTY)
    const [errors, setErrors] = useState({})
    const [saving, setSaving] = useState(false)
    const [serverError, setServerError] = useState("")

    useEffect(() => {
        setUser(initialUser
            ? { ...EMPTY, ...initialUser, network: initialUser.network || detectNetwork(initialUser.phone) }
            : EMPTY);
        setErrors({});
        setServerError("");
    }, [initialUser, mode])

    // close on Escape
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose])

    const { name, username, email, phone, network, gender } = user

    const onInputChange = (e) => {
        setUser({ ...user, [e.target.name]: e.target.value });
        if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: "" });
    }

    const handlePhoneChange = (value) => {
        const digits = value.replace(/\D/g, "").slice(0, 10);
        setUser({ ...user, phone: digits, network: detectNetwork(digits) });
        if (errors.phone) setErrors({ ...errors, phone: "" });
    };

    const validate = () => {
        const e = {};
        if (!name.trim()) e.name = "Name is required";
        if (!username.trim()) e.username = "Username is required";
        if (!email.trim()) e.email = "Email is required";
        else if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = "Enter a valid email address";
        if (!phone) e.phone = "Please enter a phone number";
        else if (!network) e.phone = "Invalid prefix. Use an MTN or Airtel prefix.";
        else if (phone.length !== 10) e.phone = "Phone must be 10 digits (e.g. 0771234567)";
        if (!gender) e.gender = "Please select a gender";
        return e;
    };

    const handleSubmit = async (ev) => {
        ev.preventDefault();
        const e = validate();
        setErrors(e);
        if (Object.keys(e).length) return;

        setSaving(true);
        setServerError("");
        try {
            await onSubmit({ ...user, name: name.trim(), username: username.trim(), email: email.trim() });
        } catch (err) {
            console.error("Save failed:", err);
            const data = err.response?.data;
            const detail = typeof data === 'string' ? data : (data?.message || data?.error);
            setServerError(
                err.response
                    ? `Server error ${err.response.status}${detail ? ': ' + detail : ''}`
                    : `Cannot reach the server at ${API_URL}. Is the backend running?`
            );
            setSaving(false);
        }
    };

    const field = (key) => `form-control${errors[key] ? ' is-invalid' : ''}`;

    return (
        <div className="app-modal-backdrop" onClick={onClose}>
            <div
                className="app-modal"
                role="dialog"
                aria-modal="true"
                aria-label={isEdit ? "Edit Client" : "Add Client"}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="app-modal-header">
                    <h3 className="m-0">{isEdit ? "Edit Client" : "Add Client"}</h3>
                    <button type="button" className="app-modal-close" onClick={onClose} aria-label="Close">
                        <MdClose size={22} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                    <div className="app-modal-body">
                        <div className="mb-3">
                            <label htmlFor="name" className="form-label d-block text-start">Name</label>
                            <input id="name" type="text" className={field('name')} placeholder="Enter Your Name"
                                name="name" value={name} onChange={onInputChange} />
                            {errors.name && <div className="invalid-feedback text-start">{errors.name}</div>}
                        </div>

                        <div className="mb-3">
                            <label htmlFor="username" className="form-label d-block text-start">Username</label>
                            <input id="username" type="text" className={field('username')} placeholder="Enter Your Username"
                                name="username" value={username} onChange={onInputChange} />
                            {errors.username && <div className="invalid-feedback text-start">{errors.username}</div>}
                        </div>

                        <div className="mb-3">
                            <label htmlFor="email" className="form-label d-block text-start">Email</label>
                            <input id="email" type="email" className={field('email')} placeholder="Enter Your Email"
                                name="email" value={email} onChange={onInputChange} />
                            {errors.email && <div className="invalid-feedback text-start">{errors.email}</div>}
                        </div>

                        <div className="mb-3">
                            <label htmlFor="phone" className="form-label d-block text-start">Phone Number</label>
                            <input id="phone" type="text" inputMode="numeric" className={field('phone')}
                                placeholder="e.g. 0771234567" name="phone" value={phone}
                                onChange={(e) => handlePhoneChange(e.target.value)} />
                            {errors.phone && <div className="invalid-feedback text-start">{errors.phone}</div>}

                            {phone.length > 0 && (
                                <small className="mt-1 d-block text-start">
                                    Network:{" "}
                                    {network ? (
                                        <span className={network === "MTN" ? "badge bg-warning text-dark" : "badge bg-danger"}>
                                            {network}
                                        </span>
                                    ) : (
                                        <span className="text-danger">Unknown prefix</span>
                                    )}
                                </small>
                            )}
                        </div>

                        <div className="mb-3">
                            <label htmlFor="gender" className="form-label d-block text-start">Gender</label>
                            <select id="gender" className={`form-select${errors.gender ? ' is-invalid' : ''}`}
                                name="gender" value={gender} onChange={onInputChange}>
                                <option value="">-- Select Gender --</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                            {errors.gender && <div className="invalid-feedback text-start">{errors.gender}</div>}
                        </div>

                        {serverError && <div className="alert alert-danger py-2">{serverError}</div>}
                    </div>

                    <div className="app-modal-footer">
                        <button type="button" className="btn btn-outline-danger" onClick={onClose} disabled={saving}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Client"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}