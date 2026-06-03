import { API_URL, BASE_URL } from "../config.js";
import { isMemberFavorited, toggleFavoriteMember, getFavoriteProducts, toggleFavoriteProduct } from "../favorites.js";

export function initProductDetail() {
  const page = document.querySelector(".product-details-page");
  if (!page) return;

  const params    = new URLSearchParams(window.location.search);
  const productId = params.get("id");
  if (!productId) return;

  const token      = localStorage.getItem("token");
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");

  // ── Helpers ───────────────────────────────────────────────────────────────

  function getInitials(name) {
    return (name || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  }

  function imgSrc(url) {
    return url ? BASE_URL + url
               : "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=800&auto=format&fit=crop";
  }

  // ── Fetch product ─────────────────────────────────────────────────────────

  let currentProduct = null;

  const loadingEl = document.getElementById("product-loading");
  const contentEl = document.getElementById("product-content");

  fetch(`${API_URL}/products/${productId}`)
    .then(res => res.json())
    .then(p => {
      currentProduct = p;
      document.title = `${p.title} – LittleLoop`;
      if (loadingEl) loadingEl.style.display = "none";
      if (contentEl) contentEl.style.display = "block";

      // Images — support multiple
      const mainImg  = document.getElementById("main-img");
      const allImgs  = (p.images && p.images.length) ? p.images : (p.imageUrl ? [p.imageUrl] : []);
      if (mainImg) { mainImg.src = imgSrc(allImgs[0] || null); mainImg.alt = p.title; }

      // Thumbnail strip (only when more than 1 image)
      if (allImgs.length > 1) {
        const gallery = document.querySelector(".product-gallery");
        const strip   = document.createElement("div");
        strip.className = "gallery-thumbnails";
        allImgs.forEach((url, i) => {
          const thumb = document.createElement("img");
          thumb.src       = imgSrc(url);
          thumb.alt       = `Photo ${i + 1}`;
          thumb.className = i === 0 ? "thumb active" : "thumb";
          thumb.addEventListener("click", () => {
            mainImg.src = imgSrc(url);
            strip.querySelectorAll(".thumb").forEach(t => t.classList.remove("active"));
            thumb.classList.add("active");
          });
          strip.appendChild(thumb);
        });
        gallery.appendChild(strip);
      }

      // Donation yellow theme
      if (p.isDonation) {
        document.querySelector(".product-details-page")?.classList.add("is-donation");
      }

      // Core fields
      document.getElementById("product-title").textContent    = p.title;
      document.getElementById("product-price").textContent    = p.isDonation ? "Free" : `€${parseFloat(p.price).toFixed(2)}`;
      document.getElementById("product-category").textContent = p.category;
      document.getElementById("product-description").textContent = p.description;

      // Specs
      document.getElementById("spec-size").textContent      = p.size;
      document.getElementById("spec-condition").textContent  = p.condition;
      document.getElementById("spec-brand").textContent      = p.brand;
      document.getElementById("spec-location").textContent   = p.location;

      // ── Favourite button on image ─────────────────────────────────────────
      const favBtn = document.getElementById("detail-fav-btn");
      if (favBtn) {
        const updateFavBtn = () => {
          const active = getFavoriteProducts().includes(p.id);
          favBtn.classList.toggle("active", active);
          favBtn.title = active ? "Remove from favorites" : "Add to favorites";
        };
        updateFavBtn();
        favBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          toggleFavoriteProduct(p.id);
          updateFavBtn();
        });
      }

      // ── Owner controls (Edit / Delete) ────────────────────────────────────
      if (storedUser && p.sellerId === storedUser.id) {
        // Replace Buy now / Message seller with owner buttons (same large size)
        const actionsDiv = document.querySelector(".product-actions");
        if (actionsDiv) {
          actionsDiv.innerHTML = `
            <button class="buy-btn edit-listing-btn-lg" id="edit-listing-btn">Edit listing</button>
            <button class="message-btn delete-listing-btn-lg" id="delete-listing-btn">Delete listing</button>
          `;
        }

        document.getElementById("edit-listing-btn").addEventListener("click", () => openEditModal(p));
        document.getElementById("delete-listing-btn").addEventListener("click", () => openDeleteConfirm());
      }

      // Seller mini-card
      const avatarEl = document.getElementById("seller-mini-avatar");
      const nameEl   = document.getElementById("seller-mini-name");
      const bioEl    = document.getElementById("seller-mini-bio");

      if (p.sellerAvatarUrl) {
        const img = document.createElement("img");
        img.src = BASE_URL + p.sellerAvatarUrl;
        img.className = "seller-mini-avatar-img";
        avatarEl.replaceWith(img);
        img.id = "seller-mini-avatar";
      } else {
        avatarEl.textContent  = getInitials(p.sellerName);
      }

      nameEl.textContent = p.sellerName || "Unknown seller";
      bioEl.textContent  = p.sellerBio  || "";

      // Make seller card clickable → go to seller profile
      const sellerCard = document.getElementById("seller-mini-card");
      if (sellerCard && p.sellerId) {
        sellerCard.style.cursor = "pointer";
        sellerCard.title = `View ${p.sellerName}'s profile`;
        sellerCard.addEventListener("click", (e) => {
          if (e.target.closest(".seller-follow-btn")) return;
          window.location.href = `seller.html?id=${p.sellerId}`;
        });
      }

      // ── Buy / Claim button (non-owner, logged-in) ────────────────────────────
      if (storedUser && p.sellerId !== storedUser.id) {
        const buyBtn = document.querySelector(".buy-btn");
        if (buyBtn) {
          const isDonation  = !!p.isDonation;
          const endpoint    = isDonation ? "donation-request" : "buy-request";
          const defaultText = isDonation ? "Claim for Free" : "Buy now";
          const sentText    = isDonation ? "Claim request sent!" : "Request sent!";
          const sentColor   = isDonation ? "#d97706" : "#58b866";

          if (isDonation) {
            buyBtn.textContent = "Claim for Free";
            buyBtn.classList.add("claim-btn");
          }

          buyBtn.addEventListener("click", async () => {
            if (!token) { window.location.href = "login.html"; return; }
            buyBtn.textContent = "Sending request…";
            buyBtn.disabled    = true;
            try {
              const res  = await fetch(`${API_URL}/notifications/${endpoint}`, {
                method:  "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body:    JSON.stringify({ productId }),
              });
              const data = await res.json();
              if (res.status === 400 && data.error === "ALREADY_REQUESTED") {
                buyBtn.textContent = "Request already sent";
              } else if (!res.ok) {
                throw new Error(data.message || "Failed");
              } else {
                buyBtn.textContent = sentText;
                buyBtn.style.background = sentColor;
              }
            } catch (err) {
              buyBtn.textContent = defaultText;
              buyBtn.disabled    = false;
              alert(err.message || "Could not send request.");
            }
          });
        }
      }

      // Message seller button
      const msgBtn = document.querySelector(".message-btn");
      if (msgBtn && !(storedUser && p.sellerId === storedUser.id)) {
        msgBtn.addEventListener("click", () => {
          showToast("Feature not implemented yet. Thank you for your understanding!");
        });
      }

      // Follow button (only if not the owner)
      if (sellerCard && p.sellerId && !(storedUser && p.sellerId === storedUser.id)) {
        const isFav = isMemberFavorited(p.sellerId);
        const followBtn = document.createElement("button");
        followBtn.className = `seller-follow-btn ${isFav ? "following" : ""}`;
        followBtn.textContent = isFav ? "Following ♥" : "Follow ♡";
        followBtn.addEventListener("click", () => {
          const nowFav = toggleFavoriteMember(p.sellerId);
          followBtn.textContent = nowFav ? "Following ♥" : "Follow ♡";
          followBtn.classList.toggle("following", nowFav);
        });
        sellerCard.appendChild(followBtn);
      }

      // More from seller
      loadMoreFromSeller(p.sellerId, p.id, p.sellerName);
    })
    .catch(() => {
      if (loadingEl) loadingEl.innerHTML = "<p style='color:#999;'>Product not found.</p>";
    });

  // ── Delete confirmation modal ─────────────────────────────────────────────

  function openDeleteConfirm() {
    document.getElementById("delete-confirm-overlay").style.display = "flex";
  }

  function closeDeleteConfirm() {
    document.getElementById("delete-confirm-overlay").style.display = "none";
  }

  const deleteOverlay = document.getElementById("delete-confirm-overlay");
  if (deleteOverlay) {
    document.getElementById("delete-confirm-no").addEventListener("click", closeDeleteConfirm);
    deleteOverlay.addEventListener("click", e => { if (e.target === deleteOverlay) closeDeleteConfirm(); });

    document.getElementById("delete-confirm-yes").addEventListener("click", async () => {
      const btn = document.getElementById("delete-confirm-yes");
      btn.textContent = "Deleting…";
      btn.disabled    = true;

      try {
        const res = await fetch(`${API_URL}/products/${productId}`, {
          method:  "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Delete failed.");
        window.location.href = "profile.html";
      } catch {
        closeDeleteConfirm();
        btn.textContent = "Yes, delete it";
        btn.disabled    = false;
      }
    });
  }

  // ── Edit modal ────────────────────────────────────────────────────────────

  let epKeepUrls  = []; // existing URLs the user hasn't removed
  let epNewFiles  = []; // newly added File objects

  const epFileInput = document.getElementById("ep-image-input");
  const epGrid      = document.getElementById("ep-photo-grid");
  const epAddTile   = document.getElementById("ep-add-tile");

  if (epAddTile) {
    epAddTile.addEventListener("click", () => epFileInput.click());
    epFileInput.addEventListener("change", () => {
      Array.from(epFileInput.files).forEach(f => {
        if (epKeepUrls.length + epNewFiles.length >= 10) return;
        epNewFiles.push(f);
      });
      epFileInput.value = "";
      renderEpGrid();
    });
  }

  function renderEpGrid() {
    epGrid.querySelectorAll(".image-preview-tile").forEach(el => el.remove());

    // Existing photos
    epKeepUrls.forEach((url, idx) => {
      const tile = document.createElement("div");
      tile.className = "image-preview-tile";
      const img = document.createElement("img");
      img.src = `${BASE_URL}${url}`;
      tile.appendChild(img);
      const rm = document.createElement("button");
      rm.type = "button"; rm.className = "image-remove-btn"; rm.textContent = "✕";
      rm.addEventListener("click", (e) => { e.stopPropagation(); epKeepUrls.splice(idx, 1); renderEpGrid(); });
      tile.appendChild(rm);
      epGrid.insertBefore(tile, epAddTile);
    });

    // New files
    epNewFiles.forEach((file, idx) => {
      const tile = document.createElement("div");
      tile.className = "image-preview-tile";
      const img = document.createElement("img");
      img.src = URL.createObjectURL(file);
      tile.appendChild(img);
      const rm = document.createElement("button");
      rm.type = "button"; rm.className = "image-remove-btn"; rm.textContent = "✕";
      rm.addEventListener("click", (e) => { e.stopPropagation(); epNewFiles.splice(idx, 1); renderEpGrid(); });
      tile.appendChild(rm);
      epGrid.insertBefore(tile, epAddTile);
    });

    epAddTile.style.display = (epKeepUrls.length + epNewFiles.length >= 10) ? "none" : "flex";
  }

  function setEpDonateMode(isDonate) {
    const sellBtn    = document.getElementById("ep-type-sell");
    const donateBtn  = document.getElementById("ep-type-donate");
    const priceGroup = document.getElementById("ep-price-group");
    const hiddenInput = document.getElementById("ep-isDonation");
    hiddenInput.value = isDonate ? "true" : "false";
    if (isDonate) {
      donateBtn.classList.add("active", "donate-active");
      sellBtn.classList.remove("active", "donate-active");
      priceGroup.style.visibility = "hidden";
    } else {
      sellBtn.classList.add("active");
      sellBtn.classList.remove("donate-active");
      donateBtn.classList.remove("active", "donate-active");
      priceGroup.style.visibility = "";
    }
  }

  document.getElementById("ep-type-sell")?.addEventListener("click",   () => setEpDonateMode(false));
  document.getElementById("ep-type-donate")?.addEventListener("click", () => setEpDonateMode(true));

  // Ensure a <select> can display value even if it's a legacy option not in the list
  function setSelectValue(selectEl, value) {
    if (value && !Array.from(selectEl.options).some(o => o.value === value)) {
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = value;
      selectEl.appendChild(opt);
    }
    selectEl.value = value;
  }

  function openEditModal(p) {
    document.getElementById("ep-title").value       = p.title;
    setSelectValue(document.getElementById("ep-category"), p.category);
    document.getElementById("ep-brand").value       = p.brand;
    document.getElementById("ep-price").value       = parseFloat(p.price).toFixed(2);
    document.getElementById("ep-size").value        = p.size;
    setSelectValue(document.getElementById("ep-condition"), p.condition);
    setSelectValue(document.getElementById("ep-location"), p.location);
    document.getElementById("ep-description").value = p.description;
    document.getElementById("edit-form-error").style.display = "none";
    setEpDonateMode(!!p.isDonation);

    // Load existing photos
    epKeepUrls = (p.images && p.images.length) ? [...p.images] : (p.imageUrl ? [p.imageUrl] : []);
    epNewFiles = [];
    renderEpGrid();

    document.getElementById("edit-modal-overlay").style.display = "flex";
  }

  function closeEditModal() {
    document.getElementById("edit-modal-overlay").style.display = "none";
  }

  const overlay = document.getElementById("edit-modal-overlay");
  if (overlay) {
    document.getElementById("edit-modal-close").addEventListener("click",  closeEditModal);
    document.getElementById("edit-cancel-btn").addEventListener("click",   closeEditModal);
    overlay.addEventListener("click", e => { if (e.target === overlay) closeEditModal(); });

    document.getElementById("edit-product-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const saveBtn  = document.getElementById("edit-save-btn");
      const errorEl  = document.getElementById("edit-form-error");
      saveBtn.textContent = "Saving…";
      saveBtn.disabled    = true;
      errorEl.style.display = "none";

      try {
        const epIsDonation = document.getElementById("ep-isDonation").value === "true";
        const formData = new FormData();
        formData.append("title",       document.getElementById("ep-title").value.trim());
        formData.append("category",    document.getElementById("ep-category").value);
        formData.append("brand",       document.getElementById("ep-brand").value.trim());
        formData.append("price",       epIsDonation ? "0" : document.getElementById("ep-price").value);
        formData.append("isDonation",  epIsDonation ? "true" : "false");
        formData.append("size",        document.getElementById("ep-size").value.trim());
        formData.append("condition",   document.getElementById("ep-condition").value);
        formData.append("location",    document.getElementById("ep-location").value);
        formData.append("description", document.getElementById("ep-description").value.trim());
        // Send kept existing URLs
        formData.append("keepImages", JSON.stringify(epKeepUrls));
        // Send new files
        epNewFiles.forEach(f => formData.append("images", f));

        const res  = await fetch(`${API_URL}/products/${productId}`, {
          method:  "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body:    formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Save failed.");

        window.location.reload();
      } catch (err) {
        errorEl.textContent   = err.message;
        errorEl.style.display = "block";
      } finally {
        saveBtn.textContent = "Save changes";
        saveBtn.disabled    = false;
      }
    });
  }

  // ── Toast helper ─────────────────────────────────────────────────────────

  function showToast(message) {
    let toast = document.getElementById("detail-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "detail-toast";
      toast.className = "detail-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("visible");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove("visible"), 3500);
  }

  // ── More from seller ──────────────────────────────────────────────────────

  function loadMoreFromSeller(sellerId, currentId, sellerName) {
    const moreTitle = document.getElementById("more-title");
    const moreSub   = document.getElementById("more-sub");
    const moreGrid  = document.getElementById("more-grid");

    if (moreTitle) moreTitle.textContent = `More from ${sellerName}'s closet`;

    fetch(`${API_URL}/products?seller=${sellerId}`)
      .then(res => res.json())
      .then(products => {
        // Exclude the current product
        const others = products.filter(p => p.id !== currentId);

        if (moreSub) moreSub.textContent = `${others.length} other item${others.length !== 1 ? "s" : ""} for sale`;

        if (others.length === 0) {
          moreGrid.innerHTML = `<p style="color:#999;grid-column:1/-1;">No other listings from this seller.</p>`;
          return;
        }

        moreGrid.innerHTML = others.map(p => `
          <div class="small-product-card" onclick="window.location.href='product.html?id=${p.id}'" style="cursor:pointer;">
            <img src="${imgSrc(p.imageUrl)}" alt="${p.title}" />
            <h4>${p.title}</h4>
            <p>€${parseFloat(p.price).toFixed(2)}</p>
          </div>
        `).join("");
      })
      .catch(() => {
        if (moreGrid) moreGrid.innerHTML = `<p style="color:#999;">Could not load listings.</p>`;
      });
  }
}
