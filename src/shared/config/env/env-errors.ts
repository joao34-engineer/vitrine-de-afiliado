import type { ZodIssue } from "zod";

export function formatEnvIssues(scope: string, issues: readonly ZodIssue[]): string {
  const keys = Array.from(
    new Set(issues.map((issue) => issue.path.join(".") || "unknown")),
  );

  return `${scope} environment variables are invalid or missing: ${keys.join(", ")}`;
}
