import React from 'react';
import {
  X,
  Sparkles,
  Camera,
  Gauge,
  Bot,
  SkipForward,
  FileCheck2,
  Play,
  Pause,
} from 'lucide-react';
import { LEVEL_THEMES } from '../game/levelThemes';
import {
  CameraPreset,
  LaneIndex,
  RobotAnimationState,
  ViewportMetrics,
} from '../game/types';

export const SPEED_PRESETS = [
  { label: 'Lambat', value: 9 },
  { label: 'Normal', value: 14 },
  { label: 'Cepat', value: 20 },
] as const;

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLevelId: number;
  onSelectTheme: (levelId: number) => void;
  cameraPreset: CameraPreset;
  onSelectCamera: (preset: CameraPreset) => void;
  trackSpeed: number;
  onSelectSpeed: (speed: number) => void;
  isRunning: boolean;
  onToggleRunning: () => void;
  robotAnim: RobotAnimationState;
  onTriggerRobotAnim: (state: RobotAnimationState) => void;
  activeLane: LaneIndex;
  onSelectLane: (lane: LaneIndex) => void;
  onNextGate: () => void;
  onOpenAudit: () => void;
  metrics: ViewportMetrics;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  selectedLevelId,
  onSelectTheme,
  cameraPreset,
  onSelectCamera,
  trackSpeed,
  onSelectSpeed,
  isRunning,
  onToggleRunning,
  robotAnim,
  onTriggerRobotAnim,
  onNextGate,
  onOpenAudit,
  metrics,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex max-h-[88vh] w-full max-w-lg flex-col rounded-2xl border border-slate-800 bg-slate-900 text-slate-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div>
            <h2
              id="settings-modal-title"
              className="font-display text-base font-bold text-white sm:text-lg"
            >
              Menu Pengaturan Permainan
            </h2>
            <p className="text-xs text-slate-400">
              Atur level, sudut kamera, kecepatan lintasan, dan animasi robot
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
            aria-label="Tutup menu pengaturan"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4 text-sm">
          {/* 1. Pemilihan Level & Fokus Perkalian */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>Pilih Level & Tema Lingkungan</span>
              </span>
              <span className="text-[11px] text-slate-400">10 Soal / Level</span>
            </div>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {LEVEL_THEMES.map((theme) => {
                const active = selectedLevelId === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => onSelectTheme(theme.id)}
                    className={`flex flex-col items-start rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                      active
                        ? 'border-amber-400 bg-amber-400/15 text-white'
                        : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="font-display text-xs font-bold text-amber-400">
                        Level {theme.id} — {theme.name}
                      </span>
                      {active && (
                        <span className="text-[11px] font-semibold text-emerald-400">
                          Aktif
                        </span>
                      )}
                    </div>
                    <span className="mt-0.5 text-[11px] text-slate-400">
                      {theme.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 2. Sudut Kamera 3D */}
          <section className="space-y-2 border-t border-slate-800/80 pt-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <Camera className="h-4 w-4 text-emerald-400" />
                <span>Sudut Kamera 3D</span>
              </span>
              <span className="font-mono-tabular text-[11px] text-slate-400">
                FOV {metrics.effectiveFov}° · {metrics.width}×{metrics.height}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(
                [
                  { id: 'standard', label: 'Belakang (Standar)' },
                  { id: 'front', label: 'Depan Robot' },
                  { id: 'close', label: 'Dekat' },
                  { id: 'overhead', label: 'Atas' },
                ] as const
              ).map((cam) => {
                const active = cameraPreset === cam.id;
                return (
                  <button
                    key={cam.id}
                    type="button"
                    onClick={() => onSelectCamera(cam.id)}
                    className={`min-h-[40px] rounded-xl border px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'border-emerald-400 bg-emerald-500 text-slate-950'
                        : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {cam.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* 3. Kecepatan Lintasan & Status Simulasi */}
          <section className="space-y-2 border-t border-slate-800/80 pt-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <Gauge className="h-4 w-4 text-sky-400" />
                <span>Kecepatan Lintasan & Gerbang</span>
              </span>
              <button
                type="button"
                onClick={onNextGate}
                className="flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-sky-300"
              >
                <SkipForward className="h-3.5 w-3.5" />
                <span>Muat Gerbang Soal Baru</span>
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onToggleRunning}
                className={`flex min-h-[40px] items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  isRunning
                    ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                    : 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="h-3.5 w-3.5" />
                    <span>Jeda Permainan</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5" />
                    <span>Lanjutkan Permainan</span>
                  </>
                )}
              </button>

              <div className="grid flex-1 grid-cols-3 gap-1.5 rounded-xl border border-slate-800 bg-slate-950/70 p-1">
                {SPEED_PRESETS.map((preset) => {
                  const active = trackSpeed === preset.value;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => onSelectSpeed(preset.value)}
                      className={`min-h-[34px] rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-sky-500 text-slate-950'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 4. Uji Animasi Karakter Robot */}
          <section className="space-y-2 border-t border-slate-800/80 pt-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Bot className="h-4 w-4 text-amber-400" />
              <span>Uji Ekspresi & Animasi Robot (Tanpa Mulut)</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  { id: 'run', label: 'Lari' },
                  { id: 'idle', label: 'Diam' },
                  { id: 'celebrate', label: 'Selebrasi' },
                  { id: 'incorrect', label: 'Salah' },
                ] as const
              ).map((anim) => {
                const active = robotAnim === anim.id;
                return (
                  <button
                    key={anim.id}
                    type="button"
                    onClick={() => onTriggerRobotAnim(anim.id)}
                    className={`min-h-[38px] rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'border-amber-400 bg-amber-400 text-slate-950'
                        : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {anim.label}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 px-5 py-3.5">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenAudit();
            }}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700 hover:text-white whitespace-nowrap shrink-0"
          >
            <FileCheck2 className="h-3.5 w-3.5 text-amber-400" />
            <span>Audit & Dokumen Proyek</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-amber-400 px-4 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-amber-300 whitespace-nowrap shrink-0"
          >
            Selesai & Kembali Bermain
          </button>
        </div>
      </div>
    </div>
  );
};
