import React from 'react'
import { Navigate } from 'react-router-dom'

// Adding a user now happens in a modal on the Users page.
// This route is kept so old /add links keep working: it opens the modal.
export default function AddUser() {
    return <Navigate to="/" replace state={{ openAddUser: true }} />
}
