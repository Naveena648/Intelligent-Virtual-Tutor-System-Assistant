import { knowledgeChunks } from "../data/knowledge.js";
import { cosineSimilarity, frequencyVector, tokenize, unique } from "../lib/text.js";

const chunkVectors = new Map(
  knowledgeChunks.map((chunk) => [chunk.id, frequencyVector(`${chunk.title} ${chunk.content} ${chunk.keywords.join(" ")}`)]),
);

export function searchKnowledge(query, preferredDomain, limit = 4) {
  const queryVector = frequencyVector(query);
  const normalizedQueryTokens = tokenize(query);

  const ranked = knowledgeChunks
    .filter((chunk) => !preferredDomain || preferredDomain === "Auto" || chunk.domain === preferredDomain)
    .map((chunk) => {
      const vector = chunkVectors.get(chunk.id) || frequencyVector(chunk.content);
      const semanticScore = cosineSimilarity(queryVector, vector);
      const keywordBonus = unique(chunk.keywords).reduce(
        (total, keyword) => total + (normalizedQueryTokens.join(" ").includes(keyword.toLowerCase()) ? 0.12 : 0),
        0,
      );

      return {
        ...chunk,
        score: semanticScore + keywordBonus,
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);

  return ranked;
}

export function buildContextSummary(chunks) {
  return chunks
    .map((chunk, index) => `${index + 1}. [${chunk.domain}] ${chunk.title}: ${chunk.content}`)
    .join("\n");
}
