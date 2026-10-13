import React from 'react'
import { Navigate, useParams } from 'react-router-dom'

// Editing a user now happens in a modal on the Users page.
// This route is kept so old /edit/:id links keep working: it opens the modal.
export default function EditUser() {
    const { id } = useParams();
    return <Navigate to="/" replace state={{ editUserId: id }} />
}
