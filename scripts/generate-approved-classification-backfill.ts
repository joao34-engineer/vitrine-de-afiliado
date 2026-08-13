import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

type CsvRow = Record<string, string>;

const reportPath = resolve("produtos-csv/classificacao/affiliate-classification-final-approved.csv");
const outputPath = resolve("supabase/backfills/20260813000000_backfill_approved_affiliate_classification.sql");
const expectedCount = 157;

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

function sqlString(value: string | number): string {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function validateRows(rows: readonly CsvRow[]): void {
  if (rows.length !== expectedCount) {
    throw new Error(`CSV consolidado inesperado: ${rows.length} linhas; esperado ${expectedCount}.`);
  }

  const ids = new Set<string>();
  for (const row of rows) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(row.id)) {
      throw new Error(`ID UUID invalido: ${row.id}`);
    }
    if (ids.has(row.id)) {
      throw new Error(`ID duplicado: ${row.id}`);
    }
    ids.add(row.id);

    for (const field of [
      "department_slug",
      "subcategory_slug",
      "leaf_slug",
      "classification_source",
      "classification_confidence",
    ]) {
      if (!row[field]) {
        throw new Error(`Campo obrigatorio ausente (${field}): ${row.id}`);
      }
    }
    if (
      row.approval_status !== "approved" ||
      row.classification_review_status !== "auto" ||
      row.status !== "auto"
    ) {
      throw new Error(`Produto nao aprovado para backfill: ${row.id}`);
    }

    const confidence = Number(row.classification_confidence);
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
      throw new Error(`Confianca invalida (${row.classification_confidence}): ${row.id}`);
    }
  }
}

function main(): void {
  const rows = parseCsv(readFileSync(reportPath, "utf8"));
  validateRows(rows);

  const values = rows.map((row) => [
    `${sqlString(row.id)}::uuid`,
    sqlString(row.department_slug),
    sqlString(row.subcategory_slug),
    sqlString(row.leaf_slug),
    sqlString(row.classification_source),
    String(Number(row.classification_confidence)),
    sqlString(row.classification_review_status),
  ].join(", "));

  const sql = `-- Affiliate Vitrine - backfill de classificacao aprovado pela revisao humana
--
-- ARQUIVO REVISAVEL. Nao executar em producao sem autorizacao explicita.
-- Este backfill nao apaga dados e atualiza somente campos de classificacao.
-- Preserva category, title, ai_copy, precos, links, imagens e is_active.
-- Fonte: produtos-csv/classificacao/affiliate-classification-final-approved.csv

begin;

create temporary table affiliate_classification_backfill_v1 (
  id uuid primary key,
  department_slug text not null,
  subcategory_slug text not null,
  leaf_slug text not null,
  classification_source text not null,
  classification_confidence numeric not null check (classification_confidence between 0 and 1),
  classification_review_status text not null check (classification_review_status in ('auto', 'review'))
) on commit drop;

insert into affiliate_classification_backfill_v1 (
  id,
  department_slug,
  subcategory_slug,
  leaf_slug,
  classification_source,
  classification_confidence,
  classification_review_status
)
values
  ${values.map((value) => `(${value})`).join(",\n  ")};

do $$
declare
  expected_count integer := ${expectedCount};
  input_count integer;
  updated_count integer;
begin
  select count(*) into input_count
  from affiliate_classification_backfill_v1;

  if input_count <> expected_count then
    raise exception 'Backfill abortado: entrada com % linhas; esperado %.', input_count, expected_count;
  end if;

  update public.products as products
  set
    department_slug = backfill.department_slug,
    subcategory_slug = backfill.subcategory_slug,
    leaf_slug = backfill.leaf_slug,
    classification_source = backfill.classification_source,
    classification_confidence = backfill.classification_confidence,
    classification_review_status = backfill.classification_review_status
  from affiliate_classification_backfill_v1 as backfill
  where products.id = backfill.id;

  get diagnostics updated_count = row_count;

  if updated_count <> expected_count then
    raise exception 'Backfill abortado: % produtos encontrados/atualizados; esperado %.', updated_count, expected_count;
  end if;
end $$;

select
  count(*) as input_rows,
  count(products.id) as matched_products,
  count(*) filter (
    where products.department_slug = backfill.department_slug
      and products.subcategory_slug = backfill.subcategory_slug
      and products.leaf_slug = backfill.leaf_slug
      and products.classification_source = backfill.classification_source
      and products.classification_confidence = backfill.classification_confidence
      and products.classification_review_status = backfill.classification_review_status
  ) as matching_classifications
from affiliate_classification_backfill_v1 as backfill
left join public.products as products on products.id = backfill.id;

commit;
`;

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, sql, "utf8");
  console.log(JSON.stringify({ outputPath, total: rows.length }));
}

main();
