import { API_URL } from "./config.js";

export function initAdmin() {
  if (!document.getElementById("admin-users-section")) return;

  const token = localStorage.getItem("token");
  const user  = JSON.parse(localStorage.getItem("user") || "null");

  // Guard: must be logged in as admin
  if (!token || !user || user.role !== "admin") {
    window.location.href = "index.html";
    return;
  }

  // ── Tab switching ─────────────────────────────────────────────────────────
  const tabBtns    = document.querySelectorAll(".admin-tab-btn");
  const sections   = document.querySelectorAll(".admin-section");

  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      tabBtns.forEach(b => b.classList.remove("active"));
      sections.forEach(s => s.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.tab).classList.add("active");
    });
  });

  // ── Confirmation modal ────────────────────────────────────────────────────
  const confirmOverlay = document.getElementById("admin-confirm-overlay");
  const confirmMsg     = document.getElementById("admin-confirm-msg");
  const confirmOk      = document.getElementById("admin-confirm-ok");
  const confirmCancel  = document.getElementById("admin-confirm-cancel");
  let   _confirmResolve = null;

  function showConfirm(message) {
    confirmMsg.textContent = message;
    confirmOverlay.style.display = "flex";
    return new Promise(resolve => { _confirmResolve = resolve; });
  }

  confirmOk.addEventListener("click", () => {
    confirmOverlay.style.display = "none";
    if (_confirmResolve) { _confirmResolve(true); _confirmResolve = null; }
  });

  confirmCancel.addEventListener("click", () => {
    confirmOverlay.style.display = "none";
    if (_confirmResolve) { _confirmResolve(false); _confirmResolve = null; }
  });

  confirmOverlay.addEventListener("click", (e) => {
    if (e.target === confirmOverlay) {
      confirmOverlay.style.display = "none";
      if (_confirmResolve) { _confirmResolve(false); _confirmResolve = null; }
    }
  });

  // ── Load Users ────────────────────────────────────────────────────────────
  async function loadUsers() {
    const tbody = document.getElementById("users-tbody");
    const statEl = document.getElementById("stat-users");
    tbody.innerHTML = `<tr><td colspan="5" class="admin-loading">Loading…</td></tr>`;

    try {
      const res   = await fetch(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load users.");
      const users = await res.json();

      if (statEl) statEl.textContent = users.length;

      if (users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="admin-empty">No users found.</td></tr>`;
        return;
      }

      tbody.innerHTML = users.map(u => {
        const isSelf    = u.id === user.id;
        const isAdminU  = u.role === "admin";
        const roleLabel = isAdminU
          ? `<span class="admin-role-badge role-admin">Admin</span>`
          : `<span class="admin-role-badge role-member">Member</span>`;

        const roleBtn = isSelf ? "" : isAdminU
          ? `<button class="admin-action-btn demote-btn" data-action="toggle-role" data-id="${u.id}">Demote</button>`
          : `<button class="admin-action-btn promote-btn" data-action="toggle-role" data-id="${u.id}">Promote</button>`;

        const deleteBtn = isSelf ? "" :
          `<button class="admin-action-btn delete-btn" data-action="delete-user" data-id="${u.id}" data-name="${escHtml(u.name)}">Delete</button>`;

        return `<tr class="admin-clickable-row" data-href="seller.html?id=${u.id}" style="cursor:pointer;">
          <td>${escHtml(u.name)}</td>
          <td>${escHtml(u.email)}</td>
          <td>${roleLabel}</td>
          <td>${new Date(u.createdAt).toLocaleDateString()}</td>
          <td><div class="admin-actions-cell">${roleBtn}${deleteBtn}</div></td>
        </tr>`;
      }).join("");

      // Attach action handlers
      // Row click → seller profile
      tbody.querySelectorAll(".admin-clickable-row").forEach(row => {
        row.addEventListener("click", (e) => {
          if (e.target.closest("button")) return; // don't navigate when clicking action buttons
          window.location.href = row.dataset.href;
        });
      });

      tbody.querySelectorAll("[data-action='delete-user']").forEach(btn => {
        btn.addEventListener("click", async () => {
          const confirmed = await showConfirm(`Delete user "${btn.dataset.name}"? This cannot be undone.`);
          if (!confirmed) return;
          btn.disabled = true;
          try {
            const r = await fetch(`${API_URL}/admin/users/${btn.dataset.id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
            if (r.ok) loadUsers();
            else { const d = await r.json(); alert(d.message); btn.disabled = false; }
          } catch { btn.disabled = false; }
        });
      });

      tbody.querySelectorAll("[data-action='toggle-role']").forEach(btn => {
        btn.addEventListener("click", async () => {
          const action = btn.classList.contains("promote-btn") ? "promote" : "demote";
          const confirmed = await showConfirm(`Are you sure you want to ${action} this user?`);
          if (!confirmed) return;
          btn.disabled = true;
          try {
            const r = await fetch(`${API_URL}/admin/users/${btn.dataset.id}/role`, {
              method: "PUT",
              headers: { Authorization: `Bearer ${token}` },
            });
            if (r.ok) loadUsers();
            else { const d = await r.json(); alert(d.message); btn.disabled = false; }
          } catch { btn.disabled = false; }
        });
      });

    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5" class="admin-empty">Could not load users.</td></tr>`;
    }
  }

  // ── Load Products ─────────────────────────────────────────────────────────
  async function loadProducts() {
    const tbody  = document.getElementById("products-tbody");
    const statEl = document.getElementById("stat-products");
    tbody.innerHTML = `<tr><td colspan="5" class="admin-loading">Loading…</td></tr>`;

    try {
      const res      = await fetch(`${API_URL}/admin/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load products.");
      const products = await res.json();

      if (statEl) statEl.textContent = products.length;

      if (products.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="admin-empty">No products found.</td></tr>`;
        return;
      }

      tbody.innerHTML = products.map(p => {
        const statusBadge = p.sold
          ? `<span class="admin-sold-badge">Sold</span>`
          : `<span class="admin-available-badge">Available</span>`;

        return `<tr class="admin-clickable-row" data-href="product.html?id=${p.id}" style="cursor:pointer;">
          <td>${escHtml(p.title)}</td>
          <td>€${parseFloat(p.price).toFixed(2)}</td>
          <td>${escHtml(p.sellerName || "—")}</td>
          <td>${statusBadge}</td>
          <td>
            <div class="admin-actions-cell">
              <button class="admin-action-btn delete-btn" data-action="delete-product" data-id="${p.id}" data-title="${escHtml(p.title)}">Delete</button>
            </div>
          </td>
        </tr>`;
      }).join("");

      // Row click → product page
      tbody.querySelectorAll(".admin-clickable-row").forEach(row => {
        row.addEventListener("click", (e) => {
          if (e.target.closest("button")) return;
          window.location.href = row.dataset.href;
        });
      });

      tbody.querySelectorAll("[data-action='delete-product']").forEach(btn => {
        btn.addEventListener("click", async () => {
          const confirmed = await showConfirm(`Delete listing "${btn.dataset.title}"? This cannot be undone.`);
          if (!confirmed) return;
          btn.disabled = true;
          try {
            const r = await fetch(`${API_URL}/admin/products/${btn.dataset.id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
            if (r.ok) loadProducts();
            else { const d = await r.json(); alert(d.message); btn.disabled = false; }
          } catch { btn.disabled = false; }
        });
      });

    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5" class="admin-empty">Could not load products.</td></tr>`;
    }
  }

  // ── Boot ──────────────────────────────────────────────────────────────────
  loadUsers();
  loadProducts();
}

function escHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
