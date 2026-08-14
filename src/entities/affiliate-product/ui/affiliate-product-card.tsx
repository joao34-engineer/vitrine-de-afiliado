import Image from "next/image";
import Link from "next/link";

import {
  formatAffiliatePrice,
  getAffiliateDiscountPercent,
  getMarketplaceLabel,
} from "../model/affiliate-product-presentation";
import type { PublicAffiliateProductCardData } from "../model/affiliate-product";

export function AffiliateProductCard({ product, variant = "default" }: Readonly<{
  product: PublicAffiliateProductCardData;
  variant?: "default" | "hero";
}>): React.JSX.Element {
  const price = formatAffiliatePrice(product.priceDiscountCents);
  const originalPrice = formatAffiliatePrice(product.priceOriginalCents);
  const discount = getAffiliateDiscountPercent(product);

  return (
    <article className={`product-card ${variant === "hero" ? "product-card-hero" : ""}`.trim()}>
      <Link href={`/p/${product.id}`} className="product-image-link" aria-label={`Abrir ${product.title}`}>
        <div className="product-image-frame">
          {product.imageUrl ? <Image src={product.imageUrl} alt="" fill sizes="(max-width: 640px) 50vw, (max-width: 1100px) 25vw, 240px" className="product-image" /> : <div className="product-image-placeholder" aria-hidden="true">Sem imagem</div>}
          {discount !== null ? <span className="discount-badge">-{discount}%</span> : null}
        </div>
      </Link>
      <div className="product-card-body">
        <p className="product-marketplace">{getMarketplaceLabel(product.marketplace)}</p>
        <h2 className="product-title"><Link href={`/p/${product.id}`}>{product.title}</Link></h2>
        <div className="product-price-row">
          {originalPrice && discount !== null ? <span className="product-original-price">{originalPrice}</span> : null}
          <span className="product-price">{price ?? "Confira no marketplace"}</span>
        </div>
        <Link href={`/r/${product.id}`} className="product-cta">Ver oferta</Link>
      </div>
    </article>
  );
}
