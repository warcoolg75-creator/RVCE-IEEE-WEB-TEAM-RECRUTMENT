import type { CampusEvent } from "@/types";

/**
 * Branch-to-event relevance scoring for the "Recommended for your branch"
 * feature (used by both the Feed and the Calendar).
 *
 * Every event is scored against the selected branch by scanning its name,
 * tags, description, category and club for keyword matches, with per-field
 * weights (see `computeScore`). Universal events (placements, fests, generic
 * workshops, …) always get a baseline boost so they stay relevant to everyone.
 *
 * Matching is case-insensitive and uses word-boundary regexes so partial stems
 * work ("robot" → "robotics") without short acronyms ("ai", "ev") matching
 * unrelated words ("available", "event"). Results are cached per branch.
 */

export const BRANCHES: string[] = [
  "Aerospace Engineering",
  "Artificial Intelligence and Machine Learning",
  "Biotechnology",
  "Chemical Engineering",
  "Civil Engineering",
  "Computer Science and Engineering",
  "CSE (Artificial Intelligence & Machine Learning)",
  "CSE (Cyber Security)",
  "CSE (Data Science)",
  "Electrical and Electronics Engineering",
  "Electronics and Communication Engineering",
  "Electronics and Instrumentation Engineering",
  "Industrial Engineering and Management",
  "Information Science and Engineering",
  "Mechanical Engineering",
  "Electronics and Telecommunication Engineering",
];

/** Cards at or above this score get the "Recommended" badge. */
export const RECOMMEND_THRESHOLD = 3;

/** Emoji per branch (for the onboarding / profile branch selector). */
export const BRANCH_EMOJI: Record<string, string> = {
  "Aerospace Engineering": "✈️",
  "Artificial Intelligence and Machine Learning": "🤖",
  Biotechnology: "🧬",
  "Chemical Engineering": "⚗️",
  "Civil Engineering": "🏗️",
  "Computer Science and Engineering": "💻",
  "CSE (Artificial Intelligence & Machine Learning)": "🧠",
  "CSE (Cyber Security)": "🔒",
  "CSE (Data Science)": "📊",
  "Electrical and Electronics Engineering": "⚡",
  "Electronics and Communication Engineering": "📡",
  "Electronics and Instrumentation Engineering": "🔧",
  "Industrial Engineering and Management": "📈",
  "Information Science and Engineering": "🖥️",
  "Mechanical Engineering": "⚙️",
  "Electronics and Telecommunication Engineering": "📶",
};

const UNIVERSAL = [
  "placement", "career fair", "internship", "resume", "interview", "soft skills",
  "communication", "cultural fest", "sports", "annual fest", "techfest", "workshop",
  "seminar", "orientation", "guest lecture", "leadership", "personality development",
  "photography", "music", "dance", "debate", "quiz", "mun", "tedx", "ieee", "acm",
];

const CSE_GROUP = [
  "coding", "hackathon", "programming", "software", "web dev", "web development",
  "frontend", "backend", "fullstack", "app dev", "api", "algorithm", "dsa",
  "data structure", "competitive programming", "open source", "git", "github",
  "devops", "cloud", "aws", "docker", "kubernetes", "database", "sql", "javascript",
  "python", "java", "react", "node", "machine learning", "deep learning", "neural",
  "nlp", "computer vision", "llm", "gpt", "ai", "artificial intelligence",
  "data science", "analytics", "big data", "cybersecurity", "ctf",
  "capture the flag", "ethical hacking", "penetration testing", "encryption",
  "network security", "blockchain", "crypto",
];

const ECE_GROUP = [
  "circuit", "embedded", "iot", "internet of things", "vlsi", "signal processing",
  "communication", "antenna", "microcontroller", "arduino", "esp32", "raspberry pi",
  "pcb", "semiconductor", "rf", "wireless", "5g", "sensor", "instrumentation",
  "control system", "plc", "scada", "automation", "telemetry", "telecommunications",
];

const MECH = [
  "cad", "solidworks", "fusion 360", "catia", "3d printing", "additive manufacturing",
  "robotics", "manufacturing", "cnc", "machining", "thermodynamics", "fluid mechanics",
  "heat transfer", "automotive", "baja", "sae", "formula student", "ic engine",
  "turbine", "hvac", "material science", "fea", "cfd", "simulation", "drone", "uav",
  "mechatronics",
];

const AERO = [
  "aerospace", "aero", "flight", "propulsion", "aerodynamics", "space", "satellite",
  "rocket", "drone", "uav", "avionics", "wind tunnel", "cfd", "orbital", "isro",
  "nasa", "aircraft",
];

const CIVIL = [
  "structural", "construction", "concrete", "surveying", "geotechnical",
  "environmental engineering", "water resources", "transportation", "bridge",
  "building", "earthquake", "seismic", "gis", "urban planning", "smart city",
  "sustainability",
];

const EEE = [
  "power system", "electrical", "energy", "transformer", "grid", "renewable energy",
  "solar", "wind energy", "motor", "generator", "power electronics", "smart grid",
  "ev", "electric vehicle", "battery", "circuit",
];

const CHEM = [
  "chemical", "process engineering", "reaction", "pharma", "pharmaceutical",
  "polymer", "catalysis", "refinery", "petrochemical", "distillation", "membrane",
  "nanotechnology",
];

const BIO = [
  "bio", "biotechnology", "genetics", "genomics", "pharmaceutical", "life science",
  "microbiology", "bioinformatics", "cell biology", "molecular", "enzyme",
  "fermentation", "biomedical", "drug discovery",
];

const IEM = [
  "management", "operations research", "supply chain", "lean manufacturing",
  "six sigma", "quality", "industrial engineering", "production", "logistics",
  "project management", "erp", "business analytics", "optimization", "ergonomics",
  "startup", "entrepreneurship",
];

