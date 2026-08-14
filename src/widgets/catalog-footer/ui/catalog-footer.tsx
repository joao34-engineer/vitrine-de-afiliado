import Link from "next/link";

import { getPublicEnv } from "@/shared/config/env";

export function CatalogFooter(): React.JSX.Element {
  const env = getPublicEnv();

  return (
    <footer className="site-footer" data-sheet-background>
      <div className="footer-grid">
        <div className="footer-brand">
          <p className="brand-name">salvat&amp;brand</p>
          <p>Curadoria de ofertas afiliadas. A compra acontece no marketplace parceiro.</p>
        </div>
        <div className="footer-navigation">
          <p className="footer-heading">Navegacao</p>
          <Link href="/como-funciona">Como funciona</Link>
          <Link href="/transparencia">Transparencia</Link>
          <Link href="/">Ofertas recentes</Link>
        </div>
        <div className="footer-community">
          <p className="footer-heading">Comunidade</p>
          <div className="footer-community-links">
            {env.NEXT_PUBLIC_INSTAGRAM_URL ? (
              <a href={env.NEXT_PUBLIC_INSTAGRAM_URL} rel="noreferrer" target="_blank">Instagram</a>
            ) : null}
            {env.NEXT_PUBLIC_WHATSAPP_URL ? (
              <a href={env.NEXT_PUBLIC_WHATSAPP_URL} rel="noreferrer" target="_blank">WhatsApp</a>
            ) : null}
            <Link href="/como-funciona">Como funciona</Link>
          </div>
        </div>
        <div className="footer-disclosure">
          <p className="footer-heading">Transparencia afiliada</p>
          <p>A Salvat&amp;Brand participa de programas de afiliados. Podemos receber comissao por compras feitas pelos links, sem custo extra para voce.</p>
          <p>Precos, estoque e condicoes podem mudar sem aviso. O preco valido e o exibido no marketplace no momento da compra.</p>
        </div>
      </div>
    </footer>
  );
}
