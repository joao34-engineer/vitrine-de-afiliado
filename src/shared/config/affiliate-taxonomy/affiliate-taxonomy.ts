export const affiliateDepartmentSlugs = [
  "home",
  "homens",
  "mulheres",
  "infantil",
  "casa",
  "cozinha",
  "tech",
  "beleza",
  "esportes",
  "pet",
  "mais",
] as const;

export const affiliateSubcategorySlugs = [
  "roupas",
  "calcados",
  "acessorios",
  "cuidados",
  "organizacao",
  "utensilios",
  "eletroportateis",
  "audio",
  "gaming",
  "papelaria",
  "ferramentas",
  "automotivo",
] as const;

export const affiliateLeafSlugs = [
  "roupas-masculinas",
  "calcados-masculinos",
  "acessorios-masculinos",
  "roupas-femininas",
  "calcados-femininos",
  "acessorios-femininos",
  "beleza-e-cuidados",
  "bebe",
  "infantil",
  "decoracao",
  "organizacao",
  "utilidades-domesticas",
  "utensilios-de-cozinha",
  "eletroportateis",
  "audio",
  "eletronicos",
  "games-e-pc",
  "fitness",
  "esportes-ao-ar-livre",
  "pets",
  "papelaria",
  "ferramentas",
  "automotivo",
  "achadinhos-gerais",
] as const;

export type DepartmentSlug = (typeof affiliateDepartmentSlugs)[number];
export type SubcategorySlug = (typeof affiliateSubcategorySlugs)[number];
export type LeafSlug = (typeof affiliateLeafSlugs)[number];

export type DepartmentDefinition = {
  readonly slug: DepartmentSlug;
  readonly label: string;
  readonly description: string;
};

export type SubcategoryDefinition = {
  readonly slug: SubcategorySlug;
  readonly label: string;
  readonly description: string;
};

export type LeafDefinition = {
  readonly slug: LeafSlug;
  readonly label: string;
  readonly description: string;
  readonly departmentSlug: DepartmentSlug;
  readonly subcategorySlug: SubcategorySlug | null;
  readonly includeKeywords: readonly string[];
  readonly excludeKeywords: readonly string[];
  readonly examples: readonly string[];
};

export type AffiliateTaxonomy = {
  readonly departments: readonly DepartmentDefinition[];
  readonly subcategories: readonly SubcategoryDefinition[];
  readonly leaves: readonly LeafDefinition[];
};

export type LegacyCategoryDestination = {
  readonly category: string;
  readonly baseDepartmentSlug: DepartmentSlug;
  readonly candidateLeafSlugs: readonly LeafSlug[];
  readonly reviewRequired: boolean;
  readonly note: string;
};

