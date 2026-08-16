import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const regressionSql = readFileSync(
  resolve(
    process.cwd(),
    "supabase/tests/20260815000000_affiliate_ingestion_review_operations.sql",
  ),
  "utf8",
);

describe("affiliate ingestion SQL regression harness", () => {
  it("is explicitly rollback-only and refuses accidental reserved-row reuse", () => {
    expect(regressionSql).toMatch(/^begin;\s*$/im);
    expect(regressionSql).toMatch(/rollback;\s*$/im);
    expect(regressionSql).toMatch(/reserved synthetic rows/i);
    expect(regressionSql).toMatch(/reserved SQL regression product identifier already exists/i);
    expect(regressionSql).not.toMatch(/\b(drop|delete|truncate|commit)\b/i);
  });

  it("covers publication, review, idempotency and review operations", () => {
    expect(regressionSql).toMatch(/upsert_affiliate_product_ingestion\(/i);
    expect(regressionSql).toMatch(/'auto'/i);
    expect(regressionSql).toMatch(/'review'/i);
    expect(regressionSql).toMatch(/approve_affiliate_product_classification\(/i);
    expect(regressionSql).toMatch(/deactivate_affiliate_product\(/i);
    expect(regressionSql).toMatch(/same auto ingestion was not idempotent/i);
    expect(regressionSql).toMatch(/same operation id was not idempotent/i);
  });

  it("checks live SQL definitions and service-role-only grants", () => {
    expect(regressionSql).toMatch(/pg_get_functiondef/i);
    expect(regressionSql).toMatch(/ambiguous product_id_shopee/i);
    expect(regressionSql).toMatch(/service_role.*execute all administrative RPCs/i);
    expect(regressionSql).toMatch(/must not grant EXECUTE to PUBLIC/i);
    expect(regressionSql).toMatch(/has_function_privilege\('anon'/i);
    expect(regressionSql).toMatch(/has_function_privilege\('authenticated'/i);
  });
});
