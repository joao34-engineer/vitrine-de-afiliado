import {
  getLeafBySlug,
  legacyCategoryDestinations,
  listLeaves,
  type DepartmentSlug,
  type LeafDefinition,
  type LeafSlug,
  type SubcategorySlug,
} from "@/shared/config/affiliate-taxonomy";

export const legacyBackfillClassificationSource = "legacy-backfill-v1" as const;
export const legacyClassificationStatuses = ["auto", "review"] as const;

export type LegacyBackfillClassificationSource = typeof legacyBackfillClassificationSource;
export type LegacyClassificationStatus = (typeof legacyClassificationStatuses)[number];

export type LegacyClassificationReason =
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

export type LegacyAffiliateProductInput = {
  readonly id: string;
  readonly title: string;
  readonly aiCopy: string | null;
  readonly category: string | null;
  readonly isActive: boolean;
};

export type LegacyAffiliateProductClassification = {
  readonly status: LegacyClassificationStatus;
  readonly departmentSlug: DepartmentSlug | null;
  readonly subcategorySlug: SubcategorySlug | null;
  readonly leafSlug: LeafSlug | null;
  readonly classificationSource: LegacyBackfillClassificationSource;
  readonly classificationConfidence: number;
  readonly classificationReviewStatus: LegacyClassificationStatus;
  readonly reasons: readonly LegacyClassificationReason[];
};

export type ClassifiedLegacyAffiliateProduct = {
  readonly product: LegacyAffiliateProductInput;
  readonly classification: LegacyAffiliateProductClassification;
};

export type LegacyAffiliateProductsClassificationBatch = {
  readonly all: readonly ClassifiedLegacyAffiliateProduct[];
  readonly auto: readonly ClassifiedLegacyAffiliateProduct[];
  readonly review: readonly ClassifiedLegacyAffiliateProduct[];
};

type NormalizedLegacyProduct = {
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
  readonly excludedKeywords: readonly string[];
};

const MIN_AUTO_TEXT_SCORE = 3;
const MIN_AUTO_SCORE = 3;
const CATEGORY_BONUS = 0.75;
const CATEGORY_TIE_MARGIN = 0.75;
const beautyKeywords = ["perfume", "serum", "maquiagem", "skincare", "creme", "secador", "chapinha", "escova"];
const fashionWearableKeywords = ["camiseta", "blusa", "vestido", "saia", "calca", "short", "conjunto", "lingerie"];
const femaleGenderKeywords = ["feminino", "mulher", "fem"];
const maleGenderKeywords = ["masculino", "homem", "masc"];

