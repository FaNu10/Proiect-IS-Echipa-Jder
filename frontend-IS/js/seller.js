import { API_URL, BASE_URL } from "./config.js";
import { isMemberFavorited, toggleFavoriteMember } from "./favorites.js";

export function initSeller() {
  if (!document.getElementById("seller-loading")) return;

  const params   = new URLSearchParams(window.location.search);
  const sellerId = params.get("id");

  if (!sellerId) {
    showError("No seller specified.");
    return;
  }

  const elLoading = document.getElementById("seller-loading");
  const elError   = document.getElementById("seller-error");
  const elContent = document.getElementById("seller-content");

  function showError(msg) {
    elLoading.style.display = "none";
    document.getElementById("seller-error-msg").textContent = msg;
    elError.style.display = "flex";
  }

  function getInitials(name) {
    return (name || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  }

  // ── Fetch seller ──────────────────────────────────────────────────────────

  async function load() {
    try {
      const res  = await fetch(`${API_URL}/users/${sellerId}`);
      if (!res.ok) { showError("Seller not found."); return; }
      const user = await res.json();

      document.title = `${user.name} – LittleLoop`;

      // Avatar
      const circle = document.getElementById("seller-avatar-circle");
      const img    = document.getElementById("seller-avatar-img");
      if (user.avatarUrl) {
        img.src = BASE_URL + user.avatarUrl;
        img.style.display    = "block";
        circle.style.display = "none";
      } else {
        circle.textContent   = getInitials(user.name);
        circle.style.display = "flex";
        img.style.display    = "none";
      }

      document.getElementById("seller-name").textContent = user.name;
      document.getElementById("seller-bio").textContent  = user.bio || "No bio yet.";

      // Follow button
      const followBtn = document.getElementById("seller-follow-btn");
      const updateFollowBtn = (isFav) => {
        followBtn.textContent = isFav ? "Following ♥" : "Follow ♡";
        followBtn.classList.toggle("following", isFav);
      };
      updateFollowBtn(isMemberFavorited(sellerId));
      followBtn.addEventListener("click", () => {
        updateFollowBtn(toggleFavoriteMember(sellerId));
      });

      elLoading.style.display = "none";
      elContent.style.display = "block";

      loadListings(user);
    } catch {
      showError("Could not load seller profile.");
    }
  }

  // ── Fetch listings ────────────────────────────────────────────────────────

  async function loadListings(user) {
    const loadingEl = document.getElementById("seller-listings-loading");
    const gridEl    = document.getElementById("seller-listings-grid");
    const emptyEl   = document.getElementById("seller-listings-empty");
    const subEl     = document.getElementById("seller-listings-sub");
    const titleEl   = document.getElementById("seller-listings-title");

    titleEl.textContent = `${user.name.split(" ")[0]}'s Listings`;

    try {
      const res      = await fetch(`${API_URL}/products?seller=${sellerId}`);
      const products = await res.json();

      loadingEl.style.display = "none";
      subEl.textContent = `${products.length} item${products.length !== 1 ? "s" : ""} for sale`;

      if (products.length === 0) {
        emptyEl.style.display = "block";
        return;
      }

      gridEl.style.display = "grid";
      gridEl.innerHTML = products.map(p => `
        <div class="product-card${p.sold ? " is-sold" : ""}" onclick="window.location.href='product.html?id=${p.id}'">
          <div class="card-img-wrap">
            ${p.sold ? `<span class="sold-badge">Sold</span>` : ""}
            ${p.isDonation && !p.sold ? `<span class="card-free-badge">Free</span>` : ""}
            <img src="${p.imageUrl ? BASE_URL + p.imageUrl : "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&auto=format&fit=crop"}"
                 alt="${p.title}" />
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
        </div>`).join("");
    } catch {
      loadingEl.textContent = "Could not load listings.";
    }
  }

  load();
}
