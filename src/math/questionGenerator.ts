import { LaneIndex, MultiplicationQuestion } from '../game/types';
import { getLevelMathSpec } from './questionBank';
import { validateLevelQuestions, validateQuestion } from './validators';

/**
 * Unbiased Fisher–Yates shuffle (DEVELOPMENT_PLAN Bab 6:
 * "Hindari sort(() => Math.random() - 0.5). Gunakan Fisher–Yates shuffle.")
 */
export function fisherYatesShuffle<T>(items: readonly T[], rng: () => number = Math.random): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}

/**
 * Generates two plausible wrong options (distractors) that are positive integers,
 * distinct from each other and from the correct answer.
 */
export function generateDistractors(
  a: number,
  b: number,
  answer: number,
  rng: () => number = Math.random,
): [number, number] {
  const candidates: number[] = [
    a * (b + 1),
    a * Math.max(1, b - 1),
    (a + 1) * b,
    Math.max(1, a - 1) * b,
    answer + 2,
    answer - 2,
    answer + a,
    answer - a,
    answer + b,
    answer + 1,
    answer - 1,
    answer + 3,
    answer + 4,
    answer + 5,
  ];

  // Filter valid positive integers distinct from answer
  const validPool: number[] = [];
  const seen = new Set<number>([answer]);

  for (const val of candidates) {
    if (Number.isInteger(val) && val >= 1 && val <= 110 && !seen.has(val)) {
      seen.add(val);
      validPool.push(val);
    }
  }

  const shuffled = fisherYatesShuffle(validPool, rng);

  // Fallback guarantee if pool has fewer than 2 items
  let d1 = shuffled[0] ?? answer + 1;
  let d2 = shuffled[1] ?? answer + 2;
  if (d1 === answer) d1 = answer + 1;
  if (d2 === answer || d2 === d1) d2 = d1 + 1 === answer ? d1 + 2 : d1 + 1;

  return [d1, d2];
}

export function createMultiplicationQuestion(
  a: number,
  b: number,
  id = `Q-${a}x${b}`,
  rng: () => number = Math.random,
): MultiplicationQuestion {
  const clampedA = Math.min(10, Math.max(1, Math.round(a)));
  const clampedB = Math.min(10, Math.max(1, Math.round(b)));
  const answer = clampedA * clampedB;

  const [wrong1, wrong2] = generateDistractors(clampedA, clampedB, answer, rng);
  const shuffledOptions = fisherYatesShuffle([answer, wrong1, wrong2], rng) as [
    number,
    number,
    number,
  ];
  const correctIndex = shuffledOptions.indexOf(answer) as LaneIndex;

  const question: MultiplicationQuestion = {
    id,
    a: clampedA,
    b: clampedB,
    answer,
    options: shuffledOptions,
    correctIndex,
    explanation: `${clampedA} × ${clampedB} = ${answer} (${clampedA} kelompok berisi ${clampedB} sama dengan ${answer}).`,
  };

  const check = validateQuestion(question);
  if (!check.valid) {
    // Deterministic safe fallback
    const fallbackOptions: [number, number, number] = [answer, answer + 1, answer + 2];
    return {
      id,
      a: clampedA,
      b: clampedB,
      answer,
      options: fallbackOptions,
      correctIndex: 0,
      explanation: `${clampedA} × ${clampedB} = ${answer}.`,
    };
  }

  return question;
}

/**
 * Generates a validated set of 10 unique multiplication questions for a given level.
 * Avoids identical or commutative-reversed pairs within the same level.
 */
export function generateLevelQuestions(
  levelId: number,
  rng: () => number = Math.random,
): MultiplicationQuestion[] {
  const spec = getLevelMathSpec(levelId);
  const candidatePairs: Array<[number, number]> = [];
  const seenCanonical = new Set<string>();

  for (const f1 of spec.focusFactors) {
    for (const f2 of spec.secondaryFactors) {
      const minF = Math.min(f1, f2);
      const maxF = Math.max(f1, f2);
      const key = `${minF}x${maxF}`;
      if (!seenCanonical.has(key)) {
        seenCanonical.add(key);
        // Randomly orient (f1, f2) or (f2, f1) while keeping canonical uniqueness
        const swap = rng() < 0.5;
        candidatePairs.push(swap ? [f2, f1] : [f1, f2]);
      }
    }
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const shuffledPairs = fisherYatesShuffle(candidatePairs, rng);
    const selectedPairs = shuffledPairs.slice(0, spec.questionsCount);

    const questions = selectedPairs.map(([a, b], index) =>
      createMultiplicationQuestion(
        a,
        b,
        `L${spec.levelId}-Q${String(index + 1).padStart(2, '0')}`,
        rng,
      ),
    );

    const validation = validateLevelQuestions(questions, spec.questionsCount);
    if (validation.valid) {
      return questions;
    }
  }

  // Tested deterministic fallback if random attempts ever fail
  const fallbackPairs: Array<[number, number]> = [
    [spec.focusFactors[0] ?? 2, 1],
    [spec.focusFactors[0] ?? 2, 2],
    [spec.focusFactors[0] ?? 2, 3],
    [spec.focusFactors[0] ?? 2, 4],
    [spec.focusFactors[0] ?? 2, 5],
    [spec.focusFactors[0] ?? 2, 6],
    [spec.focusFactors[0] ?? 2, 7],
    [spec.focusFactors[0] ?? 2, 8],
    [spec.focusFactors[0] ?? 2, 9],
    [spec.focusFactors[0] ?? 2, 10],
  ];

  return fallbackPairs.map(([a, b], idx) =>
    createMultiplicationQuestion(
      a,
      b,
      `L${spec.levelId}-Q${String(idx + 1).padStart(2, '0')}`,
      rng,
    ),
  );
}
