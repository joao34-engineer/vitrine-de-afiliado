import {
  assertJsonContentType,
  getOrCreateRequestId,
  InternalApiBodyTooLargeError,
  InternalApiUnsupportedMediaTypeError,
  internalJsonResponse,
  isAuthorizedAffiliateInternalRequest,
  readCappedJsonBody,
} from "@/shared/lib/internal-api/auth";
import {
  AffiliateProductCacheInvalidationError,
  AffiliateProductIngestionError,
  ingestAffiliateProduct,
  isAffiliateProductAdminRepositoryError,
} from "@/features/affiliate-product-ingestion/server/ingest-affiliate-product";

export async function POST(request: Request): Promise<Response> {
  const requestId = getOrCreateRequestId(request);
  if (!isAuthorizedAffiliateInternalRequest(request)) return internalJsonResponse({ error: "unauthorized" }, 401, requestId);

  try {
    assertJsonContentType(request);
    const body = await readCappedJsonBody(request);
    const result = await ingestAffiliateProduct(body);
    return internalJsonResponse(result, result.created ? 201 : 200, requestId);
  } catch (error) {
    if (error instanceof InternalApiBodyTooLargeError) return internalJsonResponse({ error: "payload_too_large" }, 413, requestId);
    if (error instanceof InternalApiUnsupportedMediaTypeError) return internalJsonResponse({ error: "unsupported_media_type" }, 415, requestId);
    if (error instanceof SyntaxError) return internalJsonResponse({ error: "invalid_json" }, 400, requestId);
    if (error instanceof AffiliateProductIngestionError) return internalJsonResponse({ error: "invalid_payload" }, 422, requestId);
    if (error instanceof AffiliateProductCacheInvalidationError || isAffiliateProductAdminRepositoryError(error)) {
      return internalJsonResponse({ error: "catalog_unavailable" }, 503, requestId);
    }
    return internalJsonResponse({ error: "internal_error" }, 500, requestId);
  }
}
