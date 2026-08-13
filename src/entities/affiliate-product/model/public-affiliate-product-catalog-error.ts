export type PublicAffiliateProductCatalogErrorCode =
  | "invalid-filter"
  | "query-failed"
  | "invalid-response";

export class PublicAffiliateProductCatalogError extends Error {
  readonly code: PublicAffiliateProductCatalogErrorCode;

  constructor(
    code: PublicAffiliateProductCatalogErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "PublicAffiliateProductCatalogError";
    this.code = code;
  }
}
