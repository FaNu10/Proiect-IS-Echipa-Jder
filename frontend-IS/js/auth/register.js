import { API_URL } from "../config.js";
import {
  setFieldError, clearFieldError, setFieldOk,
  isValidEmail, isValidName, checkPasswordStrength,
  setButtonLoading, resetButton,
} from "./utils.js";

export function initRegister() {
  const registerForm = document.querySelector(".register-form");
  if (!registerForm) return;

  const nameInput     = document.getElementById("reg-name");
  const emailInput    = document.getElementById("reg-email");
  const passwordInput = document.getElementById("reg-password");
  const confirmInput  = document.getElementById("reg-confirm");
  const termsCheck    = document.getElementById("reg-terms");
  const nameError     = document.getElementById("reg-name-error");
  const emailError    = document.getElementById("reg-email-error");
  const passwordError = document.getElementById("reg-password-error");
  const confirmError  = document.getElementById("reg-confirm-error");
  const termsError    = document.getElementById("reg-terms-error");
  const generalError  = document.getElementById("reg-error");
  const submitBtn     = document.getElementById("reg-btn");

  nameInput.addEventListener("input",     () => { clearFieldError(nameInput, nameError);         generalError.textContent = ""; });
  emailInput.addEventListener("input",    () => { clearFieldError(emailInput, emailError);        generalError.textContent = ""; });
  passwordInput.addEventListener("input", () => { clearFieldError(passwordInput, passwordError);  generalError.textContent = ""; });
  confirmInput.addEventListener("input",  () => { clearFieldError(confirmInput, confirmError);    generalError.textContent = ""; });
  termsCheck.addEventListener("change",   () => { termsError.textContent = ""; });

  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    generalError.textContent = "";
    let valid = true;

    const name     = nameInput.value.trim();
    const email    = emailInput.value.trim();
    const password = passwordInput.value;
    const confirm  = confirmInput.value;

    if (!name) {
      setFieldError(nameInput, nameError, "Full name is required.");
      valid = false;
    } else if (!isValidName(name)) {
      setFieldError(nameInput, nameError, "Name can only contain letters, spaces, hyphens and apostrophes (2–50 chars).");
      valid = false;
    } else {
      clearFieldError(nameInput, nameError);
      setFieldOk(nameInput);
    }

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

    const pwdError = checkPasswordStrength(password);
    if (!password) {
      setFieldError(passwordInput, passwordError, "Password is required.");
      valid = false;
    } else if (pwdError) {
      setFieldError(passwordInput, passwordError, pwdError);
      valid = false;
    } else {
      clearFieldError(passwordInput, passwordError);
      setFieldOk(passwordInput);
    }

    if (!confirm) {
      setFieldError(confirmInput, confirmError, "Please confirm your password.");
      valid = false;
    } else if (confirm !== password) {
      setFieldError(confirmInput, confirmError, "Passwords do not match.");
      valid = false;
    } else {
      clearFieldError(confirmInput, confirmError);
      setFieldOk(confirmInput);
    }

    if (!termsCheck.checked) {
      termsError.textContent = "You must accept the Terms of Service to register.";
      valid = false;
    } else {
      termsError.textContent = "";
    }

    if (!valid) return;

    setButtonLoading(submitBtn, "Creating account…");

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const data = await res.json();

      if (res.status === 409) {
        setFieldError(emailInput, emailError, "An account with this email already exists.");
        return;
      }

      if (res.status === 429) {
        generalError.textContent = "Too many registration attempts. Please try again later.";
        return;
      }

      if (!res.ok) {
        generalError.textContent = data.message || "Something went wrong. Please try again.";
        return;
      }

      window.location.href = "login.html";

    } catch (err) {
      generalError.textContent = err.name === "AbortError"
        ? "Request timed out. Please check your connection and try again."
        : "Cannot reach server. Please check your connection.";
    } finally {
      resetButton(submitBtn, "Register →");
    }
  });
}
