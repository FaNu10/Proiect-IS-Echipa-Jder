import { API_URL, BASE_URL } from "./config.js";

// ── Storage helpers ──────────────────────────────────────────────────────────

export function getFavoriteProducts() {
  return JSON.parse(localStorage.getItem("fav_products") || "[]");
}

export function getFavoriteMembers() {
  return JSON.parse(localStorage.getItem("fav_members") || "[]");
}

export function toggleFavoriteProduct(id) {
  const favs = getFavoriteProducts();
  const idx  = favs.indexOf(id);
  if (idx === -1) favs.push(id);
  else            favs.splice(idx, 1);
  localStorage.setItem("fav_products", JSON.stringify(favs));
  return idx === -1; // true = added
}

export function toggleFavoriteMember(id) {
  const favs = getFavoriteMembers();
  const idx  = favs.indexOf(id);
  if (idx === -1) favs.push(id);
  else            favs.splice(idx, 1);
  localStorage.setItem("fav_members", JSON.stringify(favs));
  return idx === -1;
}

export function isProductFavorited(id) {
  return getFavoriteProducts().includes(id);
}

export function isMemberFavorited(id) {
  return getFavoriteMembers().includes(id);
}

// ── Page init (only runs on favorites.html) ──────────────────────────────────

export function initFavorites() {
  if (!document.getElementById("tab-products")) return;

  const tabProducts  = document.getElementById("tab-products");
  const tabMembers   = document.getElementById("tab-members");
  const panelProducts = document.getElementById("panel-products");
  const panelMembers  = document.getElementById("panel-members");
  const countProducts = document.getElementById("count-products");
  const countMembers  = document.getElementById("count-members");

  // ── Tab switching ──────────────────────────────────────────────────────────

  function showTab(tab) {
    tabProducts.classList.toggle("active", tab === "products");
    tabMembers.classList.toggle("active",  tab === "members");
    panelProducts.style.display = tab === "products" ? "block" : "none";
    panelMembers.style.display  = tab === "members"  ? "block" : "none";
  }

  tabProducts.addEventListener("click", () => showTab("products"));
  tabMembers.addEventListener("click",  () => showTab("members"));

  // ── Load favorite products ─────────────────────────────────────────────────

  async function loadFavProducts() {
    const ids = getFavoriteProducts();
    countProducts.textContent = ids.length;

    const emptyEl = document.getElementById("empty-products");
    const gridEl  = document.getElementById("fav-products-grid");

    if (ids.length === 0) {
      emptyEl.style.display = "flex";
      gridEl.style.display  = "none";
      return;
    }

    emptyEl.style.display = "none";
    gridEl.style.display  = "grid";
    gridEl.innerHTML = `<p style="grid-column:1/-1;color:#999;">Loading…</p>`;

    try {
      // Fetch all products then filter client-side
      const res      = await fetch(`${API_URL}/products`);
      const all      = await res.json();
      const products = all.filter(p => ids.includes(p.id));

      if (products.length === 0) {
        emptyEl.style.display = "flex";
        gridEl.style.display  = "none";
        return;
      }

      gridEl.innerHTML = products.map(p => `
        <div class="product-card" onclick="window.location.href='product.html?id=${p.id}'">
          <div class="card-img-wrap">
            <img src="${p.imageUrl ? BASE_URL + p.imageUrl : "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&auto=format&fit=crop"}"
                 alt="${p.title}" />
            ${p.isDonation ? `<span class="card-free-badge">Free</span>` : ""}
            <button class="card-fav-btn active" data-id="${p.id}" title="Remove from favorites"
                    onclick="event.stopPropagation(); window.removeFavProduct('${p.id}', this)">♥</button>
          </div>
          <div class="product-info">
            <h3>${p.title}</h3>
            <p class="brand">${p.brand}</p>
            <div class="product-bottom">
              ${p.isDonation
                ? `<span class="price" style="color:#f59e0b;font-weight:700;">Free</span>`
                : `<span class="price">€${parseFloat(p.price).toFixed(2)}</span>`}
              <button onclick="event.stopPropagation(); window.location.href='product.html?id=${p.id}'">View</button>
            </div>
          </div>
        </div>
      `).join("");
    } catch {
      gridEl.innerHTML = `<p style="grid-column:1/-1;color:#999;">Could not load favorites.</p>`;
    }
  }

  // ── Load favorite members ──────────────────────────────────────────────────

  async function loadFavMembers() {
    const ids = getFavoriteMembers();
    countMembers.textContent = ids.length;

    const emptyEl = document.getElementById("empty-members");
    const gridEl  = document.getElementById("fav-members-grid");

    if (ids.length === 0) {
      emptyEl.style.display = "flex";
      gridEl.style.display  = "none";
      return;
    }

    emptyEl.style.display = "none";
    gridEl.style.display  = "grid";
    gridEl.innerHTML = `<p style="grid-column:1/-1;color:#999;">Loading…</p>`;

    try {
      const res     = await fetch(`${API_URL}/users`);
      const all     = await res.json();
      const members = all.filter(u => ids.includes(u.id));

      if (members.length === 0) {
        emptyEl.style.display = "flex";
        gridEl.style.display  = "none";
        return;
      }

      gridEl.innerHTML = members.map(u => {
        const initials = u.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
        const avatar   = u.avatarUrl
          ? `<img src="${BASE_URL}${u.avatarUrl}" class="member-card-avatar-img" alt="${u.name}" />`
          : `<div class="member-card-avatar">${initials}</div>`;
        return `
          <div class="member-card" onclick="window.location.href='seller.html?id=${u.id}'" style="cursor:pointer;">
            <button class="fav-heart-btn active member-unfollow" data-id="${u.id}" title="Unfollow"
                    onclick="event.stopPropagation(); window.removeFavMember('${u.id}', this)">♥</button>
            ${avatar}
            <h3 class="member-card-name">${u.name}</h3>
            <p class="member-card-bio">${u.bio || "No bio yet."}</p>
          </div>`;
      }).join("");
    } catch {
      gridEl.innerHTML = `<p style="grid-column:1/-1;color:#999;">Could not load members.</p>`;
    }
  }

  // ── Remove helpers (called from inline onclick) ───────────────────────────

  window.removeFavProduct = (id, btn) => {
    toggleFavoriteProduct(id);
    const card = btn.closest(".product-card");
    card.style.opacity    = "0";
    card.style.transform  = "scale(0.9)";
    card.style.transition = "0.3s";
    setTimeout(() => loadFavProducts(), 300);
  };

  window.removeFavMember = (id, btn) => {
    toggleFavoriteMember(id);
    const card = btn.closest(".member-card");
    card.style.opacity    = "0";
    card.style.transform  = "scale(0.9)";
    card.style.transition = "0.3s";
    setTimeout(() => loadFavMembers(), 300);
  };

  // ── Boot ──────────────────────────────────────────────────────────────────
  loadFavProducts();
  loadFavMembers();
}
