export function tokenize(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s+.-]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

export function frequencyVector(text) {
  const counts = new Map();

  for (const token of tokenize(text)) {
    counts.set(token, (counts.get(token) || 0) + 1);
  }

  return counts;
}

export function cosineSimilarity(left, right) {
  if (!left.size || !right.size) {
    return 0;
  }

  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (const value of left.values()) {
    leftMagnitude += value * value;
  }

  for (const value of right.values()) {
    rightMagnitude += value * value;
  }

  for (const [token, value] of left.entries()) {
    dot += value * (right.get(token) || 0);
  }

  const divisor = Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude);
  return divisor === 0 ? 0 : dot / divisor;
}

export function unique(array) {
  return [...new Set(array)];
}