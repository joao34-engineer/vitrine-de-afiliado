import { describe, expect, it } from "vitest";

import {
  classifyLegacyAffiliateProduct,
  classifyLegacyAffiliateProducts,
  type LegacyAffiliateProductInput,
} from "..";

function product(overrides: Partial<LegacyAffiliateProductInput>): LegacyAffiliateProductInput {
  return {
    id: "legacy-1",
    title: "Organizador de gaveta com divisorias",
    aiCopy: null,
    category: "Casa & Decoracao",
    isActive: true,
    ...overrides,
  };
}

describe("legacy affiliate classification", () => {
  it("does not blindly follow a wrong legacy category when text is strong", () => {
    const classification = classifyLegacyAffiliateProduct(
      product({
        title: "Organizador de gaveta para closet",
        aiCopy: "Caixa organizadora multiuso para casa.",
        category: "Moda & Beleza",
      }),
    );

    expect(classification.status).toBe("auto");
    expect(classification.departmentSlug).toBe("casa");
    expect(classification.leafSlug).toBe("organizacao");
    expect(classification.reasons).toContain("legacy-category-mismatch");
  });

  it("classifies each major legacy group with a deterministic auto result", () => {
    const samples: readonly [LegacyAffiliateProductInput, string][] = [
      [
        product({
          title: "Almofada decorativa para sofa",
          category: "Casa & Decoracao",
        }),
        "decoracao",
      ],
      [
        product({
          title: "Air fryer compacta digital",
          category: "Cozinha & Eletro",
        }),
        "eletroportateis",
      ],
      [
        product({
          title: "Parafusadeira ferramenta eletrica",
          category: "Ferramentas & Bricolagem",
        }),
        "ferramentas",
      ],
      [
        product({
          title: "Fone bluetooth com microfone",
          category: "Eletronicos",
        }),
        "audio",
      ],
      [
        product({
          title: "Serum facial de skincare",
          category: "Moda & Beleza",
        }),
        "beleza-e-cuidados",
      ],
      [
        product({
          title: "Elastico de treino para academia",
          category: "Esportes & Academia",
        }),
        "fitness",
      ],
      [
        product({
          title: "Mamadeira para bebe recem nascido",
          category: "Bebe & Infantil",
        }),
        "bebe",
      ],
      [
        product({
          title: "Comedouro para cachorro pet",
          category: "Pet Shop",
        }),
        "pets",
      ],
      [
        product({
          title: "Planner semanal com kit de canetas",
          category: "Livros & Papelaria",
        }),
        "papelaria",
      ],
      [
        product({
          title: "Organizador automotivo para porta malas do carro",
          category: "Automotivos",
        }),
        "automotivo",
      ],
    ];

    for (const [sample, expectedLeafSlug] of samples) {
      const classification = classifyLegacyAffiliateProduct(sample);

      expect(classification.status).toBe("auto");
      expect(classification.leafSlug).toBe(expectedLeafSlug);
    }
  });

  it("sends wearable fashion without reliable gender marker to review", () => {
    const classification = classifyLegacyAffiliateProduct(
      product({
        title: "Camiseta basica confortavel",
        category: "Moda & Beleza",
      }),
    );

    expect(classification.status).toBe("review");
    expect(classification.reasons).toContain("ambiguous-leaf-match");
  });

  it("sends electronics with strong audio and gaming signals to review", () => {
    const classification = classifyLegacyAffiliateProduct(
      product({
        title: "Headset gamer com microfone para console e PC",
        aiCopy: "Fone headset gamer para setup com controle e monitor.",
        category: "Eletronicos",
      }),
    );

    expect(classification.status).toBe("review");
    expect(classification.reasons).toContain("ambiguous-leaf-match");
  });

  it("sends Achadinhos Gerais without enough signal to review", () => {
    const classification = classifyLegacyAffiliateProduct(
      product({
        title: "Produto util em oferta",
        aiCopy: null,
        category: "Achadinhos Gerais",
      }),
    );

    expect(classification.status).toBe("review");
    expect(classification.reasons).toContain("achadinhos-without-strong-signal");
  });

  it("classifies text with unknown or missing category when the text signal is strong", () => {
    const unknownCategory = classifyLegacyAffiliateProduct(
      product({
        title: "Tenis masculino para corrida",
        category: "Categoria antiga errada",
      }),
    );
    const missingCategory = classifyLegacyAffiliateProduct(
      product({
        title: "Coleira para cachorro pet",
        category: null,
      }),
    );

    expect(unknownCategory.status).toBe("auto");
    expect(unknownCategory.leafSlug).toBe("calcados-masculinos");
    expect(unknownCategory.reasons).toContain("legacy-category-unknown");
    expect(missingCategory.status).toBe("auto");
    expect(missingCategory.leafSlug).toBe("pets");
    expect(missingCategory.reasons).toContain("legacy-category-missing");
  });

  it("keeps inactive products classified but marked for audit", () => {
    const classification = classifyLegacyAffiliateProduct(
      product({
        title: "Mouse gamer com teclado gamer",
        category: "Eletronicos",
        isActive: false,
      }),
    );

    expect(classification.reasons).toContain("inactive-product");
  });

  it("splits batch results into auto and review groups", () => {
    const batch = classifyLegacyAffiliateProducts([
      product({
        id: "auto-1",
        title: "Air fryer compacta digital",
        category: "Cozinha & Eletro",
      }),
      product({
        id: "review-1",
        title: "Camiseta basica confortavel",
        category: "Moda & Beleza",
      }),
    ]);

    expect(batch.all).toHaveLength(2);
    expect(batch.auto).toHaveLength(1);
    expect(batch.review).toHaveLength(1);
    expect(batch.auto[0]?.product.id).toBe("auto-1");
    expect(batch.review[0]?.product.id).toBe("review-1");
  });
});
