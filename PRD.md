# PRD — Robot Math Adventure 3D
**Versi:** 1.0  
**Status:** Spesifikasi awal untuk implementasi  
**Produk:** Game edukasi perkalian 1–10 untuk siswa sekolah dasar

## 1. Ringkasan Produk
Robot Math Adventure 3D adalah game edukasi berbasis browser yang menggabungkan latihan perkalian dengan genre 3D endless runner. Pemain mengendalikan robot kartun biru-kuning tanpa mulut, lalu memilih satu dari tiga gerbang jawaban pada lintasan. Game dirancang untuk membuat latihan perkalian terasa aktif, menyenangkan, dan memberikan umpan balik belajar.

## 2. Tujuan Produk
- Membantu siswa berlatih perkalian 1–10.
- Memberikan umpan balik langsung untuk jawaban benar dan salah.
- Mendorong ketelitian, kecepatan berpikir, dan motivasi berlatih.
- Dapat dimainkan di komputer dan perangkat seluler melalui browser.
- Dapat di-hosting sebagai situs statis di GitHub Pages.

## 3. Pengguna Sasaran
- Pengguna utama: siswa SD kelas 1–3, khususnya siswa yang sedang belajar perkalian.
- Pengguna pendamping: guru dan orang tua.
- Bahasa antarmuka: Bahasa Indonesia.
- Interaksi harus sederhana, visual, ramah anak, dan tidak mempermalukan siswa saat salah menjawab.

## 4. Ruang Lingkup
### Termasuk dalam versi pertama (MVP)
1. Halaman pembuka dan petunjuk.
2. Karakter robot 3D biru-kuning tanpa mulut.
3. Lingkungan lintasan 3D dengan tiga jalur.
4. Lima level; setiap level terdiri dari tepat 10 soal.
5. Setiap soal memiliki tepat tiga opsi jawaban: satu benar dan dua salah.
6. Gerbang jawaban di jalur kiri, tengah, dan kanan.
7. Kontrol keyboard serta kontrol sentuh/swipe.
8. Skor, nyawa, koin, indikator level, dan kemajuan soal.
9. Umpan balik benar/salah dan penjelasan singkat.
10. Ringkasan hasil setiap level.
11. Penyimpanan skor terbaik dan progres sederhana di `localStorage`.
12. Tombol jeda, lanjut, ulangi, dan kembali ke menu.
13. Desain responsif untuk desktop dan ponsel.
14. README dan panduan deployment GitHub Pages.

### Tidak termasuk dalam MVP
- Akun pengguna atau login.
- Server, database daring, leaderboard global, atau sinkronisasi ant perangkat.
- Pembelian dalam aplikasi atau iklan.
- Editor soal visual untuk guru.
- Multiplayer.
- Fisika kompleks atau model karakter eksternal berukuran besar.
- Pelacakan data pribadi siswa.

## 5. Prinsip Desain
- **Belajar lebih utama daripada hukuman:** kesalahan menjadi kesempatan belajar.
- **Terbaca:** angka soal dan opsi harus besar serta kontras.
- **Konsisten:** robot, warna UI, kontrol, dan aturan tidak berubah tanpa alasan.
- **Ringan:** aset lokal/prosedural diprioritaskan agar mudah di-hosting.
- **Aksesibel:** jangan menggunakan warna sebagai satu-satunya pembeda; angka dan label harus jelas.
- **Aman untuk anak:** tanpa chat, iklan, tautan eksternal yang tidak perlu, atau pengumpulan data pribadi.

## 6. Alur Pengguna
1. Pemain membuka halaman game.
2. Pemain memilih **Mulai Bermain** atau **Petunjuk**.
3. Pemain memilih level yang tersedia.
4. Game menampilkan soal, misalnya `7 × 2 = ?`, dan tiga gerbang bernomor.
5. Pemain mengarahkan robot ke salah satu jalur.
6. Ketika gerbang terlewati, game memeriksa opsi yang dipilih.
7. Game menampilkan umpan balik, memperbarui skor/nyawa, lalu melanjutkan ke soal berikutnya.
8. Setelah 10 soal, game menampilkan ringkasan hasil.
9. Pemain dapat mengulang level atau melanjutkan ke level berikutnya sesuai aturan pembukaan level.

## 7. Level dan Cakupan Materi
Setiap level memiliki tepat 10 soal. Total satu putaran lengkap adalah 50 soal.

