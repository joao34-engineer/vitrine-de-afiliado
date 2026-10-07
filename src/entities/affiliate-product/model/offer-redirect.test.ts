import { describe, expect, it } from "vitest";

import { offerRedirectHref } from "./offer-redirect";

describe("offerRedirectHref", () => {
  it("builds the tracked redirect path from the product id", () => {
    expect(offerRedirectHref("550e8400-e29b-41d4-a716-446655440000")).toBe(
      "/r/550e8400-e29b-41d4-a716-446655440000",
    );
  });
});
