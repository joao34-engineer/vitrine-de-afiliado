import Image from "next/image";
import Link from "next/link";

import {
  formatAffiliatePrice,
  getAffiliateDiscountPercent,
  getMarketplaceLabel,
  type PublicAffiliateProduct,
} from "@/entities/affiliate-product";

export function ProductDetail({ product }: Readonly<{ product: PublicAffiliateProduct }>): React.JSX.Element {
  const price = formatAffiliatePrice(product.priceDiscountCents);
  const originalPrice = formatAffiliatePrice(product.priceOriginalCents);
  const discount = getAffiliateDiscountPercent(product);

  return (
    <article className="product-detail">
      <Link href="/" className="back-link">← Voltar para ofertas</Link>
      <div className="product-detail-layout">
        <div className="product-detail-image">
          {product.imageUrl ? <Image src={product.imageUrl} alt={product.title} fill sizes="(max-width: 800px) 100vw, 55vw" className="product-image" priority /> : <div className="product-image-placeholder">Sem imagem</div>}
        </div>
        <div className="product-detail-copy">
          <p className="eyebrow">Oferta na {getMarketplaceLabel(product.marketplace)}</p>
          <h1>{product.title}</h1>
          <p className="product-detail-taxonomy">{product.departmentSlug} · {product.leafSlug}</p>
          <div className="product-detail-price">
            {originalPrice && discount !== null ? <span className="product-original-price">{originalPrice}</span> : null}
            <strong>{price ?? "Confira preco e disponibilidade no marketplace"}</strong>
            {discount !== null ? <span className="discount-inline">-{discount}%</span> : null}
          </div>
          <p className="product-detail-disclosure">Precos, estoque e condicoes podem mudar. Confira os dados finais no marketplace antes de comprar.</p>
          <Link href={`/r/${product.id}`} className="detail-cta">Ver oferta na {getMarketplaceLabel(product.marketplace)}</Link>
          <p className="product-detail-note">A Salvat&amp;Brand pode receber uma comissao pela compra, sem custo extra para voce.</p>
        </div>
      </div>
    </article>
  );
}
