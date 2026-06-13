function ensureGoogleConfig() {
  if (!process.env.GOOGLE_API_KEY || !process.env.GOOGLE_CSE_ID) {
    const error = new Error(
      "Google Search is not configured. Add GOOGLE_API_KEY and GOOGLE_CSE_ID to your .env file.",
    );
    error.statusCode = 500;
    throw error;
  }
}

export async function searchGoogle(query, maxResults = 5) {
  ensureGoogleConfig();

  const limit = Math.max(1, Math.min(10, Number(maxResults || 5)));

  const endpoint = new URL("https://www.googleapis.com/customsearch/v1");
  endpoint.searchParams.set("key", process.env.GOOGLE_API_KEY);
  endpoint.searchParams.set("cx", process.env.GOOGLE_CSE_ID);
  endpoint.searchParams.set("q", query);
  endpoint.searchParams.set("num", String(limit));

  const response = await fetch(endpoint.toString());
  const payload = await response.json();

  if (!response.ok) {
    const message = payload?.error?.message || "Failed to search Google.";
    const error = new Error(message);
    error.statusCode = response.status;
    throw error;
  }

  const items = Array.isArray(payload.items) ? payload.items : [];
  return items.map((item) => ({
    title: item.title || "Untitled",
    snippet: item.snippet || "",
    link: item.link || "",
  }));
}
