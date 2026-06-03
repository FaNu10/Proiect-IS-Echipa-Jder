export function setFieldError(input, errorEl, msg) {
  errorEl.textContent = msg;
  input.classList.add("input-error");
  input.classList.remove("input-ok");
}

export function clearFieldError(input, errorEl) {
  errorEl.textContent = "";
  input.classList.remove("input-error");
}

export function setFieldOk(input) {
  input.classList.add("input-ok");
  input.classList.remove("input-error");
}

export function isValidEmail(val) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
}

export function isValidName(val) {
  return /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/.test(val);
}

export function checkPasswordStrength(pwd) {
  if (pwd.length < 8)             return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(pwd))         return "Password must contain at least one uppercase letter.";
  if (!/[0-9]/.test(pwd))         return "Password must contain at least one number.";
  if (!/[^A-Za-z0-9]/.test(pwd))  return "Password must contain at least one special character.";
  return null;
}

export function setButtonLoading(btn, text) {
  btn.disabled = true;
  btn.classList.add("loading");
  btn.textContent = text;
}

export function resetButton(btn, text) {
  btn.disabled = false;
  btn.classList.remove("loading");
  btn.textContent = text;
}
