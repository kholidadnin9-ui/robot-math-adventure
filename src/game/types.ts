export enum GameState {
  MENU = 'MENU',
  INSTRUCTIONS = 'INSTRUCTIONS',
  LEVEL_SELECT = 'LEVEL_SELECT',
  COUNTDOWN = 'COUNTDOWN',
  PLAYING = 'PLAYING',
  FEEDBACK = 'FEEDBACK',
  PAUSED = 'PAUSED',
  LEVEL_COMPLETE = 'LEVEL_COMPLETE',
  GAME_OVER = 'GAME_OVER',
}

export type LaneIndex = 0 | 1 | 2;

export const LANE_WIDTH = 2.4;
export const LANE_POSITIONS: readonly [number, number, number] = [-LANE_WIDTH, 0, LANE_WIDTH];
export const LANE_LABELS: readonly [string, string, string] = [
  'Jalur Kiri',
  'Jalur Tengah',
  'Jalur Kanan',
];

export type CameraPreset = 'standard' | 'overhead' | 'close' | 'front';

export type RobotAnimationState =
  | 'idle'
  | 'run'
  | 'celebrate'
  | 'incorrect'
  | 'victory'
  | 'defeat';

export interface LevelThemeConfig {
  id: number;
  name: string;
  subtitle: string;
  focusFactors: number[];
  skyColor: number;
  fogColor: number;
  fogDensity: number;
  trackSurfaceColor: number;
  laneCenterColors: [number, number, number];
  laneDividerColor: number;
  curbColor: number;
  pylonPrimaryColor: number;
  pylonAccentColor: number;
  groundColor: number;
  ambientSkyColor: number;
  ambientGroundColor: number;
  keyLightColor: number;
}

export interface MultiplicationQuestion {
  id: string;
  a: number;
  b: number;
  answer: number;
  options: [number, number, number];
  correctIndex: LaneIndex;
  explanation: string;
}

export interface LevelRuntimeState {
  levelId: number;
  questionIndex: number;
  score: number;
  lives: number;
  coins: number;
  correctCount: number;
  incorrectCount: number;
  combo: number;
  status: GameState;
}

export interface ViewportMetrics {
  width: number;
  height: number;
  aspect: number;
  isPortraitMobile: boolean;
  effectiveFov: number;
  fps: number;
  isSoftwareGl: boolean;
}
