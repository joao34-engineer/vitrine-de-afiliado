import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: function NextImageMock({ alt }: { alt: string }) {
    return <span role="img" aria-label={alt} />;
  },
}));

vi.mock("next/link", () => ({
  default: function NextLinkMock({
    href,
    children,
    className,
    "aria-label": ariaLabel,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
    "aria-label"?: string;
  }) {
    return (
      <a href={href} className={className} aria-label={ariaLabel}>
        {children}
      </a>
    );
  },
}));

import type { PublicAffiliateProductCardData } from "../model/affiliate-product";

import { AffiliateProductCard } from "./affiliate-product-card";

const product = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  title: "Fone bluetooth",
  imageUrl: "https://cf.shopee.com.br/file/fone.jpg",
  priceOriginalCents: 12990,
  priceDiscountCents: 9990,
  marketplace: "shopee",
  leafSlug: "audio",
} satisfies PublicAffiliateProductCardData;

describe("AffiliateProductCard Ver oferta", () => {
  it("renders a native document link to the redirect route", () => {
    render(<AffiliateProductCard product={product} />);

    const cta = screen.getByRole("link", { name: "Ver oferta" });
    expect(cta.tagName).toBe("A");
    expect(cta.getAttribute("href")).toBe("/r/550e8400-e29b-41d4-a716-446655440000");
    expect(cta.className).toContain("product-cta");
  });
});
