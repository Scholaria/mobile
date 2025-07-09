// arXiv category code to readable name mapping
export const categoryMapping: Record<string, string> = {
  // Computer Science
  "cs.AI": "Artificial Intelligence",
  "cs.AR": "Hardware Architecture",
  "cs.CE": "Computational Engineering, Finance, and Science",
  "cs.CL": "Computation and Language",
  "cs.CR": "Cryptography and Security",
  "cs.CV": "Computer Vision and Pattern Recognition",
  "cs.CY": "Computers and Society",
  "cs.DB": "Databases",
  "cs.DC": "Distributed, Parallel, and Cluster Computing",
  "cs.DS": "Data Structures and Algorithms",
  "cs.ET": "Emerging Technologies",
  "cs.GR": "Graphics",
  "cs.HC": "Human-Computer Interaction",
  "cs.IR": "Information Retrieval",
  "cs.IT": "Information Theory",
  "cs.LG": "Machine Learning",
  "cs.MA": "Multiagent Systems",
  "cs.MM": "Multimedia",
  "cs.NE": "Neural and Evolutionary Computing",
  "cs.NI": "Networking and Internet Architecture",
  "cs.PF": "Performance",
  "cs.PL": "Programming Languages",
  "cs.RO": "Robotics",
  "cs.SD": "Sound",
  "cs.SE": "Software Engineering",
  "cs.SI": "Social and Information Networks",

  // Mathematics
  "math.AP": "Analysis of PDEs",
  "math.CO": "Combinatorics",
  "math.DG": "Differential Geometry",
  "math.NA": "Numerical Analysis",
  "math.OC": "Optimization and Control",
  "math.PR": "Probability",
  "math.QA": "Quantum Algebra",
  "math.SP": "Spectral Theory",
  "math.ST": "Statistics Theory",

  // Statistics
  "stat.AP": "Applications",
  "stat.CO": "Computation",
  "stat.ME": "Methodology",
  "stat.ML": "Machine Learning",

  // Physics
  "physics.acc-ph": "Accelerator Physics",
  "physics.ao-ph": "Atmospheric and Oceanic Physics",
  "physics.app-ph": "Applied Physics",
  "physics.atom-ph": "Atomic Physics",
  "physics.bio-ph": "Biological Physics",
  "physics.chem-ph": "Chemical Physics",
  "physics.comp-ph": "Computational Physics",
  "physics.flu-dyn": "Fluid Dynamics",
  "physics.gen-ph": "General Physics",
  "physics.geo-ph": "Geophysics",
  "physics.ins-det": "Instrumentation and Detectors",
  "physics.med-ph": "Medical Physics",
  "physics.optics": "Optics",
  "physics.plasm-ph": "Plasma Physics",
  "physics.soc-ph": "Physics and Society",

  // Astrophysics
  "astro-ph.CO": "Cosmology and Nongalactic Astrophysics",
  "astro-ph.EP": "Earth and Planetary Astrophysics",
  "astro-ph.GA": "Galaxy Astrophysics",
  "astro-ph.HE": "High Energy Astrophysical Phenomena",
  "astro-ph.IM": "Instrumentation and Methods for Astrophysics",
  "astro-ph.SR": "Solar and Stellar Astrophysics",

  // Condensed Matter
  "cond-mat.mes-hall": "Mesoscale and Nanoscale Physics",
  "cond-mat.mtrl-sci": "Materials Science",
  "cond-mat.soft": "Soft Condensed Matter",
  "cond-mat.stat-mech": "Statistical Mechanics",
  "cond-mat.str-el": "Strongly Correlated Electrons",
  "cond-mat.supr-con": "Superconductivity",

  // Economics
  "econ.TH": "Theoretical Economics",

  // Electrical Engineering and Systems Science
  "eess.AS": "Audio and Speech Processing",
  "eess.IV": "Image and Video Processing",
  "eess.SP": "Signal Processing",
  "eess.SY": "Systems and Control",

  // General Relativity and Quantum Cosmology
  "gr-qc": "General Relativity and Quantum Cosmology",

  // High Energy Physics
  "hep-ex": "High Energy Physics - Experiment",
  "hep-ph": "High Energy Physics - Phenomenology",
  "hep-th": "High Energy Physics - Theory",

  // Nonlinear Sciences
  "nlin.CD": "Chaotic Dynamics",

  // Nuclear Theory
  "nucl-th": "Nuclear Theory",

  // Quantitative Biology
  "q-bio.BM": "Biomolecules",
  "q-bio.MN": "Molecular Networks",
  "q-bio.NC": "Neurons and Cognition",
  "q-bio.QM": "Quantitative Methods",
  "q-bio.TO": "Tissues and Organs",

  // Quantitative Finance
  "q-fin.CP": "Computational Finance",
  "q-fin.GN": "General Finance",
  "q-fin.PM": "Portfolio Management",
  "q-fin.TR": "Trading and Market Microstructure",

  // Quantum Physics
  "quant-ph": "Quantum Physics",
};

/**
 * Convert arXiv category code to readable name
 * @param categoryCode - The arXiv category code (e.g., "cs.AI")
 * @returns The readable name (e.g., "Artificial Intelligence") or the original code if not found
 */
export function getCategoryDisplayName(categoryCode: string): string {
  return categoryMapping[categoryCode] || categoryCode;
}

/**
 * Convert readable category name back to arXiv code
 * @param displayName - The readable category name (e.g., "Artificial Intelligence")
 * @returns The arXiv category code (e.g., "cs.AI") or the original name if not found
 */
export function getCategoryCode(displayName: string): string {
  const entry = Object.entries(categoryMapping).find(
    ([_, name]) => name === displayName
  );
  return entry ? entry[0] : displayName;
}

/**
 * Get all available category codes
 * @returns Array of all available arXiv category codes
 */
export function getAllCategoryCodes(): string[] {
  return Object.keys(categoryMapping);
}

/**
 * Get all available category display names
 * @returns Array of all available readable category names
 */
export function getAllCategoryDisplayNames(): string[] {
  return Object.values(categoryMapping);
} 