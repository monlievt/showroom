# 🧪 SKENARIO PENGETESAN SISTEM END-TO-END (DARI A SAMPAI Z)
## Aplikasi Manajemen Showroom & Bengkel Mandiri — Nur Mobil
*Dokumen UAT (User Acceptance Testing) & QA Test Script Lengkap*

---

## 📋 DAFTAR SKENARIO PENGETESAN

| No | Modul / Skenario Pengujian | Cakupan Fitur |
| :--- | :--- | :--- |
| **01** | **Setup Finansial & Investor** | Pendaftaran Investor, Setoran Modal Pool, Aturan Tiering Bagi Hasil |
| **02** | **Gudang Bahan Habis Pakai & Alat** | Input Stok Grosir Oli & Filter, Inventaris Peralatan Garasi |
| **03** | **Kulakan Mobil Lelang (Intake)** | Input Unit Baru Eks Lelang Perusahaan, Uji Next-Step Dialog |
| **04** | **Servis Ganti Oli Mandiri** | Alokasi Stok Bahan, Pemotongan Stok, Verifikasi Laba Jasa Garasi |
| **05** | **Servis Bengkel Cat Luar** | Catat Biaya Bengkel Luar, Cetak Surat Jalan Bengkel (PDF) |
| **06** | **Inspeksi Fisik 11 Panel** | Cek Ketebalan Mikron Cat, Grading Mesin/Rangka, Cetak Hasil Inspeksi (PDF) |
| **07** | **Showroom Display & Tag Spion** | Update Status Ready for Sale, Cetak Price Tag Kaca Spion (PDF) |
| **08** | **Katalog Publik & Calon Pembeli** | Akses Web Publik, Filter Mobil, Detail Galeri, 1-Klik Chat WhatsApp |
| **09** | **Transaksi Penjualan Tempo & SPK** | Catat Jual Bertahap, Penerimaan DP, Cetak Surat Perjanjian SPK (PDF) |
| **10** | **Monitoring Arus Kas & Alarm Piutang** | Dashboard AI, Alarm Tempo 14 Hari, 1-Klik Kirim WhatsApp Tagihan |
| **11** | **Pelunasan & Dokumen Penyerahan** | Catat Pelunasan Sisa Piutang, Cetak Kuitansi Meterai (PDF) & BAST (PDF) |
| **12** | **Jembatan Bagi Hasil Investor 1-Klik** | Eksekusi Bagi Hasil Otomatis, Mutasi Capital Ledger, Verifikasi Dividen |
| **13** | **Portal Khusus Investor** | Login/Akses Portal Investor, Cek Transparansi Alokasi & Dividen |
| **14** | **Buku Kas BCA, Prive & Asisten AI** | Rekonsiliasi Saldo BCA, Biaya Operasional Showroom, Konsultasi Gemini AI |

---

## SKENARIO 01: SETUP FINANSIAL, INVESTOR & ATURAN TIERING

### 🎯 Tujuan:
Memastikan sistem siap menampung dana modal investor dan aturan bagi hasil sebelum membeli unit.

### 📝 Langkah Pengujian:
1. Buka menu **Sidebar > Manajemen Investor > Akun Investor** (`/admin/investors/accounts`).
2. Klik tombol **+ Tambah Investor Baru** (`/admin/investors/new`).
3. Masukkan data uji:
   - **Nama Lengkap:** `Bpk. Hendra Gunawan`
   - **Nomor Telepon/WA:** `081234567890`
   - **Nomor Rekening Bank:** `BCA - 8830192819 a.n. Hendra Gunawan`
   - **Jenis Kemitraan:** `Tetap (Pool Fund)`
4. Klik **Simpan Akun Investor**.
5. Buka tab **Setoran Modal** (`/admin/investors/deposit/new`), masukkan:
   - **Pilih Investor:** `Bpk. Hendra Gunawan`
   - **Nominal Setoran:** `Rp 150.000.000`
   - **Metode:** `Transfer BCA Rekening Showroom`
   - **Tanggal:** Hari ini.
6. Klik **Simpan Setoran Modal**.
7. Buka tab **Aturan Bagi Hasil (Tier Rules)** (`/admin/investors/tier-rules`):
   - Pastikan aturan aktif: *Tier 1: Laba s/d Rp 10.000.000 (50% Investor : 50% Showroom)*.

