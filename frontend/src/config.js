// Production (Vercel): set REACT_APP_API_URL to the Render backend address.
// Local: uses the same host the page was opened from, on port 8080.
export const API_URL = (process.env.REACT_APP_API_URL || `http://${window.location.hostname}:8080`).replace(/\/$/, "");
