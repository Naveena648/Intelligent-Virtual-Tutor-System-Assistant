import { classifyDomain } from "./domainClassifier.js";
import { buildContextSummary, searchKnowledge } from "./knowledgeService.js";

function buildStructuredAnswer({ message, domain, confidence, sources, language }) {
  const answerLines = [
    `Domain: ${domain}`,
    `Confidence: ${Math.round(confidence * 100)}%`,
    "",
    "Answer:",
    `I matched your question against the ${domain.toLowerCase()} knowledge base and pulled the most relevant passages before responding.`,
    "",
    "What the retrieved material suggests:",
    ...sources.map((source) => `- ${source.title}: ${source.content}`),
    "",
    "Why this answer is safer:",
    "- It is grounded in retrieved domain content.",
    "- It avoids overstating certainty when the context is incomplete.",
    "- It can be refined if you provide more detail.",
    "",
    `Follow-up question: What detail about "${message.slice(0, 80)}" should I clarify next?`,
  ];

  if (language && language !== "en") {
    answerLines.unshift(`Language preference: ${language}`);
  }

  return answerLines.join("\n");
}

export function answerQuestion({ message, preferredDomain = "Auto", language = "en" }) {
  const classification = classifyDomain(message);
  const domain = preferredDomain && preferredDomain !== "Auto" ? preferredDomain : classification.domain;
  const sources = searchKnowledge(message, domain, 4);
  const context = buildContextSummary(sources);

  return {
    domain,
    classification,
    sources,
    context,
    answer: buildStructuredAnswer({ message, domain, confidence: classification.confidence, sources, language }),
    followUpQuestion:
      sources.length > 0
        ? `Would you like a worked example for ${sources[0].title.toLowerCase()}?`
        : "Would you like me to narrow the topic and try again?",
    suggestions: [
      "Ask for a simpler explanation",
      "Request a worked example",
      "Ask for a comparison with a related concept",
    ],
  };
}
