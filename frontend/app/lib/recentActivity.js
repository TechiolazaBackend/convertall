const STORAGE_KEY = 'technolaza_recent_activity_v1';
const EVENT_KEY = 'technolaza:activity-updated';
const MAX_ITEMS = 5;

function readRaw() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const payload = localStorage.getItem(STORAGE_KEY);
    const parsed = payload ? JSON.parse(payload) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function loadRecentActivity() {
  return readRaw().slice(0, MAX_ITEMS);
}

export function recordRecentActivity(entry) {
  if (typeof window === 'undefined') {
    return;
  }

  const item = {
    id:
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };

  const next = [item, ...readRaw()].slice(0, MAX_ITEMS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT_KEY));
}

export function subscribeRecentActivity(callback) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handler = () => callback(loadRecentActivity());
  window.addEventListener(EVENT_KEY, handler);

  return () => window.removeEventListener(EVENT_KEY, handler);
}
