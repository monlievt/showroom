# 📖 Buku Panduan Operasional & Panduan Penggunaan Sistem
## Aplikasi Manajemen Showroom & Bengkel Mandiri — Nur Mobil

---

### Daftar Isi
1. [Pendahuluan & Filosofi Sistem](#1-pendahuluan--filosofi-sistem)
2. [Gudang Bahan Habis Pakai & Servis Mandiri Garasi](#2-gudang-bahan-habis-pakai--servis-mandiri-garasi)
3. [Alur Penerimaan Unit Baru (Intake) & Dialog Langkah Lanjutan](#3-alur-penerimaan-unit-baru-intake--dialog-langkah-lanjutan)
4. [Manajemen Inventori & Tombol Aksi Kontekstual](#4-manajemen-inventori--tombol-aksi-kontekstual)
5. [Dashboard Eksekutif, Asisten AI & Alarm Proaktif Piutang](#5-dashboard-eksekutif-asisten-ai--alarm-proaktif-piutang)
6. [Penjualan, Penagihan Piutang & Cetak Dokumen Legal (PDF)](#6-penjualan-penagihan-piutang--cetak-dokumen-legal-pdf)
7. [Jembatan Otomatis Bagi Hasil Investor (Profit Sharing)](#7-jembatan-otomatis-bagi-hasil-investor-profit-sharing)
8. [Buku Kas BCA, Pengeluaran Operasional & Modal Saham](#8-buku-kas-bca-pengeluaran-operasional--modal-saham)

---

## 1. Pendahuluan & Filosofi Sistem

Aplikasi **Nur Mobil Showroom** dirancang khusus untuk mengakomodasi realitas bisnis showroom mobil bekas harian:
- **Akuntansi HPP Riil:** Setiap rupiah yang keluar untuk unit (beli lelang, perbaikan cat, salon poles, hingga ganti oli) tercatat presisi membentuk Harga Pokok Penjualan (HPP).
- **Efisiensi Servis Mandiri:** Pekerjaan ringan seperti ganti oli dan detailing interior dilakukan sendiri di garasi menggunakan stok grosir, di mana selisih biaya grosir dan tarif servis diakui sebagai **Upah Jasa Garasi Mandiri**.
- **Penjualan Tempo & Pengawalan Piutang:** Transaksi penjualan ke showroom rekanan atau konsumen bertahap dikawal dengan sistem jatuh tempo 14 hari dan pengingat WhatsApp 1-klik.
- **Kemitraan Investor Transparan:** Bagi hasil investor dieksekusi secara otomatis dan deterministik saat unit lunas.

---

## 2. Gudang Bahan Habis Pakai & Servis Mandiri Garasi
*Lokasi Menu: Sidebar > Menu Operasional > Gudang Bahan & Alat*

Fitur ini menjawab kebutuhan stok barang habis pakai seperti **Oli mesin, Filter oli, Bohlam lampu, Sabun cuci & Kompon poles**, serta pencatatan aset peralatan garasi (Dongkrak, Polisher, Mesin Cuci Steam).

### A. Konsep Selisih Harga Modal vs Tarif Alokasi Unit
Saat Anda membeli oli grosir Rp 320.000 (misal 1 galon 4L + filter) dan Anda mengganti oli sendiri di garasi dengan membebankan Rp 500.000 ke modal mobil:
1. **Modal HPP Mobil:** Bertambah **Rp 500.000** (vendor tercatat sebagai *"Garasi Mandiri Nur Mobil"*).
2. **Stok Fisik Gudang:** Berkurang otomatis (misal oli berkurang 1 galon, filter berkurang 1 pcs).
3. **Laba Jasa Garasi:** Selisih **Rp 180.000** (Rp 500.000 - Rp 320.000) masuk ke metrik **Laba Jasa Garasi Mandiri Terkumpul**. Dana ini merupakan upah keringat/jasa Anda sendiri tanpa keluar uang ke bengkel luar.

### B. Cara Menggunakan:
1. **Input Stok Baru:**
   - Masuk ke tab **Stok Bahan Habis Pakai**.
   - Klik **+ Tambah Bahan Habis Pakai**.
   - Masukkan nama bahan, kategori (Oli/Pelumas, Filter, Lampu, Detailing, dll), jumlah stok, satuan, dan harga beli per unit.
2. **Alokasikan ke Mobil (Servis/Salon Mandiri):**
   - Di daftar bahan, klik tombol **Pakai ke Mobil**.
   - Pilih mobil yang sedang dikerjakan (misal: *Avanza G 2019 B 1234 ABC*).
   - Masukkan jumlah yang dipakai (misal: 1 galon).
   - Masukkan **Tarif Alokasi ke Modal Mobil** (misal: Rp 500.000). Sistem akan menampilkan live preview laba jasa Anda.
   - Klik **Simpan & Potong Stok**. HPP mobil langsung ter-update otomatis.

---

## 3. Alur Penerimaan Unit Baru (Intake) & Dialog Langkah Lanjutan
*Lokasi Menu: Sidebar > Menu Operasional > Data Mobil (Inventori) > + Tambah Mobil Baru*

Setiap kali Anda memenangkan unit di balai lelang (IBID, JBA, Balindo) atau membeli unit tukar tambah:

### A. Langkah Input Intake:
1. Masukkan Plat Nomor, Merk, Model, Varian, Tahun, Warna, Transmisi, dan Odometer (KM).
2. Pilih Asal Unit: **Lelang** (pilih Lot: *Eks Perusahaan* atau *Eks Tarikan Leasing*) atau **Beli Langsung / Tukar Tambah**.
3. Masukkan Harga Beli, Biaya Admin Lelang, dan Status BPKB (*Ready* atau *Pending Kedatangan*).
4. Klik **Simpan Unit Baru**.

### B. Next-Step Dialog Interaktif:
Setelah unit tersimpan, sistem tidak langsung me-redirect kosong, melainkan memunculkan dialog pop-up konfirmasi dengan pilihan:
- **Ganti Oli Mandiri Sekarang:** Langsung membuka modal pemakaian stok bahan garasi.
- **Cetak Surat Jalan Bengkel (PDF):** Dokumen resmi pengantar sopir/bengkel luar jika mobil butuh cat bodi atau perbaikan kaki-kaki.
- **Mulai Inspeksi Cek Fisik:** Membuka lembar inspeksi 11 panel bodi dan ketebalan cat (mikron).
- **Upload Foto & Dokumen Unit:** Upload foto STNK, Faktur, BPKB, dan foto display fisik mobil.

---

## 4. Manajemen Inventori & Tombol Aksi Kontekstual
*Lokasi Menu: Sidebar > Menu Operasional > Data Mobil (Inventori)*

Tabel inventori kini menggunakan sistem **1 Tombol Aksi Utama Kontekstual + Dropdown `[...]`**:

| Status Unit Mobil | Tombol Aksi Utama | Opsi di Menu Titik Tiga `[...]` |
| :--- | :--- | :--- |
| **INTAKE** (Baru Masuk) | **Cek Fisik** (warna biru) | Catat Biaya/Servis, Ganti Oli Mandiri, Cetak Surat Jalan Bengkel, Ubah Data Unit, Hapus Unit |
| **IN_REPAIR** (Sedang Perbaikan) | **Catat Servis** (warna oranye) | Cek Fisik Ulang, Tag Spion Siap Jual, Ganti Oli Mandiri, Cetak Surat Jalan Bengkel, Ubah Data |
| **READY_FOR_SALE** (Siap Dipajang) | **Tag Spion** (warna hijau) | Cetak Price Tag Spion (PDF), Spesifikasi Lengkap, Catat Penjualan, Ubah Data Unit |
| **BOOKED** (Sudah Di-DP) | **Update Status** (warna ungu) | Catat Pelunasan, Batalkan Booking, Lihat Detail Penjualan |
| **SOLD_SETTLED** (Terjual Lunas) | **Terjual Lunas** (warna abu-abu) | Lihat Riwayat Transaksi, Cetak Kuitansi PDF, Cetak BAST PDF |

---

## 5. Dashboard Eksekutif, Asisten AI & Alarm Proaktif Piutang
*Lokasi Menu: Sidebar > Menu Utama > Dashboard*

Dashboard menyajikan rangkuman komando harian yang proaktif:

### A. Asisten AI Showroom (Gemini AI):
- Menghasilkan briefing keputusan harian berdasarkan pola historis riil (pola lelang eks perusahaan, perputaran unit, dan proyeksi kas 14 hari).
- Kolom konsultasi interaktif untuk menanyakan kelayakan kulakan mobil tertentu dengan sisa saldo kas BCA berjalan.

### B. Alarm Proaktif Piutang Tempo 14 Hari (Fitur Baru):
- Muncul secara otomatis di bagian atas dashboard jika ada penjualan yang mendekati atau melewati tempo 14 hari.
- **Tombol Hijau 1-Klik Kirim WA Tagihan:** Sekali klik langsung membuka aplikasi WhatsApp dengan pesan sopan dan profesional:
  > *"Halo Pak/Bu [Nama Pembeli], Konfirmasi sisa pelunasan untuk unit [Merk Model] (Plat [Nomor Plat]) sebesar [Nominal Sisa] yang jatuh tempo pada [Tanggal]. Mohon konfirmasi bukti transfer jika sudah melakukan pembayaran ke rekening resmi Nur Mobil. Terima kasih!"*

---

## 6. Penjualan, Penagihan Piutang & Cetak Dokumen Legal (PDF)
*Lokasi Menu: Sidebar > Menu Operasional > Penjualan & Piutang*

Mendukung transaksi retail perorangan, tukar tambah (trade-in), maupun penjualan tempo ke showroom rekanan.

### A. Transaksi & Catat Angsuran:
1. Klik **+ Catat Penjualan Baru** saat ada mobil terjual.
2. Masukkan harga jual kesepakatan, DP/pembayaran awal, dan tanggal jatuh tempo pelunasan.
3. Untuk mencatat angsuran berikutnya: Klik tombol `+` di tabel penjualan atau buka halaman detail transaksi, masukkan nominal pembayaran (Transfer BCA / Cash).

### B. Dokumen Legal Otomatis (Standar Industri):
Untuk setiap unit yang terjual, tersedia 3 dokumen resmi berformat PDF siap cetak:
1. **Kuitansi Pembayaran / Faktur:** Dilengkapi tempat meterai resmi Rp 10.000 dan nomor invoice unik.
2. **Surat Perjanjian Jual Beli (SPK):** Memuat syarat & ketentuan garansi mesin, transmisi, keabsahan dokumen, dan klausul batas tempo pelunasan.
3. **Berita Acara Serah Terima (BAST):** Bukti serah terima fisik kunci, STNK, BPKB, dan kelengkapan mobil dari pihak showroom ke pembeli.

---

## 7. Jembatan Otomatis Bagi Hasil Investor (Profit Sharing)
*Lokasi Menu: Terintegrasi di Penjualan & Menu Keuangan > Bagi Hasil*

Menghilangkan keharusan admin mencatat atau mencari manual unit investor yang sudah lunas.

### A. Alur Kerja Otomatis:
1. Saat pembayaran terakhir dicatat dan status unit menjadi **LUNAS 100% (Settled)**:
2. Sistem secara instan memunculkan **Settlement Success Dialog**:
   - Jika unit didanai investor: Muncul nama investor dan tombol **"Eksekusi Bagi Hasil Investor Sekarang (1-Klik)"**.
   - Admin cukup menekan tombol tersebut, sistem langsung membagi dividen secara deterministik sesuai aturan tiering, memotong modal pokok, dan mencatat mutasi di *Capital Ledger*.
3. Di tabel Penjualan, setiap unit lunas memiliki badge status:
   - 🟠 **Siap Bagi Hasil:** Unit investor yang lunas dan siap dibagi dividennya (lengkap dengan tombol pintas jabat tangan).
   - 🟢 **Bagi Hasil Selesai:** Dividen telah berhasil dibagikan dan tercatat rapi.
   - ⚪ **100% Modal Showroom:** Unit modal mandiri.

---

## 8. Buku Kas BCA, Pengeluaran Operasional & Modal Saham
*Lokasi Menu: Sidebar > Menu Keuangan*

- **Buku Kas & Mutasi BCA:** Memantau saldo riil rekening bank, arus kas masuk dari penjualan, dan arus kas keluar untuk kulakan unit atau operasional.
- **Biaya Operasional:** Mencatat beban tetap seperti sewa garasi, listrik, air, konsumsi mekanik, dan gaji karyawan.
- **Manajemen Investor:** Mengelola modal titipan investor, memantau bagi hasil berjalan, dan mengonfigurasi aturan tiering pembagian laba (*Profit Share Rules*).

---
*Dokumen ini diperbarui secara berkala sesuai pembaruan sistem Nur Mobil Showroom.*
