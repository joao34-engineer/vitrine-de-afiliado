export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f4ee] px-5 py-10 text-[#1f211d]">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#6f6a5f]">
            Salvat Ofertas
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
            Vitrine afiliada em fundacao
          </h1>
          <p className="max-w-2xl text-base leading-7 text-[#5a5d54]">
            Este app sera a vitrine afiliada separada em
            ofertas.salvatbrand.com.br, com Supabase e taxonomia simples por
            folhas. Catalogo, PDP e redirect entram nas proximas fases.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {["Fundacao", "Catalogo", "Go-live"].map((phase) => (
            <div key={phase} className="rounded-lg border border-[#ded7ca] bg-white p-4">
              <p className="text-sm font-semibold">{phase}</p>
              <p className="mt-2 text-sm leading-6 text-[#6f6a5f]">
                Plano documentado em docs/execution-doc.
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
