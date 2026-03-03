const BASE_URL = import.meta.env.VITE_API_URL;

let onUnauthorized = null;
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
    credentials: "include",
  });

  const isAuthRoute =
    path === "/login" || path === "/register" || path === "/check-session";

  if (res.status === 401 && !isAuthRoute) {
    if (onUnauthorized) onUnauthorized();
    throw new Error("Session expired. Please log in again.");
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }

  return data;
}

export const api = {
  // ______ Auth ______________________________________________________________
  checkSession: () => request("/check-session"),

  register: (userData) =>
    request("/register", { method: "POST", body: JSON.stringify(userData) }),

  login: (userData) =>
    request("/login", { method: "POST", body: JSON.stringify(userData) }),

  logout: () => request("/logout", { method: "POST" }),

  // ── Notes CRUD ──────────────────────────────────────────────────────────
  getNotes: () => request("/notes"),

  createNote: (note) =>
    request("/notes", { method: "POST", body: JSON.stringify(note) }),

  updateNote: (id, data) =>
    request(`/notes/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  deleteNote: (id) => request(`/notes/${id}`, { method: "DELETE" }),

  // ── AI ──────────────────────────────────────────────────────────────────
  summarizeNote: (id) => request(`/notes/${id}/summarize`, { method: "POST" }),

  askAboutNote: (id, question, conversationHistory = []) =>
    request(`/notes/${id}/ask`, {
      method: "POST",
      body: JSON.stringify({ question, conversationHistory }),
    }),

  optimizeNote: (id, instruction) =>
    request(`/notes/${id}/optimize`, {
      method: "POST",
      body: JSON.stringify({ instruction }),
    }),
};
