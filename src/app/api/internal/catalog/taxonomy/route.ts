import {
  getAffiliateTaxonomyForReview,
} from "@/features/classification-review/server/review-service";
import {
  getOrCreateRequestId,
  internalJsonResponse,
  isAuthorizedAffiliateInternalRequest,
} from "@/shared/lib/internal-api/auth";

export function GET(request: Request): Response {
  const requestId = getOrCreateRequestId(request);
  if (!isAuthorizedAffiliateInternalRequest(request)) return internalJsonResponse({ error: "unauthorized" }, 401, requestId);
  return internalJsonResponse(getAffiliateTaxonomyForReview(), 200, requestId);
}
