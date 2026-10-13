import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
    MdAutoDelete,
    MdClose,
    MdDashboard,
    MdPeople,
    MdMenu
} from "react-icons/md"
import { HiOutlineLogin } from "react-icons/hi";
import { MdMenuOpen } from "react-icons/md";
import { MdOutlineDashboardCustomize } from "react-icons/md";
import { TbUserScreen } from "react-icons/tb";
import { LuUsers } from "react-icons/lu";
const MOBILE_QUERY = '(max-width: 991.98px)';

export default function Navbar({ open, setOpen, onLogout }) {
    const { pathname } = useLocation()

    // On small screens the sidebar floats over the page, so close it after navigating
    const closeOnMobile = () => {
        if (window.matchMedia && window.matchMedia(MOBILE_QUERY).matches) setOpen(false)
    }

    // Main menu
    const items = [
        { to: "/dashboard", label: "Dashboard", icon: <MdOutlineDashboardCustomize size={23} />, active: pathname === "/dashboard" },
        { to: "/", label: "All Clients", icon: <LuUsers size={23} />, active: pathname === "/" || pathname.startsWith("/find") || pathname.startsWith("/edit") },
        { to: "/RecentlyDeleted", label: "Recently Deleted", icon: <MdAutoDelete size={23} />, active: pathname.toLowerCase().startsWith("/recentlydeleted") },
    ]

    return (
        <>
            {/* ===== Vertical sidebar (pushes content, never overlays it) ===== */}
            <aside
                className={`sidebar ${open ? 'sidebar-open' : ''}`}
                aria-hidden={!open}
                style={{ display: 'flex', flexDirection: 'column' }}
            >
                <div className="sidebar-header">
                    <span>Manage Clients</span>
                </div>

                {/* Main links (top) */}
                <nav className="sidebar-links">
                    {items.map(item => (
                        <Link
                            key={item.label}
                            to={item.to}
                            className={`sidebar-link ${item.active ? 'active' : ''}`}
                            aria-current={item.active ? 'page' : undefined}
                            tabIndex={open ? 0 : -1}
                            onClick={closeOnMobile}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                {/* Logout (pinned to the bottom of the sidebar) */}
                <div
                    className="sidebar-links"
                    style={{ marginTop: 'auto', borderTop: '1px solid #e2e8f0' }}
                >
                    <Link
                        to="/login"
                        className="sidebar-link"
                        tabIndex={open ? 0 : -1}
                        onClick={() => {
                            onLogout()        // clears the session (App.js) -> login page
                            closeOnMobile()
                        }}
                    >
                        <HiOutlineLogin size={23} />
                        <span>Logout</span>
                    </Link>
                </div>
            </aside>

            {/* ===== Top navbar ===== */}
            <header className="app-navbar navbar navbar-dark bg-primary p-0">
                <div className="navbar-container w-100">
                    <button
                        type="button"
                        className="menu-button"
                        onClick={() => setOpen(!open)}
                        aria-label={open ? "Close menu" : "Open menu"}
                        aria-expanded={open}
                    >
                        {open ? <MdMenuOpen size={26} /> : <MdMenu size={26} />}
                    </button>

                    <Link className="app-brand navbar-brand" to="/">
                        MANAGE CLIENTS
                    </Link>
                </div>
            </header>
        </>
    )
}