### ✅ Hasil yang Diharapkan:
- Profil Bpk. Hendra Gunawan tersimpan rapi.
- Saldo Kas BCA bertambah Rp 150.000.000.
- Modal siap dialokasikan (*Active Allocated Capital*) bertambah Rp 150.000.000.

---

## SKENARIO 02: GUDANG BAHAN HABIS PAKAI & PERALATAN GARASI

### 🎯 Tujuan:
Menguji pencatatan stok grosir oli, filter oli, serta inventaris mesin/alat bengkel.

### 📝 Langkah Pengujian:
1. Buka menu **Sidebar > Gudang Bahan & Alat** (`/admin/finance/assets`).
2. Di tab **Stok Bahan Habis Pakai**, klik **+ Tambah Bahan Habis Pakai**:
   - **Nama Bahan:** `Oli Mesin TMO 10W-40 (Galon 4 Liter)`
   - **Kategori:** `Oli & Pelumas Mesin`
   - **Jumlah Stok Awal:** `10`
   - **Satuan:** `Galon`
   - **Harga Beli Grosir:** `Rp 260.000` per galon.
   - Klik **Simpan Bahan**.
3. Klik **+ Tambah Bahan Habis Pakai** lagi untuk filter:
   - **Nama Bahan:** `Filter Oli Original Avanza/Xenia`
   - **Kategori:** `Filter Oli & Udara`
   - **Jumlah Stok Awal:** `10`
   - **Satuan:** `Pcs`
   - **Harga Beli Grosir:** `Rp 35.000` per pcs.
   - Klik **Simpan Bahan**.
4. Pindah ke tab **Aset Tetap & Peralatan**, klik **+ Tambah Aset Peralatan** (`/admin/finance/assets/new`):
   - **Nama Alat:** `Mesin Cuci Steam High Pressure Laguna 70`
   - **Harga Beli:** `Rp 1.250.000`
   - **Kondisi:** `BAIK / BERFUNGSI NORMAL`
   - Klik **Simpan Aset**.

### ✅ Hasil yang Diharapkan:
- Stok Oli tercatat 10 Galon (nilai modal grosir Rp 2.600.000).
- Stok Filter tercatat 10 Pcs (nilai modal grosir Rp 350.000).
- Alat steam tercatat di daftar inventaris peralatan garasi.

---

## SKENARIO 03: KULAKAN MOBIL LELANG (INTAKE) & NEXT-STEP DIALOG

### 🎯 Tujuan:
Menguji form input intake mobil lelang dan dialog aksi lanjutan pasca simpan unit.

### 📝 Langkah Pengujian:
1. Buka menu **Sidebar > Data Mobil > + Tambah Mobil Baru** (`/admin/inventory/new`).
2. Masukkan data uji mobil lelang:
   - **Plat Nomor:** `B 2489 KMR`
   - **Merk & Model:** `Toyota Avanza 1.3 G M/T`
   - **Tahun Pembuatan:** `2019`
   - **Warna:** `Silver Metalik`
   - **Odometer (KM):** `62.000`
   - **Sumber Pembelian:** `AUCTION (Balai Lelang)`
   - **Balai Lelang:** `IBID Jakarta`
   - **Tipe Lot:** `EKS_PERUSAHAAN`
   - **Harga Faktur Lelang (Hammer):** `Rp 122.000.000`
   - **Biaya Admin Lelang:** `Rp 3.500.000`
   - **Target Harga Jual:** `Rp 148.000.000`
   - **Batas Minimal Jual:** `Rp 142.000.000`
   - **Status BPKB:** `PENDING_ARRIVAL` (Estimasi: 7 hari).
3. Hubungkan ke Investor Bpk. Hendra Gunawan (jika ada pilihan alokasi modal investor).
4. Klik tombol **Simpan Unit Baru**.
5. Perhatikan layar pop-up yang muncul: **Next-Step Success Dialog**.

### ✅ Hasil yang Diharapkan:
- Unit tersimpan dengan status awal **INTAKE**.
- Pop-up Next-Step Dialog muncul dengan 4 tombol: *Ganti Oli Mandiri*, *Cetak Surat Jalan Bengkel*, *Inspeksi 11 Panel*, dan *Upload Foto*.
- HPP awal mobil tercatat **Rp 125.500.000** (Rp 122jt + Rp 3.5jt admin).

