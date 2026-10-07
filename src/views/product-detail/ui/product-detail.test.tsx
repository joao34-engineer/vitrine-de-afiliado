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
  }: {
    href: string;
    children: ReactNode;
    className?: string;
  }) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  },
}));

import type { PublicAffiliateProduct } from "@/entities/affiliate-product";

import { ProductDetail } from "./product-detail";

const product = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  productIdShopee: "123.456",
  slug: "fone-bluetooth",
  title: "Fone bluetooth",
  imageUrl: "https://cf.shopee.com.br/file/fone.jpg",
  affiliateUrl: "https://shopee.com.br/oferta/123",
  marketplace: "shopee",
  category: "Categoria legada livre",
  isActive: true,
  priceOriginalCents: 12990,
  priceDiscountCents: 9990,
  departmentSlug: "tech",
  subcategorySlug: "audio",
  leafSlug: "audio",
} satisfies PublicAffiliateProduct;

describe("ProductDetail Ver oferta", () => {
  it("renders a native document link to the redirect route", () => {
    render(<ProductDetail product={product} />);

    const cta = screen.getByRole("link", { name: /ver oferta/i });
    expect(cta.tagName).toBe("A");
    expect(cta.getAttribute("href")).toBe("/r/550e8400-e29b-41d4-a716-446655440000");
    expect(cta.className).toContain("detail-cta");
  });
});
