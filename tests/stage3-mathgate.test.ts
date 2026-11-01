import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { MathGate } from '../src/game/MathGate';
import { ROBOT_DEFAULT_Z } from '../src/game/Robot';
import { LANE_POSITIONS, LaneIndex } from '../src/game/types';
import {
  createMultiplicationQuestion,
  generateLevelQuestions,
} from '../src/math/questionGenerator';
import {
  validateLevelQuestions,
  validateQuestion,
} from '../src/math/validators';

describe('Tahap 3 & 4 — Objek 3D MathGate, Pemilihan Jalur, dan Validasi Soal Perkalian', () => {
  it('membangun objek 3D MathGate dengan papan soal perkalian dan 3 portal pilihan jawaban sesuai jalur', () => {
    const question = createMultiplicationQuestion(7, 2, 'L1-Q01');
    const gate = new MathGate(question, 2, -45);

    expect(gate.group).toBeInstanceOf(THREE.Group);
    expect(gate.getQuestionText()).toBe('7 × 2 = ?');
    expect(gate.getOptions()).toHaveLength(3);
    expect(new Set(gate.getOptions()).size).toBe(3);
    expect(gate.getOptions()).toContain(14);
    expect(gate.isResolved()).toBe(false);

    const childNames: string[] = [];
    gate.group.traverse((obj) => {
      if (obj.name) childNames.push(obj.name);
    });

    // Pastikan struktur 3D gerbang memiliki 4 pilar, papan soal atas, dan 3 portal jalur
    expect(childNames).toContain('QuestionBannerMesh');
    expect(childNames).toContain('GatePillar_0');
    expect(childNames).toContain('GatePillar_1');
    expect(childNames).toContain('GatePillar_2');
    expect(childNames).toContain('GatePillar_3');
    expect(childNames).toContain('LanePortal_0');
    expect(childNames).toContain('LanePortal_1');
    expect(childNames).toContain('LanePortal_2');
    expect(childNames).toContain('OptionSignMesh_0');
    expect(childNames).toContain('OptionSignMesh_1');
    expect(childNames).toContain('OptionSignMesh_2');

    // Periksa posisi X ketiga portal sesuai dengan LANE_POSITIONS [-2.4, 0, 2.4]
    const portal0 = gate.group.getObjectByName('LanePortal_0')!;
    const portal1 = gate.group.getObjectByName('LanePortal_1')!;
    const portal2 = gate.group.getObjectByName('LanePortal_2')!;
    expect(portal0.position.x).toBe(LANE_POSITIONS[0]);
    expect(portal1.position.x).toBe(LANE_POSITIONS[1]);
    expect(portal2.position.x).toBe(LANE_POSITIONS[2]);

    gate.dispose();
  });

  it('mengevaluasi jawaban berdasarkan jalur robot saat melewati gerbang tepat satu kali (mencegah trigger ganda T-009)', () => {
    const question = createMultiplicationQuestion(6, 4, 'L2-Q01');
    const correctLane = question.correctIndex;
    const gate = new MathGate(question, 4, ROBOT_DEFAULT_Z - 1.0);

    // Sebelum mencapai ROBOT_DEFAULT_Z (masih di Z = 3.0), belum terpicu
    expect(gate.checkTrigger(correctLane, ROBOT_DEFAULT_Z)).toBeNull();

    // Gerakkan gerbang melewati ROBOT_DEFAULT_Z (ke Z = 4.2) dengan robot berada di jalur benar
    const result1 = gate.update(0.1, 12, correctLane, ROBOT_DEFAULT_Z);
    expect(result1).not.toBeNull();
    expect(result1?.isCorrect).toBe(true);
    expect(result1?.selectedLane).toBe(correctLane);
    expect(result1?.selectedOption).toBe(24);
    expect(result1?.scoreDelta).toBe(100);
    expect(result1?.livesDelta).toBe(0);
    expect(gate.isResolved()).toBe(true);

    // Panggilan berikutnya pada gerbang yang sama TIDAK boleh memicu penilaian lagi (T-009)
    const result2 = gate.update(0.05, 12, correctLane, ROBOT_DEFAULT_Z);
    expect(result2).toBeNull();
    expect(gate.checkTrigger(correctLane, ROBOT_DEFAULT_Z)).toBeNull();

    gate.dispose();
  });

  it('mengurangi 1 nyawa dan mencatat jawaban benar ketika robot melewati gerbang pada jalur yang salah (T-008)', () => {
    const question = createMultiplicationQuestion(8, 3, 'L3-Q01');
    const wrongLane = ([0, 1, 2].find(
      (idx) => idx !== question.correctIndex,
    ) ?? 0) as LaneIndex;

    const gate = new MathGate(question, 3, ROBOT_DEFAULT_Z - 0.5);
    const result = gate.update(0.1, 10, wrongLane, ROBOT_DEFAULT_Z);

    expect(result).not.toBeNull();
    expect(result?.isCorrect).toBe(false);
    expect(result?.selectedLane).toBe(wrongLane);
    expect(result?.correctOption).toBe(24);
    expect(result?.scoreDelta).toBe(0);
    expect(result?.livesDelta).toBe(-1);

    gate.dispose();
  });

  it('menghasilkan tepat 10 soal valid per level dengan 3 opsi unik dan 1 jawaban benar untuk semua 5 level (T-003 s.d. T-006)', () => {
    for (let levelId = 1; levelId <= 5; levelId++) {
      const questions = generateLevelQuestions(levelId);
      const levelValidation = validateLevelQuestions(questions, 10);

      expect(levelValidation.valid).toBe(true);
      expect(levelValidation.errors).toEqual([]);
      expect(questions).toHaveLength(10);

      for (const q of questions) {
        const singleValidation = validateQuestion(q);
        expect(singleValidation.valid).toBe(true);
        expect(q.a).toBeGreaterThanOrEqual(1);
        expect(q.a).toBeLessThanOrEqual(10);
        expect(q.b).toBeGreaterThanOrEqual(1);
        expect(q.b).toBeLessThanOrEqual(10);
        expect(q.answer).toBe(q.a * q.b);
        expect(new Set(q.options).size).toBe(3);
        expect(q.options.filter((x) => x === q.answer)).toHaveLength(1);
        expect(q.options[q.correctIndex]).toBe(q.answer);
      }
    }
  });

  it('mengelola sistem partikel sparkles berbasis BufferGeometry saat robot menjawab benar atau melewati gerbang', async () => {
    const { SparkleParticleController, SPARKLE_PARTICLE_COUNT } = await import(
      '../src/game/SceneManager'
    );
    const sparkles = new SparkleParticleController(SPARKLE_PARTICLE_COUNT);

    expect(sparkles.geometry).toBeInstanceOf(THREE.BufferGeometry);
    expect(sparkles.points).toBeInstanceOf(THREE.Points);
    expect(sparkles.isActive()).toBe(false);
    expect(sparkles.points.visible).toBe(false);

    const posAttr = sparkles.geometry.getAttribute('position');
    const colAttr = sparkles.geometry.getAttribute('color');
    expect(posAttr.count).toBe(SPARKLE_PARTICLE_COUNT);
    expect(colAttr.count).toBe(SPARKLE_PARTICLE_COUNT);

    // Emit sparkles pada posisi jalur kanan (+2.4)
    sparkles.emit(2.4, 1.5, ROBOT_DEFAULT_Z, 'correct');
    expect(sparkles.isActive()).toBe(true);
    expect(sparkles.points.visible).toBe(true);

    const initialY0 = posAttr.getY(0);
    sparkles.update(0.05);
    expect(posAttr.getY(0)).not.toBe(initialY0);

    // Simulasikan waktu hingga seluruh partikel selesai masa aktifnya (~1.2 detik)
    for (let i = 0; i < 20; i++) {
      sparkles.update(0.08);
    }
    expect(sparkles.isActive()).toBe(false);
    expect(sparkles.points.visible).toBe(false);

    sparkles.dispose();
  });
});