- **Level 1 — Kota Robot:** fokus perkalian 1, 2, dan 3.
- **Level 2 — Hutan Energi:** fokus perkalian 2, 3, 4, dan 5.
- **Level 3 — Terowongan Angka:** fokus perkalian 4, 5, 6, dan 7.
- **Level 4 — Kota Teknologi:** fokus perkalian 6, 7, 8, dan 9.
- **Level 5 — Galaksi Robot:** campuran perkalian 1–10.

Fokus level merupakan panduan distribusi soal, bukan batasan mutlak. Semua soal harus sesuai dengan perkalian 1–10. Tidak boleh ada pembagian atau operasi lain pada versi pertama.

## 8. Aturan Soal dan Opsi
- Setiap soal menggunakan dua faktor bilangan bulat dari 1 sampai 10.
- Jawaban benar dihitung dari hasil perkalian kedua faktor.
- Setiap soal mempunyai tepat tiga opsi yang unik.
- Tepat satu opsi sama dengan hasil perkalian.
- Dua opsi salah tidak boleh sama dengan satu sama lain atau dengan jawaban benar.
- Urutan opsi diacak per soal.
- Dalam satu level, hindari soal identik dengan pasangan faktor yang sama; pasangan terbalik seperti `3 × 4` dan `4 × 3` sebaiknya juga dihindari dalam level yang sama.
- Soal yang muncul kembali setelah pemain mengulang level boleh diacak ulang.
- Opsi salah harus masuk akal untuk tingkat siswa, tetapi tidak boleh mengakibatkan lebih dari satu jawaban benar.
- Semua soal dan opsi harus divalidasi otomatis sebelum ditampilkan.

## 9. Aturan Gameplay
- Robot berlari otomatis pada lintasan dengan tiga jalur.
- Pemain berpindah jalur kiri/tengah/kanan untuk memilih gerbang jawaban.
- Gerbang yang dilewati menentukan jawaban; tombol keyboard tidak boleh langsung menetapkan jawaban tanpa memperhatikan jalur/gerbang.
- Jawaban benar: tambah 100 poin.
- Jawaban salah: kurangi satu nyawa dan tampilkan jawaban benar beserta penjelasan singkat.
- Nyawa awal: 3 per level.
- Setelah 10 soal diproses, level selesai jika nyawa masih tersedia; jika nyawa habis lebih dahulu, tampilkan game over dan ringkasan percobaan.
- Koin merupakan bonus koleksi dan tidak mengubah kebenaran jawaban.
- Bonus combo boleh diberikan untuk jawaban benar beruntun, tetapi tidak boleh membuat skor dasar ambigu.
- Satu gerbang hanya boleh memproses satu jawaban satu kali.
- Jeda menghentikan pergerakan, timer (jika aktif), animasi gameplay, dan pemrosesan gerbang.
- Timer dimatikan secara default atau dapat diaktifkan sebagai pengaturan opsional; pembelajaran tidak boleh gagal hanya karena timer UI tidak terlihat.

## 10. Karakter dan Arahan Visual
- Robot kartun 3D, dominan biru dan kuning.
- Tidak memiliki mulut.
- Bentuk geometris sederhana dan ekspresif melalui mata, pose, dan animasi.
- Animasi minimum: idle, run, lane-change, correct/celebrate, incorrect, victory, defeat.
- Lingkungan: lintasan futuristik dengan horizon yang jelas dan tiga jalur yang mudah dibedakan.
- Gerbang jawaban menampilkan angka besar.
- UI: panel soal gelap, teks kontras, tombol membulat, indikator skor/koin/nyawa.
- Efek visual tidak boleh menutupi angka atau mengganggu fokus belajar.

## 11. Kontrol
### Desktop
- Panah kiri / A: pindah satu jalur ke kiri.
- Panah kanan / D: pindah satu jalur ke kanan.
- Spasi / tombol UI: jeda atau lanjut.
- Input harus dibatasi agar robot tidak berpindah melebihi tiga jalur.

### Mobile
- Swipe kiri/kanan untuk berpindah jalur.
- Tombol virtual kiri/kanan dapat disediakan sebagai alternatif.
- Area sentuh harus cukup besar dan tidak menutupi soal atau gerbang.

