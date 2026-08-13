import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

type CsvRow = Record<string, string>;

const reportDirectory = resolve("produtos-csv/classificacao");
const autoPath = join(reportDirectory, "affiliate-classification-auto.csv");
const reviewPath = join(reportDirectory, "affiliate-classification-review.csv");
const proposalPath = join(reportDirectory, "affiliate-classification-review-proposed.csv");
const outputPath = join(reportDirectory, "affiliate-classification-final-approved.csv");
const summaryPath = join(reportDirectory, "affiliate-classification-final-approved-summary.json");

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

  const headers = rows[0]?.map((header, index) =>
    index === 0 ? header.replace(/^\uFEFF/u, "") : header,
  );
  if (!headers || headers.length === 0) {
    throw new Error("CSV sem cabecalho.");
  }

  return rows.slice(1)
    .filter((values) => values.some((value) => value.length > 0))
    .map((values) => {
      const result: CsvRow = {};
      headers.forEach((header, index) => {
        result[header] = values[index] ?? "";
      });
      return result;
    });
}

function readCsv(filePath: string): CsvRow[] {
  return parseCsv(readFileSync(filePath, "utf8"));
}

function escapeCsv(value: string | number | boolean | null | undefined): string {
  const normalized = value === null || value === undefined ? "" : String(value);
  return /[",\r\n]/u.test(normalized)
    ? `"${normalized.replaceAll('"', '""')}"`
    : normalized;
}

function writeCsv(filePath: string, rows: readonly CsvRow[]): void {
  const headers = [
    "id",
    "title",
    "category",
    "is_active",
    "status",
    "department_slug",
    "subcategory_slug",
    "leaf_slug",
    "classification_source",
    "classification_confidence",
    "classification_review_status",
    "approval_status",
    "approval_note",
    "reasons",
  ];
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(",")),
  ];
  writeFileSync(filePath, `\uFEFF${lines.join("\r\n")}\r\n`, "utf8");
}

function main(): void {
  const autoRows = readCsv(autoPath);
  const reviewRows = readCsv(reviewPath);
  const proposalRows = readCsv(proposalPath);
  const reviewById = new Map(reviewRows.map((row) => [row.id, row]));
  const autoIds = new Set(autoRows.map((row) => row.id));
  const proposalIds = new Set(proposalRows.map((row) => row.id));

  if (autoRows.length !== 88 || proposalRows.length !== 69) {
    throw new Error(`Lote inesperado: auto=${autoRows.length}, proposta=${proposalRows.length}.`);
  }

  for (const id of autoIds) {
    if (proposalIds.has(id)) {
      throw new Error(`ID duplicado entre auto e proposta: ${id}`);
    }
  }

  const finalRows: CsvRow[] = [
    ...autoRows.map((row) => ({
      id: row.id,
      title: row.title,
      category: row.category,
      is_active: row.is_active,
      status: "auto",
      department_slug: row.department_slug,
      subcategory_slug: row.subcategory_slug,
      leaf_slug: row.leaf_slug,
      classification_source: row.classification_source,
      classification_confidence: row.classification_confidence,
      classification_review_status: "auto",
      approval_status: "approved",
      approval_note: "approved-batch-auto-v1",
      reasons: row.reasons,
    })),
    ...proposalRows.map((row) => {
      const original = reviewById.get(row.id);
      if (!original) {
        throw new Error(`Produto proposto nao encontrado no review original: ${row.id}`);
      }
      return {
        id: row.id,
        title: row.title,
        category: row.legacy_category,
        is_active: original.is_active,
        status: "auto",
        department_slug: row.proposed_department_slug,
        subcategory_slug: row.proposed_subcategory_slug,
        leaf_slug: row.proposed_leaf_slug,
        classification_source: "legacy-backfill-v1",
        classification_confidence: row.proposal_confidence,
        classification_review_status: "auto",
        approval_status: "approved",
        approval_note: row.proposal_note,
        reasons: `${original.reasons}|human-approved-review`,
      };
    }),
  ];

  const ids = finalRows.map((row) => row.id);
  if (finalRows.length !== 157 || new Set(ids).size !== ids.length) {
    throw new Error(`Consolidado invalido: rows=${finalRows.length}, uniqueIds=${new Set(ids).size}.`);
  }

  for (const row of finalRows) {
    if (!row.department_slug || !row.subcategory_slug || !row.leaf_slug) {
      throw new Error(`Produto sem classificacao completa: ${row.id}`);
    }
  }

  mkdirSync(reportDirectory, { recursive: true });
  writeCsv(outputPath, finalRows);
  writeFileSync(summaryPath, `${JSON.stringify({
    total: finalRows.length,
    auto: finalRows.length,
    review: 0,
    approved: finalRows.length,
    sourceAuto: autoRows.length,
    sourceReviewed: proposalRows.length,
    supabaseUpdated: false,
  }, null, 2)}\n`, "utf8");

  console.log(JSON.stringify({ outputPath, summaryPath, total: finalRows.length, approved: finalRows.length }));
}

main();