---

## SKENARIO 04: SERVIS GANTI OLI MANDIRI & LABA JASA GARASI

### 🎯 Tujuan:
Menguji pemotongan stok bahan habis pakai, penambahan HPP mobil, dan pencatatan laba jasa garasi mandiri.

### 📝 Langkah Pengujian:
1. Pada pop-up Next-Step Dialog (atau via menu **Gudang Bahan & Alat**), pilih **Ganti Oli Mandiri Sekarang**.
2. Di modal alokasi bahan:
   - **Pilih Unit:** `B 2489 KMR — Toyota Avanza 2019`
   - **Bahan 1:** `Oli Mesin TMO 10W-40` (Pakai: 1 Galon).
   - **Bahan 2:** `Filter Oli Original Avanza` (Pakai: 1 Pcs).
   - *Total Modal Beli Grosir: Rp 260.000 + Rp 35.000 = Rp 295.000.*
   - **Tarif Servis yang Dibebankan ke HPP Mobil:** Masukkan `Rp 500.000`.
3. Perhatikan live preview: Selisih laba jasa garasi sebesar **Rp 205.000**.
4. Klik **Simpan & Alokasikan ke Mobil**.

### ✅ Hasil yang Diharapkan:
- Stok Oli di gudang berkurang dari 10 menjadi **9 Galon**.
- Stok Filter berkurang dari 10 menjadi **9 Pcs**.
- HPP Avanza B 2489 KMR bertambah Rp 500.000 (dari Rp 125.5jt menjadi **Rp 126.000.000**).
- Vendor tercatat sebagai *"Garasi Mandiri Nur Mobil"*.
- Metrik **Total Laba Jasa Garasi Terkumpul** bertambah **+Rp 205.000**.

---

## SKENARIO 05: SERVIS BENGKEL CAT LUAR & SURAT JALAN (PDF)

### 🎯 Tujuan:
Menguji pencatatan biaya pengerjaan bengkel luar dan pencetakan surat jalan pengantar sopir.

### 📝 Langkah Pengujian:
1. Buka menu **Data Mobil (Inventori)** (`/admin/inventory`), cari `B 2489 KMR`.
2. Klik tombol menu titik tiga `[...]` pada baris mobil, pilih **Catat Servis / Biaya Unit**.
3. Masukkan data:
   - **Kategori Biaya:** `BODY_PAINT (Cat & Bodi)`
   - **Nama Vendor / Bengkel:** `Bengkel Cat Berkah Jaya`
   - **Deskripsi:** `Cat ulang bumper depan lecet lelang + poles kap mesin`
   - **Nominal Biaya:** `Rp 1.200.000`
   - **Metode Pembayaran:** `Transfer BCA`
4. Klik **Simpan Biaya**.
5. Buka kembali menu titik tiga `[...]`, pilih **Cetak Surat Jalan Bengkel (PDF)**.
6. Periksa file PDF yang terbuka di tab baru.

### ✅ Hasil yang Diharapkan:
- HPP Avanza bertambah menjadi **Rp 127.200.000** (Rp 126.0jt + Rp 1.2jt).
- Kas BCA showroom otomatis terpotong Rp 1.200.000 dengan keterangan pembayaran bengkel.
- PDF Surat Jalan tercetak rapi memuat nama sopir, plat nomor B 2489 KMR, rincian pekerjaan cat bumper, dan kolom tanda tangan serah terima.

---

## SKENARIO 06: INSPEKSI FISIK 11 PANEL (STANDAR ACV IBID)

### 🎯 Tujuan:
Menguji lembar kerja cek fisik 11 panel ketebalan cat bodi dan pencetakan sertifikat inspeksi PDF.

### 📝 Langkah Pengujian:
1. Pada tabel inventori, klik tombol aksi utama biru: **Cek Fisik** (`/admin/inspections/new`).
2. Masukkan data inspeksi:
   - **Panel Kap Mesin:** Ketebalan `110 µm` (Status: *ORIGINAL*).
   - **Panel Bumper/Fender Kiri:** Ketebalan `180 µm` (Status: *REPAINT* rapi).
   - **Panel Atap (Roof):** Ketebalan `95 µm` (Status: *ORIGINAL*).
   - Panel lainnya diisi standar pabrik (90-120 µm).
