import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { Robot, ROBOT_COLORS, ROBOT_DEFAULT_Z } from '../src/game/Robot';
import { LANE_POSITIONS } from '../src/game/types';

describe('Tahap 2 — Model Karakter Robot 3D Biru-Kuning (Tanpa Mulut) & Gerak 3 Jalur', () => {
  it('merakit model robot 3D biru-kuning multi-bagian tanpa mulut (mouthless)', () => {
    const robot = new Robot(1);

    expect(robot.hasMouth).toBe(false);
    expect(robot.group).toBeInstanceOf(THREE.Group);
    expect(robot.group.position.z).toBe(ROBOT_DEFAULT_Z);
    expect(robot.group.position.x).toBe(LANE_POSITIONS[1]);

    const meshNames: string[] = [];
    const materialColors = new Set<number>();

    robot.group.traverse((obj) => {
      if (obj.name) {
        meshNames.push(obj.name);
      }
      if ((obj as THREE.Mesh).isMesh) {
        const mat = (obj as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (mat && mat.color) {
          materialColors.add(mat.color.getHex());
        }
      }
    });

    // Pastikan bagian-bagian utama robot tersedia
    expect(meshNames).toContain('RobotHeadGroup');
    expect(meshNames).toContain('FaceVisor');
    expect(meshNames).toContain('LeftEye');
    expect(meshNames).toContain('RightEye');
    expect(meshNames).toContain('AntennaBulb');
    expect(meshNames).toContain('TorsoHull');
    expect(meshNames).toContain('ChestPlate');
    expect(meshNames).toContain('BoosterBackpack');
    expect(meshNames).toContain('LeftArmGroup');
    expect(meshNames).toContain('RightArmGroup');
    expect(meshNames).toContain('LeftLegGroup');
    expect(meshNames).toContain('RightLegGroup');

    // Pastikan TIDAK ADA bagian mulut (PRD Bab 10: "Tidak memiliki mulut")
    const hasMouthNamedPart = meshNames.some((name) =>
      /mouth|mulut|jaw|lips/i.test(name),
    );
    expect(hasMouthNamedPart).toBe(false);

    // Pastikan palet warna biru dan kuning digunakan
    expect(materialColors.has(ROBOT_COLORS.primaryBlue)).toBe(true);
    expect(materialColors.has(ROBOT_COLORS.accentYellow)).toBe(true);

    robot.dispose();
  });

  it('memindahkan robot di antara tiga jalur (Kiri -2.4, Tengah 0, Kanan +2.4) dan membatasi input di luar batas', () => {
    const robot = new Robot(1);
    expect(robot.getLane()).toBe(1);
    expect(robot.getTargetX()).toBe(0);

    // Pindah ke kiri -> Jalur 0 (-2.4)
    robot.moveLeft();
    expect(robot.getLane()).toBe(0);
    expect(robot.getTargetX()).toBe(LANE_POSITIONS[0]);

    // Coba pindah ke kiri lagi -> tetap tertahan di Jalur 0
    robot.moveLeft();
    expect(robot.getLane()).toBe(0);

    // Simulasikan update delta time hingga posisi X mendekati targetX (-2.4)
    for (let i = 0; i < 30; i++) {
      robot.update(0.05, 14);
    }
    expect(robot.getCurrentX()).toBeCloseTo(LANE_POSITIONS[0], 2);

    // Pindah ke kanan 2x -> Jalur 2 (+2.4)
    robot.moveRight();
    expect(robot.getLane()).toBe(1);
    robot.moveRight();
    expect(robot.getLane()).toBe(2);
    expect(robot.getTargetX()).toBe(LANE_POSITIONS[2]);

    // Coba pindah ke kanan lagi -> tetap tertahan di Jalur 2
    robot.moveRight();
    expect(robot.getLane()).toBe(2);

    for (let i = 0; i < 30; i++) {
      robot.update(0.05, 14);
    }
    expect(robot.getCurrentX()).toBeCloseTo(LANE_POSITIONS[2], 2);

    robot.dispose();
  });

  it('menjalankan animasi idle, run, celebrate, dan incorrect serta kembali ke state dasar setelah reaksi selesai', () => {
    const robot = new Robot(1);
    expect(robot.getAnimationState()).toBe('run');

    robot.setAnimationState('idle');
    expect(robot.getAnimationState()).toBe('idle');
    robot.update(0.05, 0);

    // Trigger reaksi celebrate selama 0.4 detik
    robot.triggerReaction('celebrate', 0.4);
    expect(robot.getAnimationState()).toBe('celebrate');

    // Setelah 0.2 detik masih celebrate
    robot.update(0.1, 14);
    robot.update(0.1, 14);
    expect(robot.getAnimationState()).toBe('celebrate');

    // Setelah melewati 0.4 detik kembali ke base state ('idle')
    robot.update(0.1, 14);
    robot.update(0.1, 14);
    robot.update(0.1, 14);
    expect(robot.getAnimationState()).toBe('idle');

    robot.dispose();
  });
});
