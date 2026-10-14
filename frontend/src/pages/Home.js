import { API_URL } from '../config'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useLocation, useNavigate } from 'react-router-dom'
import { IoIosAdd } from "react-icons/io"
import UserFormModal from '../components/UserFormModal'
import { recordActivity } from '../utils/activity'
import { RiDeleteBin7Line } from "react-icons/ri";
import { LuArchiveRestore } from "react-icons/lu";
import { MdFirstPage, MdLastPage, MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import { getAuthUser } from '../utils/auth'

// accent colour of the pagination (selected size + dropdown arrow). Change it to match your theme.
const PAGER_ACCENT = '#10327a'
const PAGE_SIZES = [20, 50, 100]

export default function Home() {
    const location = useLocation()
    const navigate = useNavigate()

    // signed-in account saved by the Login page (saveAuthUser)
    const authUser = getAuthUser()
    const currentUser = authUser?.fullName || authUser?.username || "Unknown"

    const [users, setUsers] = useState([])
    const [currentPage, setCurrentPage] = useState(1)
    const [usersPerPage, setUsersPerPage] = useState(20)
    const [showSizeMenu, setShowSizeMenu] = useState(false)

    // search state
    const [search, setSearch] = useState("")

    // View modal
    const [selectedUser, setSelectedUser] = useState(null)
    // Latest "deleted then restored" record for the user being viewed (null = never deleted)
    const [restoredInfo, setRestoredInfo] = useState(null)

    // Delete modal state
    const [userToDelete, setUserToDelete] = useState(null)
    const [deleteReason, setDeleteReason] = useState("")
    const [deleteError, setDeleteError] = useState("")

    // Add / Edit modal state
    const [showAdd, setShowAdd] = useState(false)
    const [editingUser, setEditingUser] = useState(null)

    useEffect(() => {
        loadUsers();
    }, []);

    // Sidebar "Add User" (state={{ openAddUser: true }}) and legacy /add, /edit/:id links
    useEffect(() => {
        const st = location.state
        if (!st) return
        if (st.openAddUser) setShowAdd(true)
        if (st.editUserId) {
            axios.get(API_URL + `/find/${st.editUserId}`)
                .then(res => setEditingUser(res.data))
                .catch(console.error)
        }
        // clear the state so a refresh / back navigation doesn't re-open the modal
        navigate(location.pathname, { replace: true, state: null })
    }, [location.state]) // eslint-disable-line react-hooks/exhaustive-deps

    const loadUsers = async () => {
        const result = await axios.get(API_URL + "/users")
        // newest first: highest id on top, so a new client appears at the top of the table
        const newestFirst = [...result.data].sort((a, b) => Number(b.id) - Number(a.id))
        setUsers(newestFirst);
    }

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date)) return 'N/A';

        const datePart = date.toLocaleDateString('en-US', {
            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
        });

        const timePart = date.toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', hour12: true
        });

        return `${datePart} ${timePart}`;
    }

    const confirmDelete = async () => {
        if (!deleteReason.trim()) {
            setDeleteError("Please tell us why you want to delete this user.");
            return;
        }

        await axios.delete(
            API_URL + `/delete/${userToDelete.id}`,
            { params: { reason: deleteReason, deletedBy: currentUser } }
        );

        recordActivity('deleted');

        setUserToDelete(null);
        setDeleteReason("");
        setDeleteError("");
        loadUsers();
    }

    const addUser = async (newUser) => {
        await axios.post(API_URL + "/user", newUser, {
            params: { addedBy: currentUser }      // who is adding this client
        });
        recordActivity('added');
        setShowAdd(false);
        setCurrentPage(1);
        await loadUsers();
    }

    const updateUser = async (updated) => {
        await axios.put(API_URL + `/update/${editingUser.id}`, updated);
        setEditingUser(null);
        await loadUsers();
    }

    // Opens the View popup. If the user was deleted and restored before,
    // the restore details are loaded too, so the popup can show the "Deleted User Details" card.
    const viewUser = async (id) => {
        setRestoredInfo(null);
        const res = await axios.get(API_URL + `/find/${id}`);

        // A restored user keeps the same id, so history.originalId === user id
        let info = null;
        try {
            const hist = await axios.get(API_URL + "/history");
            info = hist.data
                .filter(h => h.restored && Number(h.originalId) === Number(id))
                .sort((a, b) => new Date(b.restoredAt) - new Date(a.restoredAt))[0] || null;
        } catch (err) {
            console.error("Could not load restore info", err);
        }

        setRestoredInfo(info);
        setSelectedUser(res.data);
    }

    const closeView = () => {
        setSelectedUser(null);
        setRestoredInfo(null);
    }

    // filter users by search term
    const filteredUsers = users.filter(u =>
        (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (u.username || "").toLowerCase().includes(search.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (u.phone || "").toLowerCase().includes(search.toLowerCase()) ||
        (u.gender || "").toLowerCase().includes(search.toLowerCase()) ||
        String(u.id || "").includes(search)
    );

    // Pagination — uses filteredUsers
    const indexOfLastUser = currentPage * usersPerPage
    const indexOfFirstUser = indexOfLastUser - usersPerPage
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser)
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage)

    const goToPage = (page) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    }

    // "1 – 20 of 362"
    const rangeStart = filteredUsers.length === 0 ? 0 : indexOfFirstUser + 1
    const rangeEnd = Math.min(indexOfLastUser, filteredUsers.length)

    const changePageSize = (size) => {
        setUsersPerPage(size)
        setCurrentPage(1)
        setShowSizeMenu(false)
    }

    const navBtn = (disabled) => ({
        background: 'transparent', border: 0, padding: 4, display: 'flex', alignItems: 'center',
        color: disabled ? '#c7c9cf' : '#10327a', cursor: disabled ? 'default' : 'pointer'
    })

    return (
        <div className='container'>
            <div className='py-4'>
                {/* Page header with Add Clients button */}
                <div className="page-header d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
                    <div className="text-start">
                        <span className="page-eyebrow">Clients</span>
                        <h2 className="page-title">Client Management</h2>
                    </div>
                    <button
                        type="button"
                        className="btn btn-primary d-inline-flex align-items-center gap-1"
                        onClick={() => setShowAdd(true)}
                    >
                        <IoIosAdd size={24} /> Add Client
                    </button>
                </div>

                {/* White card: heading, count, search, table, pagination */}
                <div className="users-card">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                        <div className="text-start">
                            <h5 className="mb-0 fw-bold">Clients</h5>
                            <span className="text-muted small">
                                {filteredUsers.length} Client{filteredUsers.length !== 1 ? 's' : ''} found
                            </span>
                        </div>

                        <input
                            type="text"
                            className="form-control users-search"
                            placeholder="🔍 Search by ID, name, username, email, phone..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setCurrentPage(1);   // reset to page 1 on search
                            }}
                        />
                    </div>

                    <div className="table-responsive">
                        <table className="table align-middle mb-0">
                            <thead>
                                <tr>
                                    <th scope="col" className="text-start">#</th>
                                    <th scope="col" className="text-start">NAME</th>
                                    <th scope="col" className="text-start">USER NAME</th>
                                    <th scope="col" className="text-start">ID</th>
                                    <th scope="col" className="text-start">EMAIL</th>
                                    <th className="text-start">GENDER</th>
                                    <th className="text-start">DATE &amp; TIME</th>
                                    <th className="text-start">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="text-center text-muted py-4">
                                            No Clients match your search.
                                        </td>
                                    </tr>
                                ) : currentUsers.map((user, index) => (
                                    <tr key={user.id}>
                                        <td className="text-start">{indexOfFirstUser + index + 1}</td>
                                        <td className="text-start">{user.name}</td>
                                        <td className="text-start">{user.username}</td>
                                        <td className="text-start">{user.id}</td>
                                        <td className="text-start">{user.email}</td>
                                        <td className="text-start">{user.gender}</td>
                                        <td className="text-start text-nowrap">
                                            {formatDateTime(user.created_at || user.createdAt)}
                                        </td>
                                        <td className="text-start text-nowrap">
                                            <button
                                                className='btn btn-primary mx-1'
                                                title="View"
                                                onClick={() => viewUser(user.id)}
                                            >
                                                <i className="fa-solid fa-eye"></i>
                                            </button>

                                            <button
                                                className='btn btn-outline-primary mx-1'
                                                title="Edit"
                                                onClick={() => setEditingUser(user)}
                                            >
                                                <i className="fa-solid fa-pen-to-square"></i>
                                            </button>

                                            <button
                                                className='btn btn-danger mx-1'
                                                title="Delete"
                                                onClick={() => {
                                                    setUserToDelete(user);
                                                    setDeleteReason("");
                                                    setDeleteError("");
                                                }}
                                            >
                                                <i className="fa-solid fa-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination footer: Items per page | range | first prev next last */}
                    {filteredUsers.length > 0 && (
                        <div
                            className="d-flex justify-content-end align-items-center flex-wrap gap-4 pt-3 mt-2"
                            style={{ borderTop: '1px solid #e5e7eb', color: '#6b7280', fontSize: 14 }}
                        >
                            {/* Items per page */}
                            <div className="d-flex align-items-center gap-2" style={{ position: 'relative' }}>
                                <span>Items per page:</span>

                                <button
                                    type="button"
                                    onClick={() => setShowSizeMenu(open => !open)}
                                    style={{
                                        background: 'transparent', border: 0, borderBottom: '1px solid #9ca3af',
                                        color: '#0051ff', minWidth: 60, padding: '2px 0', fontSize: 14,
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        gap: 14, cursor: 'pointer'
                                    }}
                                >
                                    {usersPerPage}
                                    <span style={{
                                        width: 0, height: 0,
                                        borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
                                        borderTop: `5px solid ${PAGER_ACCENT}`
                                    }} />
                                </button>

                                {showSizeMenu && (
                                    <>
                                        {/* click outside closes the menu */}
                                        <div
                                            onClick={() => setShowSizeMenu(false)}
                                            style={{ position: 'fixed', inset: 0, zIndex: 1000 }}
                                        />
                                        <ul style={{
                                            position: 'absolute', right: 0, bottom: '100%', marginBottom: 6,
                                            padding: 0, listStyle: 'none', background: '#fff', borderRadius: 4,
                                            boxShadow: '0 4px 16px rgba(0,0,0,0.18)', zIndex: 1001, minWidth: 90,
                                            overflow: 'hidden'
                                        }}>
                                            {PAGE_SIZES.map(size => (
                                                <li
                                                    key={size}
                                                    onClick={() => changePageSize(size)}
                                                    style={{
                                                        padding: '12px 22px', cursor: 'pointer', textAlign: 'left',
                                                        color: size === usersPerPage ? PAGER_ACCENT : '#262b36',
                                                        background: size === usersPerPage ? '#e5e7eb' : '#fff'
                                                    }}
                                                >
                                                    {size}
                                                </li>
                                            ))}
                                        </ul>
                                    </>
                                )}
                            </div>

                            {/* 1 – 20 of 362 */}
                            <span>{rangeStart} – {rangeEnd} of {filteredUsers.length}</span>

                            {/* first / previous / next / last */}
                            <div className="d-flex align-items-center gap-2">
                                <button type="button" title="First page" disabled={currentPage === 1}
                                    onClick={() => goToPage(1)} style={navBtn(currentPage === 1)}>
                                    <MdFirstPage size={26} />
                                </button>
                                <button type="button" title="Previous page" disabled={currentPage === 1}
                                    onClick={() => goToPage(currentPage - 1)} style={navBtn(currentPage === 1)}>
                                    <MdKeyboardArrowLeft size={26} />
                                </button>
                                <button type="button" title="Next page" disabled={currentPage === totalPages}
                                    onClick={() => goToPage(currentPage + 1)} style={navBtn(currentPage === totalPages)}>
                                    <MdKeyboardArrowRight size={26} />
                                </button>
                                <button type="button" title="Last page" disabled={currentPage === totalPages}
                                    onClick={() => goToPage(totalPages)} style={navBtn(currentPage === totalPages)}>
                                    <MdLastPage size={26} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ADD / EDIT USER MODALS */}
                {showAdd && (
                    <UserFormModal mode="add" onSubmit={addUser} onClose={() => setShowAdd(false)} />
                )}
                {editingUser && (
                    <UserFormModal
                        mode="edit"
                        initialUser={editingUser}
                        onSubmit={updateUser}
                        onClose={() => setEditingUser(null)}
                    />
                )}

                {/* ============================ */}
                {/* VIEW USER MODAL               */}
                {/* ============================ */}
                {selectedUser && (
                    <div
                        onClick={closeView}
                        style={{
                            position: 'fixed', inset: 0,
                            background: 'rgba(0,0,0,0.5)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 1300
                        }}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: '#fff', borderRadius: '16px',
                                padding: '32px', width: '90%', maxWidth: '520px',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                                maxHeight: '90vh', overflowY: 'auto'
                            }}
                        >
                            <h3 className="text-center mb-4">
                                {restoredInfo ? "Client Details" : "Client Details"}
                            </h3>
                            <ul className="list-group list-group-flush">
                                {/* ID is shown for normal users only (same layout as before) */}
                                {!restoredInfo && (
                                    <li className="list-group-item d-flex justify-content-between">
                                        <b>ID:</b><span>{selectedUser.id}</span>
                                    </li>
                                )}
                                <li className="list-group-item d-flex justify-content-between">
                                    <b>Name:</b><span>{selectedUser.name}</span>
                                </li>
                                <li className="list-group-item d-flex justify-content-between">
                                    <b>Username:</b><span>{selectedUser.username}</span>
                                </li>
                                <li className="list-group-item d-flex justify-content-between">
                                    <b>Email:</b><span>{selectedUser.email}</span>
                                </li>
                                <li className="list-group-item d-flex justify-content-between">
                                    <b>Gender:</b>
                                    <span className={
                                        selectedUser.gender === "Male" ? "badge bg-primary"
                                            : selectedUser.gender === "Female" ? "badge bg-danger"
                                                : "badge bg-secondary"
                                    }>
                                        {selectedUser.gender || "N/A"}
                                    </span>
                                </li>
                                <li className="list-group-item d-flex justify-content-between">
                                    <b>Phone:</b>
                                    <span>
                                        {selectedUser.phone || "N/A"}{" "}
                                        {selectedUser.network && (
                                            <span className={
                                                selectedUser.network === "MTN"
                                                    ? "badge bg-warning text-dark ms-2"
                                                    : "badge bg-danger ms-2"
                                            }>
                                                {selectedUser.network}
                                            </span>
                                        )}
                                    </span>
                                </li>

                                {/* NEW: who added the client */}
                                <li className="list-group-item d-flex justify-content-between">
                                    <b>Added By:</b><span>{selectedUser.addedBy || "—"}</span>
                                </li>

                                {/* ===== Normal user (never deleted) ===== */}
                                {!restoredInfo && (
                                    <li className="list-group-item d-flex justify-content-between">
                                        <b>Created At:</b>
                                        <span>{formatDateTime(selectedUser.createdAt)}</span>
                                    </li>
                                )}

                            </ul>

                            {/* ===== Only if the user was deleted and restored before ===== */}
                            {restoredInfo && (
                                <>
                                    {/* ---------- Section 1: Deleted details ---------- */}
                                    <div className="border rounded-3 mt-4 overflow-hidden">
                                        <div
                                            className="px-3 py-2 fw-bold text-start d-flex align-items-center gap-2"
                                            style={{ background: '#fdecea', color: '#b02a37' }}
                                        >
                                            <RiDeleteBin7Line size={21} />
                                            <span>Deleted Details</span>
                                        </div>

                                        <div className="px-3 py-3 border-bottom">
                                            <div className="fw-semibold mb-2 text-start">Reason</div>
                                            <div
                                                className="p-3 rounded bg-light text-start text-muted"
                                                style={{ minHeight: '64px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                                            >
                                                {restoredInfo.reason || "No reason recorded"}
                                            </div>
                                        </div>

                                        {/* NEW: who deleted the client */}
                                        <div className="d-flex justify-content-between align-items-center px-3 py-3 border-bottom">
                                            <b>Deleted By</b>
                                            <span>{restoredInfo.deletedBy || "—"}</span>
                                        </div>

                                        <div className="d-flex justify-content-between align-items-center px-3 py-3">
                                            <b>Deleted At</b>
                                            <span>{formatDateTime(restoredInfo.deletedAt)}</span>
                                        </div>
                                    </div>

                                    {/* ---------- Section 2: Restore audit ---------- */}
                                    <div className="border rounded-3 mt-3 overflow-hidden">
                                        <div
                                            className="px-3 py-2 fw-bold text-start d-flex align-items-center gap-2"
                                            style={{ background: '#e8f5e9', color: '#1e7e34' }}
                                        >
                                            <LuArchiveRestore size={21} /> Restore Audit
                                        </div>

                                        <div className="d-flex justify-content-between align-items-center px-3 py-3 border-bottom">
                                            <b>Restored By</b>
                                            <span>{restoredInfo.restoredBy || "—"}</span>
                                        </div>

                                        <div className="d-flex justify-content-between align-items-center px-3 py-3 border-bottom">
                                            <b>Restored At</b>
                                            <span>{formatDateTime(restoredInfo.restoredAt)}</span>
                                        </div>

                                        <div className="d-flex justify-content-between align-items-center px-3 py-3 border-bottom">
                                            <b>Duration Deleted</b>
                                            <span className="badge bg-info text-dark">
                                                {restoredInfo.restoreDuration || "—"}
                                            </span>
                                        </div>

                                        <div className="px-3 py-3">
                                            <div className="fw-semibold mb-2 text-start">Restore Remarks</div>
                                            <div
                                                className="p-3 rounded bg-light text-start text-muted"
                                                style={{ minHeight: '64px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                                            >
                                                {restoredInfo.restoreRemarks || "No remarks"}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="text-center mt-4">
                                <button
                                    className={restoredInfo ? "btn btn-secondary" : "btn btn-primary"}
                                    onClick={closeView}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {/* ============================= */}
                {/* DELETE Client MODAL              */}
                {/* ============================= */}
                {userToDelete && (
                    <div
                        onClick={() => setUserToDelete(null)}
                        style={{
                            position: 'fixed', inset: 0,
                            background: 'rgba(0,0,0,0.5)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 1300
                        }}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: '#fff', borderRadius: '16px',
                                padding: '32px', width: '90%', maxWidth: '480px',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.25)'
                            }}
                        >
                            <h3 className="text-center mb-3 text-danger">Delete Client</h3>

                            <p className="text-center text-muted mb-1">
                                Are you sure you want to delete <b>{userToDelete.name}</b>?
                            </p>

                            {/* NEW: who is deleting */}
                            <p className="text-center small text-muted mb-3">
                                Deleting as <b>{currentUser}</b>
                            </p>

                            <div className="mb-3">
                                <label htmlFor="reason" className="form-label d-block text-start">
                                    Why do you want to delete this user?
                                </label>
                                <textarea
                                    id="reason"
                                    className="form-control"
                                    rows="3"
                                    placeholder="e.g. Duplicate account, no longer needed, invalid data..."
                                    value={deleteReason}
                                    onChange={(e) => {
                                        setDeleteReason(e.target.value);
                                        if (deleteError) setDeleteError("");
                                    }}
                                />
                                {deleteError && (
                                    <small className="text-danger">{deleteError}</small>
                                )}
                            </div>

                            <div className="d-flex justify-content-between mt-4">
                                <button
                                    className="btn btn-outline-secondary"
                                    onClick={() => setUserToDelete(null)}
                                >
                                    Cancel
                                </button>

                                <button
                                    className="btn btn-danger"
                                    onClick={confirmDelete}
                                >
                                    Yes, Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}