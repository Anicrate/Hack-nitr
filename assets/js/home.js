import { mountChrome, $, $$, getComplaints, effectiveStatus, toggleVote, toast } from './app.js';
import { fetchCommunityFeed } from './api.js';
import { renderCard, renderErrorState, skeletons } from './cards.js';

mountChrome();

/* ---------------- local stats ---------------- */
const local = getComplaints();
const withStatus = local.map((c) => ({ ...c, status: effectiveStatus(c) }));
const pending = withStatus.filter((c) => c.status === 'pending').length;
const review = withStatus.filter((c) => c.status === 'review').length;
const resolved = withStatus.filter((c) => c.status === 'resolved').length;

$('#statTotal').textContent = local.length;
$('#statPending').textContent = pending;
$('#statReview').textContent = review;
$('#statResolved').textContent = resolved;

$('#heroTotal').textContent = local.length;
$('#heroResolved').textContent = resolved;

/* ---------------- community pulse preview ---------------- */
const previewEl = $('#pulsePreview');

async function loadPreview() {
  previewEl.innerHTML = skeletons(3);
  try {
    const feed = await fetchCommunityFeed({ limit: 9 });
    const top = feed.slice(0, 3);
    previewEl.innerHTML = top.map(renderCard).join('');
    $('#heroVoices').textContent = local.filter((c) => c.isPublic).length + feed.length;
    wireVotes();
  } catch (err) {
    console.error(err);
    previewEl.innerHTML = renderErrorState('retryPreview');
    $('#retryPreview')?.addEventListener('click', loadPreview);
  }
}

function wireVotes() {
  $$('.vote-btn', previewEl).forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.voteId;
      const nowActive = toggleVote(id);
      btn.classList.toggle('active', nowActive);
      const countEl = $('.vote-count', btn);
      countEl.textContent = Number(countEl.textContent) + (nowActive ? 1 : -1);
      if (nowActive) toast('Thanks — you upvoted this issue.', 'success', 2200);
    });
  });
}

loadPreview();
