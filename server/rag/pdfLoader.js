import fs from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

/**
 * Recursively read all PDF files from a directory.
 */
async function collectPdfPaths(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      const nested = await collectPdfPaths(fullPath);
      results.push(...nested);
      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith(".pdf")) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * Load each PDF and extract plain text.
 */
export async function loadPdfDocuments(directory) {
  const filePaths = await collectPdfPaths(directory);

  if (filePaths.length === 0) {
    return [];
  }

  const documents = [];

  for (const filePath of filePaths) {
    const dataBuffer = await fs.readFile(filePath);
    const parser = new PDFParse({ data: dataBuffer });
    const parsed = await parser.getText();
    await parser.destroy();

    documents.push({
      pageContent: parsed.text,
      metadata: {
        source: filePath,
        title: path.basename(filePath),
        totalPages: parsed.total,
      },
    });
  }

  return documents;
}
