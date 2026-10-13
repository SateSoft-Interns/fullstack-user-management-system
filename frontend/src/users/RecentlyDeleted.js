import { API_URL } from '../config'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { recordActivity } from '../utils/activity'
import { FiEye } from "react-icons/fi";
import { MdRestore } from "react-icons/md";
import { MdAutoDelete } from "react-icons/md";
import { RiDeleteBin7Line } from "react-icons/ri";
import { LuArchiveRestore } from "react-icons/lu";
import { MdOutlineSettingsBackupRestore } from "react-icons/md";
import { MdOutlineAutoDelete } from "react-icons/md";
import { BiReset } from "react-icons/bi";
export default function RecentlyDeleted() {

    const [history, setHistory] = useState([])
    // restored records stay in the backend for audit; hidden unless toggled on
    const [showRestored, setShowRestored] = useState(false)
    const [search, setSearch] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const rowsPerPage = 10
    const [selectedRow, setSelectedRow] = useState(null)

    // 👇 NEW: restore modal state
    const [rowToRestore, setRowToRestore] = useState(null)
    const [restoreRemarks, setRestoreRemarks] = useState("")
    const [restoreError, setRestoreError] = useState("")

    // -------- Load history --------
    const loadHistory = async () => {
        const res = await axios.get(API_URL + "/history");
        setHistory(res.data);
    };

    useEffect(() => {
        loadHistory();
    }, []);

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date)) return 'N/A';
        return date.toLocaleString('en-US', {
            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
        });
    };

    // -------- Open the restore modal --------
    const openRestoreModal = (row) => {
        setRowToRestore(row);
        setRestoreRemarks("");
        setRestoreError("");
    };

    // -------- Confirm restore --------
    const confirmRestore = async () => {
        if (!restoreRemarks.trim()) {
            setRestoreError("Please tell us why you're restoring this user.");
            return;
        }

        try {
            await axios.post(
                API_URL + `/restore/${rowToRestore.id}`,
                null,
                { params: { remarks: restoreRemarks } }
            );

            setRowToRestore(null);
            setRestoreRemarks("");
            setRestoreError("");

            recordActivity('restored');
            // record leaves Recently Deleted immediately; user is back in the active list
            loadHistory();
        } catch (err) {
            console.error(err);
            alert("Restore failed: " + (err.response?.data || err.message));
        }
    };

    const handlePurge = async (archiveId) => {
        if (!window.confirm("Permanently delete this record? This cannot be undone.")) return;
        await axios.delete(API_URL + `/history/${archiveId}`);
        loadHistory();
    };

    const handleClearAll = async () => {
        if (!window.confirm("Clear the ENTIRE history? This cannot be undone.")) return;
        await axios.delete(API_URL + `/history/all`);
        loadHistory();
    };

    // -------- Search --------
    const filtered = history.filter(h => (showRestored || !h.restored) && (
        (h.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (h.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (h.username || "").toLowerCase().includes(search.toLowerCase()) ||
        (h.reason || "").toLowerCase().includes(search.toLowerCase())
    ));

    // -------- Pagination --------
    const indexOfLast = currentPage * rowsPerPage
    const indexOfFirst = indexOfLast - rowsPerPage
    const currentRows = filtered.slice(indexOfFirst, indexOfLast)
    const totalPages = Math.ceil(filtered.length / rowsPerPage)

    return (
        <div className='container'>
            <div className='py-4'>

                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h3 > Recently Deleted({filtered.length})</h3>

                    {history.length > 0 && (
                        <button className="btn btn-outline-danger" onClick={handleClearAll}>
                            Clear All History
                        </button>
                    )}
                </div>

                {/* Search + show-restored toggle */}
                <div className="mb-3 d-flex flex-wrap align-items-center gap-3">
                    <input
                        type="text"
                        className="form-control"
                        style={{ maxWidth: '420px' }}
                        placeholder="Search by name, email, username, or reason..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                    />
                    <div className="form-check mb-0">
                        <input
                            id="showRestored"
                            type="checkbox"
                            className="form-check-input"
                            checked={showRestored}
                            onChange={(e) => { setShowRestored(e.target.checked); setCurrentPage(1); }}
                        />
                        <label htmlFor="showRestored" className="form-check-label">
                            Show restored history
                        </label>
                    </div>
                </div>

                {/* Table */}
                <div className="table-responsive users-card p-0">
                    <table className="table align-middle mb-0">
                        <thead>
                            <tr>
                                <th className="text-start">#</th>
                                <th className="text-start">NAME</th>
                                <th className="text-start">EMAIL</th>
                                <th className="text-start">PHONE</th>
                                <th className="text-start">NETWORK</th>
                                <th className="text-start">REASON</th>
                                <th className="text-start">DELETED AT</th>
                                <th className="text-start">STATUS</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentRows.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="text-center text-muted py-4">
                                        No deleted Clients found.
                                    </td>
                                </tr>
                            ) : currentRows.map((h, index) => (
                                <tr key={h.id}>
                                    <td className="text-start">{indexOfFirst + index + 1}</td>
                                    <td className="text-start">{h.name}</td>
                                    <td className="text-start">{h.email}</td>
                                    <td className="text-start">{h.phone}</td>
                                    <td className="text-start">
                                        {h.network && (
                                            <span className={
                                                h.network === "MTN"
                                                    ? "badge bg-warning text-dark"
                                                    : "badge bg-danger"
                                            }>
                                                {h.network}
                                            </span>
                                        )}
                                    </td>
                                    <td className="text-start" style={{ maxWidth: 220 }}>{h.reason}</td>
                                    <td className="text-start">{formatDateTime(h.deletedAt)}</td>

                                    <td className="text-start">
                                        {h.restored
                                            ? <span className="badge bg-success">Restored</span>
                                            : <span className="badge bg-danger">Deleted</span>}
                                    </td>

                                    <td className="text-start text-nowrap">
                                        <button
                                            className="btn btn-primary btn-sm mx-1"
                                            onClick={() => setSelectedRow(h)}
                                        >
                                            <FiEye className="me-1" /> View
                                        </button>

                                        {!h.restored && (
                                            <button
                                                className="btn btn-success btn-sm mx-1"
                                                onClick={() => openRestoreModal(h)}
                                            >
                                                <MdRestore className="me-1" /> Restore
                                            </button>
                                        )}

                                        <button
                                            className="btn btn-outline-danger btn-sm mx-1"
                                            onClick={() => handlePurge(h.id)}
                                        >
                                            Delete Forever
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <nav>
                        <ul className="pagination justify-content-center">
                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>Previous</button>
                            </li>
                            {[...Array(totalPages)].map((_, i) => (
                                <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                                    <button className="page-link" onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                                </li>
                            ))}
                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
                            </li>
                        </ul>
                    </nav>
                )}

                <div className="text-center mt-4">
                    <Link className="btn btn-primary" to="/">Back Home</Link>
                </div>

                {/* ============ VIEW MODAL ============ */}
                {selectedRow && (
                    <div
                        onClick={() => setSelectedRow(null)}
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
                                background: '#fff',
                                borderRadius: '16px',
                                padding: '32px',
                                width: '90%',
                                maxWidth: '520px',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                                maxHeight: '90vh',
                                overflowY: 'auto'
                            }}
                        >
                            <h3 className="text-center mb-4">Deleted Client Details</h3>

                            <ul className="list-group list-group-flush">
                                <li className="list-group-item d-flex justify-content-between">
                                    <b>Name:</b><span>{selectedRow.name}</span>
                                </li>
                                <li className="list-group-item d-flex justify-content-between">
                                    <b>Username:</b><span>{selectedRow.username}</span>
                                </li>
                                <li className="list-group-item d-flex justify-content-between">
                                    <b>Email:</b><span>{selectedRow.email}</span>
                                </li>
                                <li className="list-group-item d-flex justify-content-between">
                                    <b>Gender:</b>
                                    <span className={
                                        selectedRow.gender === "Male" ? "badge bg-primary"
                                            : selectedRow.gender === "Female" ? "badge bg-danger"
                                                : "badge bg-secondary"
                                    }>
                                        {selectedRow.gender || "N/A"}
                                    </span>
                                </li>
                                <li className="list-group-item d-flex justify-content-between">
                                    <b>Phone:</b>
                                    <span>
                                        {selectedRow.phone || "N/A"}{" "}
                                        {selectedRow.network && (
                                            <span className={
                                                selectedRow.network === "MTN"
                                                    ? "badge bg-warning text-dark ms-2"
                                                    : "badge bg-danger ms-2"
                                            }>
                                                {selectedRow.network}
                                            </span>
                                        )}
                                    </span>
                                </li>

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
                                            {selectedRow.reason || "No reason recorded"}
                                        </div>
                                    </div>

                                    {/* NEW: who deleted the client */}
                                    <div className="d-flex justify-content-between align-items-center px-3 py-3 border-bottom">
                                        <b>Deleted By</b>
                                        <span>{selectedRow.deletedBy || "—"}</span>
                                    </div>


                                    <div className="d-flex justify-content-between align-items-center px-3 py-3">
                                        <b>Deleted At</b>
                                        <span>{formatDateTime(selectedRow.deletedAt)}</span>
                                    </div>
                                </div>

                                {selectedRow.restored && (
                                    <>
                                        <div className="border rounded-3 mt-3 overflow-hidden">
                                            <div
                                                className="px-3 py-2 fw-bold text-start"
                                                style={{ background: '#e8f5e9', color: '#1e7e34' }}
                                            >
                                                <LuArchiveRestore size={21} /> Restore Audit
                                            </div>
                                            <div className="d-flex justify-content-between align-items-center px-3 py-3 border-bottom">
                                                <b>Restored By</b>
                                                <span>{selectedRow.restoredBy || "—"}</span>
                                            </div>
                                            <div className="d-flex justify-content-between align-items-center px-3 py-3 border-bottom">
                                                <b>Restored At</b>
                                                <span>{formatDateTime(selectedRow.restoredAt)}</span>
                                            </div>

                                            <div className="d-flex justify-content-between align-items-center px-3 py-3 border-bottom">
                                                <b>Duration Deleted</b>
                                                <span className="badge bg-info text-dark">
                                                    {selectedRow.restoreDuration || "—"}
                                                </span>
                                            </div>

                                            <div className="px-3 py-3">
                                                <div className="fw-semibold mb-2 text-start">Restore Remarks</div>
                                                <div
                                                    className="p-3 rounded bg-light text-start text-muted"
                                                    style={{ minHeight: '64px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                                                >
                                                    {selectedRow.restoreRemarks || "No remarks"}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </ul>

                            <div className="text-center mt-4 d-flex justify-content-center gap-2">
                                {!selectedRow.restored && (
                                    <button
                                        className="btn btn-success"
                                        onClick={() => {
                                            setSelectedRow(null);
                                            openRestoreModal(selectedRow);
                                        }}
                                    >
                                        ♻️ Restore
                                    </button>
                                )}
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setSelectedRow(null)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ============ RESTORE MODAL (NEW) ============ */}
                {rowToRestore && (
                    <div
                        onClick={() => setRowToRestore(null)}
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
                            <h3 className="text-center mb-3 text-success">Restore Client</h3>

                            <p className="text-center text-muted">
                                Are you sure you want to restore <b>{rowToRestore.name}</b>?
                            </p>

                            <div className="mb-3">
                                <label htmlFor="remarks" className="form-label d-block text-start">
                                    Why are you restoring this Client?
                                </label>
                                <textarea
                                    id="remarks"
                                    className="form-control"
                                    rows="3"
                                    placeholder="e.g. Confirmed with HR, mistake deletion, account needed again..."
                                    value={restoreRemarks}
                                    onChange={(e) => {
                                        setRestoreRemarks(e.target.value);
                                        if (restoreError) setRestoreError("");
                                    }}
                                />
                                {restoreError && (
                                    <small className="text-danger">{restoreError}</small>
                                )}
                            </div>

                            <div className="d-flex justify-content-between mt-4">
                                <button
                                    className="btn btn-outline-secondary"
                                    onClick={() => setRowToRestore(null)}
                                >
                                    Cancel
                                </button>

                                <button
                                    className="btn btn-success"
                                    onClick={confirmRestore}
                                >
                                    Yes, Restore
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}