import React from 'react';
import { X, CheckCircle2, FileText, Wrench, AlertCircle } from 'lucide-react';

interface AuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditModal: React.FC<AuditModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="audit-modal-title"
    >
      <div className="relative flex max-h-[88vh] w-full max-w-4xl flex-col rounded-xl border border-slate-800 bg-slate-900 text-slate-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div>
            <h2 id="audit-modal-title" className="font-display text-lg font-bold text-white">
              Audit Dokumentasi & Keputusan Teknis (Tahap 0–1)
            </h2>
            <p className="text-xs text-slate-400">
              Berdasarkan PRD.md v1.0 · DEVELOPMENT_PLAN.md v1.0 · TEST_PLAN.md v1.0
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
            aria-label="Tutup panel audit"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5 text-sm leading-relaxed">
          {/* 1. Ringkasan Audit */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 font-display text-base font-bold text-amber-400">
              <FileText className="h-4 w-4 shrink-0" />
              <span>01. Hasil Audit Dokumentasi Proyek</span>
            </div>
            <p className="text-slate-300">
              Keempat dokumen spesifikasi (<code className="font-mono-tabular text-slate-200">PRD.md</code>,{' '}
              <code className="font-mono-tabular text-slate-200">DEVELOPMENT_PLAN.md</code>,{' '}
              <code className="font-mono-tabular text-slate-200">TEST_PLAN.md</code>, dan{' '}
              <code className="font-mono-tabular text-slate-200">README.md</code>) saling selaras dan telah
              ditempatkan di direktori utama proyek. Spesifikasi inti mengunci aturan: 5 level, tepat 10 soal
              perkalian (faktor 1–10) per level, 3 opsi unik per soal (1 benar, 2 salah), penilaian murni
              berdasarkan gerbang jalur yang dilewati robot, skor +100 per jawaban benar, dan 3 nyawa awal per
              level.
            </p>
          </section>

          {/* 2. Analisis Hal yang Perlu Klarifikasi / Resolusi */}
          <section className="space-y-3 border-t border-slate-800 pt-4">
            <div className="flex items-center gap-2 font-display text-base font-bold text-sky-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>02. Pemeriksaan Persyaratan yang Perlu Penegasan (Resolusi Tanpa Mengubah PRD)</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3.5">
                <h3 className="font-semibold text-white">
                  A. Kebijakan Batas Keputusan pada Lintasan Berjalan
                </h3>
                <p className="mt-1 text-xs text-slate-300">
                  DEVELOPMENT_PLAN Bab 7 meminta kebijakan adil terkait batas keputusan, sementara robot selalu
                  berada di salah satu dari 3 jalur. Resolusinya: robot selalu berada pada jalur aktif (Kiri,
                  Tengah, atau Kanan) yang terlihat jelas sejak gerbang muncul di kejauhan; pemain memiliki
                  jendela waktu panjang untuk berpindah jalur sebelum gerbang melewati titik Z robot. Timer soal
                  dimatikan secara default sesuai PRD Bab 9 & 17.
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3.5">
                <h3 className="font-semibold text-white">
                  B. Aturan Pasangan Faktor & Fokus Level 1 (1, 2, 3)
                </h3>
                <p className="mt-1 text-xs text-slate-300">
                  PRD Bab 8 melarang soal identik serta menganjurkan menghindari pasangan komutatif terbalik
                  (mis. <span className="font-mono-tabular">3×4</span> dan{' '}
                  <span className="font-mono-tabular">4×3</span>) dalam 1 level. Karena fokus Level 1 adalah
                  faktor <span className="font-mono-tabular">{'{1, 2, 3}'}</span> dikalikan dengan pengali{' '}
                  <span className="font-mono-tabular">1–10</span>, tersedia 27 pasangan unik non-terbalik
                  sehingga 10 soal unik per level dijamin 100% bebas duplikat.
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3.5">
                <h3 className="font-semibold text-white">
                  C. Perhitungan Skor, Combo, dan Koin
                </h3>
                <p className="mt-1 text-xs text-slate-300">
                  TEST_PLAN T-007 dan PRD Bab 9/12 menegaskan jawaban benar menambah tepat{' '}
                  <span className="font-mono-tabular">+100</span> poin dasar tanpa ambiguitas. Oleh karena itu,
                  skor utama dihitung murni <span className="font-mono-tabular">100 × jumlah_benar</span>,
                  sedangkan koin dan combo beruntun dicatat sebagai statistik pencapaian terpisah.
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3.5">
                <h3 className="font-semibold text-white">
                  D. Aturan Pembukaan Level Berikutnya
                </h3>
                <p className="mt-1 text-xs text-slate-300">
                  PRD Bab 9 & FR-11 menyatakan level selesai setelah 10 soal diproses dengan sisa nyawa{' '}
                  <span className="font-mono-tabular">&gt; 0</span>. Level 1 terbuka sejak awal, dan
                  menyelesaikan Level <span className="font-mono-tabular">N</span> (nyawa tersisa ≥ 1 setelah
                  10 soal) otomatis membuka Level <span className="font-mono-tabular">N + 1</span> di{' '}
                  <code className="font-mono-tabular">localStorage</code>.
                </p>
              </div>
            </div>
          </section>

          {/* 3. Keputusan Teknis */}
          <section className="space-y-3 border-t border-slate-800 pt-4">
            <div className="flex items-center gap-2 font-display text-base font-bold text-emerald-400">
              <Wrench className="h-4 w-4 shrink-0" />
              <span>03. Daftar Keputusan Teknis Utama</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <span>
                  <strong className="text-white">Arsitektur Modular TypeScript + Three.js + Vite:</strong>{' '}
                  Menggunakan ES Modules dengan pemisahan tegas antara <code className="font-mono-tabular">SceneManager</code>,{' '}
                  <code className="font-mono-tabular">Track</code>, dan modul tahap berikutnya, serta{' '}
                  <code className="font-mono-tabular">base: &apos;./&apos;</code> di Vite agar kompatibel dengan
                  subpath GitHub Pages (T-020).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <span>
                  <strong className="text-white">Sistem Koordinat 3 Jalur Presisi:</strong> Jalur Kiri pada{' '}
                  <span className="font-mono-tabular">X = -2.4</span>, Jalur Tengah pada{' '}
                  <span className="font-mono-tabular">X = 0.0</span>, dan Jalur Kanan pada{' '}
                  <span className="font-mono-tabular">X = +2.4</span>, dengan titik berdiri pemain pada{' '}
                  <span className="font-mono-tabular">Z = +4.0</span> dan lintasan bergerak dari{' '}
                  <span className="font-mono-tabular">Z = -124</span> menuju kamera.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <span>
                  <strong className="text-white">100% Aset Prosedural (Zero External 404):</strong> Seluruh
                  tekstur marka jalur, pencahayaan <code className="font-mono-tabular">RoomEnvironment</code>,
                  pilar <code className="font-mono-tabular">InstancedMesh</code>, dan nantinya model robot serta
                  efek suara Web Audio dibuat secara prosedural di kode tanpa risiko gagal muat file eksternal.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <span>
                  <strong className="text-white">Kompensasi Kamera Responsif Desktop & Mobile (T-017):</strong>{' '}
                  Pada layar ponsel vertikal (<span className="font-mono-tabular">aspect &lt; 0.85</span>, mis.{' '}
                  <span className="font-mono-tabular">360×800</span>), FOV dan jarak Z kamera otomatis
                  disesuaikan sehingga ketiga jalur tetap masuk 100% ke dalam frustum layar.
                </span>
              </li>
            </ul>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-800 px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-amber-400 px-4 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-amber-300"
          >
            Tutup & Kembali ke Lingkungan 3D
          </button>
        </div>
      </div>
    </div>
  );
};
