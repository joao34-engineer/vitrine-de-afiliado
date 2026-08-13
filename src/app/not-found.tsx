import Link from "next/link";

export default function NotFound() {
  return <main className="route-error"><p className="eyebrow">404</p><h1>Esta oferta nao esta disponivel.</h1><p>O produto pode ter sido removido ou ainda nao estar pronto para publicacao.</p><Link href="/" className="detail-cta">Voltar para ofertas</Link></main>;
}
