import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import dotenv from "dotenv";

dotenv.config();

const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

async function collectPdfFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectPdfFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith(".pdf")) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Load all PDFs and extract plain text.
 */
export async function loadPdfDocuments(pdfDirectory = process.env.PDF_DIR || "./data/pdfs") {
  try {
    const absoluteDir = path.resolve(pdfDirectory);
    const pdfFiles = await collectPdfFiles(absoluteDir);

    if (pdfFiles.length === 0) {
      return [];
    }

    const docs = [];
    for (const filePath of pdfFiles) {
      const dataBuffer = await fs.readFile(filePath);
      const parser = new PDFParse({ data: dataBuffer });
      const parsed = await parser.getText();
      await parser.destroy();

      docs.push({
        pageContent: parsed.text,
        metadata: {
          source: filePath,
          fileName: path.basename(filePath),
          totalPages: parsed.total,
        },
      });
    }

    return docs;
  } catch (error) {
    throw new Error(`Failed to load PDFs: ${error.message}`);
  }
}
