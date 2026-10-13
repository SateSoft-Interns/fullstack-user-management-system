// Weekly user-activity tracking (Added / Deleted / Restored per weekday).
//
// The backend does not expose an activity endpoint, so activity is kept in
// localStorage in this shape:
//   { Monday: { added: 0, deleted: 0, restored: 0 }, ... Sunday: {...} }
//
// On first use the store is SEEDED from real backend data (users' createdAt,
// history deletedAt / restoredAt). After that, every successful add / delete /
// restore increments the matching weekday via recordActivity().

export const DAYS = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday',
    'Friday', 'Saturday', 'Sunday'
];

const STORAGE_KEY = 'userActivityByWeekday.v1';

export const emptyActivity = () =>
    DAYS.reduce((acc, day) => {
        acc[day] = { added: 0, deleted: 0, restored: 0 };
        return acc;
    }, {});

// Parse a date WITHOUT timezone drift: a bare "YYYY-MM-DD" string is treated
// as a local calendar date (plain new Date() would read it as UTC midnight and
// can land on the previous day). Full timestamps are converted to local time.
export const parseLocalDate = (value) => {
    if (!value) return null;
    if (value instanceof Date) return isNaN(value) ? null : value;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value));
    const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(value);
    return isNaN(d) ? null : d;
};

// JS getDay(): 0 = Sunday ... 6 = Saturday  ->  our Monday-first names
export const weekdayName = (date) => DAYS[(date.getDay() + 6) % 7];

const read = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

const write = (data) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch { /* storage unavailable - ignore */ }
};

// Build activity from existing backend records (used once, for seeding).
export const buildActivityFromData = (users = [], history = []) => {
    const activity = emptyActivity();
    const bump = (dateValue, type) => {
        const d = parseLocalDate(dateValue);
        if (d) activity[weekdayName(d)][type] += 1;
    };

    users.forEach(u => bump(u.createdAt || u.created_at, 'added'));
    history.forEach(h => {
        bump(h.deletedAt, 'deleted');
        if (h.restored) bump(h.restoredAt, 'restored');
        // deleted-but-not-restored users are no longer in the users list,
        // so count their original creation here (no double counting)
        if (!h.restored) bump(h.createdAt || h.created_at, 'added');
    });
    return activity;
};

// Returns the stored activity, seeding it from backend data the first time.
export const getActivity = (users, history) => {
    let activity = read();
    if (!activity) {
        activity = buildActivityFromData(users, history);
        write(activity);
    }
    // make sure every day/key exists
    const merged = emptyActivity();
    DAYS.forEach(day => {
        merged[day] = { ...merged[day], ...(activity[day] || {}) };
    });
    return merged;
};

// Call after a SUCCESSFUL add / delete / restore.
// If the store has not been seeded yet, nothing is written: the record is
// already in the backend and will be picked up when the store is seeded.
export const recordActivity = (type, when = new Date()) => {
    const activity = read();
    if (!activity) return;
    const day = weekdayName(when);
    activity[day] = activity[day] || { added: 0, deleted: 0, restored: 0 };
    activity[day][type] = (activity[day][type] || 0) + 1;
    write(activity);
};

// Chart-friendly rows: [{ day, Added, Deleted, Restored }, ...] Monday-Sunday
export const toChartData = (activity) =>
    DAYS.map(day => ({
        day,
        Added: activity[day].added,
        Deleted: activity[day].deleted,
        Restored: activity[day].restored
    }));
