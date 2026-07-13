// LIFF event check-in — runs the real flow inside LINE, and a mock flow in a
// plain browser (demo mode) so the whole thing is clickable without a LINE app.

const qs = new URLSearchParams(location.search);
const EVENT = (qs.get("event") || "demo-expo-2026").slice(0, 120);
const FORCE_DEMO = qs.has("demo");

const $ = (id) => document.getElementById(id);
const show = (id) => {
  document.querySelectorAll(".view").forEach((v) => (v.hidden = true));
  $(id).hidden = false;
};

async function getConfig() {
  try {
    const r = await fetch("/api/config");
    return await r.json();
  } catch {
    return { liffId: "" };
  }
}

// Returns a LINE profile in-app, or a mock profile in demo mode.
async function resolveProfile() {
  const { liffId } = await getConfig();

  if (!FORCE_DEMO && liffId && window.liff) {
    try {
      await liff.init({ liffId });
      // Only drive the real LINE flow when actually opened inside the LINE app.
      // In an external browser we fall through to demo mode instead of forcing a
      // LINE-login redirect, so the page is instantly usable for anyone.
      // (Want real login in external browsers too? Drop the isInClient() guard.)
      if (liff.isInClient()) {
        if (!liff.isLoggedIn()) {
          liff.login(); // redirects; page reloads logged in
          return null;
        }
        const p = await liff.getProfile();
        return { userId: p.userId, name: p.displayName, avatar: p.pictureUrl, demo: false };
      }
    } catch (e) {
      console.warn("LIFF init failed, falling back to demo:", e);
    }
  }

  // Demo mode: a stable per-browser mock identity so re-checking is idempotent.
  let id = localStorage.getItem("demo_uid");
  if (!id) {
    id = "demo-" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem("demo_uid", id);
  }
  return { userId: id, name: "Demo Guest", avatar: "", demo: true };
}

async function checkIn(profile) {
  const r = await fetch("/api/checkin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event: EVENT, userId: profile.userId, name: profile.name }),
  });
  if (!r.ok) throw new Error(`check-in failed (${r.status})`);
  return r.json();
}

function fmtTime(ms) {
  return new Date(ms).toLocaleString();
}

async function main() {
  show("view-loading");
  $("event").textContent = EVENT.replace(/-/g, " ");

  let profile;
  try {
    profile = await resolveProfile();
  } catch (e) {
    $("error-msg").textContent = String(e);
    show("view-error");
    return;
  }
  if (!profile) return; // redirecting to LINE login

  $("mode").textContent = profile.demo ? "demo mode" : "via LINE";
  $("mode").classList.toggle("demo", profile.demo);
  $("name").textContent = profile.name;
  if (profile.avatar) $("avatar").src = profile.avatar;
  else $("avatar").remove();
  show("view-checkin");

  $("btn").addEventListener("click", async () => {
    $("btn").disabled = true;
    $("btn").textContent = "…";
    try {
      const res = await checkIn(profile);
      $("count").textContent = res.count;
      if (res.already) {
        $("done-title").textContent = "Already checked in";
        $("done-sub").textContent = "You checked in at " + fmtTime(res.at);
      } else {
        $("done-title").textContent = "You're checked in";
        $("done-sub").textContent = "Welcome, " + profile.name + "!";
      }
      show("view-done");
    } catch (e) {
      $("error-msg").textContent = String(e);
      show("view-error");
    }
  });
}

main();
