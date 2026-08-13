import { after, NextResponse, type NextRequest } from "next/server";

import {
  getPublicAffiliateProductById,
  isAffiliateProductId,
} from "@/entities/affiliate-product/index.server";
import { isAllowedAffiliateDestination } from "@/entities/affiliate-product";
import { createTrackingSupabaseClient } from "@/shared/api/supabase/index.server";

const FALLBACK_URL = "https://shopee.com.br";

function redirect(url: string): NextResponse {
  return NextResponse.redirect(url, {
    status: 302,
    headers: { "Cache-Control": "no-store" },
  });
}

function isLikelyBot(userAgent: string): boolean {
  return /bot|crawler|spider|preview|facebookexternalhit|whatsapp/i.test(userAgent);
}

function getRefererOrigin(request: NextRequest): string | null {
  const referer = request.headers.get("referer");
  if (!referer) return null;
  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

function scheduleClickTracking(request: NextRequest, productId: string, productIdShopee: string): void {
  const userAgent = request.headers.get("user-agent") ?? "";
  if (isLikelyBot(userAgent)) return;

  after(async () => {
    try {
      const supabase = createTrackingSupabaseClient();
      if (supabase === null) return;

      const { error } = await supabase.rpc("record_click", {
        p_event_id: crypto.randomUUID(),
        p_source: "vitrine",
        p_tracking_code: productId,
        p_product_id: productIdShopee,
        p_post_id: null,
        p_group_id: null,
        p_campaign_id: null,
        p_copy_id: null,
        p_user_agent_class: "browser",
        p_referer_origin: getRefererOrigin(request),
      });
      if (error) throw error;
    } catch {
      console.error("[affiliate-vitrine] record_click failed", { productId });
    }
  });
}

export async function GET(request: NextRequest, context: { params: Promise<{ productId: string }> }) {
  const { productId } = await context.params;
  if (!isAffiliateProductId(productId)) return redirect(FALLBACK_URL);

  try {
    const product = await getPublicAffiliateProductById(productId);
    if (product === null || !isAllowedAffiliateDestination(product.affiliateUrl, product.marketplace)) {
      return redirect(FALLBACK_URL);
    }

    scheduleClickTracking(request, product.id, product.productIdShopee);
    return redirect(product.affiliateUrl);
  } catch {
    return redirect(FALLBACK_URL);
  }
}
