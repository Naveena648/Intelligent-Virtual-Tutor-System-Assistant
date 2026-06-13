import { supportedDomains } from "../data/knowledge.js";

const keywordMap = {
  Education: ["learn", "study", "exam", "concept", "explain", "assignment", "school"],
  Programming: ["code", "javascript", "python", "api", "bug", "async", "react", "sql"],
  Healthcare: ["health", "symptom", "medical", "doctor", "treatment", "vitamin", "disease"],
  Law: ["law", "legal", "court", "contract", "jurisdiction", "case", "rights"],
  Finance: ["finance", "interest", "budget", "invest", "portfolio", "money", "risk"],
  "Personal Development": ["habit", "productivity", "goal", "mindset", "confidence", "growth"],
};

export function classifyDomain(message) {
  const text = String(message).toLowerCase();

  const scores = supportedDomains.map((domain) => {
    const keywords = keywordMap[domain] || [];
    const score = keywords.reduce((total, keyword) => total + (text.includes(keyword) ? 1 : 0), 0);
    return { domain, score };
  });

  scores.sort((left, right) => right.score - left.score);

  const winner = scores[0] || { domain: "Education", score: 0 };
  const confidence = Math.min(0.95, 0.35 + winner.score * 0.18);

  return {
    domain: winner.score > 0 ? winner.domain : "Education",
    confidence,
    scores,
  };
}
