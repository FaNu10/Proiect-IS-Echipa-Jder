export function initUI() {
  // Page loader fade-in
  document.body.style.opacity = "0";
  document.body.style.transition = "0.4s";
  window.addEventListener("load", () => { document.body.style.opacity = "1"; });

  // Search filter
  const searchInput = document.querySelector(".filters-container input");
  if (searchInput) {
    searchInput.addEventListener("keyup", () => {
      const val = searchInput.value.toLowerCase();
      document.querySelectorAll(".product-card").forEach((card) => {
        const title = card.querySelector("h3")?.innerText.toLowerCase() || "";
        card.style.display = title.includes(val) ? "block" : "none";
      });
    });
  }

  // Product image gallery
  const mainImage = document.querySelector(".main-product-image img");
  if (mainImage) {
    document.querySelectorAll(".thumbnail img").forEach((thumbnail) => {
      thumbnail.addEventListener("click", () => { mainImage.src = thumbnail.src; });
    });
  }



  // Start Shopping → scroll filters into view
  const startShoppingBtn = document.querySelector(".primary-btn");
  if (startShoppingBtn) {
    startShoppingBtn.addEventListener("click", () => {
      const filtersSection = document.querySelector(".filters-section");
      if (filtersSection) {
        filtersSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  // Learn More → open modal
  const learnMoreBtn     = document.querySelector(".secondary-btn");
  const learnMoreOverlay = document.getElementById("learn-more-overlay");
  const learnMoreClose   = document.getElementById("learn-more-close");

  if (learnMoreBtn && learnMoreOverlay) {
    learnMoreBtn.addEventListener("click", () => {
      learnMoreOverlay.style.display = "flex";
    });
    learnMoreClose.addEventListener("click", () => {
      learnMoreOverlay.style.display = "none";
    });
    learnMoreOverlay.addEventListener("click", (e) => {
      if (e.target === learnMoreOverlay) learnMoreOverlay.style.display = "none";
    });
  }

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      document.querySelector(this.getAttribute("href"))?.scrollIntoView({ behavior: "smooth" });
    });
  });

}