3. Beri penilaian Grade:
   - **Grade Rangka:** `Grade A` (Bebas tabrakan, apron utuh, bebas rendam banjir).
   - **Grade Mesin:** `Grade B+` (Kering, suara halus, tidak ada rembes).
   - **Grade Interior:** `Grade B` (Bersih, wangi, jok orisinil).
4. Klik **Simpan Hasil Cek Fisik**.
5. Klik tombol **Cetak Laporan Inspeksi Fisik (PDF)**.

### ✅ Hasil yang Diharapkan:
- Data inspeksi tersimpan permanen.
- Dokumen PDF inspeksi berhasil diunduh, menampilkan diagram bodi mobil (*Car Blueprint*) dengan kode warna ketebalan mikron dan tanda tangan inspektur.

---

## SKENARIO 07: UPDATE STATUS SIAP JUAL & PRICE TAG KACA SPION

### 🎯 Tujuan:
Menguji perpindahan unit ke lantai pamer showroom dan pencetakan label gantung kaca spion.

### 📝 Langkah Pengujian:
1. Buka tabel inventori, klik tombol aksi oranye: **Tag Spion** atau pindahkan status ke **READY_FOR_SALE**.
2. Klik tombol **Cetak Tag Spion (PDF)** (`/api/pdf/spec-tag/[id]`).
3. Periksa tampilan dokumen PDF di browser.

### ✅ Hasil yang Diharapkan:
- Status unit berubah menjadi **READY_FOR_SALE** (hijau).
- Di dashboard, funnel *Siap Jual* bertambah 1 unit.
- PDF Price Tag Spion ter-generate dengan format vertikal siap potong/gantung, memuat tulisan *Toyota Avanza G 2019*, transmisi Manual, KM 62.000, plat B 2489 KMR, dan harga OTR Rp 148.000.000 Nego.

---

## SKENARIO 08: KATALOG PUBLIK & CALON KONSUMEN

### 🎯 Tujuan:
Memverifikasi bahwa mobil otomatis muncul di katalog web dan tombol konsultasi WhatsApp berfungsi.

### 📝 Langkah Pengujian:
1. Buka browser incognito, navigasikan ke halaman publik: `http://localhost:3000/katalog`.
2. Gunakan filter: Pilih merk `Toyota`, harga `100 - 150 Juta`.
3. Klik kartu mobil `Toyota Avanza 2019 (Silver)`.
4. Di halaman detail (`/katalog/[id]`):
   - Cek galeri foto dan badge hasil inspeksi *Grade A*.
   - Ubah slider kalkulator DP (misal DP 25%).
   - Klik tombol hijau **Tanya Unit via WhatsApp**.

### ✅ Hasil yang Diharapkan:
- Mobil Avanza B 2489 KMR muncul paling atas di katalog publik.
- Tombol WhatsApp membuka link `https://wa.me/...` dengan teks otomatis yang memuat spesifikasi dan plat nomor mobil.

---

## SKENARIO 09: TRANSAKSI PENJUALAN TEMPO & CETAK SPK (PDF)

### 🎯 Tujuan:
Menguji pencatatan transaksi penjualan bertahap (tempo) dan pembuatan Surat Perjanjian Jual Beli (SPK).

### 📝 Langkah Pengujian:
1. Buka menu **Sidebar > Penjualan & Piutang** (`/admin/sales`).
2. Klik tombol **+ Catat Penjualan Baru** (`/admin/sales/new`).
3. Masukkan data transaksi:
   - **Pilih Mobil:** `Toyota Avanza 2019 (B 2489 KMR)`
   - **Tipe Pembeli:** `Retail Konsumen Perorangan`
   - **Nama Pembeli:** `Bpk. Agus Prasetyo`
   - **Nomor HP / WhatsApp:** `081388990011`
   - **Alamat:** `Jl. Melati No. 45, Jakarta Timur`
   - **Harga Jual Disepakati:** `Rp 146.000.000`
   - **Pembayaran Awal / Uang Muka (DP):** `Rp 46.000.000` (Metode: Transfer BCA).
   - **Sisa Piutang Berjalan:** `Rp 100.000.000`
   - **Tanggal Jatuh Tempo Pelunasan:** Masukkan tanggal 14 hari dari hari ini.
