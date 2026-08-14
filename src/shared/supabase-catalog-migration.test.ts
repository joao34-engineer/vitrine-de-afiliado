import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260813000000_add_affiliate_catalog_search_and_public_access.sql",
  ),
  "utf8",
);

describe("public catalog migration contract", () => {
  it("keeps the migration non-destructive and bounded", () => {
    expect(migration).not.toMatch(/drop\s+function/i);
    expect(migration).not.toMatch(/\boffset\b/i);
    expect(migration).toMatch(/begin;/i);
    expect(migration).toMatch(/commit;/i);
    expect(migration).toMatch(/p_limit\s+is\s+null/i);
    expect(migration).toMatch(/security\s+definer/i);
    expect(migration).toMatch(/search_path\s*=\s*pg_catalog/i);
    expect(migration).toMatch(/revoke\s+all\s+on\s+table\s+public\.products/i);
    expect(migration).toMatch(/relrowsecurity\s*=\s*true/i);
    expect(migration).toMatch(/cmd\s+in\s+\('SELECT',\s*'ALL'\)/i);
    expect(migration).toMatch(/policy_roles\s+name\[\]/i);
    expect(migration).toMatch(/result_definition/i);
    expect(migration).toMatch(/products_public_home_created_id_idx/i);
    expect(migration).toMatch(/products_public_search_document_idx/i);
    expect(migration).toMatch(/grant\s+select\s*\(/i);
    expect(migration).toMatch(/from\s+public,\s*anon,\s*authenticated/i);
  });

  it("keeps the public RPC return contract explicit", () => {
    const publicReturnDefinitions = migration.match(/returns\s+table[\s\S]*?language\s+(?:plpgsql|sql)/gi)?.join("\n") ?? "";
    expect(migration).toMatch(/returns\s+table\s*\(\s*id\s+uuid/i);
    expect(migration).toMatch(/relevance_rank\s+real/i);
    expect(migration).toMatch(/shopee_affiliate_link\s+text/i);
    expect(publicReturnDefinitions).not.toMatch(/classification_confidence/i);
    expect(publicReturnDefinitions).not.toMatch(/classification_review_status\s+text,?/i);
  });
});
