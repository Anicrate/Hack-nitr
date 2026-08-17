// ==========================================================================
// Resolv — shared app utilities: theme, nav, storage, toasts, icons, helpers
// No framework, no build step — plain ES module imported by every page.
// ==========================================================================

/* ---------------------------- tiny dom helpers --------------------------- */
export const $ = (sel, ctx = document) => ctx.querySelector(sel);
export const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

export function escapeHtml(str = '') {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

export function debounce(fn, wait = 250) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}

export function formatDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatRelative(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

/* -------------------------------- icons ---------------------------------- */
// Small hand-rolled stroke icon set (24x24, currentColor) — no external deps.
const ICON_PATHS = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  filter: '<path d="M4 5h16M7 12h10M10 19h4"/>',
  arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.5 2.5 5-5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  alertCircle: '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/>',
  chevronUp: '<path d="m18 15-6-6-6 6"/>',
  messageCircle: '<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.4 0-2.7-.3-3.9-1L3 20l1.1-4.2A8.5 8.5 0 1 1 21 11.5Z"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  fileText: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M9 13h6M9 17h6M9 9h1"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  shieldCheck: '<path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5Z"/><path d="m9 12 2 2 4-4"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13l3.5 7v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7Z"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L8 9.7a16 16 0 0 0 6.3 6.3l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2Z"/>',
  mapPin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  plusCircle: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  idCard: '<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="12" r="2"/><path d="M14 10h5M14 14h3"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m14.5 9.5-2 5-5 2 2-5Z"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/>',
  trendingUp: '<path d="M3 17 9 11l4 4 8-8"/><path d="M15 7h6v6"/>',
};

export function icon(name, cls = '') {
  const body = ICON_PATHS[name] || ICON_PATHS.alertCircle;
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

/* ------------------------------- page chrome -------------------------------- */
// Fills every [data-icon="name"] element with its SVG, and wires up the
// theme toggle / hamburger button icons. Call once per page after the DOM
// (nav + footer markup) is present.
export function hydrateIcons(root = document) {
  $$('[data-icon]', root).forEach((el) => {
    el.innerHTML = icon(el.dataset.icon);
  });
}

export function mountChrome() {
  const themeBtn = $('#themeToggle');
  if (themeBtn && !themeBtn.innerHTML.trim()) {
    themeBtn.innerHTML = icon('sun', 'icon-sun') + icon('moon', 'icon-moon');
  }
  const navBtn = $('.nav-toggle');
  if (navBtn && !navBtn.innerHTML.trim()) navBtn.innerHTML = icon('menu');
  hydrateIcons();
  initNav();
  initThemeToggle();
}

/* -------------------------------- theme ----------------------------------- */
const THEME_KEY = 'resolv.theme';

export function getTheme() {
  return localStorage.getItem(THEME_KEY) ||
    (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

export function toggleTheme() {
  const next = getTheme() === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
}

/* Runs immediately (before DOMContentLoaded) via inline script in <head>,
   but we also wire the toggle button once DOM is ready. */
export function initThemeToggle() {
  const btn = $('#themeToggle');
  if (!btn) return;
  btn.addEventListener('click', toggleTheme);
}

/* --------------------------------- nav ------------------------------------ */
export function initNav() {
  const toggle = $('.nav-toggle');
  const links = $('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    $$('.nav-links a').forEach((a) => a.addEventListener('click', () => links.classList.remove('open')));
  }
  const page = document.body.dataset.page;
  $$('.nav-links a[data-nav]').forEach((a) => {
    if (a.dataset.nav === page) a.classList.add('active');
  });
}

/* -------------------------------- toasts ----------------------------------- */
function toastStack() {
  let stack = $('.toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    document.body.appendChild(stack);
  }
  return stack;
}

export function toast(message, type = 'info', ms = 3800) {
  const stack = toastStack();
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const iconName = type === 'success' ? 'checkCircle' : type === 'error' ? 'alertCircle' : 'inbox';
  el.innerHTML = `${icon(iconName)}<p>${escapeHtml(message)}</p>`;
  stack.appendChild(el);
  setTimeout(() => {
    el.style.animation = 'toast-in .2s ease reverse';
    setTimeout(() => el.remove(), 180);
  }, ms);
}

/* ------------------------------ domain data -------------------------------- */
export const CATEGORIES = ['Academic', 'Financial', 'Maintenance', 'Hostel & Mess', 'Technology', 'Other'];

export const STATUS_META = {
  pending: { label: 'Pending', badge: 'badge-status-pending', icon: 'clock' },
  review: { label: 'In Review', badge: 'badge-status-review', icon: 'search' },
  resolved: { label: 'Resolved', badge: 'badge-status-resolved', icon: 'checkCircle' },
};

// Simulated SLA engine: since there's no real backend, a complaint's status
// advances deterministically with elapsed time so tracking feels alive
// instead of being permanently "Pending".
export function computeStatus(createdAtISO) {
  const mins = (Date.now() - new Date(createdAtISO).getTime()) / 60000;
  if (mins < 3) return 'pending';
  if (mins < 10) return 'review';
  return 'resolved';
}

/* -------------------------------- storage ----------------------------------- */
const KEYS = {
  complaints: 'resolv.complaints',
  contact: 'resolv.contactMessages',
  votes: 'resolv.votedPublicIds',
  publicVoteBonus: 'resolv.publicVoteBonus',
};

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function generateComplaintId() {
  const time = Date.now().toString(36).toUpperCase().slice(-5);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 5);
  return `RSV-${time}${rand}`;
}

export function getComplaints() {
  return readJSON(KEYS.complaints, []);
}

export function saveComplaint(complaint) {
  const all = getComplaints();
  all.unshift(complaint);
  writeJSON(KEYS.complaints, all);
  return complaint;
}

export function getComplaintById(id) {
  return getComplaints().find((c) => c.id.toLowerCase() === String(id).toLowerCase());
}

export function getContactMessages() {
  return readJSON(KEYS.contact, []);
}

export function saveContactMessage(msg) {
  const all = getContactMessages();
  all.unshift(msg);
  writeJSON(KEYS.contact, all);
  return msg;
}

export function getVotedIds() {
  return new Set(readJSON(KEYS.votes, []));
}

export function toggleVote(id) {
  const set = getVotedIds();
  const bonus = readJSON(KEYS.publicVoteBonus, {});
  const wasVoted = set.has(id);
  if (wasVoted) {
    set.delete(id);
    bonus[id] = (bonus[id] || 1) - 1;
  } else {
    set.add(id);
    bonus[id] = (bonus[id] || 0) + 1;
  }
  writeJSON(KEYS.votes, Array.from(set));
  writeJSON(KEYS.publicVoteBonus, bonus);
  return !wasVoted;
}

export function getVoteBonus(id) {
  return readJSON(KEYS.publicVoteBonus, {})[id] || 0;
}

/* ------------------------------- boot theme --------------------------------- */
applyTheme(getTheme());
