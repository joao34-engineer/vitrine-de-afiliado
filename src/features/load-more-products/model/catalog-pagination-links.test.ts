import { describe, expect, it } from "vitest";

import { createCatalogPaginationHref } from "./catalog-pagination-links";

describe("catalog pagination links", () => {
  it("creates a server navigation URL without a client action", () => {
    expect(createCatalogPaginationHref({
      pathname: "/folha/audio",
      params: { ref: "catalogo" },
      pageNumber: 2,
      startingCursor: "cursor-value",
    })).toBe("/folha/audio?ref=catalogo&pagina=2&cursor=cursor-value");
  });

  it("removes a stale cursor when starting a new window", () => {
    expect(createCatalogPaginationHref({
      pathname: "/",
      params: { pagina: "9", cursor: "old" },
      pageNumber: 1,
    })).toBe("/?pagina=1");
  });
});
