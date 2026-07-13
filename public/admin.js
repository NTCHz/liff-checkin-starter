// Organizer view — live attendance for one event. Polls GET /api/event/:id.
// ponytail: no auth on this starter. Before real use, put /admin + /api/event
// behind a login or a signed organizer token — it exposes the attendee list.

const EVENT = (new URLSearchParams(location.search).get("event") || "demo-expo-2026").slice(0, 120);
const POLL_MS = 4000;

const $ = (id) => document.getElementById(id);
$("event").textContent = EVENT.replace(/-/g, " ");

function fmt(ms) {
  return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

async function refresh() {
  let data;
  try {
    data = await fetch(`/api/event/${encodeURIComponent(EVENT)}`).then((r) => r.json());
  } catch {
    return; // transient; next tick retries
  }
  $("count").textContent = data.count;
  $("empty").hidden = data.count > 0;

  // Newest first, so the latest check-in is always on top.
  const rows = [...data.checkins].reverse();
  $("list").innerHTML = rows
    .map(
      (c) => `<li class="admin-row">
        <span class="admin-name">${escapeHtml(c.name)}</span>
        <span class="admin-time">${fmt(c.at)}</span>
      </li>`,
    )
    .join("");
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
}

refresh();
setInterval(refresh, POLL_MS);
