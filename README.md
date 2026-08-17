# Resolv

A reimagined complaint forum — file an issue, get an instant tracking ID, and
watch it move from **Pending → In Review → Resolved** in real time. No login,
no backend to stand up, no build step.

Originally a hackathon project (Hack-nitr) with a static Bootstrap page, three
hardcoded "recent complaints," and a contact form wired to `smtp.js` with
blank credentials (so it never actually sent anything). This version replaces
all of that with real, working functionality.

## What's here

- **File a Complaint** — validated form, generates a unique `RSV-XXXXXX`
  tracking ID, saves to `localStorage`.
- **Track a Complaint** — look up any ID (or browse everything you've filed
  on this device) and see a live status timeline. Status advances
  automatically over time via a small simulated SLA engine, since there's no
  real backend behind this demo.
- **Community Pulse** — a public board of complaint-shaped threads, fetched
  live from [JSONPlaceholder](https://jsonplaceholder.typicode.com) (a free
  public REST API) and normalized into complaints — plus anything you've
  filed and marked "public." Filter by category/status, search, sort, and
  upvote.
- **Contact Us** — a general-purpose contact form (separate from filing a
  complaint), stored locally; no more exposed, non-functional email
  credentials.
- Light/dark theme, fully responsive, no framework — plain HTML/CSS/ES
  modules.

## Stack

Vanilla HTML/CSS/JS. No `npm install`, no build tool — open `index.html` in
a browser (or serve the folder with any static file server) and it works.

```
index.html              Landing page + live stats + Community Pulse preview
file-complaint.html      Complaint filing form
track-complaint.html     Lookup + "my complaints" tracker
community.html           Full Community Pulse board
contact.html             General contact form
assets/css/styles.css    Design system (light + dark)
assets/js/app.js         Theme, nav, storage, toasts, icons, shared helpers
assets/js/api.js         Public data layer (JSONPlaceholder → complaint feed)
assets/js/cards.js       Shared complaint card renderer
assets/js/*.js           Per-page logic
```

## Data & persistence

There's no real complaints backend here (that would need a hosted database
and a service the user provisions). Instead:

- Complaints you file and contact messages you send live in your browser's
  `localStorage` — they persist across visits on the same device/browser,
  but aren't shared across devices or users.
- The Community Pulse board fetches real data over the network from
  JSONPlaceholder's `/posts`, `/users`, and `/comments` endpoints and
  deterministically reshapes each post into a complaint (category, status,
  and vote count are derived from the post's id, so the board looks
  consistent between reloads instead of reshuffling randomly).

Swapping in a real backend (Firebase, Supabase, a custom API) later mostly
means replacing the functions in `assets/js/app.js` (`getComplaints`,
`saveComplaint`, …) and `assets/js/api.js` with real network calls — the UI
layer doesn't need to change.
