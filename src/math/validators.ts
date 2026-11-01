import { MultiplicationQuestion } from '../game/types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates a single multiplication question according to PRD Bab 8 & TEST_PLAN Bab 4:
 * - Factors a and b are integers in range 1..10
 * - answer === a * b
 * - options has length 3, all finite integers, all unique
 * - Exactly 1 option equals answer
 * - correctIndex (0, 1, or 2) points to the option equal to answer
 */
export function validateQuestion(q: MultiplicationQuestion): ValidationResult {
  const errors: string[] = [];

  if (!q || typeof q !== 'object') {
    return { valid: false, errors: ['Objek soal tidak valid.'] };
  }

  if (!Number.isInteger(q.a) || q.a < 1 || q.a > 10) {
    errors.push(`Faktor pertama (${q.a}) harus bilangan bulat 1–10.`);
  }

  if (!Number.isInteger(q.b) || q.b < 1 || q.b > 10) {
    errors.push(`Faktor kedua (${q.b}) harus bilangan bulat 1–10.`);
  }

  const expectedAnswer = q.a * q.b;
  if (q.answer !== expectedAnswer) {
    errors.push(`Jawaban (${q.answer}) tidak sama dengan hasil ${q.a} × ${q.b} (${expectedAnswer}).`);
  }

  if (!Array.isArray(q.options) || q.options.length !== 3) {
    errors.push('Soal harus memiliki tepat 3 opsi jawaban.');
  } else {
    const allPositiveInts = q.options.every((opt) => Number.isInteger(opt) && opt > 0);
    if (!allPositiveInts) {
      errors.push('Semua opsi harus bilangan bulat positif.');
    }

    const uniqueOptions = new Set(q.options);
    if (uniqueOptions.size !== 3) {
      errors.push(`Opsi jawaban harus unik, ditemukan duplikat: [${q.options.join(', ')}].`);
    }

    const correctMatches = q.options.filter((opt) => opt === expectedAnswer);
    if (correctMatches.length !== 1) {
      errors.push(
        `Harus ada tepat 1 opsi yang sama dengan jawaban benar (${expectedAnswer}), ditemukan ${correctMatches.length}.`,
      );
    }

    if (
      q.correctIndex !== 0 &&
      q.correctIndex !== 1 &&
      q.correctIndex !== 2
    ) {
      errors.push(`correctIndex (${q.correctIndex}) harus bernilai 0, 1, atau 2.`);
    } else if (q.options[q.correctIndex] !== expectedAnswer) {
      errors.push(
        `options[correctIndex] (${q.options[q.correctIndex]}) tidak menunjuk ke jawaban benar (${expectedAnswer}).`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a full level question set (PRD Bab 7 & 8):
 * - Exactly 10 questions per level
 * - Every question passes validateQuestion
 * - No identical factor pairs (a, b) or commutative reversed pairs (b, a) within the same level
 */
export function validateLevelQuestions(
  questions: MultiplicationQuestion[],
  expectedCount = 10,
): ValidationResult {
  const errors: string[] = [];

  if (!Array.isArray(questions) || questions.length !== expectedCount) {
    errors.push(
      `Level harus memiliki tepat ${expectedCount} soal, ditemukan ${questions?.length ?? 0}.`,
    );
    return { valid: false, errors };
  }

  const seenCanonicalPairs = new Set<string>();

  questions.forEach((q, idx) => {
    const qResult = validateQuestion(q);
    if (!qResult.valid) {
      errors.push(`Soal indeks ${idx} (${q.id}) tidak valid: ${qResult.errors.join(' ')}`);
    }

    const minF = Math.min(q.a, q.b);
    const maxF = Math.max(q.a, q.b);
    const canonicalKey = `${minF}x${maxF}`;

    if (seenCanonicalPairs.has(canonicalKey)) {
      errors.push(
        `Pasangan faktor duplikat atau terbalik ditemukan dalam satu level: ${q.a} × ${q.b}.`,
      );
    }
    seenCanonicalPairs.add(canonicalKey);
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
