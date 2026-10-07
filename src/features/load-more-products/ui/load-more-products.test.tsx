import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({ default: ({ alt = "" }: { alt?: string }) => <span role="img" aria-label={alt} /> }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a>,
}));

const firstProduct = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  title: "Primeiro produto",
  imageUrl: null,
  priceOriginalCents: 1000,
  priceDiscountCents: 900,
  marketplace: "shopee" as const,
  leafSlug: "audio" as const,
};

const secondProduct = {
  id: "018f47bf-8f47-7f32-995e-db19a8753c81",
  title: "Segundo produto",
  imageUrl: null,
  priceOriginalCents: 1000,
  priceDiscountCents: 900,
  marketplace: "shopee" as const,
  leafSlug: "audio" as const,
};

const heroProduct = {
  ...firstProduct,
  id: "018f47bf-8f47-7f32-995e-db19a8753c82",
  title: "Hero produto",
};

vi.mock("../api/load-more-catalog-products", () => ({
  loadMoreCatalogProducts: vi.fn(),
}));

import { loadMoreCatalogProducts } from "../api/load-more-catalog-products";
import { LoadMoreProducts } from "./load-more-products";

class IntersectionObserverMock {
  static instances: IntersectionObserverMock[] = [];
  readonly observe = vi.fn();
  readonly disconnect = vi.fn();
  readonly unobserve = vi.fn();
  readonly callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    IntersectionObserverMock.instances.push(this);
  }
}

function intersectingEntry(): IntersectionObserverEntry {
  return { isIntersecting: true } as IntersectionObserverEntry;
}

describe("LoadMoreProducts", () => {
  beforeEach(() => {
    IntersectionObserverMock.instances = [];
    vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);
    vi.mocked(loadMoreCatalogProducts).mockReset();
    vi.mocked(loadMoreCatalogProducts).mockResolvedValue({
      items: [firstProduct, secondProduct],
      nextHref: null,
      nextLabel: "Carregar mais",
    });
  });

  it("replaces the grid with the next window without duplicating product ids", async () => {
    render(<LoadMoreProducts items={[firstProduct]} nextHref="/?pagina=2" />);

    fireEvent.click(screen.getByRole("link", { name: "Carregar mais" }));

    await waitFor(() => expect(screen.getByText("Segundo produto")).toBeTruthy());
    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(screen.getAllByText("Primeiro produto")).toHaveLength(1);
  });

  it("drops hero items when the window is sliced by itemOffset", async () => {
    vi.mocked(loadMoreCatalogProducts).mockResolvedValue({
      items: [heroProduct, firstProduct, secondProduct],
      nextHref: null,
      nextLabel: "Carregar mais",
    });
    render(<LoadMoreProducts items={[firstProduct]} nextHref="/?pagina=2" itemOffset={1} />);

    fireEvent.click(screen.getByRole("link", { name: "Carregar mais" }));

    await waitFor(() => expect(screen.getByText("Segundo produto")).toBeTruthy());
    expect(screen.queryByText("Hero produto")).toBeNull();
    expect(screen.getAllByRole("article")).toHaveLength(2);
  });

  it("loads the next window once when the sentinel intersects", async () => {
    let resolveLoad: (value: Awaited<ReturnType<typeof loadMoreCatalogProducts>>) => void = () => undefined;
    vi.mocked(loadMoreCatalogProducts).mockImplementation(() => new Promise((resolve) => {
      resolveLoad = resolve;
    }));
    render(<LoadMoreProducts items={[firstProduct]} nextHref="/?pagina=2" />);

    const observer = IntersectionObserverMock.instances[0];
    expect(observer).toBeTruthy();
    observer?.callback([intersectingEntry()], observer as unknown as IntersectionObserver);
    observer?.callback([intersectingEntry()], observer as unknown as IntersectionObserver);

    expect(loadMoreCatalogProducts).toHaveBeenCalledTimes(1);
    resolveLoad({ items: [firstProduct, secondProduct], nextHref: null, nextLabel: "Carregar mais" });
    await waitFor(() => expect(screen.getByText("Segundo produto")).toBeTruthy());
  });

  it("does not observe when the catalog window is exhausted", () => {
    render(<LoadMoreProducts items={[firstProduct]} nextHref={null} />);

    expect(IntersectionObserverMock.instances).toHaveLength(0);
    expect(screen.queryByRole("link", { name: "Carregar mais" })).toBeNull();
  });

  it("keeps the next window as a real navigation instead of appending", () => {
    render(<LoadMoreProducts items={[firstProduct]} nextHref="/?pagina=1&cursor=next" nextLabel="Proxima janela" />);

    expect(IntersectionObserverMock.instances).toHaveLength(0);
    fireEvent.click(screen.getByRole("link", { name: "Proxima janela" }));
    expect(loadMoreCatalogProducts).not.toHaveBeenCalled();
  });
});
