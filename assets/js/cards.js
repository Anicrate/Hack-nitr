// ==========================================================================
// Resolv — shared complaint card renderer, used by the home preview and the
// full Community Pulse board so both stay visually identical.
// ==========================================================================

import { icon, escapeHtml, formatRelative, STATUS_META, getVotedIds } from './app.js';

function truncate(str = '', n = 120) {
  const clean = str.replace(/\s+/g, ' ').trim();
  return clean.length > n ? `${clean.slice(0, n).trim()}…` : clean;
}

export function renderCard(item) {
  const status = STATUS_META[item.status] || STATUS_META.pending;
  const voted = getVotedIds().has(item.id);
  const avatarImg = item.author?.avatar
    ? `<img src="${item.author.avatar}" alt="" loading="lazy" />`
    : icon('users');

  return `
    <article class="card complaint-card fade-in" data-id="${item.id}">
      <div class="card-top">
        <span class="badge badge-cat">${escapeHtml(item.category)}</span>
        <span class="badge ${status.badge}">${icon(status.icon)}${status.label}</span>
      </div>
      <h3>${escapeHtml(item.title)}</h3>
      <p class="excerpt">${escapeHtml(truncate(item.body))}</p>
      <div class="card-foot">
        <div class="author">
          <span class="avatar">${avatarImg}</span>
          <span>${escapeHtml(item.author?.name || 'Anonymous')} · ${formatRelative(item.createdAt)}</span>
        </div>
        <div class="card-actions">
          <button class="pill-btn vote-btn ${voted ? 'active' : ''}" data-vote-id="${item.id}" type="button" aria-pressed="${voted}">
            ${icon('chevronUp')}<span class="vote-count">${item.votes}</span>
          </button>
          <span class="pill-btn" style="cursor:default;">${icon('messageCircle')}${item.commentCount}</span>
        </div>
      </div>
    </article>`;
}

export function renderEmptyState({ title = 'Nothing here yet', body = '', iconName = 'inbox' } = {}) {
  return `<div class="state-box">${icon(iconName)}<p><strong>${escapeHtml(title)}</strong></p><p>${escapeHtml(body)}</p></div>`;
}

export function renderErrorState(retryId) {
  return `<div class="state-box">${icon('alertCircle')}<p><strong>Couldn't reach the community feed</strong></p>
    <p>The public data source might be offline or you're not connected to the internet.</p>
    <button class="btn btn-outline btn-sm" id="${retryId}" type="button" style="margin-top:1rem;">${icon('refresh')} Try again</button></div>`;
}

export function skeletons(n = 3) {
  return Array.from({ length: n }, () => '<div class="skeleton skeleton-card"></div>').join('');
}
