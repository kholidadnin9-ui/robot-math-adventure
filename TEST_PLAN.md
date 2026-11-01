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
| T-001 | Buka halaman awal | Menu/halaman tampil tanpa error kritis | P0 |
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
| T-019 | Aset tidak tersedia / WebGL | Pesan fallback muncul; tidak terjadi crash total | P1 |
| T-020 | GitHub Pages | File JS/CSS/aset tidak 404 di URL subpath | P0 |
