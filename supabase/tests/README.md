# Affiliate ingestion SQL regression test

`20260815000000_affiliate_ingestion_review_operations.sql` is an optional
database-level regression script for a disposable Supabase/Postgres project.
It is intentionally not wired into Vitest or the production deployment path:
this repository does not contain a disposable Postgres/pgTAP runner, and the
Supabase SQL editor is not a test environment.

Run it only after the migrations have been applied to a disposable database,
using a privileged SQL session. The script refuses to reuse its reserved
synthetic product identifiers, wraps all data changes in one transaction, and
ends with `ROLLBACK`; it must never be pointed at the production project.

The script verifies:

- `auto` ingestion is public and `review` ingestion remains unpublished;
- re-ingesting the same product is idempotent and does not duplicate rows;
- approval and deactivation update the expected revision and publication state;
- retrying each operation with the same operation id is idempotent;
- the live function definitions do not contain the former ambiguous predicates;
- only `service_role` has execute privileges on the administrative RPCs.

The local Vitest migration contract test remains the deterministic CI check.
