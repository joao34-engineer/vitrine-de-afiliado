import { notFound } from "next/navigation";
import { connection } from "next/server";

import { getCachedPublicAffiliateProductById, isAffiliateProductId, listRelatedPublicAffiliateProducts } from "@/entities/affiliate-product/index.server";
import { ProductDetail } from "@/views/product-detail";
import { CatalogShell } from "@/widgets/catalog-shell";

export default async function ProductPage({ params }: { params: Promise<{ productId: string }> }) {
  await connection();
  const { productId } = await params;
  if (!isAffiliateProductId(productId)) notFound();
  const product = await getCachedPublicAffiliateProductById(productId);
  if (product === null) notFound();
  const relatedProducts = await listRelatedPublicAffiliateProducts({
    departmentSlug: product.departmentSlug,
    leafSlug: product.leafSlug,
    excludeProductId: product.id,
  });
  return <CatalogShell mobileSearch="hidden"><ProductDetail product={product} relatedProducts={relatedProducts} /></CatalogShell>;
}
