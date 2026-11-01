# Robot Math Adventure 3D

Game edukasi perkalian 1–10 untuk siswa SD berbasis 3D endless runner dengan robot 3D biru-kuning tanpa mulut dan mekanisme memilih gerbang jawaban pada lintasan tiga jalur.

## Status Implementasi Saat Ini
- **Tahap 0 — Setup Proyek:** Selesai (`package.json`, konfigurasi Vite dengan dukungan base path relatif, struktur modular `src/game/`, `src/math/`, `tests/`, dan dokumentasi proyek).
- **Tahap 1 — Scene 3D & Responsivitas:** Selesai (`SceneManager.ts`, `Track.ts` dengan tiga jalur jelas Kiri/Tengah/Kanan, pencahayaan studio 3 titik + `RoomEnvironment` PBR + kabut horizon, fallback WebGL, serta kontrol inspeksi lintasan & 5 tema level).
- **Tahap 2 — Karakter Robot 3D:** Selesai (`Robot.ts` merakit robot 3D biru-kuning tanpa mulut dari bentuk geometri Three.js dengan visor, dua mata bercahaya ekspresif, antena, pelat dada kuning, *booster pack*, bayangan kontak, animasi `idle`/`run`/`celebrate`/`incorrect`, dan perpindahan mulus antar tiga jalur).
- **Tahap 3 & 4 — Gerbang Jawaban 3D (`MathGate`) & Sistem Soal Perkalian:** Selesai (`MathGate.ts` merender struktur gerbang 3D dengan papan soal perkalian di atas lintasan dan tiga portal pilihan jawaban pada jalur Kiri, Tengah, dan Kanan, dilengkapi deteksi melewati gerbang tepat satu kali serta generator/validator 10 soal perkalian unik per level di `src/math/`).
- **Tahap 5 s.d. Tahap 9:** Siap dilanjutkan sesuai tahapan di `DEVELOPMENT_PLAN.md`.

## Dokumen Proyek
- [`PRD.md`](./PRD.md) — Kebutuhan produk dan aturan gameplay.
- [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md) — Arsitektur modular dan tahapan implementasi.
- [`TEST_PLAN.md`](./TEST_PLAN.md) — Skenario pengujian fungsional, matematika, dan rilis.

## Cara Menjalankan Proyek
1. Instal dependensi:
   ```bash
   npm install
   ```
2. Jalankan server pengembangan (port 3000):
   ```bash
   npm run dev
   ```
3. Jalankan pengujian otomatis (Vitest):
   ```bash
   npm test
   ```
4. Periksa tipe TypeScript dan build produksi:
   ```bash
   npm run lint
   npm run build
   ```
