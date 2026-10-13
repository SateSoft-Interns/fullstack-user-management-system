// Simple client-side session helpers.
// "Remember me" ON  -> kept in localStorage   (survives closing the browser)
// "Remember me" OFF -> kept in sessionStorage (cleared when the tab/browser closes)

const KEY = 'auth.user';

export const getAuthUser = () => {
    try {
        const raw = localStorage.getItem(KEY) || sessionStorage.getItem(KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

export const saveAuthUser = (user, remember = false) => {
    clearAuthUser();
    try {
        (remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(user));
    } catch { /* storage unavailable - ignore */ }
};

export const clearAuthUser = () => {
    try {
        localStorage.removeItem(KEY);
        sessionStorage.removeItem(KEY);
    } catch { /* ignore */ }
};