export const affiliateTaxonomy = {
  departments: [
    {
      slug: "home",
      label: "Home",
      description: "Entrada editorial e vitrines iniciais da affiliate-vitrine.",
    },
    {
      slug: "homens",
      label: "Homens",
      description: "Moda, calcados e acessorios masculinos.",
    },
    {
      slug: "mulheres",
      label: "Mulheres",
      description: "Moda, calcados e acessorios femininos.",
    },
    {
      slug: "infantil",
      label: "Infantil",
      description: "Produtos para bebe, criancas e rotina infantil.",
    },
    {
      slug: "casa",
      label: "Casa",
      description: "Decoracao, organizacao e utilidades domesticas.",
    },
    {
      slug: "cozinha",
      label: "Cozinha",
      description: "Utensilios e eletroportateis para cozinha.",
    },
    {
      slug: "tech",
      label: "Tech",
      description: "Audio, eletronicos e itens gamer.",
    },
    {
      slug: "beleza",
      label: "Beleza",
      description: "Beleza, skincare, cabelo e cuidados pessoais.",
    },
    {
      slug: "esportes",
      label: "Esportes",
      description: "Fitness, treino e esportes ao ar livre.",
    },
    {
      slug: "pet",
      label: "Pet",
      description: "Produtos para pets e cuidados do dia a dia.",
    },
    {
      slug: "mais",
      label: "Mais",
      description: "Papelaria, ferramentas, automotivo e achadinhos gerais.",
    },
  ],
  subcategories: [
    {
      slug: "roupas",
      label: "Roupas",
      description: "Pecas de vestuario e looks.",
    },
    {
      slug: "calcados",
      label: "Calcados",
      description: "Tenis, sapatos, sandalias e botas.",
    },
    {
      slug: "acessorios",
      label: "Acessorios",
      description: "Bolsas, relogios, carteiras, bones e complementos.",
    },
    {
      slug: "cuidados",
      label: "Cuidados",
      description: "Cuidados pessoais, bebe e pet.",
    },
    {
      slug: "organizacao",
      label: "Organizacao",
      description: "Organizadores, caixas, cabides e itens de ordem.",
    },
    {
      slug: "utensilios",
      label: "Utensilios",
      description: "Itens manuais para preparo, servir e rotina de cozinha.",
    },
    {
      slug: "eletroportateis",
      label: "Eletroportateis",
      description: "Pequenos eletros para cozinha e casa.",
    },
    {
      slug: "audio",
      label: "Audio",
      description: "Fones, caixas de som, headsets e microfones.",
    },
    {
      slug: "gaming",
      label: "Gaming",
      description: "Perifericos, consoles e setup gamer.",
    },
    {
      slug: "papelaria",
      label: "Papelaria",
      description: "Materiais de escrita, estudo e escritorio.",
    },
    {
      slug: "ferramentas",
      label: "Ferramentas",
      description: "Ferramentas, bricolagem e manutencao.",
    },
    {
      slug: "automotivo",
      label: "Automotivo",
      description: "Acessorios e utilidades para carro e moto.",
    },
  ],
  leaves: [
    {
      slug: "roupas-masculinas",
      label: "Roupas masculinas",
      description: "Camisetas, calcas, bermudas e roupas para homens.",
      departmentSlug: "homens",
      subcategorySlug: "roupas",
      includeKeywords: ["masculino", "homem", "camiseta", "calca", "bermuda"],
      excludeKeywords: ["feminino", "mulher", "infantil", "bebe"],
      examples: ["camiseta masculina", "bermuda masculina"],
    },
    {
      slug: "calcados-masculinos",
      label: "Calcados masculinos",
      description: "Tenis, sapatos, botas e chinelos masculinos.",
      departmentSlug: "homens",
      subcategorySlug: "calcados",
      includeKeywords: ["masculino", "homem", "tenis", "sapato", "bota", "chinelo"],
      excludeKeywords: ["feminino", "mulher", "infantil", "bebe"],
      examples: ["tenis masculino", "sapato masculino"],
    },
    {
      slug: "acessorios-masculinos",
      label: "Acessorios masculinos",
      description: "Relogios, bones, oculos, carteiras, cintos e mochilas.",
      departmentSlug: "homens",
      subcategorySlug: "acessorios",
      includeKeywords: ["masculino", "homem", "relogio", "bone", "oculos", "carteira", "cinto"],
      excludeKeywords: ["feminino", "mulher", "infantil", "bebe"],
      examples: ["relogio masculino", "carteira masculina"],
    },
    {
      slug: "roupas-femininas",
      label: "Roupas femininas",
      description: "Vestidos, blusas, saias, calcas, shorts e conjuntos.",
      departmentSlug: "mulheres",
      subcategorySlug: "roupas",
      includeKeywords: ["feminino", "mulher", "vestido", "blusa", "saia", "conjunto"],
      excludeKeywords: ["masculino", "homem", "infantil", "bebe"],
      examples: ["vestido feminino", "blusa feminina"],
    },
    {
      slug: "calcados-femininos",
      label: "Calcados femininos",
      description: "Tenis, sapatos, botas, chinelos, sandalias e saltos.",
      departmentSlug: "mulheres",
      subcategorySlug: "calcados",
      includeKeywords: ["feminino", "mulher", "tenis", "sapato", "bota", "sandalia", "salto"],
      excludeKeywords: ["masculino", "homem", "infantil", "bebe"],
      examples: ["sandalia feminina", "tenis feminino"],
    },
    {
      slug: "acessorios-femininos",
      label: "Acessorios femininos",
      description: "Bolsas, oculos, relogios, pulseiras, colares e brincos.",
      departmentSlug: "mulheres",
      subcategorySlug: "acessorios",
      includeKeywords: ["feminino", "mulher", "bolsa", "oculos", "pulseira", "colar", "brinco"],
      excludeKeywords: ["masculino", "homem", "infantil", "bebe"],
      examples: ["bolsa feminina", "colar feminino"],
    },
    {
      slug: "beleza-e-cuidados",
      label: "Beleza e cuidados",
      description: "Skincare, maquiagem, perfume, cabelo e cuidados pessoais.",
      departmentSlug: "beleza",
      subcategorySlug: "cuidados",
      includeKeywords: ["perfume", "serum", "maquiagem", "skincare", "creme", "secador", "chapinha"],
      excludeKeywords: ["pet", "automotivo", "ferramenta"],
      examples: ["serum facial", "escova secadora"],
    },
    {
      slug: "bebe",
      label: "Bebe",
      description: "Mamadeiras, chupetas, maternidade e itens para recem-nascido.",
      departmentSlug: "infantil",
      subcategorySlug: "cuidados",
      includeKeywords: ["bebe", "mamadeira", "chupeta", "maternidade", "recem nascido", "berco"],
      excludeKeywords: ["adulto", "pet"],
      examples: ["mamadeira de bebe", "kit maternidade"],
    },
    {
      slug: "infantil",
      label: "Infantil",
      description: "Produtos para criancas quando nao forem especificamente bebe.",
      departmentSlug: "infantil",
      subcategorySlug: "roupas",
      includeKeywords: ["infantil", "crianca", "menino", "menina", "brinquedo"],
      excludeKeywords: ["adulto", "pet"],
      examples: ["roupa infantil", "item para crianca"],
    },
    {
      slug: "decoracao",
      label: "Decoracao",
      description: "Almofadas, quadros, tapetes, vasos e luminarias decorativas.",
      departmentSlug: "casa",
      subcategorySlug: "organizacao",
      includeKeywords: ["almofada", "quadro", "tapete", "vela", "vaso", "luminaria decorativa"],
      excludeKeywords: ["cozinha", "automotivo"],
      examples: ["tapete decorativo", "vaso decorativo"],
    },
    {
      slug: "organizacao",
      label: "Organizacao",
      description: "Organizadores, caixas, gavetas, closets, cabides e prateleiras.",
      departmentSlug: "casa",
      subcategorySlug: "organizacao",
      includeKeywords: ["organizador", "caixa", "gaveta", "closet", "cabide", "prateleira"],
      excludeKeywords: ["automotivo", "pet"],
      examples: ["organizador de gaveta", "caixa organizadora"],
    },
    {
      slug: "utilidades-domesticas",
      label: "Utilidades domesticas",
      description: "Itens praticos de casa que nao se encaixam em decoracao ou organizacao.",
      departmentSlug: "casa",
      subcategorySlug: "organizacao",
      includeKeywords: ["utilidade", "limpeza", "banheiro", "lavanderia", "multiuso"],
      excludeKeywords: ["cozinha", "automotivo"],
      examples: ["item multiuso para casa", "utilidade para lavanderia"],
    },
    {
      slug: "utensilios-de-cozinha",
      label: "Utensilios de cozinha",
      description: "Panelas, potes, formas, cortadores, talheres e itens manuais.",
      departmentSlug: "cozinha",
      subcategorySlug: "utensilios",
      includeKeywords: ["panela", "pote", "forma", "cortador", "talher", "utensilio"],
      excludeKeywords: ["air fryer", "liquidificador", "cafeteira"],
      examples: ["pote hermetico", "cortador de legumes"],
    },
    {
      slug: "eletroportateis",
      label: "Eletroportateis",
      description: "Air fryer, cafeteiras, liquidificadores, mixers e eletros compactos.",
      departmentSlug: "cozinha",
      subcategorySlug: "eletroportateis",
      includeKeywords: ["air fryer", "cafeteira", "liquidificador", "mixer", "grill", "chaleira"],
      excludeKeywords: ["pote", "talher", "forma"],
      examples: ["air fryer", "liquidificador compacto"],
    },
    {
      slug: "audio",
      label: "Audio",
      description: "Fones, headsets, caixas de som, earbuds e microfones.",
      departmentSlug: "tech",
      subcategorySlug: "audio",
      includeKeywords: ["fone", "headset", "caixa de som", "earbud", "microfone"],
      excludeKeywords: ["mouse gamer", "teclado gamer", "monitor"],
      examples: ["fone bluetooth", "caixa de som portatil"],
    },
    {
      slug: "eletronicos",
      label: "Eletronicos",
      description: "Acessorios e gadgets eletronicos gerais.",
      departmentSlug: "tech",
      subcategorySlug: "audio",
      includeKeywords: ["eletronico", "carregador", "cabo", "adaptador", "smart"],
      excludeKeywords: ["fone", "headset", "mouse gamer", "teclado gamer"],
      examples: ["carregador rapido", "adaptador usb"],
    },
    {
      slug: "games-e-pc",
      label: "Games e PC",
      description: "Perifericos gamer, monitores, consoles e acessorios de setup.",
      departmentSlug: "tech",
      subcategorySlug: "gaming",
      includeKeywords: ["mouse gamer", "teclado gamer", "monitor", "console", "controle", "cadeira gamer"],
      excludeKeywords: ["fone", "caixa de som"],
      examples: ["mouse gamer", "controle para console"],
    },
    {
      slug: "fitness",
      label: "Fitness",
      description: "Itens para academia, treino, yoga, pilates e exercicios.",
      departmentSlug: "esportes",
      subcategorySlug: "cuidados",
      includeKeywords: ["halter", "elastico", "yoga", "pilates", "academia", "treino"],
      excludeKeywords: ["pet", "automotivo"],
      examples: ["elastico de treino", "halter para academia"],
    },
    {
      slug: "esportes-ao-ar-livre",
      label: "Esportes ao ar livre",
      description: "Itens esportivos externos, aventura e lazer ativo.",
      departmentSlug: "esportes",
      subcategorySlug: "cuidados",
      includeKeywords: ["esporte", "bike", "corrida", "trilha", "camping", "ao ar livre"],
      excludeKeywords: ["academia", "yoga", "pilates"],
      examples: ["acessorio para bike", "item para camping"],
    },
    {
      slug: "pets",
      label: "Pets",
      description: "Produtos para cachorro, gato e rotina de animais de estimacao.",
      departmentSlug: "pet",
      subcategorySlug: "cuidados",
      includeKeywords: ["pet", "cachorro", "gato", "coleira", "comedouro", "brinquedo pet"],
      excludeKeywords: ["bebe", "infantil"],
      examples: ["comedouro para pet", "coleira para cachorro"],
    },
    {
      slug: "papelaria",
      label: "Papelaria",
      description: "Cadernos, canetas, materiais de estudo e escritorio.",
      departmentSlug: "mais",
      subcategorySlug: "papelaria",
      includeKeywords: ["caderno", "caneta", "lapis", "papelaria", "escritorio", "planner"],
      excludeKeywords: ["automotivo", "pet"],
      examples: ["planner semanal", "kit de canetas"],
    },
    {
      slug: "ferramentas",
      label: "Ferramentas",
      description: "Ferramentas, bricolagem, manutencao e reparos.",
      departmentSlug: "mais",
      subcategorySlug: "ferramentas",
      includeKeywords: ["ferramenta", "furadeira", "parafusadeira", "bricolagem", "reparo"],
      excludeKeywords: ["maquiagem", "pet"],
      examples: ["kit ferramentas", "parafusadeira"],
    },
    {
      slug: "automotivo",
      label: "Automotivo",
      description: "Acessorios e utilidades para carro, moto e manutencao automotiva.",
      departmentSlug: "mais",
      subcategorySlug: "automotivo",
      includeKeywords: ["carro", "moto", "automotivo", "veicular", "porta malas"],
      excludeKeywords: ["pet", "bebe"],
      examples: ["organizador automotivo", "acessorio para carro"],
    },
    {
      slug: "achadinhos-gerais",
      label: "Achadinhos gerais",
      description: "Fallback controlado para ofertas boas sem sinal forte de outra folha.",
      departmentSlug: "mais",
      subcategorySlug: "automotivo",
      includeKeywords: ["achadinho", "oferta", "utilidade", "promocao"],
      excludeKeywords: [],
      examples: ["achadinho util", "oferta geral"],
    },
  ],
} as const satisfies AffiliateTaxonomy;

