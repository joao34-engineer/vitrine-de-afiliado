export type CatalogPaginationLinkInput = {
  readonly pathname: string;
  readonly params?: Readonly<Record<string, string>>;
  readonly pageNumber: number;
  readonly startingCursor?: string | null;
};

export function createCatalogPaginationHref(input: CatalogPaginationLinkInput): string {
  const params = new URLSearchParams(input.params);
  params.set("pagina", String(input.pageNumber));
  if (input.startingCursor) params.set("cursor", input.startingCursor);
  else params.delete("cursor");
  return `${input.pathname}?${params.toString()}`;
}
