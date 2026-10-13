import { API_URL } from '../config'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { FaChartBar } from "react-icons/fa";
import { useNavigate } from 'react-router-dom'
import { getActivity, toChartData } from '../utils/activity'
import { AiOutlineUserDelete } from "react-icons/ai";
import {
    PieChart, Pie, Cell, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    ResponsiveContainer
} from 'recharts'

const COLORS = {
    active: "#22c55e",
    deleted: "#ef4444",
    MTN: "#facc15",
    Airtel: "#dc2626",
    Male: "#3b82f6",
    Added: "#3b82f6",
    Restored: "#319ba9",
    Female: "#ec4899",
    Other: "#a78bfa",
    Logins: "#8b5cf6"
};

// ---------- DEMO DATA (design preview only) ----------
// true  = chart shows the fake numbers below
// false = chart shows your real activity
const USE_DEMO_DATA = true;

const DEMO_WEEKLY = [
    { day: "Monday", Added: 12, Deleted: 4, Restored: 2 },
    { day: "Tuesday", Added: 8, Deleted: 6, Restored: 3 },
    { day: "Wednesday", Added: 15, Deleted: 5, Restored: 4 },
    { day: "Thursday", Added: 10, Deleted: 9, Restored: 6 },
    { day: "Friday", Added: 18, Deleted: 7, Restored: 5 },
    { day: "Saturday", Added: 6, Deleted: 3, Restored: 2 },
    { day: "Sunday", Added: 9, Deleted: 2, Restored: 3 },
];