const CYBER_EXTRA = [
  "cybersecurity", "ctf", "capture the flag", "ethical hacking", "penetration testing",
  "encryption", "network security", "forensics", "malware", "firewall",
];
const DS_EXTRA = [
  "data science", "analytics", "big data", "statistics", "visualization", "pandas",
  "r programming", "tableau", "power bi", "etl", "data pipeline",
];
const ML_EXTRA = [
  "machine learning", "deep learning", "neural network", "nlp", "computer vision",
  "llm", "gpt", "reinforcement learning", "tensorflow", "pytorch",
];
const EIE_EXTRA = [
  "instrumentation", "control system", "plc", "scada", "automation", "sensor",
  "calibration", "process control",
];
const ETE_EXTRA = [
  "telecommunications", "5g", "wireless", "antenna", "rf", "spectrum", "satellite",
  "optical fiber",
];

const BASE: Record<string, string[]> = {
  "Aerospace Engineering": AERO,
  "Artificial Intelligence and Machine Learning": CSE_GROUP,
  Biotechnology: BIO,
  "Chemical Engineering": CHEM,
  "Civil Engineering": CIVIL,
  "Computer Science and Engineering": CSE_GROUP,
  "CSE (Artificial Intelligence & Machine Learning)": CSE_GROUP,
  "CSE (Cyber Security)": CSE_GROUP,
  "CSE (Data Science)": CSE_GROUP,
  "Electrical and Electronics Engineering": EEE,
  "Electronics and Communication Engineering": ECE_GROUP,
  "Electronics and Instrumentation Engineering": ECE_GROUP,
  "Industrial Engineering and Management": IEM,
  "Information Science and Engineering": CSE_GROUP,
  "Mechanical Engineering": MECH,
  "Electronics and Telecommunication Engineering": ECE_GROUP,
};

const EXTRA: Record<string, string[]> = {
  "Artificial Intelligence and Machine Learning": ML_EXTRA,
  "CSE (Artificial Intelligence & Machine Learning)": ML_EXTRA,
  "CSE (Cyber Security)": CYBER_EXTRA,
  "CSE (Data Science)": DS_EXTRA,
  "Electronics and Instrumentation Engineering": EIE_EXTRA,
  "Electronics and Telecommunication Engineering": ETE_EXTRA,
};

/* -------------------------------------------------------------------------- */
/*  Keyword → regex compilation                                               */
/* -------------------------------------------------------------------------- */

// 3+ char keywords that must match as a whole word (else they hit common words
// like "feature"/"municipal"). Sub-3-char keywords are always whole-word.
const EXACT = new Set(["fea", "mun"]);

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function makeRe(keyword: string): RegExp {
  const k = keyword.toLowerCase();
  const wholeWord = k.length <= 2 || EXACT.has(k);
  // Leading boundary always; trailing boundary only for short/ambiguous tokens
  // so longer stems still match suffixes ("robot" → "robotics").
  return new RegExp(`\\b${escapeRe(k)}${wholeWord ? "\\b" : ""}`);
}

const UNIVERSAL_RES = UNIVERSAL.map(makeRe);

interface Compiled {
  base: RegExp[];
  extra: RegExp[];
}
const compiledCache = new Map<string, Compiled>();

function getCompiled(branch: string): Compiled {
  let c = compiledCache.get(branch);
  if (!c) {
    c = {
      base: (BASE[branch] ?? []).map(makeRe),
      extra: (EXTRA[branch] ?? []).map(makeRe),
    };
    compiledCache.set(branch, c);
  }
  return c;
}

/* -------------------------------------------------------------------------- */
/*  Scoring (cached per branch)                                               */
/* -------------------------------------------------------------------------- */

const scoreCache = new Map<string, WeakMap<CampusEvent, number>>();

/** Relevance score of an event for a branch. 0 when no branch is selected. */
export function scoreEvent(event: CampusEvent, branch: string): number {
  if (!branch) return 0;
  let wm = scoreCache.get(branch);
  if (!wm) {
    wm = new WeakMap();
    scoreCache.set(branch, wm);
  }
  const cached = wm.get(event);
  if (cached !== undefined) return cached;
  const score = computeScore(event, branch);
  wm.set(event, score);
  return score;
}

function computeScore(e: CampusEvent, branch: string): number {
  const name = e.title.toLowerCase();
  const tags = e.tags.join(" ").toLowerCase();
  const desc = e.description.toLowerCase();
  const cat = e.category.toLowerCase();
  const club = e.organizer.toLowerCase();
  const hay = `${name} ${tags} ${desc} ${cat} ${club}`;

  let score = 0;

  // Universal events always float to the top.
  if (UNIVERSAL_RES.some((re) => re.test(hay))) score += 5;

  const { base, extra } = getCompiled(branch);
  for (const re of base) {
    if (re.test(name)) score += 3;
    if (re.test(tags)) score += 2;
    if (re.test(desc)) score += 1;
    if (re.test(cat)) score += 2;
    if (re.test(club)) score += 1;
  }

  // Sub-branch boosts.
  for (const re of extra) {
    if (re.test(hay)) score += 2;
  }

  return score;
}

/** Whether an event is relevant to the branch (any positive score). */
export function isRelevantToBranch(event: CampusEvent, branch: string): boolean {
  if (!branch) return true;
  return scoreEvent(event, branch) > 0;
}

/** Is this score high enough to surface a "Recommended" badge? */
export function isRecommended(event: CampusEvent, branch: string): boolean {
  return branch !== "" && scoreEvent(event, branch) >= RECOMMEND_THRESHOLD;
}
