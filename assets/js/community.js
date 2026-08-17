import {
  mountChrome, $, $$, debounce, CATEGORIES,
  getComplaints, effectiveStatus, getVoteBonus, toggleVote, toast,
} from './app.js';
import { fetchCommunityFeed } from './api.js';
import { renderCard, renderEmptyState, renderErrorState, skeletons } from './cards.js';

mountChrome();

const categoryFilter = $('#categoryFilter');
CATEGORIES.forEach((cat) => {
  const opt = document.createElement('option');
  opt.value = cat;
  opt.textContent = cat;
  categoryFilter.appendChild(opt);
});

function normalizeLocal(c) {
  const authorName = `${c.firstName} ${c.lastName?.charAt(0) || ''}.`.trim();
  return {
    id: c.id,
    source: 'local',
    title: `${c.category}: ${c.address || 'General concern'}`,
    body: c.description,
    category: c.category,
    status: effectiveStatus(c),
    createdAt: c.createdAt,
    author: {
      name: authorName,
      avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(authorName || c.id)}`,
    },
    votes: getVoteBonus(c.id),
    commentCount: 0,
  };
}

const board = $('#board');
const resultCount = $('#resultCount');
let items = [];

function applyFiltersAndRender() {
  const q = $('#searchInput').value.trim().toLowerCase();
  const cat = categoryFilter.value;
  const status = $('#statusFilter').value;
  const sort = $('#sortFilter').value;

  let filtered = items.filter((it) => {
    if (cat !== 'all' && it.category !== cat) return false;
    if (status !== 'all' && it.status !== status) return false;
    if (q && !(`${it.title} ${it.body} ${it.category}`.toLowerCase().includes(q))) return false;
    return true;
  });

  filtered = filtered.sort((a, b) => {
    if (sort === 'votes') return b.votes - a.votes;
    if (sort === 'discussed') return b.commentCount - a.commentCount;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  resultCount.textContent = `${filtered.length} complaint${filtered.length === 1 ? '' : 's'} found`;

  if (filtered.length === 0) {
    board.innerHTML = renderEmptyState({
      title: 'No complaints match your filters',
      body: 'Try clearing the search or switching categories.',
      iconName: 'search',
    });
    return;
  }

  board.innerHTML = filtered.map(renderCard).join('');
  wireVotes();
}

function wireVotes() {
  $$('.vote-btn', board).forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.voteId;
      const nowActive = toggleVote(id);
      btn.classList.toggle('active', nowActive);
      btn.setAttribute('aria-pressed', String(nowActive));
      const countEl = $('.vote-count', btn);
      countEl.textContent = Number(countEl.textContent) + (nowActive ? 1 : -1);
      const item = items.find((i) => i.id === id);
      if (item) item.votes += nowActive ? 1 : -1;
      if (nowActive) toast('Thanks — you upvoted this issue.', 'success', 2200);
    });
  });
}

async function load() {
  board.innerHTML = skeletons(6);
  const localPublic = getComplaints().filter((c) => c.isPublic).map(normalizeLocal);
  try {
    const feed = await fetchCommunityFeed({ limit: 24 });
    items = [...localPublic, ...feed];
    applyFiltersAndRender();
  } catch (err) {
    console.error(err);
    if (localPublic.length) {
      items = localPublic;
      applyFiltersAndRender();
      toast("Couldn't load the public feed — showing only your local complaints.", 'error');
    } else {
      board.innerHTML = renderErrorState('retryBoard');
      $('#retryBoard')?.addEventListener('click', load);
    }
  }
}

['input', 'change'].forEach((evt) => {
  $('#searchInput').addEventListener(evt, debounce(applyFiltersAndRender, 200));
});
categoryFilter.addEventListener('change', applyFiltersAndRender);
$('#statusFilter').addEventListener('change', applyFiltersAndRender);
$('#sortFilter').addEventListener('change', applyFiltersAndRender);

load();
