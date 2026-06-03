import { API_URL } from "./config.js";

// ── Initialise bell + dropdown in navbar ─────────────────────────────────────

export function initNotifications() {
  const token = localStorage.getItem("token");
  if (!token) return; // only for logged-in users

  const navButtons = document.getElementById("nav-buttons");
  if (!navButtons) return;

  // Insert bell BEFORE nav-buttons renders the avatar
  // We inject it into a wrapper added by navbar.js — wait one tick so navbar runs first
  setTimeout(() => _mountBell(token), 0);
}

function _mountBell(token) {
  // Create bell container and inject it before #nav-buttons
  const navButtons = document.getElementById("nav-buttons");
  if (!navButtons) return;

  const bell = document.createElement("div");
  bell.className = "notif-bell-wrap";
  bell.id        = "notif-bell-wrap";
  bell.innerHTML = `
    <button class="notif-bell-btn" id="notif-bell-btn" title="Notifications">
      <svg class="notif-bell-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 0 0 2 2zm6-6V11c0-3.07-1.64-5.64-4.5-6.32V4a1.5 1.5 0 0 0-3 0v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
      </svg>
      <span class="notif-badge" id="notif-badge" style="display:none;">0</span>
    </button>
    <div class="notif-dropdown" id="notif-dropdown">
      <div class="notif-dropdown-header">
        <span>Notifications</span>
        <div class="notif-header-actions">
          <button class="notif-mark-read-btn" id="notif-mark-read-btn">Mark all read</button>
          <button class="notif-delete-all-btn" id="notif-delete-all-btn">Delete all</button>
        </div>
      </div>
      <div class="notif-list" id="notif-list">
        <p class="notif-empty">Loading…</p>
      </div>
    </div>
  `;

  // Wrap bell + navButtons in a right-side group if not already wrapped
  let rightGroup = document.getElementById("navbar-right-group");
  if (!rightGroup) {
    rightGroup = document.createElement("div");
    rightGroup.id        = "navbar-right-group";
    rightGroup.className = "navbar-right-group";
    navButtons.parentElement.insertBefore(rightGroup, navButtons);
    rightGroup.appendChild(bell);
    rightGroup.appendChild(navButtons);
  } else {
    rightGroup.insertBefore(bell, navButtons);
  }

  // Toggle dropdown
  document.getElementById("notif-bell-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    // Close avatar dropdown if open
    document.getElementById("avatar-dropdown")?.classList.remove("visible");
    const dd = document.getElementById("notif-dropdown");
    const isOpen = dd.classList.toggle("visible");
    if (isOpen) loadNotifications(token);
  });

  // Close when clicking outside
  document.addEventListener("click", () => {
    document.getElementById("notif-dropdown")?.classList.remove("visible");
  });

  // Mark all read
  document.getElementById("notif-mark-read-btn").addEventListener("click", async (e) => {
    e.stopPropagation();
    await fetch(`${API_URL}/notifications/mark-read`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    updateBadge(0);
    document.querySelectorAll(".notif-item").forEach(el => el.classList.remove("unread"));
  });

  // Delete all
  document.getElementById("notif-delete-all-btn").addEventListener("click", async (e) => {
    e.stopPropagation();
    const btn = document.getElementById("notif-delete-all-btn");
    btn.textContent = "Deleting…";
    btn.disabled    = true;
    await fetch(`${API_URL}/notifications`, {
      method:  "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    updateBadge(0);
    document.getElementById("notif-list").innerHTML = `<p class="notif-empty">No notifications yet.</p>`;
    btn.textContent = "Delete all";
    btn.disabled    = false;
  });

  // Initial badge fetch
  fetchUnreadCount(token);

  // Poll every 30 seconds
  setInterval(() => fetchUnreadCount(token), 30000);
}

async function fetchUnreadCount(token) {
  try {
    const res  = await fetch(`${API_URL}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    updateBadge(data.count || 0);
  } catch { /* silent */ }
}

function updateBadge(count) {
  const badge = document.getElementById("notif-badge");
  if (!badge) return;
  if (count > 0) {
    badge.textContent    = count > 99 ? "99+" : count;
    badge.style.display  = "flex";
  } else {
    badge.style.display  = "none";
  }
}

async function loadNotifications(token) {
  const listEl = document.getElementById("notif-list");
  listEl.innerHTML = `<p class="notif-empty">Loading…</p>`;

  try {
    const res   = await fetch(`${API_URL}/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const items = await res.json();

    if (!items.length) {
      listEl.innerHTML = `<p class="notif-empty">No notifications yet.</p>`;
      return;
    }

    listEl.innerHTML = items.map(n => renderNotif(n)).join("");

    // Attach respond buttons (Accept / Decline)
    listEl.querySelectorAll(".notif-respond-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const { notifId, action } = btn.dataset;
        btn.disabled = true;
        btn.textContent = action === "accept" ? "Accepting…" : "Declining…";
        try {
          const r = await fetch(`${API_URL}/notifications/${notifId}/respond`, {
            method:  "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body:    JSON.stringify({ action }),
          });
          if (r.ok) loadNotifications(token);
        } catch {
          btn.disabled = false;
          btn.textContent = action === "accept" ? "Accept" : "Decline";
        }
      });
    });

    // Attach delete (trash) buttons
    listEl.querySelectorAll(".notif-delete-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const id = btn.dataset.deleteId;
        btn.disabled = true;
        try {
          await fetch(`${API_URL}/notifications/${id}`, {
            method:  "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          // Animate out then reload
          const item = btn.closest(".notif-item");
          item.style.transition = "opacity 0.2s, transform 0.2s";
          item.style.opacity    = "0";
          item.style.transform  = "translateX(10px)";
          setTimeout(() => loadNotifications(token), 220);
        } catch {
          btn.disabled = false;
        }
      });
    });

    // Clicking a notification marks it as read + navigates if it has a product
    listEl.querySelectorAll(".notif-item").forEach(el => {
      el.style.cursor = "pointer";
      el.addEventListener("click", (e) => {
        if (e.target.closest("button")) return;
        // Mark as read visually
        el.classList.remove("unread");
        // Navigate to product if applicable
        const pid = el.dataset.productId;
        if (pid) window.location.href = `product.html?id=${pid}`;
      });
    });

    // Mark all as read after opening
    updateBadge(0);
    await fetch(`${API_URL}/notifications/mark-read`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });

  } catch {
    listEl.innerHTML = `<p class="notif-empty">Could not load notifications.</p>`;
  }
}

