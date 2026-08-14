import {
  isClassificationReviewRepositoryError,
  listClassificationReviews,
} from "@/features/classification-review/server/review-service";
import {
  getOrCreateRequestId,
  internalJsonResponse,
  isAuthorizedAffiliateInternalRequest,
} from "@/shared/lib/internal-api/auth";

export async function GET(request: Request): Promise<Response> {
  const requestId = getOrCreateRequestId(request);
  if (!isAuthorizedAffiliateInternalRequest(request)) return internalJsonResponse({ error: "unauthorized" }, 401, requestId);

  const url = new URL(request.url);
  try {
    const page = await listClassificationReviews(
      url.searchParams.get("limit"),
      url.searchParams.get("cursor"),
    );
    return internalJsonResponse(page, 200, requestId);
  } catch (error) {
    if (error instanceof Error && error.name === "ClassificationReviewValidationError") {
      return internalJsonResponse({ error: "invalid_query" }, 422, requestId);
    }
    if (isClassificationReviewRepositoryError(error)) return internalJsonResponse({ error: "catalog_unavailable" }, 503, requestId);
    return internalJsonResponse({ error: "internal_error" }, 500, requestId);
  }
}
