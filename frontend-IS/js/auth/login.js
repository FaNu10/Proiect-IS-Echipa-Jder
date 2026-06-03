import { API_URL } from "../config.js";
import {
  setFieldError, clearFieldError, setFieldOk,
  isValidEmail, setButtonLoading, resetButton,
} from "./utils.js";

export function initLogin() {
  const loginForm = document.querySelector(".login-form");
  if (!loginForm) return;

  const emailInput    = document.getElementById("login-email");
  const passwordInput = document.getElementById("login-password");
  const emailError    = document.getElementById("login-email-error");
  const passwordError = document.getElementById("login-password-error");
  const generalError  = document.getElementById("login-error");
  const submitBtn     = document.getElementById("login-btn");

  let failedAttempts = 0;

  emailInput.addEventListener("input", () => {
    clearFieldError(emailInput, emailError);
    generalError.textContent = "";
  });

  passwordInput.addEventListener("input", () => {
    clearFieldError(passwordInput, passwordError);
    generalError.textContent = "";
  });

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    generalError.textContent = "";
    let valid = true;

    const email    = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email) {
      setFieldError(emailInput, emailError, "Email is required.");
      valid = false;
    } else if (!isValidEmail(email)) {
      setFieldError(emailInput, emailError, "Please enter a valid email address.");
      valid = false;
    } else {
      clearFieldError(emailInput, emailError);
      setFieldOk(emailInput);
    }

    if (!password) {
      setFieldError(passwordInput, passwordError, "Password is required.");
      valid = false;
    } else {
      clearFieldError(passwordInput, passwordError);
      setFieldOk(passwordInput);
    }

    if (!valid) return;

    setButtonLoading(submitBtn, "Logging in…");

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const data = await res.json();

      if (res.status === 401) {
        failedAttempts++;
        setFieldError(passwordInput, passwordError, "Wrong email or password.");
        if (failedAttempts >= 3) {
          showAdminContacts();
        }
        return;
      }

      if (!res.ok) {
        generalError.textContent = data.message || "Something went wrong. Please try again.";
        return;
      }

      failedAttempts = 0;
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "index.html";

    } catch (err) {
      generalError.textContent = err.name === "AbortError"
        ? "Request timed out. Please check your connection and try again."
        : "Cannot reach server. Please check your connection.";
    } finally {
      resetButton(submitBtn, "Login →");
    }
  });

  async function showAdminContacts() {
    let adminBox = document.getElementById("admin-contact-box");
    if (adminBox) return; // already shown

    adminBox = document.createElement("div");
    adminBox.id = "admin-contact-box";
    adminBox.className = "admin-contact-box";
    adminBox.innerHTML = `<p class="admin-contact-title">Having trouble logging in? Contact one of our admins:</p><ul class="admin-contact-list"><li>Loading…</li></ul>`;
    loginForm.appendChild(adminBox);

    try {
      const res    = await fetch(`${API_URL}/users/admins`);
      const admins = await res.json();
      const list   = adminBox.querySelector(".admin-contact-list");
      if (admins.length === 0) {
        list.innerHTML = `<li>No admins available.</li>`;
      } else {
        list.innerHTML = admins.map(a =>
          `<li><strong>${a.name}</strong> — <a href="mailto:${a.email}">${a.email}</a></li>`
        ).join("");
      }
    } catch {
      adminBox.querySelector(".admin-contact-list").innerHTML = `<li>Could not load admin contacts.</li>`;
    }
  }
}
