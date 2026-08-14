import {
  ClassificationReviewCacheInvalidationError,
  deactivateClassificationReview,
  isClassificationReviewRepositoryError,
} from "@/features/classification-review/server/review-service";
import {
  assertJsonContentType,
  getOrCreateRequestId,
  InternalApiBodyTooLargeError,
  InternalApiUnsupportedMediaTypeError,
  internalJsonResponse,
  isAuthorizedAffiliateInternalRequest,
  readCappedJsonBody,
} from "@/shared/lib/internal-api/auth";
import { deactivateAffiliateReviewRequestSchema } from "@/features/classification-review/model/affiliate-review-requests";
import { ZodError } from "zod";

export async function POST(
  request: Request,
  context: { params: Promise<{ productId: string }> },
): Promise<Response> {
  const requestId = getOrCreateRequestId(request);
  if (!isAuthorizedAffiliateInternalRequest(request)) return internalJsonResponse({ error: "unauthorized" }, 401, requestId);

  try {
    assertJsonContentType(request);
    const body = await readCappedJsonBody(request);
    const params = await context.params;
    const payload = deactivateAffiliateReviewRequestSchema.parse(body);
    const result = await deactivateClassificationReview(params.productId, payload.expectedRevision, payload.operationId);
    return internalJsonResponse(result, 200, requestId);
  } catch (error) {
    if (error instanceof InternalApiBodyTooLargeError) return internalJsonResponse({ error: "payload_too_large" }, 413, requestId);
    if (error instanceof InternalApiUnsupportedMediaTypeError) return internalJsonResponse({ error: "unsupported_media_type" }, 415, requestId);
    if (error instanceof SyntaxError) return internalJsonResponse({ error: "invalid_json" }, 400, requestId);
    if (error instanceof ZodError) return internalJsonResponse({ error: "invalid_payload" }, 422, requestId);
    if (error instanceof Error && error.name === "ClassificationReviewValidationError") return internalJsonResponse({ error: "invalid_payload" }, 422, requestId);
    if (error instanceof Error && error.name === "ClassificationReviewNotFoundError") return internalJsonResponse({ error: "not_found" }, 404, requestId);
    if (error instanceof Error && error.name === "ClassificationReviewConflictError") return internalJsonResponse({ error: "conflict" }, 409, requestId);
    if (error instanceof ClassificationReviewCacheInvalidationError) return internalJsonResponse({ error: "catalog_unavailable" }, 503, requestId);
    if (isClassificationReviewRepositoryError(error)) return internalJsonResponse({ error: "catalog_unavailable" }, 503, requestId);
    return internalJsonResponse({ error: "internal_error" }, 500, requestId);
  }
}
