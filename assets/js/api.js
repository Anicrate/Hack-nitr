// ==========================================================================
// Resolv — public data layer.
//
// There's no real complaints backend, so the "Community Pulse" board is
// powered by JSONPlaceholder (https://jsonplaceholder.typicode.com), a free
// public REST API. Its /posts + /users + /comments resources map naturally
// onto complaint threads: a post = a filed complaint, its author = the
// filer, its comments = responses from staff/other students. We deterministically
// derive a category/status/vote-count from each record's id so the board
// looks the same on every reload instead of reshuffling randomly.
// ==========================================================================

import { CATEGORIES, getVoteBonus } from './app.js';

const API_BASE = 'https://jsonplaceholder.typicode.com';
const CACHE_KEY = 'resolv.publicFeedCache.v1';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
// Always fetch/cache this many posts under the hood, then slice per caller —
// so a small request (e.g. the home page preview) can never poison the
// cache for a later, larger request (e.g. the full Community board).
const MAX_FEED_SIZE = 30;

function hashToIndex(n, len) {
  return n % len;
}

function deriveCategory(id) {
  return CATEGORIES[hashToIndex(id * 7, CATEGORIES.length)];
}

function deriveStatus(id) {
  const buckets = ['resolved', 'review', 'pending', 'resolved', 'review'];
  return buckets[hashToIndex(id * 3, buckets.length)];
}

function deriveCreatedAt(id) {
  // Spread fake filing dates across the last ~21 days, stable per id.
  const daysAgo = (id * 13) % 21;
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours((id * 5) % 24, (id * 17) % 60);
  return d.toISOString();
}

function baseVotes(id) {
  return 3 + ((id * 11) % 34);
}

function titleCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

async function fetchJSON(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`Request failed: ${path} (${res.status})`);
  return res.json();
}

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ fetchedAt: Date.now(), data }));
  } catch {
    /* storage full/unavailable — non-fatal */
  }
}

/**
 * Fetches and normalizes a community complaint feed from JSONPlaceholder.
 * @param {{limit?: number, force?: boolean}} opts
 * @returns {Promise<Array>} normalized complaint-like objects
 */
export async function fetchCommunityFeed({ limit = 12, force = false } = {}) {
  if (!force) {
    const cached = readCache();
    if (cached) return cached.slice(0, limit);
  }

  const [posts, users, comments] = await Promise.all([
    fetchJSON(`/posts?_limit=${MAX_FEED_SIZE}`),
    fetchJSON('/users'),
    fetchJSON('/comments'),
  ]);

  const usersById = new Map(users.map((u) => [u.id, u]));
  const commentCountByPost = new Map();
  for (const c of comments) {
    commentCountByPost.set(c.postId, (commentCountByPost.get(c.postId) || 0) + 1);
  }

  const feed = posts.map((post) => {
    const user = usersById.get(post.userId) || { name: 'Anonymous', email: '' };
    const seed = encodeURIComponent(user.name || `user${post.userId}`);
    return {
      id: `PUB-${String(post.id).padStart(4, '0')}`,
      source: 'public',
      title: titleCase(post.title),
      body: post.body,
      category: deriveCategory(post.id),
      status: deriveStatus(post.id),
      createdAt: deriveCreatedAt(post.id),
      author: {
        name: user.name,
        avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${seed}`,
      },
      votes: baseVotes(post.id) + getVoteBonus(`PUB-${String(post.id).padStart(4, '0')}`),
      commentCount: commentCountByPost.get(post.id) || 0,
    };
  });

  writeCache(feed);
  return feed.slice(0, limit);
}
