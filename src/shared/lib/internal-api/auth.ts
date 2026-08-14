import "server-only";

import { randomUUID, timingSafeEqual } from "node:crypto";

import { getServerEnv } from "@/shared/config/env/index.server";

export const INTERNAL_API_MAX_BODY_BYTES = 64 * 1024;

function isSecureInternalOrigin(request: Request): boolean {
  const url = new URL(request.url);
  if (url.protocol === "https:") return true;
  return url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1");
}

export function isAuthorizedAffiliateInternalRequest(request: Request): boolean {
  if (!isSecureInternalOrigin(request)) return false;
  const authorization = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+([^\s]+)$/i.exec(authorization);
  if (match === null) return false;

  const expected = getServerEnv().AFFILIATE_VITRINE_INTERNAL_SECRET?.trim() ?? "";
  if (expected.length === 0) return false;
  const received = Buffer.from(match[1], "utf8");
  const expectedBytes = Buffer.from(expected, "utf8");
  return received.length === expectedBytes.length && timingSafeEqual(received, expectedBytes);
}

export async function readCappedJsonBody(request: Request): Promise<unknown> {
  const contentLength = request.headers.get("content-length");
  if (contentLength !== null && Number(contentLength) > INTERNAL_API_MAX_BODY_BYTES) {
    throw new InternalApiBodyTooLargeError();
  }

  if (request.body === null) {
    return JSON.parse(await request.text());
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > INTERNAL_API_MAX_BODY_BYTES) throw new InternalApiBodyTooLargeError();
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return JSON.parse(new TextDecoder().decode(body));
}

export class InternalApiBodyTooLargeError extends Error {
  constructor() {
    super("Request body exceeds the internal API limit.");
    this.name = "InternalApiBodyTooLargeError";
  }
}

export class InternalApiUnsupportedMediaTypeError extends Error {
  constructor() {
    super("Internal API requires application/json.");
    this.name = "InternalApiUnsupportedMediaTypeError";
  }
}

export function assertJsonContentType(request: Request): void {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "application/json") throw new InternalApiUnsupportedMediaTypeError();
}

export function internalJsonResponse(
  body: unknown,
  status = 200,
  requestId?: string,
): Response {
  const headers = new Headers({
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8",
  });
  if (requestId !== undefined) headers.set("x-request-id", requestId);
  return new Response(JSON.stringify(body), { status, headers });
}

export function getOrCreateRequestId(request: Request): string {
  const incoming = request.headers.get("x-request-id")?.trim();
  return incoming !== undefined && incoming.length > 0 && incoming.length <= 128
    ? incoming
    : randomUUID();
}
