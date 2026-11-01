# Test Plan — Robot Math Adventure 3D
**Versi:** 1.0

## 1. Tujuan
Memastikan logika matematika, pemilihan gerbang, skor, nyawa, state permainan, kontrol, responsivitas, dan deployment bekerja sesuai PRD.

## 2. Prioritas
- **P0:** Menghalangi permainan atau menyebabkan jawaban/skor salah.
- **P1:** Fitur utama tidak berjalan pada kondisi tertentu.
- **P2:** Masalah visual atau kenyamanan yang tidak menghalangi permainan.

## 3. Tes Fungsional
| ID | Skenario | Hasil yang diharapkan | Prioritas |
|---|---|---|---|
| T-001 | Buka halaman awal | Menu tampil tanpa error kritis | P0 |
| T-002 | Mulai level | Robot, lintasan, HUD, dan soal tampil | P0 |
| T-003 | Periksa jumlah soal level | Tepat 10 soal diproses per level | P0 |
| T-004 | Periksa opsi setiap soal | Tepat 3 opsi unik | P0 |
| T-005 | Validasi jawaban | Tepat satu opsi sama dengan hasil perkalian | P0 |
| T-006 | Periksa faktor | Kedua faktor berada pada rentang 1–10 | P0 |
| T-007 | Pilih gerbang benar | Skor bertambah 100 satu kali dan feedback benar muncul | P0 |
| T-008 | Pilih gerbang salah | Nyawa berkurang satu kali dan jawaban benar dijelaskan | P0 |
| T-009 | Trigger gerbang berulang | Satu soal tidak dinilai dua kali | P0 |
| T-010 | Kehabisan nyawa | Game over tampil dan hasil percobaan akurat | P0 |
| T-011 | Selesaikan 10 soal | Ringkasan level tampil dengan statistik benar | P0 |
| T-012 | Jeda permainan | Gerak, timer, dan trigger berhenti | P0 |
| T-013 | Lanjutkan permainan | Permainan kembali dari state yang benar | P1 |
| T-014 | Ulangi level | Skor/nyawa/indeks soal direset sesuai aturan | P0 |
| T-015 | Keyboard | Panah dan A/D memindahkan robot satu jalur | P1 |
| T-016 | Swipe mobile | Swipe kiri/kanan bekerja tanpa scroll yang mengganggu | P1 |
| T-017 | Resize layar | Kamera, renderer, dan UI menyesuaikan layar | P1 |
| T-018 | Simpan skor | Skor terbaik tersimpan setelah reload | P1 |
| T-019 | Aset tidak tersedia | Pesan fallback muncul; tidak terjadi crash total | P1 |
| T-020 | GitHub Pages | File JS/CSS/aset tidak 404 di URL subpath | P0 |

## 4. Tes Logika Matematika
- Uji seluruh pasangan faktor yang diizinkan.
- Pastikan `answer === a * b`.
- Pastikan `options.length === 3`.
- Pastikan `new Set(options).size === 3`.
- Pastikan `options.filter(x => x === answer).length === 1`.
- Pastikan `correctIndex` menunjuk pada nilai jawaban benar.
- Pastikan pasangan soal tidak duplikat dalam satu level sesuai aturan PRD.
- Pastikan persentase ketepatan tidak menghasilkan `NaN` saat belum ada soal diproses.

## 5. Tes State dan Skor
- Satu gerbang tidak boleh mengurangi nyawa atau menambah skor dua kali.
- Input gameplay tidak boleh mengubah jalur saat state `PAUSED`, `MENU`, atau `GAME_OVER`.
- Restart harus menghapus gerbang dan efek yang tersisa.
- Setelah level selesai, input gerbang tidak boleh mengubah hasil.
- Skor akhir harus sesuai dengan jawaban yang diproses.
- Kebijakan untuk soal tidak terjawab harus konsisten dan ditampilkan jelas.

## 6. Tes Visual dan Perangkat
- Desktop: lebar 1280×720 dan 1920×1080.
- Mobile: lebar 360×800 dan 390×844.
- Pastikan panel soal dan angka gerbang tidak terpotong.
- Pastikan kontrol mudah disentuh dan tidak menutupi informasi penting.
- Pastikan robot dan gerbang terlihat jelas.
- Pastikan efek visual tidak mengurangi keterbacaan.

## 7. Tes Performa dan Browser
- Uji pada setidaknya satu browser desktop berbasis Chromium dan satu browser mobile jika tersedia.
- Periksa console untuk error dan warning penting.
- Pastikan ukuran objek/efek tidak terus bertambah setelah restart.
- Pastikan event listener tidak terpasang berulang kali.
- Uji kondisi WebGL tidak tersedia atau gagal dibuat.
- Periksa frame rate dan turunkan detail bila perangkat sasaran mengalami lag berat.

## 8. Tes Deployment
- Jalankan build produksi.
- Preview hasil build.
- Pastikan path `base` sesuai nama repositori.
- Buka URL GitHub Pages dari perangkat lain atau jendela privat.
- Periksa console dan Network untuk 404.
- Uji alur menu → level → jawaban → hasil di versi online.

## 9. Kriteria Rilis
Rilis awal tidak boleh dilakukan jika masih ada bug P0. Bug P1 harus diperbaiki atau didokumentasikan dengan workaround yang jelas. Catat browser/perangkat, langkah reproduksi, hasil aktual, hasil yang diharapkan, dan status setiap tes.
