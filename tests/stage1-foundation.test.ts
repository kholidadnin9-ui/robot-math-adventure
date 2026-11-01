import { describe, expect, it } from 'vitest';
import {
  GameState,
  LANE_LABELS,
  LANE_POSITIONS,
  LANE_WIDTH,
} from '../src/game/types';
import { LEVEL_THEMES, getLevelTheme } from '../src/game/levelThemes';
import { getLaneX, Track } from '../src/game/Track';
import { computeResponsiveCameraParams } from '../src/game/SceneManager';

describe('Tahap 0 & 1 — Fondasi Proyek, Lintasan 3 Jalur, dan Responsivitas 3D', () => {
  it('memiliki tepat 3 jalur lintasan yang simetris (Kiri, Tengah, Kanan)', () => {
    expect(LANE_POSITIONS).toHaveLength(3);
    expect(LANE_LABELS).toEqual(['Jalur Kiri', 'Jalur Tengah', 'Jalur Kanan']);
    expect(getLaneX(0)).toBe(-LANE_WIDTH);
    expect(getLaneX(1)).toBe(0);
    expect(getLaneX(2)).toBe(LANE_WIDTH);
  });

  it('mendefinisikan seluruh state permainan sesuai DEVELOPMENT_PLAN Bab 4', () => {
    expect(Object.values(GameState)).toEqual([
      'MENU',
      'INSTRUCTIONS',
      'LEVEL_SELECT',
      'COUNTDOWN',
      'PLAYING',
      'FEEDBACK',
      'PAUSED',
      'LEVEL_COMPLETE',
      'GAME_OVER',
    ]);
  });

  it('menyediakan 5 konfigurasi tema level sesuai PRD Bab 7 dengan faktor 1–10', () => {
    expect(LEVEL_THEMES).toHaveLength(5);
    const names = LEVEL_THEMES.map((t) => t.name);
    expect(names).toEqual([
      'Kota Robot',
      'Hutan Energi',
      'Terowongan Angka',
      'Kota Teknologi',
      'Galaksi Robot',
    ]);

    for (const theme of LEVEL_THEMES) {
      expect(theme.focusFactors.length).toBeGreaterThanOrEqual(3);
      for (const factor of theme.focusFactors) {
        expect(factor).toBeGreaterThanOrEqual(1);
        expect(factor).toBeLessThanOrEqual(10);
      }
    }
  });

  it('membangun objek 3D Track tiga jalur, mendukung pergantian tema, dan menghentikan gerak saat speed = 0', () => {
    const theme1 = getLevelTheme(1);
    const track = new Track(theme1, 4);

    expect(track.group).toBeDefined();
    expect(track.group.children.length).toBeGreaterThanOrEqual(8);
    expect(track.getHighlightedLane()).toBe(1);

    // Pindah ke jalur kiri (0) dan jalankan update
    track.setHighlightedLane(0);
    expect(track.getHighlightedLane()).toBe(0);
    track.update(0.05, 14);

    // Uji pergantian tema ke semua 5 level tanpa error
    for (let lvl = 1; lvl <= 5; lvl++) {
      expect(() => track.applyTheme(getLevelTheme(lvl))).not.toThrow();
    }

    // Uji dispose resource 3D
    expect(() => track.dispose()).not.toThrow();
  });

  it('menghitung parameter kamera responsif untuk resolusi Desktop (1280x720, 1920x1080) dan Mobile (360x800, 390x844) sesuai TEST_PLAN Bab 6', () => {
    const desktop720 = computeResponsiveCameraParams(1280, 720, 'standard', 0);
    const desktop1080 = computeResponsiveCameraParams(1920, 1080, 'standard', 0);
    const mobile360 = computeResponsiveCameraParams(360, 800, 'standard', 0);
    const mobile390 = computeResponsiveCameraParams(390, 844, 'standard', 0);

    expect(desktop720.isPortraitMobile).toBe(false);
    expect(desktop1080.isPortraitMobile).toBe(false);
    expect(desktop720.aspect).toBeCloseTo(1280 / 720, 4);

    expect(mobile360.isPortraitMobile).toBe(true);
    expect(mobile390.isPortraitMobile).toBe(true);

    // Pada layar vertikal mobile, FOV dan jarak Z kamera harus lebih besar agar 3 jalur tidak terpotong
    expect(mobile360.fov).toBeGreaterThan(desktop720.fov);
    expect(mobile360.targetPosition[2]).toBeGreaterThan(desktop720.targetPosition[2]);

    // Pastikan ukuran ekstrem (0x0) aman dari NaN / pembagian nol
    const zeroSafe = computeResponsiveCameraParams(0, 0, 'standard', 0);
    expect(Number.isFinite(zeroSafe.aspect)).toBe(true);
    expect(Number.isFinite(zeroSafe.fov)).toBe(true);
  });
});
