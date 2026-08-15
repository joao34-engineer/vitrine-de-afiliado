import Image from "next/image";
import Link from "next/link";

import {
  AffiliateProductCard,
  formatAffiliatePrice,
  getAffiliateDiscountPercent,
  getMarketplaceLabel,
  type PublicAffiliateProduct,
  type PublicAffiliateProductCardData,
} from "@/entities/affiliate-product";

export function ProductDetail({ product, relatedProducts = [] }: Readonly<{
  product: PublicAffiliateProduct;
  relatedProducts?: readonly PublicAffiliateProductCardData[];
}>): React.JSX.Element {
  const price = formatAffiliatePrice(product.priceDiscountCents);
  const originalPrice = formatAffiliatePrice(product.priceOriginalCents);
  const discount = getAffiliateDiscountPercent(product);

  return (
    <article className="product-detail">
      <Link href="/" className="back-link">Voltar para ofertas</Link>
      <div className="product-detail-layout">
        <div className="product-detail-image">
          {product.imageUrl ? <Image src={product.imageUrl} alt={product.title} fill sizes="(max-width: 800px) 100vw, 55vw" className="product-image" priority /> : <div className="product-image-placeholder">Sem imagem</div>}
        </div>
        <div className="product-detail-copy">
          <p className="eyebrow">Oferta na {getMarketplaceLabel(product.marketplace)}</p>
          <h1>{product.title}</h1>
          <div className="product-detail-price">
            {originalPrice && discount !== null ? <span className="product-original-price">{originalPrice}</span> : null}
            <strong>{price ?? "Confira preco e disponibilidade no marketplace"}</strong>
            {discount !== null ? <span className="discount-inline">-{discount}%</span> : null}
          </div>
          <div className="product-detail-info">
            <p>Selecionado para uso diario</p>
            <p>Click seguro via redirecionamento</p>
            <p>Preco pode mudar na loja origem</p>
          </div>
          <Link href={`/r/${product.id}`} className="detail-cta">
            <span className="detail-cta-mobile">Ver oferta</span>
            <span className="detail-cta-desktop">Ver oferta na {getMarketplaceLabel(product.marketplace)}</span>
          </Link>
          <p className="product-detail-note">A Salvat&amp;Brand pode receber uma comissao pela compra, sem custo extra para voce.</p>
        </div>
      </div>
      {relatedProducts.length > 0 ? (
        <section className="product-related" aria-labelledby="product-related-title">
          <div className="section-heading-row">
            <div>
              <h2 id="product-related-title">Tambem combina</h2>
              <p className="catalog-description">Mais achados da mesma curadoria.</p>
            </div>
          </div>
          <div className="product-related-grid">
            {relatedProducts.map((relatedProduct) => <AffiliateProductCard key={relatedProduct.id} product={relatedProduct} />)}
          </div>
        </section>
      ) : null}
    </article>
  );
}