function normalizeText(value: string | null): string {
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

function normalizeProduct(product: LegacyAffiliateProductInput): NormalizedLegacyProduct {
  const title = normalizeText(product.title);
  const aiCopy = normalizeText(product.aiCopy);

  return {
    title,
    aiCopy,
    combinedText: `${title} ${aiCopy}`.trim(),
  };
}

function includesKeyword(text: string, keyword: string): boolean {
  return text.includes(normalizeText(keyword));
}

function includesAnyKeyword(text: string, keywords: readonly string[]): boolean {
  return keywords.some((keyword) => includesKeyword(text, keyword));
}

function scoreLeaf(
  leaf: LeafDefinition,
  normalizedProduct: NormalizedLegacyProduct,
  candidateLeafSlugs: readonly LeafSlug[],
): LeafScore {
  let textScore = 0;
  const matchedKeywords: string[] = [];
  const excludedKeywords: string[] = [];

  for (const keyword of leaf.includeKeywords) {
    const titleMatches = includesKeyword(normalizedProduct.title, keyword);
    const aiCopyMatches = includesKeyword(normalizedProduct.aiCopy, keyword);

    if (titleMatches || aiCopyMatches) {
      textScore += titleMatches ? 3 : 1;
      matchedKeywords.push(keyword);
    }
  }

  for (const keyword of leaf.excludeKeywords) {
    if (includesKeyword(normalizedProduct.combinedText, keyword)) {
      textScore -= 2;
      excludedKeywords.push(keyword);
    }
  }

  const categoryBonus = candidateLeafSlugs.includes(leaf.slug) ? CATEGORY_BONUS : 0;

  return {
    leaf,
    textScore,
    categoryBonus,
    totalScore: textScore + categoryBonus,
    matchedKeywords,
    excludedKeywords,
  };
}

function getCandidateLeafSlugs(category: string | null): readonly LeafSlug[] {
  const legacyDestination = legacyCategoryDestinations.find((destination) => destination.category === category);
  return legacyDestination?.candidateLeafSlugs ?? [];
}

function hasKnownCategory(category: string | null): boolean {
  return legacyCategoryDestinations.some((destination) => destination.category === category);
}

function getCategoryReason(category: string | null): LegacyClassificationReason | null {
  if (category === null || category.trim().length === 0) {
    return "legacy-category-missing";
  }

  return hasKnownCategory(category) ? null : "legacy-category-unknown";
}

function sortScores(scores: readonly LeafScore[]): readonly LeafScore[] {
  return [...scores].sort((left, right) => {
    if (right.totalScore !== left.totalScore) {
      return right.totalScore - left.totalScore;
    }

    if (right.textScore !== left.textScore) {
      return right.textScore - left.textScore;
    }

    return left.leaf.slug.localeCompare(right.leaf.slug);
  });
}

function getConflictReason(bestScore: LeafScore, candidateLeafSlugs: readonly LeafSlug[]): LegacyClassificationReason | null {
  if (candidateLeafSlugs.length === 0 || candidateLeafSlugs.includes(bestScore.leaf.slug)) {
    return null;
  }

  return bestScore.textScore >= MIN_AUTO_TEXT_SCORE ? "legacy-category-mismatch" : null;
}

function getConfidence(score: LeafScore, status: LegacyClassificationStatus): number {
  if (status === "review") {
    return 0.4;
  }

  if (score.textScore >= 6) {
    return 0.95;
  }

  if (score.textScore >= MIN_AUTO_TEXT_SCORE) {
    return score.categoryBonus > 0 ? 0.88 : 0.85;
  }

  return 0.7;
}

function buildReviewResult(reasons: readonly LegacyClassificationReason[]): LegacyAffiliateProductClassification {
  return {
    status: "review",
    departmentSlug: null,
    subcategorySlug: null,
    leafSlug: null,
    classificationSource: legacyBackfillClassificationSource,
    classificationConfidence: 0.4,
    classificationReviewStatus: "review",
    reasons,
  };
}

function buildAutoResult(score: LeafScore, reasons: readonly LegacyClassificationReason[]): LegacyAffiliateProductClassification {
  const leaf = getLeafBySlug(score.leaf.slug);

  return {
    status: "auto",
    departmentSlug: leaf.departmentSlug,
    subcategorySlug: leaf.subcategorySlug,
    leafSlug: leaf.slug,
    classificationSource: legacyBackfillClassificationSource,
    classificationConfidence: getConfidence(score, "auto"),
    classificationReviewStatus: "auto",
    reasons,
  };
}

function isGenderlessWearableFashion(
  product: LegacyAffiliateProductInput,
  normalizedProduct: NormalizedLegacyProduct,
): boolean {
  if (product.category !== "Moda & Beleza") {
    return false;
  }

  const text = normalizedProduct.combinedText;

  return (
    includesAnyKeyword(text, fashionWearableKeywords) &&
    !includesAnyKeyword(text, beautyKeywords) &&
    !includesAnyKeyword(text, maleGenderKeywords) &&
    !includesAnyKeyword(text, femaleGenderKeywords)
  );
}

export function classifyLegacyAffiliateProduct(
  product: LegacyAffiliateProductInput,
): LegacyAffiliateProductClassification {
  const normalizedProduct = normalizeProduct(product);
  const reasons: LegacyClassificationReason[] = ["text-title-ai-copy-primary"];
  const categoryReason = getCategoryReason(product.category);
  const candidateLeafSlugs = getCandidateLeafSlugs(product.category);

  if (!product.isActive) {
    reasons.push("inactive-product");
  }

  if (categoryReason !== null) {
    reasons.push(categoryReason);
  }

  if (normalizedProduct.combinedText.length < 5) {
    return buildReviewResult([...reasons, "low-information"]);
  }

  if (isGenderlessWearableFashion(product, normalizedProduct)) {
    return buildReviewResult([...reasons, "ambiguous-leaf-match"]);
  }

  const sortedScores = sortScores(
    listLeaves().map((leaf) => scoreLeaf(leaf, normalizedProduct, candidateLeafSlugs)),
  );
  const bestScore = sortedScores[0];
  const secondScore = sortedScores[1] ?? null;
  const audioScore = sortedScores.find((score) => score.leaf.slug === "audio");
  const gamingScore = sortedScores.find((score) => score.leaf.slug === "games-e-pc");

  if (bestScore === undefined || bestScore.totalScore < MIN_AUTO_SCORE || bestScore.textScore < MIN_AUTO_TEXT_SCORE) {
    return buildReviewResult([...reasons, "low-score"]);
  }

  if (
    product.category === "Eletronicos" &&
    audioScore !== undefined &&
    gamingScore !== undefined &&
    audioScore.textScore >= MIN_AUTO_TEXT_SCORE &&
    gamingScore.textScore >= MIN_AUTO_TEXT_SCORE
  ) {
    return buildReviewResult([...reasons, "ambiguous-leaf-match"]);
  }

  if (secondScore !== null && bestScore.totalScore - secondScore.totalScore <= CATEGORY_TIE_MARGIN) {
    return buildReviewResult([...reasons, "ambiguous-leaf-match"]);
  }

  const conflictReason = getConflictReason(bestScore, candidateLeafSlugs);
  const finalReasons: LegacyClassificationReason[] = [...reasons, "text-strong-match"];

  if (bestScore.categoryBonus > 0) {
    finalReasons.push("category-tiebreaker");
  }

  if (conflictReason !== null) {
    finalReasons.push(conflictReason);
  }

  if (product.category === "Achadinhos Gerais" && conflictReason === null && bestScore.leaf.slug === "achadinhos-gerais") {
    return buildReviewResult([...reasons, "achadinhos-without-strong-signal"]);
  }

  return buildAutoResult(bestScore, finalReasons);
}

export function classifyLegacyAffiliateProducts(
  products: readonly LegacyAffiliateProductInput[],
): LegacyAffiliateProductsClassificationBatch {
  const all = products.map((product) => ({
    product,
    classification: classifyLegacyAffiliateProduct(product),
  }));

  return {
    all,
    auto: all.filter((item) => item.classification.status === "auto"),
    review: all.filter((item) => item.classification.status === "review"),
  };
}