const trashSVG = `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
</svg>`;

function renderNotif(n) {
  const time   = timeAgo(new Date(n.createdAt));
  const unread = !n.read ? "unread" : "";
  const trash  = `<button class="notif-delete-btn" data-delete-id="${n.id}" title="Delete notification">${trashSVG}</button>`;

  if (n.type === "DONATION_REQUEST") {
    return `
      <div class="notif-item ${unread}" data-product-id="${n.productId || ""}" data-notif-id="${n.id}">
        <div class="notif-icon notif-icon-donate"></div>
        <div class="notif-body">
          <p><strong>${n.fromName || "Someone"}</strong> wants to claim your donation: <strong>${n.productTitle || "your item"}</strong></p>
          <span class="notif-time">${time}</span>
          ${!n.actionTaken ? `
            <div class="notif-actions">
              <button class="notif-respond-btn accept-btn" data-notif-id="${n.id}" data-action="accept">Give</button>
              <button class="notif-respond-btn decline-btn" data-notif-id="${n.id}" data-action="decline">Decline</button>
            </div>` : `<span class="notif-actioned">Already responded</span>`}
        </div>
        ${trash}
      </div>`;
  }

  if (n.type === "DONATION_ACCEPTED") {
    return `
      <div class="notif-item ${unread}" data-product-id="${n.productId || ""}" data-notif-id="${n.id}">
        <div class="notif-icon notif-icon-donate"></div>
        <div class="notif-body">
          <p><strong>${n.fromName || "The donor"}</strong> is giving you <strong>${n.productTitle || "the item"}</strong> for free!</p>
          <span class="notif-time">${time}</span>
        </div>
        ${trash}
      </div>`;
  }

  if (n.type === "DONATION_DECLINED") {
    return `
      <div class="notif-item ${unread}" data-product-id="${n.productId || ""}" data-notif-id="${n.id}">
        <div class="notif-icon notif-icon-no"></div>
        <div class="notif-body">
          <p>Your claim request for <strong>${n.productTitle || "the item"}</strong> was declined.</p>
          <span class="notif-time">${time}</span>
        </div>
        ${trash}
      </div>`;
  }

  if (n.type === "BUY_REQUEST") {
    return `
      <div class="notif-item ${unread}" data-product-id="${n.productId || ""}" data-notif-id="${n.id}">
        <div class="notif-icon notif-icon-buy"></div>
        <div class="notif-body">
          <p><strong>${n.fromName || "Someone"}</strong> wants to buy <strong>${n.productTitle || "your product"}</strong></p>
          <span class="notif-time">${time}</span>
          ${!n.actionTaken ? `
            <div class="notif-actions">
              <button class="notif-respond-btn accept-btn" data-notif-id="${n.id}" data-action="accept">Accept</button>
              <button class="notif-respond-btn decline-btn" data-notif-id="${n.id}" data-action="decline">Decline</button>
            </div>` : `<span class="notif-actioned">Already responded</span>`}
        </div>
        ${trash}
      </div>`;
  }

  if (n.type === "BUY_ACCEPTED") {
    return `
      <div class="notif-item ${unread}" data-product-id="${n.productId || ""}" data-notif-id="${n.id}">
        <div class="notif-icon notif-icon-ok"></div>
        <div class="notif-body">
          <p><strong>${n.fromName || "The seller"}</strong> accepted your request for <strong>${n.productTitle || "the product"}</strong></p>
          <span class="notif-time">${time}</span>
        </div>
        ${trash}
      </div>`;
  }

  if (n.type === "BUY_DECLINED") {
    return `
      <div class="notif-item ${unread}" data-product-id="${n.productId || ""}" data-notif-id="${n.id}">
        <div class="notif-icon notif-icon-no"></div>
        <div class="notif-body">
          <p><strong>${n.fromName || "The seller"}</strong> declined your request for <strong>${n.productTitle || "the product"}</strong></p>
          <span class="notif-time">${time}</span>
        </div>
        ${trash}
      </div>`;
  }

  if (n.type === "ADMIN_REQUEST") {
    return `
      <div class="notif-item ${unread}" data-notif-id="${n.id}">
        <div class="notif-icon notif-icon-admin"></div>
        <div class="notif-body">
          <p><strong>${n.fromName || "Someone"}</strong> is requesting admin access</p>
          <span class="notif-time">${time}</span>
          ${!n.actionTaken ? `
            <div class="notif-actions">
              <button class="notif-respond-btn accept-btn" data-notif-id="${n.id}" data-action="accept">Accept</button>
              <button class="notif-respond-btn decline-btn" data-notif-id="${n.id}" data-action="decline">Decline</button>
            </div>` : `<span class="notif-actioned">Already responded</span>`}
        </div>
        ${trash}
      </div>`;
  }

  if (n.type === "ADMIN_REQUEST_ACCEPTED") {
    return `
      <div class="notif-item ${unread}" data-notif-id="${n.id}">
        <div class="notif-icon notif-icon-ok"></div>
        <div class="notif-body">
          <p>Your admin request was <strong>accepted</strong>! Please log out and back in to access the Admin Panel.</p>
          <span class="notif-time">${time}</span>
        </div>
        ${trash}
      </div>`;
  }

  if (n.type === "ADMIN_REQUEST_DECLINED") {
    return `
      <div class="notif-item ${unread}" data-notif-id="${n.id}">
        <div class="notif-icon notif-icon-no"></div>
        <div class="notif-body">
          <p>Your admin request was <strong>declined</strong>.</p>
          <span class="notif-time">${time}</span>
        </div>
        ${trash}
      </div>`;
  }

  if (n.type === "NEW_USER") {
    return `
      <div class="notif-item ${unread}" data-notif-id="${n.id}">
        <div class="notif-icon notif-icon-admin"></div>
        <div class="notif-body">
          <p><strong>${n.fromName || "A new user"}</strong> just registered on LittleLoop</p>
          <span class="notif-time">${time}</span>
        </div>
        ${trash}
      </div>`;
  }

  if (n.type === "NEW_PRODUCT") {
    return `
      <div class="notif-item ${unread}" data-product-id="${n.productId || ""}" data-notif-id="${n.id}">
        <div class="notif-icon notif-icon-buy"></div>
        <div class="notif-body">
          <p><strong>${n.fromName || "A seller"}</strong> listed a new product: <strong>${n.productTitle || "a new item"}</strong></p>
          <span class="notif-time">${time}</span>
        </div>
        ${trash}
      </div>`;
  }

  return `
    <div class="notif-item ${unread}" data-notif-id="${n.id}">
      <div class="notif-icon notif-icon-bell"></div>
      <div class="notif-body">
        <p>${n.type}</p>
        <span class="notif-time">${time}</span>
      </div>
      ${trash}
    </div>`;
}

function timeAgo(date) {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60)    return "just now";
  if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}
