import { API_URL, BASE_URL } from "../config.js";
import { isProductFavorited, toggleFavoriteProduct } from "../favorites.js";

export function initProductList() {
  const productsGrid = document.querySelector(".products-grid");
  if (!productsGrid) return;

  // Filter controls (only present on index.html)
  const searchInput    = document.getElementById("filter-search");
  const categorySelect = document.getElementById("filter-category");
  const locationSelect = document.getElementById("filter-location");
  const filterBtn      = document.getElementById("filter-btn");
  const clearBtn       = document.getElementById("clear-filter-btn");

  let allProducts = [];

  // ── Render ────────────────────────────────────────────────────────────────

  function renderProducts(products) {
    if (products.length === 0) {
      productsGrid.innerHTML = `
        <p style="text-align:center;color:#888;grid-column:1/-1;padding:60px 0;">
          No products match your filters.
        </p>`;
      return;
    }

    productsGrid.innerHTML = products.map(p => {
      const isFav = isProductFavorited(p.id);
      return `
        <div class="product-card" onclick="window.location.href='product.html?id=${p.id}'">
          <div class="card-img-wrap">
            <img
              src="${p.imageUrl
                ? BASE_URL + p.imageUrl
                : "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=1000&auto=format&fit=crop"}"
              alt="${p.title}"
            />
            ${p.isDonation ? `<span class="card-free-badge">Free</span>` : ""}
            <button class="card-fav-btn ${isFav ? "active" : ""}"
                    data-id="${p.id}"
                    onclick="event.stopPropagation(); window.handleCardFav(this, '${p.id}')"
                    title="${isFav ? "Remove from favorites" : "Add to favorites"}">♥</button>
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
        </div>`;
    }).join("");
  }

  // ── Heart toggle (global so inline onclick can reach it) ──────────────────

  window.handleCardFav = (btn, id) => {
    const added = toggleFavoriteProduct(id);
    btn.textContent = added ? "♥" : "♡";
    btn.title       = added ? "Remove from favorites" : "Add to favorites";
    btn.classList.toggle("active", added);

    // pop animation
    btn.style.transform = "scale(1.35)";
    setTimeout(() => { btn.style.transform = "scale(1)"; }, 200);
  };

  // ── Filter ────────────────────────────────────────────────────────────────

  function applyFilters() {
    const search   = searchInput   ? searchInput.value.trim().toLowerCase() : "";
    const category = categorySelect ? categorySelect.value                   : "";
    const location = locationSelect ? locationSelect.value                   : "";

    const filtered = allProducts.filter(p => {
      const matchSearch   = !search   ||
        p.title.toLowerCase().includes(search) ||
        p.brand.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search);
      const matchCategory = !category || p.category === category;
      const matchLocation = !location || p.location.toLowerCase() === location.toLowerCase();
      return matchSearch && matchCategory && matchLocation;
    });

    renderProducts(filtered);
  }

  // ── Event listeners ───────────────────────────────────────────────────────

  if (filterBtn)      filterBtn.addEventListener("click", applyFilters);
  if (searchInput)    searchInput.addEventListener("keydown", e => { if (e.key === "Enter") applyFilters(); });
  if (categorySelect) categorySelect.addEventListener("change", applyFilters);
  if (locationSelect) locationSelect.addEventListener("change", applyFilters);

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (searchInput)    searchInput.value    = "";
      if (categorySelect) categorySelect.value = "";
      if (locationSelect) locationSelect.value = "";
      renderProducts(allProducts);
    });
  }

  // ── Initial fetch ─────────────────────────────────────────────────────────

  productsGrid.innerHTML = `
    <p style="text-align:center;color:#888;grid-column:1/-1;padding:60px 0;">
      Loading products…
    </p>`;

  fetch(`${API_URL}/products`)
    .then(res => res.json())
    .then(products => {
      allProducts = products;
      if (allProducts.length === 0) {
        productsGrid.innerHTML = `
          <p style="text-align:center;color:#888;grid-column:1/-1;padding:60px 0;">
            No products listed yet. Be the first to sell!
          </p>`;
        return;
      }
      renderProducts(allProducts);
    })
    .catch(() => {
      productsGrid.innerHTML = `
        <p style="text-align:center;color:#888;grid-column:1/-1;padding:60px 0;">
          Could not load products. Please check your connection.
        </p>`;
    });
}
