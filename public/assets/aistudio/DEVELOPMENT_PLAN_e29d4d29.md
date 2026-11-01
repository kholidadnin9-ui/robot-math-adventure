# Development Plan — Robot Math Adventure 3D
**Versi:** 1.0  
**Tujuan:** Panduan teknis implementasi berdasarkan PRD v1.0

## 1. Strategi Pengembangan
Bangun game dalam irisan kecil yang bisa dijalankan dan diuji setelah setiap tahap. Jangan membuat seluruh kode sekaligus tanpa pemeriksaan. Setelah setiap tahap, jalankan smoke test dan perbaiki regresi sebelum melanjutkan.

## 2. Stack Teknologi
- HTML5: struktur halaman.
- CSS3: layout responsif dan UI overlay.
- JavaScript ES Modules: logika aplikasi modular.
- Three.js: renderer dan lingkungan 3D.
- Web Audio API atau file audio lokal: efek suara opsional.
- `localStorage`: skor terbaik dan progres lokal.
- GitHub Pages: hosting statis.

**Catatan deployment:** gunakan versi Three.js yang dipatok (pinned) dan pastikan import map atau bundling konsisten. Untuk proyek sederhana tanpa proses build, import map dan ESM dari CDN dapat dipakai, tetapi rilis yang lebih stabil sebaiknya memakai Vite sebagai development server/build tool. Jika menggunakan Vite, output produksi harus diarahkan ke `dist/` dan `base` disetel sesuai nama repositori GitHub Pages.

## 3. Arsitektur yang Disarankan
Pisahkan logika game, soal, UI, robot, audio, dan penyimpanan. Hindari satu file `main.js` yang menampung seluruh logika.

Contoh struktur:
```text
robot-math-adventure/
├── index.html
├── package.json                 # jika menggunakan Vite
├── vite.config.js               # konfigurasi base GitHub Pages
├── src/
│   ├── main.js                  # bootstrap aplikasi
│   ├── game/
│   │   ├── GameController.js    # state dan alur level
│   │   ├── SceneManager.js      # scene, camera, renderer, resize
│   │   ├── Track.js             # lintasan, tiga jalur, gerbang
│   │   ├── Robot.js             # model prosedural dan animasi
│   │   ├── GateManager.js       # spawn, posisi, collision/trigger
│   │   └── InputController.js   # keyboard, swipe, tombol virtual
│   ├── math/
│   │   ├── questionBank.js      # data/fokus materi level
│   │   ├── questionGenerator.js # opsi jawaban dan pengacakan
│   │   └── validators.js        # validasi soal dan hasil
│   ├── ui/
│   │   ├── ScreenManager.js     # menu, pause, game over, hasil
│   │   └── HUD.js               # soal, skor, nyawa, progress
│   ├── services/
│   │   ├── AudioManager.js
│   │   └── StorageService.js
│   └── styles/
│       └── main.css
├── public/
│   └── assets/
│       ├── audio/
│       └── textures/
├── tests/
│   ├── questions.test.js
│   └── scoring.test.js
├── README.md
├── PRD.md
├── DEVELOPMENT_PLAN.md
└── TEST_PLAN.md
```

Jika build tool belum digunakan, struktur dapat disederhanakan, tetapi pemisahan tanggung jawab tetap dipertahankan.

## 4. State Machine
Gunakan state eksplisit agar transisi layar dan input tidak tumpang tindih:
- `MENU`
- `INSTRUCTIONS`
- `LEVEL_SELECT`
- `COUNTDOWN` (opsional)
- `PLAYING`
- `FEEDBACK`
- `PAUSED`
- `LEVEL_COMPLETE`
- `GAME_OVER`

Aturan:
- Input gameplay hanya diproses pada state `PLAYING`.
- Saat `PAUSED`, hentikan update dunia, timer, dan gerbang.
- Satu soal hanya dapat diselesaikan satu kali.
- Transisi ke soal berikutnya hanya terjadi setelah feedback ditampilkan atau dilewati dengan aman.
- Saat restart, reset seluruh state level dan bersihkan objek gerbang/efek lama.

## 5. Model Data
Contoh data soal:
```js
{
  id: "L1-Q01",
  a: 7,
  b: 2,
  answer: 14,
  options: [12, 14, 16],
  correctIndex: 1,
  explanation: "7 kelompok berisi 2 sama dengan 14."
}
```

