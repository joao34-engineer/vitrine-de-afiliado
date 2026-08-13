"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="route-error"><p className="eyebrow">Catalogo indisponivel</p><h1>Nao foi possivel carregar as ofertas.</h1><p>Tente novamente em alguns instantes.</p><button type="button" className="load-more-button" onClick={reset}>Tentar novamente</button></main>;
}
