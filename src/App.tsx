/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  Settings,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { MathGateTriggerResult } from './game/MathGate';
import { checkWebGLSupport, SceneManager } from './game/SceneManager';
import { getLevelTheme } from './game/levelThemes';
import {
  CameraPreset,
  LANE_LABELS,
  LaneIndex,
  MultiplicationQuestion,
  RobotAnimationState,
  ViewportMetrics,
} from './game/types';
import { AuditModal } from './ui/AuditModal';
import { SettingsModal } from './ui/SettingsModal';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);

  const [webglError, setWebglError] = useState<string | null>(null);
  const [contextLost, setContextLost] = useState(false);

  const [selectedLevelId, setSelectedLevelId] = useState<number>(1);
  const [activeLane, setActiveLane] = useState<LaneIndex>(1);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [trackSpeed, setTrackSpeed] = useState<number>(14);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('standard');
  const [robotAnim, setRobotAnim] = useState<RobotAnimationState>('run');

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isAuditOpen, setIsAuditOpen] = useState<boolean>(false);

  const [currentQuestion, setCurrentQuestion] =
    useState<MultiplicationQuestion | null>(null);
  const [questionProgress, setQuestionProgress] = useState<{
    current: number;
    total: number;
  }>({ current: 1, total: 10 });
  const [lastGateResult, setLastGateResult] =
    useState<MathGateTriggerResult | null>(null);
  const [score, setScore] = useState<number>(0);

  const [metrics, setMetrics] = useState<ViewportMetrics>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 720,
    aspect: 1.78,
    isPortraitMobile: false,
    effectiveFov: 52,
    fps: 60,
    isSoftwareGl: false,
  });

  // Touch swipe tracking for 3-lane movement
  const touchStartXRef = useRef<number | null>(null);

  // Initialize Three.js SceneManager once on mount
  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const support = checkWebGLSupport();
    if (!support.supported) {
      setWebglError(
        support.message ??
          'WebGL tidak tersedia pada perangkat atau browser ini.',
      );
      return;
    }

    const manager = new SceneManager(container, {
      initialLevelId: 1,
      onMetricsUpdate: (nextMetrics) => setMetrics(nextMetrics),
      onContextLost: (lost) => setContextLost(lost),
      onQuestionChanged: (question, qNum, total) => {
        setCurrentQuestion(question);
        setQuestionProgress({ current: qNum, total });
        setLastGateResult(null);
      },
      onGateResolved: (result) => {
        setLastGateResult(result);
        setRobotAnim(result.isCorrect ? 'celebrate' : 'incorrect');
        if (result.scoreDelta > 0) {
          setScore((prev) => prev + result.scoreDelta);
        }
      },
    });
    sceneManagerRef.current = manager;

    return () => {
      manager.dispose();
      sceneManagerRef.current = null;
    };
  }, []);

  // Sync keyboard controls (Left/Right/A/D lane switch, Space pause, Escape close modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAuditOpen) {
        if (e.key === 'Escape') setIsAuditOpen(false);
        return;
      }
      if (isSettingsOpen) {
        if (e.key === 'Escape') setIsSettingsOpen(false);
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        setActiveLane((prev) => {
          const next = Math.max(0, prev - 1) as LaneIndex;
          sceneManagerRef.current?.setActiveLane(next);
          return next;
        });
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        setActiveLane((prev) => {
          const next = Math.min(2, prev + 1) as LaneIndex;
          sceneManagerRef.current?.setActiveLane(next);
          return next;
        });
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsRunning((prev) => {
          const next = !prev;
          sceneManagerRef.current?.setRunning(next);
          setRobotAnim(next ? 'run' : 'idle');
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuditOpen, isSettingsOpen]);

  const handleSelectLane = (lane: LaneIndex) => {
    setActiveLane(lane);
    sceneManagerRef.current?.setActiveLane(lane);
  };

  const handleSelectTheme = (levelId: number) => {
    setSelectedLevelId(levelId);
    sceneManagerRef.current?.setLevelTheme(levelId);
  };

  const handleToggleRunning = () => {
    setIsRunning((prev) => {
      const next = !prev;
      sceneManagerRef.current?.setRunning(next);
      setRobotAnim(next ? 'run' : 'idle');
      return next;
    });
  };

  const handleSelectSpeed = (speed: number) => {
    setTrackSpeed(speed);
    sceneManagerRef.current?.setTrackSpeed(speed);
  };

  const handleTriggerRobotAnim = (state: RobotAnimationState) => {
    setRobotAnim(state);
    if (state === 'run') {
      setIsRunning(true);
      sceneManagerRef.current?.setRunning(true);
    } else if (state === 'idle') {
      setIsRunning(false);
      sceneManagerRef.current?.setRunning(false);
    } else {
      sceneManagerRef.current?.triggerRobotReaction(state, 1.8);
    }
  };

  const handleNextGate = () => {
    sceneManagerRef.current?.advanceToNextGate();
  };

  const handleSelectCamera = (preset: CameraPreset) => {
    setCameraPreset(preset);
    sceneManagerRef.current?.setCameraPreset(preset);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartXRef.current = e.touches[0].clientX;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || e.changedTouches.length === 0) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    touchStartXRef.current = null;

    if (Math.abs(deltaX) > 36) {
      if (deltaX < 0) {
        handleSelectLane(Math.max(0, activeLane - 1) as LaneIndex);
      } else {
        handleSelectLane(Math.min(2, activeLane + 1) as LaneIndex);
      }
    }
  };

  const currentTheme = getLevelTheme(selectedLevelId);

  return (
    <div
      className="relative h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Dedicated isolated WebGL Canvas Mount */}
      <div
        ref={canvasMountRef}
        className="absolute inset-0 h-full w-full"
        aria-label="Lingkungan 3D Robot, Lintasan Tiga Jalur, dan Gerbang Matematika"
      />

      {/* WebGL Error or Context Lost Fallback (FR-15 / T-019) */}
      {(webglError || contextLost) && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-6">
          <div className="max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 text-center shadow-2xl">
            <AlertTriangle className="mx-auto h-10 w-10 text-amber-400" />
            <h2 className="mt-3 font-display text-lg font-bold text-white">
              {contextLost ? 'Konteks Grafis 3D Terputus' : 'WebGL Tidak Tersedia'}
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              {webglError ??
                'Koneksi ke akselerasi grafis 3D terputus sementara. Silakan muat ulang halaman untuk memulihkan tampilan 3D.'}
            </p>
          </div>
        </div>
      )}

      {/* Compact Proportional Top Header Bar (Follows 3-Zone Contract, < 52px height) */}
      <header className="pointer-events-auto relative z-20 flex items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-950/90 px-3 py-2 sm:gap-6 sm:px-5 sm:py-2.5">
        {/* Zone 1: Single-element Brand Wordmark */}
        <span className="font-display text-sm font-bold tracking-tight text-white whitespace-nowrap shrink-0 sm:text-base">
          Robot Math 3D
        </span>

        {/* Zone 2: Compact Unboxed Level, Question & Score Readout */}
        <div className="flex items-center gap-2 overflow-hidden text-xs text-slate-300 sm:gap-3">
          <span className="hidden text-slate-400 md:inline whitespace-nowrap shrink-0">
            Lv.{currentTheme.id} {currentTheme.name}
          </span>
          <span aria-hidden="true" className="hidden md:inline text-slate-600">
            ·
          </span>
          {currentQuestion && (
            <span className="font-display text-sm font-bold text-amber-400 whitespace-nowrap shrink-0 sm:text-base">
              {currentQuestion.a} × {currentQuestion.b} = ?
            </span>
          )}
          <span aria-hidden="true" className="text-slate-600">
            ·
          </span>
          <span className="font-mono-tabular text-xs font-semibold text-emerald-400 whitespace-nowrap shrink-0">
            Skor {score}
          </span>
          <span aria-hidden="true" className="hidden sm:inline text-slate-600">
            ·
          </span>
          <span className="hidden font-mono-tabular text-xs text-slate-400 sm:inline whitespace-nowrap shrink-0">
            Soal {questionProgress.current}/{questionProgress.total}
          </span>
        </div>

        {/* Zone 3: Play/Pause & Settings Menu Trigger */}
        <div className="flex items-center gap-1.5 shrink-0 sm:gap-2">
          <button
            type="button"
            onClick={handleToggleRunning}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-800 hover:text-white whitespace-nowrap shrink-0 sm:h-9 sm:px-3"
            aria-label={isRunning ? 'Jeda permainan' : 'Lanjutkan permainan'}
          >
            {isRunning ? (
              <Pause className="h-3.5 w-3.5 text-amber-400" />
            ) : (
              <Play className="h-3.5 w-3.5 text-emerald-400" />
            )}
            <span className="hidden sm:inline">{isRunning ? 'Jeda' : 'Jalan'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-amber-400 px-2.5 text-xs font-semibold text-slate-950 transition-colors hover:bg-amber-300 whitespace-nowrap shrink-0 sm:h-9 sm:px-3.5"
            aria-label="Buka menu pengaturan"
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Pengaturan</span>
          </button>
        </div>
      </header>

      {/* Slim Non-Obstructive Feedback Banner (Only appears briefly after passing a gate) */}
      {lastGateResult && (
        <div className="pointer-events-none relative z-10 mt-2 flex justify-center px-3">
          <div
            className={`flex max-w-md items-center gap-2 rounded-lg border px-3.5 py-1.5 text-xs font-medium shadow-lg ${
              lastGateResult.isCorrect
                ? 'border-emerald-500/50 bg-emerald-950/90 text-emerald-200'
                : 'border-amber-500/50 bg-slate-900/92 text-amber-200'
            }`}
          >
            {lastGateResult.isCorrect ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                <span>
                  Benar! (+100) · {lastGateResult.question.a} ×{' '}
                  {lastGateResult.question.b} = {lastGateResult.correctOption}
                </span>
              </>
            ) : (
              <>
                <XCircle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                <span>
                  Belum tepat · {lastGateResult.question.a} ×{' '}
                  {lastGateResult.question.b} = {lastGateResult.correctOption}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Proportional, Low-Profile Bottom 3-Lane Selector (Does not block the 3D scene) */}
      <div className="pointer-events-auto fixed bottom-3 left-1/2 z-20 w-[90vw] max-w-xs -translate-x-1/2 sm:max-w-sm">
        <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-slate-800/90 bg-slate-950/88 p-1.5 shadow-xl">
          {([0, 1, 2] as LaneIndex[]).map((laneIdx) => {
            const active = activeLane === laneIdx;
            const optionVal = currentQuestion?.options[laneIdx];
            return (
              <button
                key={laneIdx}
                type="button"
                onClick={() => handleSelectLane(laneIdx)}
                aria-label={`Pindah ke ${LANE_LABELS[laneIdx]}`}
                className={`flex min-h-[40px] items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-sky-500 text-slate-950 shadow-sm'
                    : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {laneIdx === 0 && <ChevronLeft className="h-3.5 w-3.5 shrink-0" />}
                <span>
                  {laneIdx === 0 ? 'Kiri' : laneIdx === 1 ? 'Tengah' : 'Kanan'}
                </span>
                {optionVal !== undefined && (
                  <span
                    className={`font-mono-tabular text-[11px] ${
                      active ? 'text-slate-950/80' : 'text-amber-400'
                    }`}
                  >
                    ({optionVal})
                  </span>
                )}
                {laneIdx === 2 && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Settings Modal (Houses Level, Camera Angle, Speed, Robot Animation, and Audit Access) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        selectedLevelId={selectedLevelId}
        onSelectTheme={handleSelectTheme}
        cameraPreset={cameraPreset}
        onSelectCamera={handleSelectCamera}
        trackSpeed={trackSpeed}
        onSelectSpeed={handleSelectSpeed}
        isRunning={isRunning}
        onToggleRunning={handleToggleRunning}
        robotAnim={robotAnim}
        onTriggerRobotAnim={handleTriggerRobotAnim}
        activeLane={activeLane}
        onSelectLane={handleSelectLane}
        onNextGate={handleNextGate}
        onOpenAudit={() => setIsAuditOpen(true)}
        metrics={metrics}
      />

      {/* Audit & Documentation Modal */}
      <AuditModal isOpen={isAuditOpen} onClose={() => setIsAuditOpen(false)} />
    </div>
  );
}
