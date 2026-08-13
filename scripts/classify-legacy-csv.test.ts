import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  classifyLegacyAffiliateProducts,
  type ClassifiedLegacyAffiliateProduct,
  type LegacyAffiliateProductInput,
} from "@/entities/affiliate-product";

type CsvRow = Record<string, string>;

const inputPath = path.resolve("produtos-csv/Supabase Snippet Untitled query.csv");
const outputDirectory = path.resolve("produtos-csv/classificacao");

function parseCsv(source: string): CsvRow[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const nextCharacter = source[index + 1];

    if (inQuotes) {
      if (character === '"' && nextCharacter === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        inQuotes = false;
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"' && field.length === 0) {
      inQuotes = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const header = rows[0];
  if (header === undefined || header.length === 0) {
    throw new Error("CSV sem cabecalho.");
  }

  return rows.slice(1).filter((values) => values.some((value) => value.length > 0)).map((values) => {
    const result: CsvRow = {};
    for (let index = 0; index < header.length; index += 1) {
      const column = header[index];
      if (column !== undefined) {
        result[column] = values[index] ?? "";
      }
    }
    return result;
  });
}

function toLegacyProduct(row: CsvRow): LegacyAffiliateProductInput {
  const id = row.id?.trim();
  const title = row.title?.trim();
  const activeValue = row.is_active?.trim().toLowerCase();

  if (!id || !title || (activeValue !== "true" && activeValue !== "false")) {
    throw new Error(`Linha CSV invalida para produto ${id || "sem-id"}.`);
  }

  return {
    id,
    title,
    aiCopy: row.ai_copy?.trim() || null,
    category: row.category?.trim() || null,
    isActive: activeValue === "true",
  };
}

function escapeCsv(value: string | number | boolean | null): string {
  const normalized = value === null ? "" : String(value);
  return /[",\r\n]/u.test(normalized)
    ? `"${normalized.replaceAll('"', '""')}"`
    : normalized;
}

function toClassificationRow(item: ClassifiedLegacyAffiliateProduct): Record<string, string | number | boolean | null> {
  return {
    id: item.product.id,
    title: item.product.title,
    category: item.product.category,
    is_active: item.product.isActive,
    status: item.classification.status,
    department_slug: item.classification.departmentSlug,
    subcategory_slug: item.classification.subcategorySlug,
    leaf_slug: item.classification.leafSlug,
    classification_source: item.classification.classificationSource,
    classification_confidence: item.classification.classificationConfidence,
    classification_review_status: item.classification.classificationReviewStatus,
    reasons: item.classification.reasons.join("|"),
  };
}

function writeCsv(filePath: string, rows: readonly Record<string, string | number | boolean | null>[]): void {
  const firstRow = rows[0];
  if (firstRow === undefined) {
    writeFileSync(filePath, "", "utf8");
    return;
  }

  const headers = Object.keys(firstRow);
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeCsv(row[header] ?? null)).join(",")),
  ];
  writeFileSync(filePath, `\uFEFF${lines.join("\r\n")}\r\n`, "utf8");
}

const runCsvClassification = process.env.AFFILIATE_RUN_CSV_CLASSIFIER === "1";
const classificationSuite = runCsvClassification ? describe : describe.skip;

classificationSuite("legacy CSV classification runner", () => {
  it("classifies the complete exported catalog into reviewable local reports", () => {
    const csvRows = parseCsv(readFileSync(inputPath, "utf8"));
    const products = csvRows.map(toLegacyProduct);
    const ids = products.map((product) => product.id);

    expect(products).toHaveLength(157);
    expect(new Set(ids).size).toBe(ids.length);

    const batch = classifyLegacyAffiliateProducts(products);
    const allRows = batch.all.map(toClassificationRow);
    const autoRows = batch.auto.map(toClassificationRow);
    const reviewRows = batch.review.map(toClassificationRow);
    const summary = {
      inputFile: path.relative(process.cwd(), inputPath),
      total: batch.all.length,
      auto: batch.auto.length,
      review: batch.review.length,
      generatedAt: new Date().toISOString(),
      supabaseUpdated: false,
    };

    mkdirSync(outputDirectory, { recursive: true });
    writeCsv(path.join(outputDirectory, "affiliate-classification-auto.csv"), autoRows);
    writeCsv(path.join(outputDirectory, "affiliate-classification-review.csv"), reviewRows);
    writeFileSync(
      path.join(outputDirectory, "affiliate-classification-all.json"),
      `${JSON.stringify(batch.all, null, 2)}\n`,
      "utf8",
    );
    writeFileSync(
      path.join(outputDirectory, "affiliate-classification-summary.json"),
      `${JSON.stringify(summary, null, 2)}\n`,
      "utf8",
    );

    expect(allRows).toHaveLength(157);
    expect(autoRows.length + reviewRows.length).toBe(157);
  });
});
