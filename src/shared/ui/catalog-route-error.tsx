"use client";

export function CatalogRouteError({ reset }: Readonly<{ reset: () => void }>): React.JSX.Element {
  return (
    <main className="route-error" role="alert">
      <p className="eyebrow">Catalogo indisponivel</p>
      <h1>Nao foi possivel carregar as ofertas.</h1>
      <p>Tente novamente em alguns instantes.</p>
      <button type="button" className="load-more-button" onClick={reset}>Tentar novamente</button>
    </main>
  );
}