4. Klik **Simpan Transaksi Penjualan**.
5. Di tabel penjualan, klik tombol **Cetak Surat Perjanjian Jual Beli / SPK (PDF)** (`/api/pdf/agreement/[id]`).

### ✅ Hasil yang Diharapkan:
- Transaksi tercatat dengan status lencana piutang: `ON_SCHEDULE (Kurang Rp 100.000.000)`.
- Status unit mobil otomatis berubah menjadi **BOOKED / AT_SHOWROOM_PENDING**.
- Kas BCA showroom otomatis bertambah Rp 46.000.000 dari penerimaan DP.
- PDF SPK berhasil terunduh lengkap dengan pasal garansi dan tanggal jatuh tempo 14 hari.

---

## SKENARIO 10: ALARM PROAKTIF PIUTANG TEMPO 14 HARI & 1-KLIK WA

### 🎯 Tujuan:
Menguji fungsi deteksi dini piutang di Dashboard Utama dan tombol penagihan WhatsApp otomatis.

### 📝 Langkah Pengujian:
1. Buka menu **Sidebar > Dashboard** (`/admin`).
2. Perhatikan bagian atas dashboard:
   - Kotak **Alarm Piutang Tempo 14 Hari** aktif.
   - Terlihat tagihan atas nama `Bpk. Agus Prasetyo`, unit `Avanza B 2489 KMR`, sisa `Rp 100.000.000`.
3. Periksa juga widget **Proyeksi Arus Kas 14 Hari**:
   - Di daftar *Piutang Mendekati 2 Minggu (Tagih Sekarang)*, transaksi Bpk. Agus terdaftar.
4. Klik tombol hijau **Kirim WA Tagihan (1-Klik)** pada kartu alarm.
5. Periksa jendela WhatsApp Web/App yang terbuka.

### ✅ Hasil yang Diharapkan:
- WhatsApp Web terbuka dengan format pesan resmi:
  > *"Halo Pak/Bu Agus Prasetyo, Konfirmasi sisa pelunasan untuk unit Toyota Avanza (Plat B 2489 KMR) sebesar Rp 100.000.000 yang jatuh tempo pada [Tanggal]. Mohon konfirmasi bukti transfer jika sudah melakukan pembayaran ke rekening resmi Nur Mobil. Terima kasih!"*

---

## SKENARIO 11: PELUNASAN, KUITANSI METERAI (PDF) & BAST (PDF)

### 🎯 Tujuan:
Menguji pencatatan pelunasan sisa piutang Rp 100.000.000 dan pencetakan dokumen serah terima fisik.

### 📝 Langkah Pengujian:
1. Buka menu **Penjualan & Piutang** (`/admin/sales`), cari transaksi Bpk. Agus Prasetyo.
2. Klik tombol `+` **Catat Pembayaran Masuk** (`/admin/sales/[id]/payment`).
3. Di form pelunasan:
   - **Nominal Pembayaran:** Masukkan `Rp 100.000.000` (Lunas).
   - **Metode Pembayaran:** `Transfer Bank (BCA Rekening Showroom)`
   - **Catatan:** `Pelunasan via transfer m-BCA Bpk. Agus Prasetyo`.
4. Perhatikan live badge di bawah: Status berubah menjadi `LUNAS 100% (Settled)`.
5. Klik tombol **Simpan Pembayaran Masuk**.

### ✅ Hasil yang Diharapkan:
- Sistem tidak me-redirect kosong, melainkan membuka **Settlement Success Dialog Modal**.
- Sisa piutang menjadi **Rp 0**.
- Status mobil resmi berubah menjadi **SOLD_SETTLED**.
- Di dalam dialog tersedia tombol:
  * **Cetak Kuitansi Lunas (PDF):** Format resmi nota pelunasan bermeterai Rp 10.000.
  * **Cetak BAST (PDF):** Berita acara serah terima kunci, STNK, BPKB asli.

---

## SKENARIO 12: JEMBATAN OTOMATIS BAGI HASIL INVESTOR 1-KLIK

### 🎯 Tujuan:
Menguji eksekusi pembagian dividen laba ke investor langsung dari dialog pelunasan tanpa hitung manual.

### 📝 Langkah Pengujian:
1. Di dalam **Settlement Success Dialog Modal** yang sedang terbuka:
   - Perhatikan lencana oranye: *"Unit Sah Didanai Investor: Bpk. Hendra Gunawan"*.
   - Perhitungan Laba Kotor: Harga Jual Rp 146jt - HPP Total Rp 127.2jt = **Laba Bersih Rp 18.800.000**.
