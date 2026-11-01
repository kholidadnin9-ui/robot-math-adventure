# Development Plan — Robot Math Adventure 3D
**Versi:** 1.0  
**Tujuan:** Panduan teknis implementasi berdasarkan PRD v1.0

## 1. Strategi Pengembangan
Bangun game dalam irisan kecil yang bisa dijalankan dan diuji setelah setiap tahap. Jangan membuat seluruh kode sekaligus tanpa pemeriksaan. Setelah setiap tahap, jalankan smoke test dan perbaiki regresi sebelum melanjutkan.

## 2. Stack Teknologi
- HTML5: struktur halaman.
- CSS3 / Tailwind CSS: layout responsif dan UI overlay.
- JavaScript / TypeScript ES Modules: logika aplikasi modular.
- Three.js: renderer dan lingkungan 3D.
- Web Audio API: efek suara prosedural tanpa dependensi file eksternal.
- `localStorage`: skor terbaik dan progres lokal.
- Vite & GitHub Pages: build tool dan hosting statis.

## 3. Arsitektur Proyek
Pisahkan logika game, soal, UI, robot, audio, dan penyimpanan.

```text
robot-math-adventure-3d/
├── index.html
├── package.json
├── vite.config.ts
├── src/
│   ├── main.tsx                 # bootstrap aplikasi
│   ├── App.tsx                  # container kanvas 3D & UI overlay
│   ├── game/
│   │   ├── types.ts             # kontrak tipe, state, dan tema level
│   │   ├── levelThemes.ts       # konfigurasi visual 5 level (PRD Bab 7)
│   │   ├── SceneManager.ts      # scene, camera, renderer, pencahayaan, resize
│   │   └── Track.ts             # lintasan 3D, tiga jalur, pembatas, dan horizon
│   ├── math/                    # (Tahap 4) questionBank, questionGenerator, validators
│   ├── ui/                      # (Tahap 1 & 7) HUD & kontrol inspeksi
│   ├── services/                # (Tahap 5 & 7) AudioManager, StorageService
│   └── index.css
├── tests/
│   └── stage1-foundation.test.ts
├── README.md
├── PRD.md
├── DEVELOPMENT_PLAN.md
└── TEST_PLAN.md
```

## 8. Tahapan Implementasi dan Definition of Done
- **Tahap 0 — Setup:** Repo, struktur file, `package.json`, Vite, README awal.
- **Tahap 1 — Scene 3D dan responsivitas:** Inisialisasi scene, kamera, renderer, pencahayaan, resize, lintasan tiga jalur dan horizon.
- **Tahap 2 — Robot:** Karakter robot 3D biru-kuning tanpa mulut, animasi idle/run dan perpindahan 3 jalur.
- **Tahap 3 — Gerbang:** Render 3 gerbang dengan angka besar, gerakan lintasan, trigger 1x per soal.
- **Tahap 4 — Sistem soal:** Generator, Fisher-Yates shuffle, validator soal perkalian 1–10.
- **Tahap 5 — State, skor, nyawa, feedback:** State machine, pause/resume/restart, skor, nyawa, penjelasan.
- **Tahap 6 — Lima level:** Fokus materi dan tema visual 5 level, progres pembukaan level.
- **Tahap 7 — UI, audio, dan aksesibilitas:** Menu lengkap, petunjuk, HUD, kontrol sentuh/swipe, Web Audio.
- **Tahap 8 — Testing dan optimasi:** Unit test, smoke test, perbaikan performa dan regresi.
- **Tahap 9 — Build dan deployment:** Build produksi dan kesiapan GitHub Pages.
