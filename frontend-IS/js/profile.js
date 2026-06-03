import { API_URL, BASE_URL } from "./config.js";

export function initProfile() {
  if (!document.getElementById("profile-loading")) return;

  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  // Elements
  const elLoading      = document.getElementById("profile-loading");
  const elError        = document.getElementById("profile-error");
  const elErrorMsg     = document.getElementById("profile-error-msg");
  const elContent      = document.getElementById("profile-content");

  const avatarCircle   = document.getElementById("profile-avatar-circle");
  const avatarImg      = document.getElementById("profile-avatar-img");
  const editPhotoBtn   = document.getElementById("edit-photo-btn");
  const avatarInput    = document.getElementById("avatar-file-input");

  const profileName    = document.getElementById("profile-name");
  const profileBio     = document.getElementById("profile-bio");

  // Edit mode elements
  const viewMode       = document.getElementById("profile-view-mode");
  const editMode       = document.getElementById("profile-edit-mode");
  const editProfileBtn = document.getElementById("edit-profile-btn");
  const editNameInput  = document.getElementById("edit-name-input");
  const editBioInput   = document.getElementById("edit-bio-input");
  const bioCharCount   = document.getElementById("bio-char-count");
  const saveProfileBtn = document.getElementById("save-profile-btn");
  const cancelProfileBtn = document.getElementById("cancel-profile-btn");
  const profileSaveError = document.getElementById("profile-save-error");

  const listingsSub    = document.getElementById("listings-sub");
  const listingsLoading = document.getElementById("listings-loading");
  const listingsGrid   = document.getElementById("listings-grid");
  const listingsEmpty  = document.getElementById("listings-empty");

  let currentUser = null;

  // ── Helpers ──────────────────────────────────────────────────────────────

  function getInitials(name) {
    return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  }

  function renderAvatar(user) {
    if (user.avatarUrl) {
      avatarImg.src = `${BASE_URL}${user.avatarUrl}`;
      avatarImg.style.display = "block";
      avatarCircle.style.display = "none";
    } else {
      avatarCircle.textContent = getInitials(user.name);
      avatarCircle.style.display = "flex";
      avatarImg.style.display = "none";
    }
  }

  function renderProfile(user) {
    renderAvatar(user);
    profileName.textContent = user.name;
    profileBio.textContent  = user.bio || "No bio yet.";
  }

  function renderListings(products) {
    listingsLoading.style.display = "none";

    if (products.length === 0) {
      listingsEmpty.style.display = "block";
      listingsSub.textContent = "0 items listed";
      return;
    }

    listingsSub.textContent = `${products.length} item${products.length !== 1 ? "s" : ""} listed`;
    listingsGrid.style.display = "grid";

    listingsGrid.innerHTML = products.map(p => {
      const img = p.imageUrl
        ? `<img src="${BASE_URL}${p.imageUrl}" alt="${p.title}" />`
        : `<div class="product-img-placeholder"></div>`;
      return `
        <div class="product-card${p.sold ? " is-sold" : ""}" onclick="window.location.href='product.html?id=${p.id}'">
          <div class="card-img-wrap">
            ${p.sold ? `<span class="sold-badge">Sold</span>` : ""}
            ${p.isDonation && !p.sold ? `<span class="card-free-badge">Free</span>` : ""}
            ${img}
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

  // ── Fetch profile ─────────────────────────────────────────────────────────

  async function loadProfile() {
    elLoading.style.display = "flex";
    elError.style.display   = "none";
    elContent.style.display = "none";

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "login.html";
        return;
      }
      if (!res.ok) throw new Error("Failed to load profile.");

      currentUser = await res.json();

      elLoading.style.display = "none";
      elContent.style.display = "block";
      renderProfile(currentUser);

      loadListings(currentUser.id);
    } catch (err) {
      elLoading.style.display = "none";
      elErrorMsg.textContent  = err.name === "AbortError" ? "Request timed out." : err.message;
      elError.style.display   = "flex";
    }
  }

  // ── Fetch this user's listings ────────────────────────────────────────────

  async function loadListings(userId) {
    listingsLoading.style.display = "block";
    listingsGrid.style.display    = "none";
    listingsEmpty.style.display   = "none";

    try {
      const res = await fetch(`${API_URL}/products?seller=${userId}`);
      if (!res.ok) throw new Error("Failed to load listings.");
      const products = await res.json();
      renderListings(products);
    } catch {
      listingsLoading.textContent = "Could not load listings.";
    }
  }

  // ── Photo upload ──────────────────────────────────────────────────────────

  editPhotoBtn.addEventListener("click", () => avatarInput.click());

  avatarInput.addEventListener("change", async () => {
    const file = avatarInput.files[0];
    if (!file || !currentUser) return;

    editPhotoBtn.textContent = "Uploading…";
    editPhotoBtn.disabled    = true;

    const formData = new FormData();
    formData.append("name", currentUser.name);
    formData.append("bio",  currentUser.bio || "");
    formData.append("avatar", file);

    try {
      const res  = await fetch(`${API_URL}/profile`, {
        method:  "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body:    formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed.");

      currentUser = { ...currentUser, ...data };
      renderAvatar(currentUser);

      // Update name in localStorage too
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...stored, name: currentUser.name }));
    } catch (err) {
      alert(err.message);
    } finally {
      editPhotoBtn.textContent = "Edit photo";
      editPhotoBtn.disabled    = false;
    }
  });

  // ── Delete account ────────────────────────────────────────────────────────

  const deleteAccountBtn     = document.getElementById("delete-account-btn");
  const deleteAccountOverlay = document.getElementById("delete-account-overlay");
  const deleteAccountConfirm = document.getElementById("delete-account-confirm-btn");
  const deleteAccountCancel  = document.getElementById("delete-account-cancel-btn");

  deleteAccountBtn.addEventListener("click", () => {
    deleteAccountOverlay.style.display = "flex";
  });

  deleteAccountCancel.addEventListener("click", () => {
    deleteAccountOverlay.style.display = "none";
  });

  deleteAccountOverlay.addEventListener("click", (e) => {
    if (e.target === deleteAccountOverlay) deleteAccountOverlay.style.display = "none";
  });

  deleteAccountConfirm.addEventListener("click", async () => {
    deleteAccountConfirm.textContent = "Deleting…";
    deleteAccountConfirm.disabled    = true;

    try {
      const res = await fetch(`${API_URL}/profile`, {
        method:  "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete account.");

      // Clear local storage and redirect to home
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "index.html";
    } catch {
      deleteAccountConfirm.textContent = "Yes, delete my account";
      deleteAccountConfirm.disabled    = false;
      deleteAccountOverlay.style.display = "none";
      alert("Could not delete account. Please try again.");
    }
  });

  // ── Retry button ──────────────────────────────────────────────────────────
  document.getElementById("profile-retry-btn").addEventListener("click", loadProfile);

  // ── Edit profile ──────────────────────────────────────────────────────────

  function openEditMode() {
    editNameInput.value  = currentUser.name || "";
    editBioInput.value   = currentUser.bio  || "";
    bioCharCount.textContent = (currentUser.bio || "").length;
    profileSaveError.style.display = "none";
    viewMode.style.display = "none";
    editMode.style.display = "block";
    editNameInput.focus();
  }

  function closeEditMode() {
    editMode.style.display = "none";
    viewMode.style.display = "block";
  }

  editBioInput.addEventListener("input", () => {
    bioCharCount.textContent = editBioInput.value.length;
  });

  editProfileBtn.addEventListener("click", openEditMode);
  cancelProfileBtn.addEventListener("click", closeEditMode);

  saveProfileBtn.addEventListener("click", async () => {
    const newName = editNameInput.value.trim();
    const newBio  = editBioInput.value.trim();

    if (!newName) {
      profileSaveError.textContent = "Name cannot be empty.";
      profileSaveError.style.display = "block";
      return;
    }

    saveProfileBtn.textContent = "Saving…";
    saveProfileBtn.disabled    = true;
    profileSaveError.style.display = "none";

    try {
      const formData = new FormData();
      formData.append("name", newName);
      formData.append("bio",  newBio);

      const res  = await fetch(`${API_URL}/profile`, {
        method:  "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body:    formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Save failed.");

      // Update local state
      currentUser = { ...currentUser, ...data };
      profileName.textContent = currentUser.name;
      profileBio.textContent  = currentUser.bio || "No bio yet.";

      // Keep localStorage in sync
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...stored, name: currentUser.name }));

      closeEditMode();
    } catch (err) {
      profileSaveError.textContent = err.message;
      profileSaveError.style.display = "block";
    } finally {
      saveProfileBtn.textContent = "Save";
      saveProfileBtn.disabled    = false;
    }
  });

  // ── Boot ──────────────────────────────────────────────────────────────────
  loadProfile();
}