2. Klik tombol utama: **Eksekusi Bagi Hasil Investor Sekarang (1-Klik)**.
3. Perhatikan proses loading spinner dan konfirmasi yang muncul:
   * *"Bagi Hasil Sukses Dieksekusi! Snapshot aturan deterministik tersimpan, mutasi Capital Ledger tercatat."*
4. Klik tautan **Buka Riwayat Bagi Hasil Investor** (`/admin/investors/history`).
5. Periksa tabel riwayat pembagian dividen.

### ✅ Hasil yang Diharapkan:
- Eksekusi berhasil tanpa error.
- Pokok modal Bpk. Hendra Gunawan kembali utuh ke *Capital Ledger*.
- Dividen laba Bpk. Hendra tercatat presisi sesuai tiering rule (misal 50% = Rp 9.400.000).
- Sisa laba garasi sebesar Rp 9.400.000 masuk ke kas laba showroom.
- Di tabel penjualan, transaksi Avanza B 2489 KMR memiliki badge hijau: **Bagi Hasil Selesai**.

---

## SKENARIO 13: PORTAL KHUSUS INVESTOR (`/investor`)

### 🎯 Tujuan:
Memverifikasi bahwa investor dapat melihat pengembalian modal dan dividen secara transparan di portalnya.

### 📝 Langkah Pengujian:
1. Buka browser incognito, navigasikan ke: `http://localhost:3000/investor`.
2. Periksa ringkasan yang tampil untuk Bpk. Hendra Gunawan:
   - Total Modal Disetor: Rp 150.000.000.
   - Status Avanza B 2489 KMR: *TERJUAL LUNAS (SOLD_SETTLED)*.
   - Riwayat Pembagian Dividen: Tercatat tanggal hari ini, nominal dividen Rp 9.400.000.

### ✅ Hasil yang Diharapkan:
- Portal investor menampilkan data akurat tanpa ada selisih angka.
- Investor merasa tenang dan percaya dengan transparansi pembagian dividen showroom.

---

## SKENARIO 14: REKONSILIASI KAS BCA, PRIVE & ASISTEN AI GEMINI

### 🎯 Tujuan:
Menguji rekonsiliasi akhir saldo kas showroom, pencatatan prive pribadi owner, dan briefing AI.

### 📝 Langkah Pengujian:
1. Buka menu **Sidebar > Keuangan > Buku Kas & Mutasi BCA** (`/admin/finance`):
   - Periksa mutasi masuk: DP Rp 46jt + Pelunasan Rp 100jt = Rp 146.000.000.
   - Periksa mutasi keluar: Beli unit lelang, admin, bengkel cat.
   - Saldo akhir BCA sinkron dengan mutasi fisik.
2. Buka menu **Biaya & Pengeluaran > Tarik Prive Owner** (`/admin/finance/prive/new`):
   - Masukkan nominal prive: `Rp 5.000.000` (Keperluan pribadi pemilik showroom).
   - Simpan prive.
   - Pastikan HPP mobil tidak terganggu, saldo kas BCA berkurang wajar.
3. Buka **Dashboard Utama** (`/admin`):
   - Klik **Generate Rangkuman Harian AI**.
   - Ajukan pertanyaan di kotak chat AI: *"Berapa sisa kas BCA saya setelah transaksi Avanza dan bagi hasil Pak Hendra?"*.

### ✅ Hasil yang Diharapkan:
- Buku kas mencatat seluruh mutasi secara kronologis.
- Prive tercatat terpisah dari beban operasional.
- Asisten AI Gemini merespons dengan data akurat sesuai histori transaksi yang baru saja diselesaikan.

---

## 🏁 KESIMPULAN HASIL PENGETESAN

Jika seluruh 14 skenario di atas telah dijalankan dengan hasil checklist **PASSED (LULUS)**:
1. Sistem Showroom Nur Mobil dinyatakan **100% Siap Produksi (Production Ready)**.
2. Seluruh siklus bisnis mulai dari kulakan lelang, servis garasi mandiri, inspeksi bodi, display publik, penjualan tempo, penagihan WA, hingga dividen investor telah terhubung secara otomatis, presisi, dan anti-bocor.