// Custom tooltip for the weekly activity chart (day title + coloured dots)
function WeeklyTooltip({ active, payload, label }) {

    if (!active || !payload || !payload.length) return null;

    return (
        <div style={{
            background: '#fff', borderRadius: 10, minWidth: 170,
            boxShadow: '0 8px 24px rgba(15,23,42,0.15)', overflow: 'hidden', fontSize: 13
        }}>
            <div style={{
                background: '#f1f5f9', padding: '8px 14px', textAlign: 'center',
                fontWeight: 700, color: '#475569'
            }}>
                {label}
            </div>
            <div style={{ padding: '10px 14px' }}>
                {payload.map(p => (
                    <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '6px 0' }}>
                        <span style={{
                            width: 10, height: 10, borderRadius: '50%',
                            background: p.color || p.stroke || p.fill
                        }} />
                        <span style={{ color: '#64748b' }}>{p.name}:</span>
                        <b style={{ marginLeft: 'auto' }}>{p.value}</b>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function Graphs() {

    const navigate = useNavigate();                 // needed for the click handler

    const [users, setUsers] = useState([])
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)
    const [weekly, setWeekly] = useState([])
    const [loginActivity, setLoginActivity] = useState([])

    const loadData = async () => {
        setLoading(true);
        const [usersRes, historyRes, loginRes] = await Promise.all([
            axios.get(API_URL + "/users"),
            axios.get(API_URL + "/history"),
            axios.get(API_URL + "/login-activity")
        ]);
        setUsers(usersRes.data);
        setHistory(historyRes.data);
        setLoginActivity(loginRes.data);
        setWeekly(toChartData(getActivity(usersRes.data, historyRes.data)));
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    // Restored = users that are ACTIVE again after being deleted.
    // They are taken OUT of "Active" so nobody is counted twice.
    const activeIds = new Set(users.map(u => Number(u.id)));
    const restoredIds = new Set(
        history.filter(h => h.restored).map(h => Number(h.originalId))
    );
    const restoredCount = [...restoredIds].filter(id => activeIds.has(id)).length;

    const donutData = [
        { name: "Active", value: users.length - restoredCount, color: COLORS.active },
        { name: "Restored", value: restoredCount, color: COLORS.Restored },
        // current state only: restored records are NOT counted as deleted
        { name: "Deleted", value: history.filter(h => !h.restored).length, color: COLORS.deleted }
    ];

    // ---------- Users by gender (donut) ----------
    const genderOf = u => (u.gender || "").toLowerCase();
    const genderData = [
        { name: "Male", value: users.filter(u => genderOf(u) === "male").length, color: COLORS.Male },
        { name: "Female", value: users.filter(u => genderOf(u) === "female").length, color: COLORS.Female },
        { name: "Other", value: users.filter(u => !["male", "female"].includes(genderOf(u))).length, color: COLORS.Other }
    ];

    const buildBarData = () => {
        const networks = ["MTN", "Airtel"];
        return networks.map(net => {
            const males = users.filter(u =>
                u.network === net &&
                (u.gender || "").toLowerCase() === "male"
            ).length;
            const females = users.filter(u =>
                u.network === net &&
                (u.gender || "").toLowerCase() === "female"
            ).length;
            return { network: net, Male: males, Female: females };
        });
    };
    const barData = buildBarData();
    const chartData = USE_DEMO_DATA ? DEMO_WEEKLY : weekly;   // not used yet: Weekly Activity below still reads `weekly`
    if (loading) {
        return <div className="text-center py-5">Loading dashboard...</div>;
    }

    return (
        <div className="dashboard-page">
            <div className="container py-4">

                <h2 className="mb-4 text-center d-flex align-items-center justify-content-center gap-2">
                    <FaChartBar size={32} /> Dashboard
                </h2>

                <div className="row">
                    {/* ============ DONUT ============ */}
                    <div className="col-md-6 mb-4 " style={{ borderRadius: 16 }}>
                        <div className="card shadow-sm border-0 h-100">
                            <div className="card-body">
                                <h5 className="card-title fw-bold text-start">Active, Restored &amp; Deleted</h5>
                                <div className="float-end">
                                    <button
                                        className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1"
                                        onClick={() => navigate("/RecentlyDeleted")}
                                    >
                                        <AiOutlineUserDelete size={16} /> View Deleted Clients
                                    </button>
                                </div>
                                <div className='mt-4'>
                                    <ResponsiveContainer width="100%" height={320}>
                                        <PieChart>
                                            <Pie
                                                data={donutData}
                                                dataKey="value"
                                                nameKey="name"
                                                innerRadius={70}
                                                outerRadius={120}
                                                paddingAngle={4}
                                                label={({ name, value }) => (value > 0 ? `${name}: ${value}` : "")}
                                                onClick={(data) => {
                                                    if (data.name === "Deleted") navigate("/RecentlyDeleted");
                                                }}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                {donutData.map((entry, i) => (
                                                    <Cell key={i} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div
                                        className="d-flex justify-content-center flex-wrap gap-4 pt-3 mt-3 "
                                        style={{ borderTop: '2.7px dashed #cbd5e1' }}
                                    >
                                        {donutData.map(item => (
                                            <div key={item.name} className="d-flex align-items-center gap-2 small">
                                                <span style={{
                                                    width: 10, height: 10, borderRadius: '50%',
                                                    background: item.color, display: 'inline-block'
                                                }} />
                                                <span>{item.name}: <b>{item.value}</b></span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ============ BAR CHART ============ */}
                    <div className="col-md-6 mb-4" style={{ borderRadius: 16 }}>
                        <div className="card shadow-sm border-0 h-100">
                            <div className="card-body">
                                <h5 className="card-title fw-bold mb-1 text-start">
                                    Gender by Network
                                </h5>
                                <p className="text-muted small mb-3 text-start">
                                    Clients by Gender and Network (MTN &amp; Airtel)
                                </p>
                                <ResponsiveContainer width="100%" height={380}>
                                    <BarChart data={barData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="network" />
                                        <YAxis allowDecimals={false} />
                                        <Tooltip />
                                        <Legend iconType="circle" />
                                        <Bar dataKey="Female" fill={COLORS.Female} barSize={70} radius={[6, 6, 0, 0]} />
                                        <Bar dataKey="Male" fill={COLORS.Male} barSize={70} radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row">
                    {/* ============ GENDER DONUT ============ */}
                    <div className="col-md-6 mb-4" style={{ borderRadius: 16 }}>
                        <div className="card shadow-sm border-0 h-100">
                            <div className="card-body">
                                <h5 className="card-title fw-bold mb-1 text-start">Users by Gender</h5>
                                <p className="text-muted small mb-3 text-start">
                                    Share of clients by gender
                                </p>
                                <ResponsiveContainer width="100%" height={320}>
                                    <PieChart>
                                        <Pie
                                            data={genderData}
                                            dataKey="value"
                                            nameKey="name"
                                            innerRadius={70}
                                            outerRadius={120}
                                            paddingAngle={4}
                                            label={({ name, value }) => (value > 0 ? `${name}: ${value}` : "")}
                                        >
                                            {genderData.map((entry, i) => (
                                                <Cell key={i} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div
                                    className="d-flex justify-content-center flex-wrap gap-4 pt-3 mt-3"
                                    style={{ borderTop: '2.7px dashed #cbd5e1' }}
                                >
                                    {genderData.map(item => (
                                        <div key={item.name} className="d-flex align-items-center gap-2 small">
                                            <span style={{
                                                width: 10, height: 10, borderRadius: '50%',
                                                background: item.color, display: 'inline-block'
                                            }} />
                                            <span>{item.name}: <b>{item.value}</b></span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ============ LOGIN ACTIVITY ============ */}
                    <div className="col-md-6 mb-4" style={{ borderRadius: 16 }}>
                        <div className="card shadow-sm border-0 h-100">
                            <div className="card-body">
                                <h5 className="card-title fw-bold mb-1 text-start">Login Activity</h5>
                                <p className="text-muted small mb-3 text-start">
                                    Logins by day of the week
                                </p>

                                <ResponsiveContainer width="100%" height={370}>
                                    <BarChart data={loginActivity}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="day" tick={{ fontSize: 12 }} tickFormatter={d => d.slice(0, 3)} />
                                        <YAxis allowDecimals={false} domain={[0, dataMax => Math.max(dataMax * 3, 19)]} />
                                        <Tooltip content={<WeeklyTooltip />} />
                                         {/* <Bar dataKey="Logins" fill={COLORS.Logins} radius={[6, 6, 0, 0]} /> */}
                                        <Bar dataKey="Logins" fill={COLORS.Logins} barSize={53} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ============ WEEKLY ACTIVITY ============ */}
                <div className="card shadow-sm border-0 mb-4">
                    <div className="card-body p-4">
                        <h5 className="card-title fw-bold mb-1 text-start">Weekly Activity</h5>
                        <p className="text-muted small mb-3 text-start">
                            Added, deleted &amp; restored Clients by day of the week
                        </p>

                        <ResponsiveContainer width="100%" height={340}>
                            <BarChart data={weekly}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="Added" fill={COLORS.Added} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Deleted" fill={COLORS.deleted} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Restored" fill={COLORS.Restored} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    )
}
