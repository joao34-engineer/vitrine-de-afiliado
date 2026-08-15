import Link from "next/link";

import { getPublicEnv } from "@/shared/config/env";

export function CatalogFooter(): React.JSX.Element {
  const env = getPublicEnv();

  const communityLink = (label: string, href: string | undefined): React.JSX.Element => href ? (
    <a href={href} rel="noreferrer" target="_blank">{label}</a>
  ) : <span>{label}</span>;

  return (
    <footer className="site-footer" data-sheet-background>
      <div className="footer-grid">
        <div className="footer-brand">
          <p className="brand-name">salvat&amp;brand</p>
          <p>Curadoria de ofertas afiliadas. A compra acontece no marketplace parceiro.</p>
        </div>
        <div className="footer-community">
          <div className="footer-community-links">
            {communityLink("WhatsApp", env.NEXT_PUBLIC_WHATSAPP_URL)}
            {communityLink("Instagram", env.NEXT_PUBLIC_INSTAGRAM_URL)}
            <Link href="/como-funciona">Como funciona</Link>
          </div>
        </div>
        <div className="footer-navigation">
          <p className="footer-heading">Navegacao</p>
          <p><Link href="/">Departamentos</Link> · <Link href="/">Ofertas recentes</Link> · <Link href="/transparencia">Transparencia</Link></p>
        </div>
        <div className="footer-disclosure">
          <p className="footer-heading">Afiliados</p>
          <p>Podemos receber comissao por compras feitas pelos links.</p>
          <p>Precos, estoque e condicoes podem mudar sem aviso.</p>
          <p>Amazon sem API: conferir preco na Amazon.</p>
        </div>
      </div>
    </footer>
  );
}
