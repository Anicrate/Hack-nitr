import {
  mountChrome, $, $$, icon, escapeHtml, formatDate, formatRelative,
  getComplaints, getComplaintById, computeStatus, STATUS_META,
} from './app.js';
import { renderEmptyState } from './cards.js';

mountChrome();

const STEP_ORDER = ['pending', 'review', 'resolved'];

function timelineHtml(status) {
  const currentIdx = STEP_ORDER.indexOf(status);
  return STEP_ORDER.map((step, i) => {
    const meta = STATUS_META[step];
    let cls = '';
    if (i < currentIdx) cls = 'done';
    else if (i === currentIdx) cls = 'current';
    const dotIcon = i < currentIdx ? 'check' : meta.icon;
    return `<div class="timeline-step ${cls}">
      <div class="timeline-dot">${icon(dotIcon)}</div>
      <div class="t-label">${meta.label}</div>
    </div>`;
  }).join('');
}

function renderDetail(c) {
  const status = computeStatus(c.createdAt);
  const meta = STATUS_META[status];
  const resultArea = $('#resultArea');
  resultArea.innerHTML = `
    <div class="card detail-card fade-in">
      <div class="detail-head">
        <div>
          <span class="badge badge-cat">${escapeHtml(c.category)}</span>
          <h3 style="margin-top:.6rem;">${escapeHtml(c.category)} complaint — ${escapeHtml(c.id)}</h3>
        </div>
        <span class="badge ${meta.badge}">${icon(meta.icon)}${meta.label}</span>
      </div>
      <div class="timeline">${timelineHtml(status)}</div>
      <p>${escapeHtml(c.description)}</p>
      <div class="meta-grid">
        <div><div class="k">Filed</div><div class="v">${formatDate(c.createdAt)}</div></div>
        <div><div class="k">Urgency</div><div class="v" style="text-transform:capitalize;">${escapeHtml(c.urgency || '—')}</div></div>
        <div><div class="k">Location</div><div class="v">${escapeHtml(c.address || '—')}</div></div>
        <div><div class="k">Filed by</div><div class="v">${escapeHtml(c.firstName)} ${escapeHtml(c.lastName)}</div></div>
        <div><div class="k">Visibility</div><div class="v">${c.isPublic ? 'Public' : 'Private'}</div></div>
        <div><div class="k">Last update</div><div class="v">${formatRelative(c.createdAt)}</div></div>
      </div>
    </div>`;
}

function renderNotFound(query) {
  $('#resultArea').innerHTML = `<div class="card" style="padding:0;">${renderEmptyState({
    title: 'No complaint found',
    body: `We couldn't find anything matching "${query}". Double-check the ID — it looks like RSV-XXXXXX.`,
    iconName: 'alertCircle',
  })}</div>`;
}

function lookup(id) {
  const trimmed = id.trim();
  if (!trimmed) return;
  const found = getComplaintById(trimmed);
  if (found) renderDetail(found);
  else renderNotFound(trimmed);
}

$('#lookupBtn').addEventListener('click', () => lookup($('#lookupInput').value));
$('#lookupInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') lookup($('#lookupInput').value);
});

/* ---------------- my complaints list ---------------- */
let activeFilter = 'all';
const listEl = $('#myComplaintsList');

function renderList() {
  const all = getComplaints().map((c) => ({ ...c, status: computeStatus(c.createdAt) }));
  const filtered = activeFilter === 'all' ? all : all.filter((c) => c.status === activeFilter);

  if (all.length === 0) {
    listEl.innerHTML = renderEmptyState({
      title: 'No complaints filed yet',
      body: 'Anything you file on this device will show up here for quick tracking.',
      iconName: 'fileText',
    });
    return;
  }
  if (filtered.length === 0) {
    listEl.innerHTML = renderEmptyState({ title: 'Nothing in this filter', body: 'Try a different status.', iconName: 'filter' });
    return;
  }

  listEl.innerHTML = filtered.map((c) => {
    const meta = STATUS_META[c.status];
    return `<div class="mini-list-row" data-id="${c.id}">
      <div>
        <div class="title">${escapeHtml(c.category)} — ${escapeHtml(c.id)}</div>
        <div class="sub">${formatRelative(c.createdAt)} · ${escapeHtml(c.description.slice(0, 60))}${c.description.length > 60 ? '…' : ''}</div>
      </div>
      <span class="badge ${meta.badge}">${icon(meta.icon)}${meta.label}</span>
    </div>`;
  }).join('');

  $$('.mini-list-row', listEl).forEach((row) => {
    row.addEventListener('click', () => {
      $('#lookupInput').value = row.dataset.id;
      lookup(row.dataset.id);
      $('#resultArea').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });
}

$$('#statusChips .chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    $$('#statusChips .chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    activeFilter = chip.dataset.filter;
    renderList();
  });
});

renderList();

/* ---------------- deep link support (?id=) ---------------- */
const params = new URLSearchParams(window.location.search);
const deepLinkId = params.get('id');
if (deepLinkId) {
  $('#lookupInput').value = deepLinkId;
  lookup(deepLinkId);
}