## 12. Skor, Nyawa, dan Evaluasi
- Jawaban benar: +100.
- Jawaban salah: -1 nyawa.
- Persentase ketepatan = jumlah benar / jumlah soal yang diproses × 100%.
- Hasil level menampilkan: jumlah benar, jumlah salah, persentase ketepatan, skor, koin, dan materi yang perlu dilatih.
- Jangan menampilkan pesan yang mempermalukan siswa.
- Skor terbaik disimpan lokal; simpan hanya data permainan nonpribadi.
- Status progres level boleh disimpan di `localStorage`, dengan opsi mulai ulang/reset.

## 13. Kebutuhan Fungsional
- **FR-01:** Game menampilkan halaman awal dan petunjuk.
- **FR-02:** Game merender lingkungan 3D dan robot.
- **FR-03:** Robot dapat berpindah di antara tiga jalur.
- **FR-04:** Game menghasilkan 10 soal valid per level.
- **FR-05:** Setiap soal menampilkan tepat tiga opsi.
- **FR-06:** Jawaban benar dan posisi opsi diacak dengan validasi.
- **FR-07:** Gerbang yang dilewati menjadi jawaban yang dinilai.
- **FR-08:** Skor dan nyawa diperbarui satu kali per soal.
- **FR-09:** Umpan balik menampilkan benar/salah dan hasil yang benar.
- **FR-10:** Game menampilkan ringkasan akhir level.
- **FR-11:** Level berikutnya dapat dibuka sesuai aturan progres.
- **FR-12:** Game menyediakan pause, resume, restart, dan kembali ke menu.
- **FR-13:** Kontrol desktop dan mobile berfungsi.
- **FR-14:** Progres dan skor terbaik disimpan lokal.
- **FR-15:** Game tetap menampilkan pesan yang jelas jika terjadi kegagalan aset atau WebGL.

## 14. Kebutuhan Nonfungsional
- Berjalan pada browser modern yang mendukung WebGL.
- Tidak membutuhkan backend, akun, atau API key.
- Semua dependensi dan aset yang diperlukan harus tersedia saat deployment.
- Target performa: mendekati 60 FPS pada perangkat yang mendukung; perangkat lebih rendah tetap dapat dimainkan dengan mengurangi efek.
- Layout responsif dan teks tetap terbaca pada lebar layar ponsel.
- Kode modular, mudah dibaca, dan memiliki penanganan error.
- Tidak mengirim data pribadi ke server.
- Tidak menyertakan aset berhak cipta tanpa izin.

## 15. Kriteria Penerimaan
Produk dapat dinyatakan siap untuk rilis awal jika:
1. Semua lima level tersedia.
2. Setiap level memproses tepat 10 soal.
3. Setiap soal menampilkan tepat tiga opsi unik dan satu jawaban benar.
4. Seluruh hasil perkalian tervalidasi.
5. Gerbang yang dilewati menentukan jawaban.
6. Tidak ada skor ganda atau pengurangan nyawa ganda pada satu soal.
7. Pause benar-benar menghentikan simulasi gameplay.
8. Ringkasan hasil akurat.
9. Kontrol keyboard dan mobile berfungsi.
10. Game dapat dimuat dari GitHub Pages dengan path aset yang benar.
11. Tidak ada error kritis yang diketahui di console saat alur utama dimainkan.
12. README menjelaskan cara menjalankan dan deploy game.

## 16. Risiko dan Mitigasi
- **Performa 3D rendah:** gunakan geometri sederhana, batasi partikel, dan sediakan pengaturan kualitas.
- **Input terlalu sulit untuk anak:** sediakan tombol virtual dan petunjuk kontrol.
- **Gerbang terlewat sebelum siswa memilih:** atur jarak baca, kecepatan awal lambat, dan jendela keputusan yang cukup.
- **Opsi salah tidak valid:** gunakan validator soal dan tes otomatis.
- **Path aset gagal di GitHub Pages:** gunakan path relatif dan uji deployment dari subpath repositori.
- **Game terasa menghukum:** gunakan bahasa positif dan tampilkan pembahasan jawaban.

## 17. Asumsi yang Dapat Diubah
- Skor dasar benar: 100 poin.
- Nyawa awal: 3 per level.
- Lima level dengan 10 soal masing-masing.
- Timer tidak wajib dan nonaktif secara default.
- Progres disimpan lokal pada perangkat yang sama.
