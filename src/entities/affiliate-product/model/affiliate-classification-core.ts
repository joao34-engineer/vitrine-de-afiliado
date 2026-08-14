import {
  getLeafBySlug,
  legacyCategoryDestinations,
  listLeaves,
  type DepartmentSlug,
  type LeafDefinition,
  type LeafSlug,
  type SubcategorySlug,
} from "@/shared/config/affiliate-taxonomy";

export const affiliateClassificationStatuses = ["auto", "review"] as const;
export type AffiliateClassificationStatus = (typeof affiliateClassificationStatuses)[number];

export type AffiliateClassificationReason =
  | "achadinhos-without-strong-signal"
  | "ambiguous-leaf-match"
  | "category-tiebreaker"
  | "inactive-product"
  | "legacy-category-mismatch"
  | "legacy-category-missing"
  | "legacy-category-unknown"
  | "low-information"
  | "low-score"
  | "text-strong-match"
  | "text-title-ai-copy-primary";

export type AffiliateClassificationInput = {
  readonly title: string;
  readonly aiCopy: string | null;
  readonly category: string | null;
  readonly isActive: boolean;
};

export type AffiliateClassificationDecision = {
  readonly status: AffiliateClassificationStatus;
  readonly departmentSlug: DepartmentSlug | null;
  readonly subcategorySlug: SubcategorySlug | null;
  readonly leafSlug: LeafSlug | null;
  readonly suggestedDepartmentSlug: DepartmentSlug | null;
  readonly suggestedSubcategorySlug: SubcategorySlug | null;
  readonly suggestedLeafSlug: LeafSlug | null;
  readonly confidence: number;
  readonly reasons: readonly AffiliateClassificationReason[];
};

type NormalizedProduct = {
  readonly title: string;
  readonly aiCopy: string;
  readonly combinedText: string;
};

type LeafScore = {
  readonly leaf: LeafDefinition;
  readonly textScore: number;
  readonly categoryBonus: number;
  readonly totalScore: number;
  readonly matchedKeywords: readonly string[];
};

const MIN_AUTO_TEXT_SCORE = 3;
const MIN_AUTO_SCORE = 3;
const CATEGORY_BONUS = 0.75;
const CATEGORY_TIE_MARGIN = 0.75;
const beautyKeywords = ["perfume", "serum", "maquiagem", "skincare", "creme", "secador", "chapinha", "escova"];
const fashionWearableKeywords = ["camiseta", "blusa", "vestido", "saia", "calca", "short", "conjunto", "lingerie"];
const femaleGenderKeywords = ["feminino", "feminina", "femininas", "mulher", "mulheres", "fem"];
const maleGenderKeywords = ["masculino", "masculina", "masculinos", "homem", "homens", "masc"];

