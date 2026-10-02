import studyPortrait from "@/assets/concept-coach-study.jpg";
import studyBooks from "@/assets/concept-coach-books.jpg";

/** All photography is bundled with the app so the learning UI never shows remote-image placeholders. */

export type TopicCategory = "tech" | "science" | "finance" | "humanities" | "general";

export interface AppImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export const IMAGES = {
  hero: {
    studying: {
      src: studyPortrait,
      alt: "Student writing notes beside a laptop at a sunlit desk",
      width: 1200,
      height: 1408,
    },
  },
  banners: {
    tech: { src: studyBooks, alt: "Study notes, books and a laptop on a desk", width: 1600, height: 912 },
    science: { src: studyBooks, alt: "Open study notebook and reference books", width: 1600, height: 912 },
    finance: { src: studyBooks, alt: "Study notes and books in warm natural light", width: 1600, height: 912 },
    humanities: { src: studyBooks, alt: "Open notebook beside stacked books", width: 1600, height: 912 },
    general: { src: studyBooks, alt: "Open notebook and books ready for study", width: 1600, height: 912 },
  } satisfies Record<TopicCategory, AppImage>,
  empty: { src: studyBooks, alt: "Open notebook and books ready for study", width: 1600, height: 912 },
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