`answer`, `options`, dan `correctIndex` dapat dibuat saat runtime, tetapi hasilnya harus divalidasi sebelum ditampilkan. Jangan menyimpan nilai yang dihitung dari input UI tanpa validasi.

Contoh state level:
```js
{
  levelId: 1,
  questionIndex: 0,
  score: 0,
  lives: 3,
  coins: 0,
  correctCount: 0,
  incorrectCount: 0,
  combo: 0,
  status: "PLAYING"
}
```

## 6. Generator dan Validator Soal
1. Pilih pasangan faktor sesuai fokus level.
2. Hitung jawaban benar dengan `a * b`.
3. Buat dua opsi salah yang berbeda dari jawaban benar dan satu sama lain.
4. Batasi opsi salah pada rentang yang masuk akal, tetapi jangan mengubah jawaban benar.
5. Acak tiga opsi.
6. Hitung `correctIndex` setelah pengacakan.
7. Validasi: panjang opsi 3, semua unik, tepat satu opsi sama dengan jawaban, faktor 1–10.
8. Validasi daftar soal level agar tidak ada pasangan faktor identik atau terbalik dalam level yang sama, kecuali aturan konten sengaja mengizinkannya.
9. Jika validasi gagal, generate ulang dengan batas percobaan; bila tetap gagal, gunakan fallback yang sudah diuji.

Hindari `sort(() => Math.random() - 0.5)` sebagai metode pengacakan utama. Gunakan Fisher–Yates shuffle.

## 7. Sistem Gerbang dan Penilaian
- Setiap soal menghasilkan tiga gerbang yang ditempatkan pada jalur kiri, tengah, dan kanan.
- Gerbang menampilkan angka opsi yang sudah diacak.
- Pemain mengubah jalur robot menggunakan input.
- Ketika zona trigger gerbang tercapai, baca gerbang pada jalur robot saat itu.
- Tandai soal sebagai `resolved` sebelum memberikan skor untuk mencegah trigger ganda.
- Bandingkan angka gerbang dengan jawaban benar.
- Tampilkan feedback, perbarui skor/nyawa, lalu lanjutkan ke soal berikutnya.
- Jika pemain tidak memilih jalur sebelum batas keputusan, tentukan kebijakan yang adil dan konsisten: beri kesempatan memilih sampai titik batas yang terlihat; jika tetap tidak memilih, catat sebagai tidak terjawab dan terangkan jawaban benar. Jangan diam-diam memilih opsi untuk pemain.

**Penting:** jangan menilai jawaban berdasarkan tombol kiri/kanan yang ditekan. Penilaian harus berdasarkan opsi gerbang yang benar-benar dilewati robot.

## 8. Tahapan Implementasi dan Definition of Done
### Tahap 0 — Setup
- Buat repo dan struktur file.
- Siapkan `package.json`, Vite, dan konfigurasi base path jika digunakan.
- Tambahkan README awal.
**Selesai jika:** development server berjalan dan halaman tampil tanpa error.

### Tahap 1 — Scene 3D dan responsivitas
- Inisialisasi scene, kamera, renderer, pencahayaan, resize.
- Buat lintasan sederhana dengan tiga jalur dan horizon.
**Selesai jika:** scene tampil pada desktop/mobile dan resize tidak merusak rasio.

### Tahap 2 — Robot
- Bangun robot dari geometri sederhana.
- Tambahkan animasi idle/run dan perpindahan jalur.
**Selesai jika:** robot konsisten, tanpa mulut, dapat bergerak pada tiga jalur.

### Tahap 3 — Gerbang
- Render tiga gerbang dengan angka besar.
- Tambahkan gerakan lintasan dan trigger gerbang.
**Selesai jika:** jalur yang dilewati dapat diidentifikasi tepat satu kali.

### Tahap 4 — Sistem soal
- Buat generator, pengacakan opsi, dan validator.
- Sambungkan soal ke gerbang.
**Selesai jika:** 100% soal yang diuji mempunyai tiga opsi unik dan satu jawaban benar.

### Tahap 5 — State, skor, nyawa, feedback
- Implementasikan state machine, pause, resume, restart, skor, nyawa, dan feedback.
**Selesai jika:** setiap soal diproses satu kali dan hasil akhir akurat.

