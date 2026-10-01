/**
 * All photography in one place so it's easy to swap.
 * Every image is rendered through <SmartImage>, which falls back to a
 * palette gradient + icon if a URL ever fails to load.
 */

export type TopicCategory = "tech" | "science" | "finance" | "humanities" | "general";

export interface AppImage {
  src: string;
  alt: string;
}

const u = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const IMAGES = {
  hero: {
    notebook: { src: u("photo-1517842645767-c639042777db", 800), alt: "Open notebook beside a cup of coffee" },
    studying: { src: u("photo-1434030216411-0b793f4b4173", 800), alt: "Person writing notes at a desk" },
    plants: { src: u("photo-1466692476868-aef1dfb1e735", 600), alt: "Green leafy plants in soft light" },
  },
  banners: {
    tech: { src: u("photo-1555066931-4365d14bab8c"), alt: "Code on a laptop screen" },
    science: { src: u("photo-1532094349884-543bc11b234d"), alt: "Science lab glassware" },
    finance: { src: u("photo-1554224155-6726b3ff858f"), alt: "Calculator and financial notes" },
    humanities: { src: u("photo-1507842217343-583bb7270b66"), alt: "Shelves of books in a library" },
    general: { src: u("photo-1497633762265-9d179a990aa6"), alt: "Stack of books on a table" },
  } satisfies Record<TopicCategory, AppImage>,
  empty: { src: u("photo-1456513080510-7bf3a84b82f8", 600), alt: "Notebook and pencils ready for study" },
} as const;

const KEYWORDS: Record<Exclude<TopicCategory, "general">, string[]> = {
  tech: ["docker", "code", "api", "rest", "graphql", "recursion", "http", "algorithm", "javascript", "python", "java", "database", "sql", "cloud", "react", "git", "network", "ai", "machine learning", "software", "kubernetes", "linux", "program"],
  science: ["photosynthesis", "cell", "atom", "physics", "chemistry", "biology", "dna", "gravity", "quantum", "energy", "evolution", "climate", "molecule", "planet"],
  finance: ["interest", "finance", "money", "stock", "invest", "tax", "inflation", "budget", "economy", "bank", "loan", "market", "business", "crypto"],
  humanities: ["history", "war", "philosophy", "art", "literature", "religion", "empire", "revolution", "language", "culture", "apartheid", "democracy"],
};

/** Simple keyword matching: topic text -> banner category. */
export function categorize(topic: string): TopicCategory {
  const t = topic.toLowerCase();
  for (const [cat, words] of Object.entries(KEYWORDS) as [TopicCategory, string[]][]) {
    if (words.some((w) => new RegExp(`\\b${w}`).test(t))) return cat;
  }
  return "general";
}

export const CATEGORY_LABEL: Record<TopicCategory, string> = {
  tech: "Tech & code",
  science: "Science",
  finance: "Finance",
  humanities: "Humanities",
  general: "General",
};