export function normalizeAffiliateClassificationText(value: string | null): string {
  if (value === null) {
    return "";
  }

  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeProduct(product: AffiliateClassificationInput): NormalizedProduct {
  const title = normalizeAffiliateClassificationText(product.title);
  const aiCopy = normalizeAffiliateClassificationText(product.aiCopy);

  return { title, aiCopy, combinedText: `${title} ${aiCopy}`.trim() };
}

function includesKeyword(text: string, keyword: string): boolean {
  return text.includes(normalizeAffiliateClassificationText(keyword));
}

function includesAnyKeyword(text: string, keywords: readonly string[]): boolean {
  return keywords.some((keyword) => includesKeyword(text, keyword));
}

function candidateLeafSlugs(category: string | null): readonly LeafSlug[] {
  return legacyCategoryDestinations.find((destination) => destination.category === category)?.candidateLeafSlugs ?? [];
}

function categoryReason(category: string | null): AffiliateClassificationReason | null {
  if (category === null || category.trim().length === 0) {
    return "legacy-category-missing";
  }

  return legacyCategoryDestinations.some((destination) => destination.category === category)
    ? null
    : "legacy-category-unknown";
}

function scoreLeaf(
  leaf: LeafDefinition,
  product: NormalizedProduct,
  candidateSlugs: readonly LeafSlug[],
): LeafScore {
  let textScore = 0;
  const matchedKeywords: string[] = [];

  for (const keyword of leaf.includeKeywords) {
    const titleMatches = includesKeyword(product.title, keyword);
    const copyMatches = includesKeyword(product.aiCopy, keyword);

    if (titleMatches || copyMatches) {
      textScore += titleMatches ? 3 : 1;
      matchedKeywords.push(keyword);
    }
  }

  for (const keyword of leaf.excludeKeywords) {
    if (includesKeyword(product.combinedText, keyword)) {
      textScore -= 2;
    }
  }

  const categoryBonus = candidateSlugs.includes(leaf.slug) ? CATEGORY_BONUS : 0;
  return {
    leaf,
    textScore,
    categoryBonus,
    totalScore: textScore + categoryBonus,
    matchedKeywords,
  };
}

function sortScores(scores: readonly LeafScore[]): readonly LeafScore[] {
  return [...scores].sort((left, right) => {
    if (right.totalScore !== left.totalScore) return right.totalScore - left.totalScore;
    if (right.textScore !== left.textScore) return right.textScore - left.textScore;
    return left.leaf.slug.localeCompare(right.leaf.slug);
  });
}

function isGenderlessWearableFashion(product: AffiliateClassificationInput, normalized: NormalizedProduct): boolean {
  if (product.category !== "Moda & Beleza") return false;

  return (
    includesAnyKeyword(normalized.combinedText, fashionWearableKeywords) &&
    !includesAnyKeyword(normalized.combinedText, beautyKeywords) &&
    !includesAnyKeyword(normalized.combinedText, maleGenderKeywords) &&
    !includesAnyKeyword(normalized.combinedText, femaleGenderKeywords)
  );
}

function confidence(score: LeafScore | undefined, status: AffiliateClassificationStatus): number {
  if (status === "review" || score === undefined) return 0.4;
  if (score.textScore >= 6) return 0.95;
  if (score.textScore >= MIN_AUTO_TEXT_SCORE) return score.categoryBonus > 0 ? 0.88 : 0.85;
  return 0.7;
}

function suggestion(score: LeafScore | undefined): Pick<
  AffiliateClassificationDecision,
  "suggestedDepartmentSlug" | "suggestedSubcategorySlug" | "suggestedLeafSlug"
> {
  if (score === undefined || score.matchedKeywords.length === 0 || score.totalScore <= 0) {
    return { suggestedDepartmentSlug: null, suggestedSubcategorySlug: null, suggestedLeafSlug: null };
  }

  return {
    suggestedDepartmentSlug: score.leaf.departmentSlug,
    suggestedSubcategorySlug: score.leaf.subcategorySlug,
    suggestedLeafSlug: score.leaf.slug,
  };
}

function reviewDecision(
  reasons: readonly AffiliateClassificationReason[],
  bestScore: LeafScore | undefined,
): AffiliateClassificationDecision {
  return {
    status: "review",
    departmentSlug: null,
    subcategorySlug: null,
    leafSlug: null,
    ...suggestion(bestScore),
    confidence: confidence(bestScore, "review"),
    reasons,
  };
}

export function classifyAffiliateProduct(input: AffiliateClassificationInput): AffiliateClassificationDecision {
  const normalized = normalizeProduct(input);
  const reasons: AffiliateClassificationReason[] = ["text-title-ai-copy-primary"];
  const legacyCandidates = candidateLeafSlugs(input.category);
  const legacyReason = categoryReason(input.category);

  if (!input.isActive) reasons.push("inactive-product");
  if (legacyReason !== null) reasons.push(legacyReason);
  if (normalized.combinedText.length < 5) return reviewDecision([...reasons, "low-information"], undefined);
  if (isGenderlessWearableFashion(input, normalized)) return reviewDecision([...reasons, "ambiguous-leaf-match"], undefined);

  const scores = sortScores(listLeaves().map((leaf) => scoreLeaf(leaf, normalized, legacyCandidates)));
  const best = scores[0];
  const second = scores[1] ?? null;

  if (best === undefined || best.totalScore < MIN_AUTO_SCORE || best.textScore < MIN_AUTO_TEXT_SCORE) {
    return reviewDecision([...reasons, "low-score"], best);
  }

  const audio = scores.find((score) => score.leaf.slug === "audio");
  const gaming = scores.find((score) => score.leaf.slug === "games-e-pc");
  if (
    input.category === "Eletronicos" &&
    audio !== undefined &&
    gaming !== undefined &&
    audio.textScore >= MIN_AUTO_TEXT_SCORE &&
    gaming.textScore >= MIN_AUTO_TEXT_SCORE
  ) {
    return reviewDecision([...reasons, "ambiguous-leaf-match"], best);
  }

  if (second !== null && best.totalScore - second.totalScore <= CATEGORY_TIE_MARGIN) {
    return reviewDecision([...reasons, "ambiguous-leaf-match"], best);
  }

  const finalReasons: AffiliateClassificationReason[] = [...reasons, "text-strong-match"];
  if (best.categoryBonus > 0) finalReasons.push("category-tiebreaker");
  if (legacyCandidates.length > 0 && !legacyCandidates.includes(best.leaf.slug)) {
    finalReasons.push("legacy-category-mismatch");
  }

  if (best.leaf.slug === "achadinhos-gerais") {
    return reviewDecision([...reasons, "achadinhos-without-strong-signal"], best);
  }

  const leaf = getLeafBySlug(best.leaf.slug);
  return {
    status: "auto",
    departmentSlug: leaf.departmentSlug,
    subcategorySlug: leaf.subcategorySlug,
    leafSlug: leaf.slug,
    suggestedDepartmentSlug: null,
    suggestedSubcategorySlug: null,
    suggestedLeafSlug: null,
    confidence: confidence(best, "auto"),
    reasons: finalReasons,
  };
}
