/**
 * Perplexity AI API Client
 * Provides question-answering with real-time web context and citations
 */

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";

/**
 * Call Perplexity API for question-answering
 * @param {string} question - The user's question
 * @param {Array} conversationHistory - Prior conversation turns for context
 * @returns {Promise<Object>} - { answer, sources, citations }
 */
export async function queryPerplexity(question, conversationHistory = []) {
  if (!PERPLEXITY_API_KEY) {
    throw new Error("PERPLEXITY_API_KEY not configured");
  }

  // Build messages with conversation history for context
  const messages = [];

  // Add prior conversation turns (last 4)
  const recentHistory = (conversationHistory || []).slice(-4);
  for (const turn of recentHistory) {
    if (turn.role === "user" || turn.role === "assistant") {
      messages.push({
        role: turn.role === "user" ? "user" : "assistant",
        content: turn.content,
      });
    }
  }

  // Add current question
  messages.push({
    role: "user",
    content: question,
  });

  try {
    const response = await fetch(PERPLEXITY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages,
        temperature: 0.2,
        max_tokens: 400,
        search_domain_filter: ["perplexity.com"],
        return_images: false,
        return_related_questions: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Perplexity API Error:", error);
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const citations = data.citations || [];

    // Parse the response for sources
    const sources = citations.map((url, index) => ({
      title: `Source ${index + 1}`,
      snippet: url,
      link: url,
    }));

    return {
      answer: content,
      sources,
      raw: data,
    };
  } catch (error) {
    console.error("Perplexity API call failed:", error.message);
    throw error;
  }
}

/**
 * Format Perplexity answer into tutor format
 * @param {string} rawAnswer - Raw answer from Perplexity
 * @returns {string} - Formatted answer
 */
export function formatPerplexityAnswer(rawAnswer) {
  const answer = String(rawAnswer || "").trim();

  if (!answer) {
    return "Unable to generate an answer at this time.";
  }

  // Limit to 120 words for consistency
  const words = answer.split(/\s+/).filter(Boolean);
  const limited = words.length > 120 ? words.slice(0, 120).join(" ") + "." : answer;

  // Try to extract Definition/Explanation/Example structure if not present
  if (!limited.includes("Definition:") && !limited.includes("Explanation:")) {
    const sentences = limited.split(/(?<=[.!?])\s+/).filter(Boolean);
    const definition = sentences[0] || answer;
    const explanation = sentences.slice(1, 3).join(" ") || answer;
    const example = sentences.slice(3, 5).join(" ") || "Refer to the sources for specific examples.";

    return `Definition: ${definition} Explanation: ${explanation} Example: ${example}`;
  }

  return limited;
}
