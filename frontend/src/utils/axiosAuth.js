// src/utils/axiosAuth.js
// Adds the signed-in user's name to every restore request, so the
// Recently Deleted page doesn't need to change.
import axios from 'axios'
import { getAuthUser } from './auth'

axios.interceptors.request.use((config) => {
    const url = config.url || ''

    if (url.includes('/restore/') && !url.includes('restoredBy=')) {
        const user = getAuthUser()
        const name = user?.fullName || user?.username || 'Unknown'
        config.params = { ...(config.params || {}), restoredBy: name }
    }

    return config
})