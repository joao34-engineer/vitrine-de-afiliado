import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({ default: ({ alt = "" }: { alt?: string }) => <span role="img" aria-label={alt} /> }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a>,
}));
vi.mock("../api/load-more-catalog-products", () => ({
  loadMoreCatalogProducts: vi.fn().mockResolvedValue({
    items: [{
      id: "018f47bf-8f47-7f32-995e-db19a8753c81",
      title: "Segundo produto",
      imageUrl: null,
      priceOriginalCents: 1000,
      priceDiscountCents: 900,
      marketplace: "shopee",
      leafSlug: "audio",
    }],
    nextHref: null,
    nextLabel: "Carregar mais",
  }),
}));

import { LoadMoreProducts } from "./load-more-products";

const firstProduct = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  title: "Primeiro produto",
  imageUrl: null,
  priceOriginalCents: 1000,
  priceDiscountCents: 900,
  marketplace: "shopee" as const,
  leafSlug: "audio" as const,
};

describe("LoadMoreProducts", () => {
  it("appends the next public batch without navigating the document", async () => {
    render(<LoadMoreProducts items={[firstProduct]} nextHref="/?pagina=2&cursor=valid" />);

    fireEvent.click(screen.getByRole("link", { name: "Carregar mais" }));

    await waitFor(() => expect(screen.getByText("Segundo produto")).toBeTruthy());
    expect(screen.getAllByRole("article")).toHaveLength(2);
  });
});
