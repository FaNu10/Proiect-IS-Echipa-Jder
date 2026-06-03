import { API_URL } from "../config.js";

export function initAddProduct() {
  const addProductForm = document.querySelector(".add-product-form");
  if (!addProductForm) return;

  // ── Sell / Donate toggle ─────────────────────────────────────────────────
  const sellBtn       = document.getElementById("type-sell");
  const donateBtn     = document.getElementById("type-donate");
  const isDonationInput = document.getElementById("isDonation-input");
  const priceGroup    = document.getElementById("price-group");
  const formSubtitle  = document.getElementById("form-subtitle");
  const form          = addProductForm;

  function setDonateMode(isDonate) {
    isDonationInput.value = isDonate ? "true" : "false";
    priceGroup.style.display = isDonate ? "none" : "";
    if (isDonate) {
      donateBtn.classList.add("active", "donate-active");
      sellBtn.classList.remove("active", "donate-active");
      form.classList.add("donate-mode");
      formSubtitle.textContent = "Fill in the details and give this item a new home for free.";
    } else {
      sellBtn.classList.add("active");
      sellBtn.classList.remove("donate-active");
      donateBtn.classList.remove("active", "donate-active");
      form.classList.remove("donate-mode");
      formSubtitle.textContent = "Complete the form below to publish your item.";
    }
  }

  sellBtn?.addEventListener("click", () => setDonateMode(false));
  donateBtn?.addEventListener("click", () => setDonateMode(true));

  // ── Multi-photo upload grid ──────────────────────────────────────────────
  const fileInput = document.getElementById("image-file-input");
  const grid      = document.getElementById("multi-upload-grid");
  const addTile   = document.getElementById("image-add-tile");

  // Holds the actual File objects in order
  let selectedFiles = [];

  if (addTile) {
    addTile.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", () => {
      const newFiles = Array.from(fileInput.files);
      newFiles.forEach(f => {
        if (selectedFiles.length >= 10) return;
        if (selectedFiles.find(x => x.name === f.name && x.size === f.size)) return; // skip duplicates
        selectedFiles.push(f);
      });
      fileInput.value = ""; // reset so same file can be re-added after removal
      renderPreviews();
    });
  }

  function renderPreviews() {
    // Remove all tiles except the add-tile
    grid.querySelectorAll(".image-preview-tile").forEach(el => el.remove());

    selectedFiles.forEach((file, idx) => {
      const tile = document.createElement("div");
      tile.className = "image-preview-tile";

      const img = document.createElement("img");
      img.src = URL.createObjectURL(file);
      tile.appendChild(img);

      // Remove button
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "image-remove-btn";
      removeBtn.textContent = "×";
      removeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        selectedFiles.splice(idx, 1);
        renderPreviews();
      });
      tile.appendChild(removeBtn);

      // Insert before the add-tile
      grid.insertBefore(tile, addTile);
    });

    // Hide add-tile when at limit
    addTile.style.display = selectedFiles.length >= 10 ? "none" : "flex";
  }

  addProductForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "login.html";
      return;
    }

    const errorEl = document.getElementById("product-error");
    errorEl.textContent = "";

    const title       = addProductForm.querySelector('[name="title"]').value.trim();
    const category    = addProductForm.querySelector('[name="category"]').value;
    const brand       = addProductForm.querySelector('[name="brand"]').value.trim();
    const price       = addProductForm.querySelector('[name="price"]').value;
    const size        = addProductForm.querySelector('[name="size"]').value;
    const condition   = addProductForm.querySelector('[name="condition"]').value;
    const location    = addProductForm.querySelector('[name="location"]').value.trim();
    const description = addProductForm.querySelector('[name="description"]').value.trim();
    const isDonation  = isDonationInput?.value === "true";

    if (!title || !category || !brand || !size || !condition || !location || !description) {
      errorEl.textContent = "Please fill in all required fields.";
      return;
    }
    if (!isDonation && !price) {
      errorEl.textContent = "Please enter a price.";
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("category", category);
    formData.append("brand", brand);
    formData.append("price", isDonation ? "0" : price);
    formData.append("isDonation", isDonation ? "true" : "false");
    formData.append("size", size);
    formData.append("condition", condition);
    formData.append("location", location);
    formData.append("description", description);
    selectedFiles.forEach(f => formData.append("images", f));

    const btn = addProductForm.querySelector(".publish-btn");
    btn.disabled = true;
    btn.textContent = "Publishing…";

    try {
      const res = await fetch(`${API_URL}/products`, {
        method: "POST",
        headers: { "Authorization": "Bearer " + token },
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        errorEl.textContent = result.message || "Failed to publish product.";
        return;
      }

      window.location.href = "index.html";
    } catch (err) {
      errorEl.textContent = "Cannot reach server. Make sure the backend is running.";
    } finally {
      btn.disabled = false;
      btn.textContent = "Publish Product";
    }
  });
}
