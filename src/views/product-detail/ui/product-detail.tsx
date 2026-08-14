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
            <p>Selecionado para uso diario.</p>
            <p>Clique seguro via redirecionamento.</p>
            <p>Preco, estoque e condicoes podem mudar na loja de origem.</p>
          </div>
          <Link href={`/r/${product.id}`} className="detail-cta">Ver oferta na {getMarketplaceLabel(product.marketplace)}</Link>
          <p className="product-detail-note">A Salvat&amp;Brand pode receber uma comissao pela compra, sem custo extra para voce.</p>
        </div>
      </div>
      {relatedProducts.length > 0 ? (
        <section className="product-related" aria-labelledby="product-related-title">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">Tambem combina</p>
              <h2 id="product-related-title">Mais achados da mesma curadoria.</h2>
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
