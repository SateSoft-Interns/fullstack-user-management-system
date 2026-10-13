import { API_URL } from '../config'
import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

export default function ViewUser() {

    const [user, setUser] = useState({
        name: "",
        username: "",
        email: "",
        gender: "",
        phone: "",
        network: "",
        createdAt: ""
    })

    // Latest "deleted then restored" record for this user (null = never deleted)
    const [restoredInfo, setRestoredInfo] = useState(null)
    const [ready, setReady] = useState(false)

    const { id } = useParams();

    useEffect(() => {
        const load = async () => {
            setReady(false);

            const result = await axios.get(API_URL + `/find/${id}`)
            setUser(result.data);

            // A restored user keeps the same id, so history.originalId === this user's id
            try {
                const res = await axios.get(API_URL + "/history")
                const restored = res.data
                    .filter(h => h.restored && Number(h.originalId) === Number(id))
                    .sort((a, b) => new Date(b.restoredAt) - new Date(a.restoredAt))
                setRestoredInfo(restored[0] || null)
            } catch (err) {
                console.error("Could not load restore info", err)
                setRestoredInfo(null)
            }

            setReady(true);
        }

        load();
    }, [id])

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date)) return 'N/A';

        const datePart = date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        const timePart = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        return `${datePart} ${timePart}`;
    }

    // Shared by both cards
    const genderBadge = (
        <span
            className={
                user.gender === "Male"
                    ? "badge bg-primary"
                    : user.gender === "Female"
                    ? "badge bg-pink"
                    : "badge bg-secondary"
            }
            style={user.gender === "Female" ? { backgroundColor: "#e83e8c" } : {}}
        >
            {user.gender || "N/A"}
        </span>
    )

    const phoneWithNetwork = (
        <span>
            {user.phone || "N/A"}{" "}
            {user.network && (
                <span
                    className={
                        user.network === "MTN"
                            ? "badge bg-warning text-dark ms-2"
                            : "badge bg-danger ms-2"
                    }
                >
                    {user.network}
                </span>
            )}
        </span>
    )

    // Wait until we know whether this user was ever deleted (avoids a flash of the wrong card)
    if (!ready) {
        return (
            <div className="floating-card">
                <p className="text-center text-muted m-0">Loading...</p>
            </div>
        )
    }

    // =====================================================
    //  CARD 1: user was deleted and then restored
    // =====================================================
    if (restoredInfo) {
        return (
            <div className="floating-card">

                <h2 className="text-center mb-4">Deleted User Details</h2>

                <ul className="list-group list-group-flush">

                    <li className="list-group-item d-flex justify-content-between">
                        <b>Name:</b>
                        <span>{user.name}</span>
                    </li>

                    <li className="list-group-item d-flex justify-content-between">
                        <b>Username:</b>
                        <span>{user.username}</span>
                    </li>

                    <li className="list-group-item d-flex justify-content-between">
                        <b>Email:</b>
                        <span>{user.email}</span>
                    </li>

                    <li className="list-group-item d-flex justify-content-between">
                        <b>Gender:</b>
                        {genderBadge}
                    </li>

                    <li className="list-group-item d-flex justify-content-between">
                        <b>Phone:</b>
                        {phoneWithNetwork}
                    </li>

                    <li className="list-group-item">
                        <b>Reason:</b>
                        <div className="text-muted mt-1">
                            {restoredInfo.reason || "No reason recorded"}
                        </div>
                    </li>

                    <li className="list-group-item d-flex justify-content-between">
                        <b>Deleted At:</b>
                        <span>{formatDateTime(restoredInfo.deletedAt)}</span>
                    </li>

                    <li className="list-group-item bg-light fw-bold text-center">
                        🔄 Restore Audit
                    </li>

                    <li className="list-group-item d-flex justify-content-between">
                        <b>Restored At:</b>
                        <span>{formatDateTime(restoredInfo.restoredAt)}</span>
                    </li>

                    <li className="list-group-item d-flex justify-content-between">
                        <b>Duration Deleted:</b>
                        <span className="badge bg-info text-dark">
                            {restoredInfo.restoreDuration || "—"}
                        </span>
                    </li>

                    <li className="list-group-item">
                        <b>Restore Remarks:</b>
                        <div className="text-muted mt-1">
                            {restoredInfo.restoreRemarks || "No remarks"}
                        </div>
                    </li>

                </ul>

                <div className="text-center mt-4">
                    <Link className="btn btn-secondary" to={"/"}>Close</Link>
                </div>
            </div>
        )
    }

    // =====================================================
    //  CARD 2: normal user (never deleted)
    // =====================================================
    return (
        <div className="floating-card">

            <h2 className="text-center mb-4">User Details</h2>

            <ul className="list-group list-group-flush">

                <li className="list-group-item d-flex justify-content-between">
                    <b>ID:</b>
                    <span>{user.id}</span>
                </li>

                <li className="list-group-item d-flex justify-content-between">
                    <b>Name:</b>
                    <span>{user.name}</span>
                </li>

                <li className="list-group-item d-flex justify-content-between">
                    <b>Username:</b>
                    <span>{user.username}</span>
                </li>

                <li className="list-group-item d-flex justify-content-between">
                    <b>Email:</b>
                    <span>{user.email}</span>
                </li>

                <li className="list-group-item d-flex justify-content-between">
                    <b>Gender:</b>
                    {genderBadge}
                </li>

                <li className="list-group-item d-flex justify-content-between">
                    <b>Phone:</b>
                    {phoneWithNetwork}
                </li>

                <li className="list-group-item d-flex justify-content-between">
                    <b>Created At:</b>
                    <span>{formatDateTime(user.createdAt)}</span>
                </li>

            </ul>

            <div className="text-center mt-4">
                <Link className="btn btn-primary" to={"/"}>Back Home</Link>
            </div>
        </div>
    )
}