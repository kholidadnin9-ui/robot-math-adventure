export interface LevelMathSpec {
  levelId: number;
  name: string;
  focusFactors: readonly number[];
  secondaryFactors: readonly number[];
  questionsCount: number;
}

/**
 * Level curriculum specifications strictly following PRD Bab 7:
 * - Level 1 — Kota Robot: fokus perkalian 1, 2, dan 3.
 * - Level 2 — Hutan Energi: fokus perkalian 2, 3, 4, dan 5.
 * - Level 3 — Terowongan Angka: fokus perkalian 4, 5, 6, dan 7.
 * - Level 4 — Kota Teknologi: fokus perkalian 6, 7, 8, dan 9.
 * - Level 5 — Galaksi Robot: campuran perkalian 1–10.
 */
export const LEVEL_MATH_SPECS: readonly LevelMathSpec[] = [
  {
    levelId: 1,
    name: 'Kota Robot',
    focusFactors: [1, 2, 3],
    secondaryFactors: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    questionsCount: 10,
  },
  {
    levelId: 2,
    name: 'Hutan Energi',
    focusFactors: [2, 3, 4, 5],
    secondaryFactors: [2, 3, 4, 5, 6, 7, 8, 9, 10],
    questionsCount: 10,
  },
  {
    levelId: 3,
    name: 'Terowongan Angka',
    focusFactors: [4, 5, 6, 7],
    secondaryFactors: [2, 3, 4, 5, 6, 7, 8, 9, 10],
    questionsCount: 10,
  },
  {
    levelId: 4,
    name: 'Kota Teknologi',
    focusFactors: [6, 7, 8, 9],
    secondaryFactors: [2, 3, 4, 5, 6, 7, 8, 9, 10],
    questionsCount: 10,
  },
  {
    levelId: 5,
    name: 'Galaksi Robot',
    focusFactors: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    secondaryFactors: [2, 3, 4, 5, 6, 7, 8, 9, 10],
    questionsCount: 10,
  },
];

export function getLevelMathSpec(levelId: number): LevelMathSpec {
  return (
    LEVEL_MATH_SPECS.find((spec) => spec.levelId === levelId) ??
    LEVEL_MATH_SPECS[0]
  );
}
