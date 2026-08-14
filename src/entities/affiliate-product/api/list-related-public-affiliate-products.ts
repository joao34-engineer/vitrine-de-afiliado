import "server-only";

import type { DepartmentSlug, LeafSlug } from "@/shared/config/affiliate-taxonomy";

import type { PublicAffiliateProductCardData } from "../model/affiliate-product";
import { listPublicAffiliateProductPage } from "./list-public-affiliate-product-page";

export async function listRelatedPublicAffiliateProducts({
  departmentSlug,
  leafSlug,
  excludeProductId,
}: Readonly<{
  departmentSlug: DepartmentSlug;
  leafSlug: LeafSlug;
  excludeProductId: string;
}>): Promise<readonly PublicAffiliateProductCardData[]> {
  const page = await listPublicAffiliateProductPage({ departmentSlug, leafSlug, pageSize: 3 });
  return page.items.filter((product) => product.id !== excludeProductId).slice(0, 2);
}
