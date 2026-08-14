import { describe, expect, it } from "vitest";

import { classifyAffiliateProductForIngestion } from "./affiliate-ingestion-classification";

describe("classifyAffiliateProductForIngestion", () => {
  it.each([
    ["Meia-Calca Termica Feminina Forrada", "roupas-femininas"],
    ["Calca Legging Feminina Flanelada", "roupas-femininas"],
    ["Conjunto com 6 Xicaras de Porcelana", "utensilios-de-cozinha"],
    ["Tablet Android com Teclado Bluetooth", "eletronicos"],
    ["Cesto de Silicone para Air Fryer", "utensilios-de-cozinha"],
    ["Frigideira Antiaderente de Aluminio", "utensilios-de-cozinha"],
    ["Kit Limpa Estofados para Carro e Sofa", "utilidades-domesticas"],
    ["Calcinha Modeladora Cinta Seca Barriga", "roupas-femininas"],
  ])("classifica %s na folha %s", (title, expectedLeaf) => {
    const result = classifyAffiliateProductForIngestion({
      title,
      aiCopy: null,
      legacyCategory: "Achadinhos Gerais",
    });

    expect(result.status).toBe("auto");
    expect(result.leafSlug).toBe(expectedLeaf);
  });

  it("separa sugestao de classificacao aceita quando ha ambiguidade", () => {
    const result = classifyAffiliateProductForIngestion({
      title: "Produto legal em oferta",
      aiCopy: null,
      legacyCategory: null,
    });

    expect(result.status).toBe("review");
    expect(result.departmentSlug).toBeNull();
    expect(result.leafSlug).toBeNull();
  });

  it("nao permite que category legada venca texto forte", () => {
    const result = classifyAffiliateProductForIngestion({
      title: "Tablet Android 10 polegadas",
      aiCopy: null,
      legacyCategory: "Cozinha & Eletro",
    });

    expect(result.status).toBe("auto");
    expect(result.leafSlug).toBe("eletronicos");
    expect(result.reasons).toContain("legacy-category-mismatch");
  });
});
