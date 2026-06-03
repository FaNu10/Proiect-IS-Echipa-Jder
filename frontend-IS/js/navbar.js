import { API_URL } from "./config.js";

export function initNavbar() {
  // Mobile menu
  const menuButton = document.querySelector(".menu-btn");
  const nav = document.querySelector("nav");
  if (menuButton) {
    menuButton.addEventListener("click", () => nav.classList.toggle("active"));
  }

  // Highlight active nav link based on current page
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  document.querySelectorAll("nav a").forEach(link => {
    const linkPage = link.getAttribute("href").split("/").pop();
    if (linkPage === currentPage) link.classList.add("active");
  });

  const navButtons = document.getElementById("nav-buttons");
  if (!navButtons) return;

  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (user) {
    const initials = user.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const isAdmin = user.role === "admin";
    const adminItem = isAdmin
      ? `<a class="dropdown-profile-link" href="admin.html">Admin Panel</a><div class="dropdown-divider"></div>`
      : `<button class="dropdown-request-admin-btn" id="request-admin-btn">Request Admin</button><div class="dropdown-divider"></div>`;

    navButtons.innerHTML = `
      <div class="user-avatar" id="user-avatar">${initials}</div>
      <div class="avatar-dropdown" id="avatar-dropdown">
        <a class="dropdown-profile-link" href="profile.html">My Profile</a>
        <div class="dropdown-divider"></div>
        ${adminItem}
        <span class="logout-link" id="logout-link">Log out</span>
      </div>
    `;

    const avatar   = document.getElementById("user-avatar");
    const dropdown = document.getElementById("avatar-dropdown");
    const logoutLink = document.getElementById("logout-link");

    avatar.addEventListener("click", (e) => {
      e.stopPropagation();
      // Close notification dropdown if open
      document.getElementById("notif-dropdown")?.classList.remove("visible");
      dropdown.classList.toggle("visible");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", () => {
      dropdown.classList.remove("visible");
    });

    logoutLink.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "login.html";
    });

    // Request Admin button
    if (!isAdmin) {
      const reqBtn = document.getElementById("request-admin-btn");
      if (reqBtn) {
        reqBtn.addEventListener("click", async (e) => {
          e.stopPropagation();
          reqBtn.textContent = "Sending…";
          reqBtn.disabled    = true;
          try {
            const token = localStorage.getItem("token");
            const res   = await fetch(`${API_URL}/notifications/admin-request`, {
              method:  "POST",
              headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) {
              reqBtn.textContent = "Request sent!";
            } else {
              reqBtn.textContent = data.message || "Already requested";
            }
          } catch {
            reqBtn.textContent = "Error. Try again.";
            reqBtn.disabled    = false;
          }
        });
      }
    }

  } else {
    navButtons.innerHTML = `
      <a href="login.html"><button class="login-btn">Login</button></a>
    `;
  }
}
