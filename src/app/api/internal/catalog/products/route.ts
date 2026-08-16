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

type InternalCatalogOperationLog = {
  readonly operation: "ingest_product";
  readonly requestId: string;
  readonly outcome: "success" | "rejected" | "error";
  readonly status: number;
  readonly durationMs: number;
  readonly error?: {
    readonly category: "validation" | "cache_invalidation" | "repository" | "internal";
    readonly operation: string;
    readonly rpcName: string | null;
    readonly upstreamStatus: number | null;
    readonly code: string | null;
    readonly message: string;
    readonly retryable: boolean;
  };
};

function sanitizeLogText(value: unknown): string {
  if (typeof value !== "string") return "unknown error";
  return value
    .replace(/bearer\s+[^\s]+/gi, "bearer [redacted]")
    .replace(/((?:token|secret|password|api[-_]?key)\s*[:=]\s*)[^\s,;]+/gi, "$1[redacted]")
    .replace(/[\r\n\t]+/g, " ")
    .slice(0, 240);
}

function logInternalCatalogOperation(entry: InternalCatalogOperationLog): void {
  console.info("[affiliate-vitrine] internal-catalog-operation", JSON.stringify(entry));
}

function errorLogDetails(error: unknown): InternalCatalogOperationLog["error"] {
  if (error instanceof AffiliateProductCacheInvalidationError) {
    return {
      category: "cache_invalidation",
      operation: "cache_invalidation",
      rpcName: null,
      upstreamStatus: null,
      code: error.code,
      message: "public catalog cache invalidation failed",
      retryable: true,
    };
  }

  if (isAffiliateProductAdminRepositoryError(error)) {
    return {
      category: "repository",
      operation: error.metadata.operation,
      rpcName: error.metadata.rpcName,
      upstreamStatus: error.metadata.status,
      code: error.metadata.code,
      message: sanitizeLogText(error.metadata.message),
      retryable: error.metadata.retryable,
    };
  }

  if (error instanceof AffiliateProductIngestionError) {
    return {
      category: "validation",
      operation: "validate_payload",
      rpcName: null,
      upstreamStatus: null,
      code: error.code,
      message: "invalid affiliate product ingestion payload",
      retryable: false,
    };
  }

  return {
    category: "internal",
    operation: "internal",
    rpcName: null,
    upstreamStatus: null,
    code: null,
    message: "unexpected internal error",
    retryable: false,
  };
}

export async function POST(request: Request): Promise<Response> {
  const requestId = getOrCreateRequestId(request);
  const startedAt = Date.now();
  if (!isAuthorizedAffiliateInternalRequest(request)) {
    logInternalCatalogOperation({
      operation: "ingest_product",
      requestId: sanitizeLogText(requestId),
      outcome: "rejected",
      status: 401,
      durationMs: Date.now() - startedAt,
    });
    return internalJsonResponse({ error: "unauthorized" }, 401, requestId);
  }

  try {
    assertJsonContentType(request);
    const body = await readCappedJsonBody(request);
    const result = await ingestAffiliateProduct(body);
    logInternalCatalogOperation({
      operation: "ingest_product",
      requestId: sanitizeLogText(requestId),
      outcome: "success",
      status: result.created ? 201 : 200,
      durationMs: Date.now() - startedAt,
    });
    return internalJsonResponse(result, result.created ? 201 : 200, requestId);
  } catch (error) {
    const errorDetails = errorLogDetails(error);
    let responseError:
      | "payload_too_large"
      | "unsupported_media_type"
      | "invalid_json"
      | "invalid_payload"
      | "catalog_unavailable"
      | "catalog_rpc_error"
      | "catalog_internal_error";
    let status: 400 | 413 | 415 | 422 | 500 | 503;

    if (error instanceof InternalApiBodyTooLargeError) {
      responseError = "payload_too_large";
      status = 413;
    } else if (error instanceof InternalApiUnsupportedMediaTypeError) {
      responseError = "unsupported_media_type";
      status = 415;
    } else if (error instanceof SyntaxError) {
      responseError = "invalid_json";
      status = 400;
    } else if (error instanceof AffiliateProductIngestionError) {
      responseError = "invalid_payload";
      status = 422;
    } else if (error instanceof AffiliateProductCacheInvalidationError) {
      responseError = "catalog_unavailable";
      status = 503;
    } else if (isAffiliateProductAdminRepositoryError(error) && error.metadata.retryable) {
      responseError = "catalog_unavailable";
      status = 503;
    } else if (isAffiliateProductAdminRepositoryError(error)) {
      responseError = "catalog_rpc_error";
      status = 500;
    } else {
      responseError = "catalog_internal_error";
      status = 500;
    }

    logInternalCatalogOperation({
      operation: "ingest_product",
      requestId: sanitizeLogText(requestId),
      outcome: "error",
      status,
      durationMs: Date.now() - startedAt,
      error: errorDetails,
    });
    return internalJsonResponse({ error: responseError }, status, requestId);
  }
}
