const authTokenKey = "lumina-auth-token";

export function getAuthToken() {
  return localStorage.getItem(authTokenKey);
}

export function setAuthToken(token) {
  if (!token) {
    localStorage.removeItem(authTokenKey);
    return;
  }

  localStorage.setItem(authTokenKey, token);
}

export async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  const token = getAuthToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof payload === "string" ? payload : payload.message || "Request failed";
    const error = new Error(message);
    error.payload = payload;
    throw error;
  }

  return payload;
}