export const legacyCategoryDestinations = [
  {
    category: "Casa & Decoracao",
    baseDepartmentSlug: "casa",
    candidateLeafSlugs: ["decoracao", "organizacao", "utilidades-domesticas"],
    reviewRequired: false,
    note: "Dividir por titulo entre decoracao, organizacao e utilidades.",
  },
  {
    category: "Cozinha & Eletro",
    baseDepartmentSlug: "cozinha",
    candidateLeafSlugs: ["utensilios-de-cozinha", "eletroportateis"],
    reviewRequired: false,
    note: "Dividir por titulo entre utensilios e eletroportateis.",
  },
  {
    category: "Ferramentas & Bricolagem",
    baseDepartmentSlug: "mais",
    candidateLeafSlugs: ["ferramentas"],
    reviewRequired: false,
    note: "Cair em ferramentas.",
  },
  {
    category: "Eletronicos",
    baseDepartmentSlug: "tech",
    candidateLeafSlugs: ["audio", "eletronicos", "games-e-pc"],
    reviewRequired: false,
    note: "Dividir por titulo entre audio, eletronicos e games-e-pc.",
  },
  {
    category: "Moda & Beleza",
    baseDepartmentSlug: "beleza",
    candidateLeafSlugs: [
      "roupas-masculinas",
      "calcados-masculinos",
      "acessorios-masculinos",
      "roupas-femininas",
      "calcados-femininos",
      "acessorios-femininos",
      "beleza-e-cuidados",
    ],
    reviewRequired: true,
    note: "Segregar por genero ou beleza; ambiguos vao para revisao.",
  },
  {
    category: "Esportes & Academia",
    baseDepartmentSlug: "esportes",
    candidateLeafSlugs: ["fitness", "esportes-ao-ar-livre"],
    reviewRequired: false,
    note: "Dividir por titulo entre fitness e esportes ao ar livre.",
  },
  {
    category: "Bebe & Infantil",
    baseDepartmentSlug: "infantil",
    candidateLeafSlugs: ["bebe", "infantil"],
    reviewRequired: false,
    note: "Dividir por titulo entre bebe e infantil.",
  },
  {
    category: "Pet Shop",
    baseDepartmentSlug: "pet",
    candidateLeafSlugs: ["pets"],
    reviewRequired: false,
    note: "Cair em pets.",
  },
  {
    category: "Livros & Papelaria",
    baseDepartmentSlug: "mais",
    candidateLeafSlugs: ["papelaria"],
    reviewRequired: false,
    note: "Cair em papelaria.",
  },
  {
    category: "Automotivos",
    baseDepartmentSlug: "mais",
    candidateLeafSlugs: ["automotivo"],
    reviewRequired: false,
    note: "Cair em automotivo.",
  },
  {
    category: "Achadinhos Gerais",
    baseDepartmentSlug: "mais",
    candidateLeafSlugs: ["achadinhos-gerais"],
    reviewRequired: true,
    note: "Usar regra forte quando existir; fallback controlado em achadinhos-gerais.",
  },
] as const satisfies readonly LegacyCategoryDestination[];

