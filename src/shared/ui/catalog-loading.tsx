export function CatalogLoading(): React.JSX.Element {
  return (
    <main className="route-loading" aria-busy="true" aria-live="polite">
      <span className="loading-line" />
      <span className="loading-line loading-line-short" />
      <div className="loading-grid">
        {Array.from({ length: 8 }, (_, index) => <span className="loading-card" key={index} />)}
      </div>
    </main>
  );
}
