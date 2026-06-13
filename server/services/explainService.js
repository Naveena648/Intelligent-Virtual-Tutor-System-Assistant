import { cosineSimilarity, frequencyVector, tokenize, unique } from "../lib/text.js";

function detectKeyConcepts(referenceAnswer) {
  const text = String(referenceAnswer).toLowerCase();
  return unique(
    text
      .split(/[^a-z0-9+.-]+/)
      .filter((token) => token.length > 4)
      .slice(0, 10),
  );
}

export function evaluateExplanation({ question, referenceAnswer, explanation, domain }) {
  const referenceVector = frequencyVector(referenceAnswer);
  const explanationVector = frequencyVector(explanation);
  const keyConcepts = detectKeyConcepts(referenceAnswer);
  const explanationTokens = new Set(tokenize(explanation));
  const matchedConcepts = keyConcepts.filter((concept) => explanationTokens.has(concept));

  const similarityScore = cosineSimilarity(referenceVector, explanationVector);
  const coverageScore = keyConcepts.length === 0 ? 0 : matchedConcepts.length / keyConcepts.length;
  const score = Math.round((similarityScore * 0.6 + coverageScore * 0.4) * 100);

  let status = "incorrect";
  let feedback = "The explanation needs more of the core idea.";

  if (score >= 75) {
    status = "correct";
    feedback = "Correct understanding. Your explanation captured the main idea and supporting detail.";
  } else if (score >= 45) {
    status = "partial";
    feedback = "Partial understanding. You captured part of the idea, but some important concepts are missing.";
  }

  const missingConcepts = keyConcepts.filter((concept) => !matchedConcepts.includes(concept));

  return {
    status,
    score,
    feedback,
    domain,
    question,
    matchedConcepts,
    missingConcepts,
    suggestions: [
      missingConcepts[0] ? `Include the idea of ${missingConcepts[0]}.` : "Add a concrete example.",
      "State the definition in your own words.",
      "Explain why the concept matters or how it works.",
    ].filter(Boolean),
  };
}
