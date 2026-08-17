import {
  mountChrome, $, $$, icon, escapeHtml, formatDate, formatRelative, debounce,
  getComplaints, effectiveStatus, updateComplaintStatus, STATUS_META, toast,
} from './app.js';
import { renderEmptyState } from './cards.js';

mountChrome();

// Demo-only client-side gate — there is no real backend, so this cannot be
// real authentication (anyone can read this file). It exists purely to
// model "staff area vs. public area," matching the localStorage-only scope
// of the rest of the app.
const PASSCODE = 'resolv-staff';
const UNLOCK_KEY = 'resolv.staffUnlocked';

const gateSection = $('#gateSection');
const consoleSection = $('#consoleSection');

function unlock() {
  sessionStorage.setItem(UNLOCK_KEY, '1');
  gateSection.hidden = true;
  consoleSection.hidden = false;
  renderAll();
}

$('#gateForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const val = $('#passcode').value.trim().toLowerCase();
  if (val === PASSCODE) {
    unlock();
  } else {
    toast('Wrong passcode — try "resolv-staff".', 'error');
  }
});

if (sessionStorage.getItem(UNLOCK_KEY) === '1') unlock();

/* ---------------- console ---------------- */
let activeFilter = 'all';
const listEl = $('#adminList');

function renderStats(all) {
  $('#cTotal').textContent = all.length;
  $('#cPending').textContent = all.filter((c) => c.status === 'pending').length;
  $('#cReview').textContent = all.filter((c) => c.status === 'review').length;
  $('#cResolved').textContent = all.filter((c) => c.status === 'resolved').length;
}

function actionsHtml(c) {
  if (c.status === 'resolved') {
    return `
      <div class="resolution-banner">
        ${icon('checkCircle')}
        <div><strong>Resolved ${formatRelative(c.resolvedAt)}</strong>${escapeHtml(c.resolutionNote || 'No note left.')}</div>
      </div>
      <div class="admin-actions">
        <button class="btn btn-outline btn-sm" data-action="reopen" data-id="${c.id}" type="button">${icon('refresh')} Reopen</button>
      </div>`;
  }
  return `
    <div class="admin-actions">
      ${c.status === 'pending' ? `<button class="btn btn-outline btn-sm" data-action="review" data-id="${c.id}" type="button">${icon('search')} Move to In Review</button>` : ''}
      <button class="btn btn-primary btn-sm" data-action="open-resolve" data-id="${c.id}" type="button">${icon('checkCircle')} Resolve…</button>
    </div>
    <div class="note-box" id="note-${c.id}">
      <label for="note-input-${c.id}" style="font-weight:700; font-size:.85rem;">Resolution note</label>
      <textarea id="note-input-${c.id}" rows="2" placeholder="What was done to fix this?"></textarea>
      <div class="note-actions">
        <button class="btn btn-primary btn-sm" data-action="confirm-resolve" data-id="${c.id}" type="button">Confirm resolved</button>
        <button class="btn btn-ghost btn-sm" data-action="cancel-resolve" data-id="${c.id}" type="button">Cancel</button>
      </div>
    </div>`;
}

function renderAll() {
  const all = getComplaints().map((c) => ({ ...c, status: effectiveStatus(c) }));
  renderStats(all);

  const q = $('#searchInput').value.trim().toLowerCase();
  let filtered = activeFilter === 'all' ? all : all.filter((c) => c.status === activeFilter);
  if (q) {
    filtered = filtered.filter((c) => `${c.id} ${c.category} ${c.firstName} ${c.lastName} ${c.description}`.toLowerCase().includes(q));
  }

  if (all.length === 0) {
    listEl.innerHTML = renderEmptyState({
      title: 'No complaints filed yet',
      body: 'Once someone files a complaint on this device, it will show up here for staff to work.',
      iconName: 'inbox',
    });
    return;
  }
  if (filtered.length === 0) {
    listEl.innerHTML = renderEmptyState({ title: 'Nothing matches', body: 'Try a different filter or search.', iconName: 'search' });
    return;
  }

  listEl.innerHTML = filtered.map((c) => {
    const meta = STATUS_META[c.status];
    return `
      <div class="card admin-card" data-row-id="${c.id}">
        <div class="admin-head">
          <div>
            <span class="badge badge-cat">${escapeHtml(c.category)}</span>
            <h3 style="margin-top:.5rem;">${escapeHtml(c.id)}</h3>
          </div>
          <span class="badge ${meta.badge}">${icon(meta.icon)}${meta.label}</span>
        </div>
        <p style="color:var(--text-muted); font-size:.9rem;">${escapeHtml(c.description)}</p>
        <div class="admin-meta">
          <span>Filed by <strong>${escapeHtml(c.firstName)} ${escapeHtml(c.lastName)}</strong></span>
          <span>${escapeHtml(c.email)}</span>
          <span>${escapeHtml(c.contact || '—')}</span>
          <span>${formatDate(c.createdAt)}</span>
          <span style="text-transform:capitalize;">${escapeHtml(c.urgency || '—')} urgency</span>
        </div>
        ${actionsHtml(c)}
      </div>`;
  }).join('');

  wireRowActions();
}

function wireRowActions() {
  $$('[data-action="review"]', listEl).forEach((btn) => {
    btn.addEventListener('click', () => {
      updateComplaintStatus(btn.dataset.id, 'review');
      toast(`${btn.dataset.id} moved to In Review.`, 'success', 2400);
      renderAll();
    });
  });
  $$('[data-action="reopen"]', listEl).forEach((btn) => {
    btn.addEventListener('click', () => {
      updateComplaintStatus(btn.dataset.id, 'review');
      toast(`${btn.dataset.id} reopened.`, 'info', 2400);
      renderAll();
    });
  });
  $$('[data-action="open-resolve"]', listEl).forEach((btn) => {
    btn.addEventListener('click', () => {
      $(`#note-${btn.dataset.id}`)?.classList.add('open');
      $(`#note-input-${btn.dataset.id}`)?.focus();
    });
  });
  $$('[data-action="cancel-resolve"]', listEl).forEach((btn) => {
    btn.addEventListener('click', () => $(`#note-${btn.dataset.id}`)?.classList.remove('open'));
  });
  $$('[data-action="confirm-resolve"]', listEl).forEach((btn) => {
    btn.addEventListener('click', () => {
      const note = $(`#note-input-${btn.dataset.id}`)?.value || '';
      updateComplaintStatus(btn.dataset.id, 'resolved', note);
      toast(`${btn.dataset.id} marked resolved.`, 'success');
      renderAll();
    });
  });
}

$$('#statusChips .chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    $$('#statusChips .chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    activeFilter = chip.dataset.filter;
    renderAll();
  });
});

$('#searchInput').addEventListener('input', debounce(renderAll, 200));

/* deep link: ?id= scrolls to and highlights a specific row once unlocked */
const params = new URLSearchParams(window.location.search);
const focusId = params.get('id');
if (focusId && sessionStorage.getItem(UNLOCK_KEY) === '1') {
  setTimeout(() => {
    const row = document.querySelector(`[data-row-id="${CSS.escape(focusId)}"]`);
    row?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    row?.style.setProperty('border-color', 'var(--accent)');
  }, 150);
}