### Tahap 6 — Lima level
- Konfigurasikan fokus materi dan tema visual setiap level.
- Implementasikan pembukaan level berikutnya.
**Selesai jika:** lima level masing-masing mempunyai 10 soal valid.

### Tahap 7 — UI, audio, dan aksesibilitas
- Implementasikan menu, petunjuk, HUD, hasil, kontrol mobile, dan pengaturan suara.
**Selesai jika:** alur lengkap dapat dilakukan tanpa keyboard di perangkat sentuh, dan angka tetap terbaca.

### Tahap 8 — Testing dan optimasi
- Jalankan unit test, smoke test, tes manual, dan tes browser.
- Perbaiki error console, performa, dan masalah input.
**Selesai jika:** semua tes P0/P1 lulus.

### Tahap 9 — Build dan deployment
- Jalankan build produksi.
- Uji folder output melalui preview server.
- Deploy ke GitHub Pages.
**Selesai jika:** game dapat diakses dari URL publik dan aset tidak mengalami 404.

## 9. Strategi Git dan Checkpoint
Gunakan commit terpisah untuk tahap utama:
1. `chore: initialize project`
2. `feat: add 3d scene and track`
3. `feat: add robot movement`
4. `feat: add answer gates`
5. `feat: add multiplication question system`
6. `feat: add scoring and level flow`
7. `feat: add responsive UI and feedback`
8. `test: add validation and gameplay tests`
9. `chore: prepare github pages deployment`

Jangan menimpa versi stabil tanpa commit atau backup. Setelah setiap tahap, jalankan ulang tes yang terkait.

## 10. Deployment GitHub Pages
### Jika menggunakan Vite
- Atur `base` di `vite.config.js` ke `/<nama-repo>/` untuk proyek GitHub Pages berbasis subpath.
- Pastikan seluruh aset memakai path yang sesuai.
- Jalankan `npm run build`.
- Uji hasil dengan `npm run preview`.
- Publikasikan folder `dist` melalui GitHub Actions atau pengaturan Pages yang sesuai.

### Jika tanpa bundler
- Gunakan path relatif untuk file CSS, JavaScript, dan aset.
- Pastikan import Three.js tidak bergantung pada path lokal.
- Uji URL halaman pada subpath repo, bukan hanya `localhost`.

## 11. Risiko Teknis
- **WebGL tidak tersedia:** tampilkan pesan yang jelas dan petunjuk menggunakan browser/perangkat yang mendukung.
- **Laju frame tidak stabil:** gunakan delta time, batasi efek, dan kurangi detail.
- **Input berulang:** debounce atau batasi perpindahan per event; jangan mengabaikan input sah saat pemain bergerak.
- **Gerbang terpicu berkali-kali:** gunakan flag resolved dan identitas soal.
- **Perbedaan ukuran layar:** hitung ulang kamera dan renderer saat resize.
- **Asset path gagal:** uji deployment pada base path repo.
- **Randomisasi soal menghasilkan opsi invalid:** validasi dan tes generator.

## 12. Urutan Prompt untuk AI Coding
Gunakan instruksi bertahap:
1. “Baca PRD.md dan DEVELOPMENT_PLAN.md. Implementasikan Tahap 0–1 saja. Jangan melanjutkan ke tahap lain sebelum kode dapat dijalankan.”
2. “Implementasikan Tahap 2. Pertahankan semua kontrak dan struktur yang ada. Jalankan tes terkait.”
3. “Implementasikan Tahap 3–4. Tambahkan tes untuk validasi opsi dan pemilihan gerbang.”
4. “Implementasikan Tahap 5–6. Pastikan pause, restart, skor, nyawa, dan level berjalan benar.”
5. “Implementasikan Tahap 7–8. Jalankan seluruh pengujian dan perbaiki semua bug yang ditemukan.”
6. “Siapkan deployment GitHub Pages, periksa base path dan aset, lalu berikan instruksi publikasi.”

Pada setiap tahap, minta AI menyebutkan file yang diubah, tes yang dijalankan, hasil tes, dan keterbatasan yang masih ada. Jangan mengklaim tes lulus jika tidak benar-benar dijalankan.