const departmentSlugSet: ReadonlySet<string> = new Set(affiliateDepartmentSlugs);
const subcategorySlugSet: ReadonlySet<string> = new Set(affiliateSubcategorySlugs);
const leafSlugSet: ReadonlySet<string> = new Set(affiliateLeafSlugs);

export function listDepartments(): readonly DepartmentDefinition[] {
  return affiliateTaxonomy.departments;
}

export function listSubcategories(): readonly SubcategoryDefinition[] {
  return affiliateTaxonomy.subcategories;
}

export function listLeaves(): readonly LeafDefinition[] {
  return affiliateTaxonomy.leaves;
}

export function isDepartmentSlug(value: unknown): value is DepartmentSlug {
  return typeof value === "string" && departmentSlugSet.has(value);
}

export function isSubcategorySlug(value: unknown): value is SubcategorySlug {
  return typeof value === "string" && subcategorySlugSet.has(value);
}

export function isLeafSlug(value: unknown): value is LeafSlug {
  return typeof value === "string" && leafSlugSet.has(value);
}

export function findLeafBySlug(value: unknown): LeafDefinition | null {
  if (!isLeafSlug(value)) {
    return null;
  }

  const leaf = affiliateTaxonomy.leaves.find((candidate) => candidate.slug === value);
  return leaf ?? null;
}

export function getLeafBySlug(slug: LeafSlug): LeafDefinition {
  const leaf = findLeafBySlug(slug);

  if (leaf === null) {
    throw new Error(`Unknown affiliate leaf slug: ${slug}`);
  }

  return leaf;
}

export function isDepartmentLeafPair(
  departmentSlug: unknown,
  leafSlug: unknown,
): departmentSlug is DepartmentSlug {
  const leaf = findLeafBySlug(leafSlug);

  return isDepartmentSlug(departmentSlug) && leaf !== null && leaf.departmentSlug === departmentSlug;
}
