# 🧪 SKENARIO PENGETESAN SISTEM END-TO-END (DARI A SAMPAI Z)
## Aplikasi Manajemen Showroom & Bengkel Mandiri — Nur Mobil
*Dokumen UAT (User Acceptance Testing) & QA Test Script Lengkap*

---

## 📋 DAFTAR SKENARIO PENGETESAN LENGKAP

| No | Modul / Skenario Pengujian | Cakupan Fitur Utama |
| :--- | :--- | :--- |
| **01** | **Setup Finansial & Investor** | Pendaftaran Investor, Setoran Modal Pool, Aturan Tiering Bagi Hasil |
| **02** | **Gudang Bahan Habis Pakai & Alat** | Input Stok Grosir Oli & Filter, Inventaris Peralatan Garasi |
| **03** | **Kulakan Mobil Lelang (Intake) & Pajak STNK** | Input Unit Eks Lelang, Tanggal Jatuh Tempo PKB & Plat Kaleng, Next-Step Dialog |
| **04** | **Servis Ganti Oli Mandiri** | Alokasi Stok Bahan, Pemotongan Stok, Verifikasi Laba Jasa Garasi |
| **05** | **Servis Bengkel Cat Luar** | Catat Biaya Bengkel Luar, Cetak Surat Jalan Bengkel (PDF) |
| **06** | **Inspeksi Fisik 11 Panel** | Cek Ketebalan Mikron Cat, Grading Mesin/Rangka, Cetak Hasil Inspeksi (PDF) |
| **07** | **Showroom Display & Tag Spion** | Update Status Ready for Sale, Cetak Price Tag Kaca Spion (PDF) |
| **08** | **Katalog Publik & Siklus Stok Segera Hadir** | Homepage Showcase, 5 Tab Filter, Teaser 1 Foto Depan, Anti-Grade Palsu, 1-Klik WA |
| **09** | **Transaksi Penjualan Cash Tempo & SPK Pasal V** | Validasi DP Minimal 70%, Tempo Maks 30 Hari, Penahanan BPKB/STNK, SPK (PDF) |
| **10** | **Monitoring Arus Kas & Alarm Piutang** | Dashboard AI, Alarm Tempo, 1-Klik Kirim WhatsApp Tagihan |
| **11** | **Pelunasan & Dokumen Penyerahan** | Catat Pelunasan Sisa Piutang, Cetak Kuitansi Meterai (PDF) & BAST (PDF) |
| **12** | **Jembatan Bagi Hasil Investor 1-Klik** | Eksekusi Bagi Hasil Otomatis, Mutasi Capital Ledger, Verifikasi Dividen |
| **13** | **Portal Khusus Investor** | Login/Akses Portal Investor, Cek Transparansi Alokasi & Dividen |
| **14** | **Buku Kas BCA, Prive & Asisten AI** | Rekonsiliasi Saldo BCA, Biaya Operasional Showroom, Konsultasi Gemini AI |
| **15** | **Radar Alarm Pajak STNK & Plat Kaleng** | Deteksi Unit Jatuh Tempo H-30 & Overdue, Proyeksi Beban Kas PKB di Dashboard |
| **16** | **Pengujian Keamanan RBAC (4 Peran)** | Validasi Hak Akses OWNER, STAFF_ADMIN, SALES, dan INVESTOR |
| **17** | **Strategi Multi-Layer Backup VPS & Restore** | Download JSON Snapshot Web, Eksekusi Backup 4 Lapis & Simulasi Restore |

---

## SKENARIO 01: SETUP FINANSIAL, INVESTOR & ATURAN TIERING 7 TINGKAT

### 🎯 Tujuan:
Memastikan sistem siap menampung data profil pemodal (termasuk nomor rekening bank), upload multi-lampiran bukti setoran modal ke kas BCA, serta konfigurasi 7 tingkatan aturan bagi hasil deterministik 4 saudara (skema modal Ibu) lengkap dengan proteksi saat unit merugi.

### 📝 Langkah Pengujian:
1. Buka menu **Sidebar > Investor & Bagi Hasil > Daftar Akun Investor** (`/admin/investors/accounts`).
2. Klik tombol **+ Investor Baru** (`/admin/investors/new`).
3. Masukkan data uji:
   - **Nama Lengkap:** `Bpk. Hendra Gunawan`
   - **Nomor Telepon/WA:** `081234567890`
   - **Kategori Investor:** Pilih `Mitra Pihak Ketiga (THIRD_PARTY)` atau `Ibu / 4 Saudara (MOTHER_SIBLING)`.
   - **Nama Bank & Nomor Rekening:** Masukkan `BCA - 8735019281 a.n. Hendra Gunawan`.
4. Klik **Simpan Investor**.
5. Uji fitur **Edit Profil Investor**:
   - Di daftar akun investor, klik tombol **Edit** pada baris investor `Bpk. Hendra Gunawan`.
   - Perbarui catatan atau nomor rekening, lalu simpan. Verifikasi data tersinkronisasi instan.
6. Di halaman daftar akun investor, klik tombol **+ Setor Modal** (`/admin/investors/deposit/new`), masukkan:
   - **Pilih Investor:** `Bpk. Hendra Gunawan`
   - **Nominal Setoran:** `Rp 150.000.000`
   - **Catatan:** `Setoran modal awal investasi pool fund kulakan lelang`
   - **Tanggal:** Hari ini.
   - **Multi-Lampiran Bukti Transfer:** Upload 1 atau lebih file bukti mutasi bank (format JPG, PNG, WEBP, atau PDF hingga 10MB per file). Verifikasi kartu pratinjau thumbnail muncul secara rapi dan link dokumen dapat dibuka penuh.
7. Klik **Simpan Setoran Modal**.
8. Buka menu **Sidebar > Investor & Bagi Hasil > Aturan Tier 4 Saudara** (`/admin/investors/tier-rules`):
   - Verifikasi tersedianya **7 tingkatan jenjang laba otomatis**:
     * **Tier 1 (Laba Rp 0 s/d Rp 1.000.000):** Nominal Rp 50.000 per saudara (Total Rp 200.000 / 4 saudara).
     * **Tier 2 (Laba Rp 1.000.001 s/d Rp 3.000.000):** Nominal Rp 100.000 per saudara (Total Rp 400.000).
     * **Tier 3 (Laba Rp 3.000.001 s/d Rp 5.000.000):** Nominal Rp 200.000 per saudara (Total Rp 800.000).
     * **Tier 4 (Laba Rp 5.000.001 s/d Rp 10.000.000):** Nominal Rp 300.000 per saudara (Total Rp 1.200.000).
     * **Tier 5 (Laba Rp 10.000.001 s/d Rp 15.000.000):** Nominal Rp 500.000 per saudara (Total Rp 2.000.000).
     * **Tier 6 (Laba Rp 15.000.001 s/d Rp 20.000.000):** Nominal Rp 750.000 per saudara (Total Rp 3.000.000).
     * **Tier 7 (Laba > Rp 20.000.000):** Nominal Rp 1.000.000 per saudara (Total Rp 4.000.000).
   - Uji tombol interaktif **+ Tambah Baris Tier** dan **Hapus Baris** untuk kustomisasi batas rentang laba.
   - Periksa kartu **Penanganan Jika Unit Rugi / Laba Rp 0**: Sistem menampilkan visualisasi tegas bahwa jika laba <= Rp 0, bagi hasil otomatis Rp 0 (tidak ada pembagian dividen minus) dan modal pokok investor tetap utuh terlindungi.

### ✅ Hasil yang Diharapkan:
- Profil Bpk. Hendra Gunawan beserta nomor rekening pencairan tersimpan di database.
- Multi-lampiran bukti mutasi setoran modal tersimpan aman dan dapat ditinjau kembali kapan saja.
- Saldo Kas BCA (`Sidebar > Keuangan & Kas > Buku Kas & Mutasi`) bertambah Rp 150.000.000 dengan keterangan setoran modal investor.
- Modal siap dialokasikan (*Active Allocated Capital*) bertambah Rp 150.000.000.
- Skema 7 tiering aturan 4 saudara siap mengunci pembagian dividen deterministik saat unit terjual lunas.

---

## SKENARIO 02: GUDANG BAHAN HABIS PAKAI & PERALATAN GARASI

### 🎯 Tujuan:
Menguji pencatatan stok grosir oli, filter oli, serta inventaris mesin/alat bengkel mandiri di garasi.

### 📝 Langkah Pengujian:
1. Buka menu **Sidebar > Gudang Bahan & Alat** (`/admin/workshop`).
2. Di tab **Stok Bahan Habis Pakai**, klik **+ Tambah Bahan Habis Pakai**:
   - **Nama Bahan:** `Oli Mesin TMO 10W-40 (Galon 4 Liter)`
   - **Kategori:** `Oli & Pelumas Mesin (OIL_AND_FLUIDS)`
   - **Jumlah Stok Awal:** `10`
   - **Satuan:** `Galon`
   - **Harga Beli Grosir:** `Rp 260.000` per galon.
   - Klik **Simpan Bahan**.
3. Klik **+ Tambah Bahan Habis Pakai** lagi untuk filter:
   - **Nama Bahan:** `Filter Oli Original Avanza/Xenia`
   - **Kategori:** `Filter Oli & Udara (FAST_MOVING_PARTS)`
   - **Jumlah Stok Awal:** `10`
   - **Satuan:** `Pcs`
   - **Harga Beli Grosir:** `Rp 35.000` per pcs.
   - Klik **Simpan Bahan**.
4. Pindah ke tab **Aset Tetap & Peralatan**, klik **+ Tambah Aset Tetap**:
   - **Nama Alat:** `Mesin Cuci Steam High Pressure Laguna 70`
   - **Kategori:** `Peralatan & Mesin Garasi (WORKSHOP_EQUIPMENT)`
   - **Harga Beli:** `Rp 1.250.000`
   - **Kondisi:** `BAIK / BERFUNGSI NORMAL`
   - Klik **Simpan Aset**.

### ✅ Hasil yang Diharapkan:
- Stok Oli tercatat 10 Galon (nilai modal grosir Rp 2.600.000).
- Stok Filter tercatat 10 Pcs (nilai modal grosir Rp 350.000).
- Alat steam tercatat di daftar inventaris peralatan garasi.

---

## SKENARIO 03: KULAKAN MOBIL LELANG (INTAKE) & PAJAK STNK

### 🎯 Tujuan:
Menguji form input intake mobil lelang, pencatatan tanggal jatuh tempo pajak STNK, dan dialog aksi lanjutan pasca simpan unit.

### 📝 Langkah Pengujian:
1. Buka menu **Sidebar > Inventori Unit** (`/admin/inventory`), lalu klik tombol **+ Intake Unit Baru** (`/admin/inventory/new`).
2. Masukkan data uji mobil lelang:
   - **Plat Nomor:** `B 2489 KMR`
   - **Merk & Model:** `Toyota Avanza 1.3 G M/T`
   - **Tahun Pembuatan:** `2019`
   - **Warna:** `Silver Metalik`
   - **Odometer (KM):** `62.000`
   - **Tanggal Jatuh Tempo PKB (Pajak Tahunan):** Masukkan tanggal `15 hari dari hari ini` (untuk menguji alarm jatuh tempo H-30).
   - **Tanggal Plat Kaleng 5 Tahunan:** Masukkan tanggal `2028-10-15`.
   - **Estimasi Biaya PKB:** `Rp 2.450.000`.
   - **Sumber Pembelian:** `AUCTION (Balai Lelang)`
   - **Balai Lelang:** `IBID Jakarta`
   - **Tipe Lot:** `EKS_PERUSAHAAN`
   - **Harga Faktur Lelang (Hammer):** `Rp 122.000.000`
   - **Biaya Admin Lelang:** `Rp 3.500.000`
   - **Target Harga Jual:** `Rp 148.000.000`
   - **Batas Minimal Jual:** `Rp 142.000.000`
   - **Status BPKB:** `READY` atau `PROCESS_1_2_WEEKS`.
3. Hubungkan modal unit ke Investor Bpk. Hendra Gunawan.
4. Klik tombol **Simpan Unit Baru**.
5. Perhatikan layar pop-up yang muncul: **Next-Step Success Dialog**.

### ✅ Hasil yang Diharapkan:
- Unit tersimpan dengan status awal **INTAKE**.
- Tanggal pajak STNK dan estimasi biaya PKB Rp 2.450.000 tersimpan ke database.
- Pop-up Next-Step Dialog muncul dengan 4 tombol: *Ganti Oli Mandiri*, *Cetak Surat Jalan Bengkel*, *Inspeksi 11 Panel*, dan *Upload Foto*.
- HPP awal mobil tercatat **Rp 125.500.000** (Rp 122jt + Rp 3.5jt admin).

---

## SKENARIO 04: SERVIS GANTI OLI MANDIRI & LABA JASA GARASI

### 🎯 Tujuan:
Menguji pemotongan stok bahan habis pakai, penambahan HPP mobil, dan pencatatan laba jasa garasi mandiri.

### 📝 Langkah Pengujian:
1. Pada pop-up Next-Step Dialog (atau via menu **Sidebar > Gudang Bahan & Alat**), pilih **Ganti Oli Mandiri Sekarang**.
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

## SKENARIO 05: SERVIS BENGKEL CAT LUAR, MULTI-LAMPIRAN BUKTI & SURAT JALAN (PDF)

### 🎯 Tujuan:
Menguji pencatatan biaya pengerjaan bengkel luar/servis unit dengan multi-lampiran nota/kuitansi digital, pengarsipan otomatis foto pengerjaan ke galeri kendaraan, dan pencetakan surat jalan pengantar sopir.

### 📝 Langkah Pengujian:
1. Buka menu **Sidebar > Inventori Unit** (`/admin/inventory`), cari `B 2489 KMR`.
2. Klik tombol menu titik tiga `[...]` pada baris mobil, pilih **Catat Servis / Biaya Unit**.
3. Masukkan data pengeluaran:
   - **Kategori Biaya:** Pilih `BODY_PAINT (Cat & Bodi)`. *(Tersedia juga kategori baru seperti `TIRES_AND_WHEELS (Ban & Velg)` dan `ELECTRICAL (Kelistrikan & Aki)`).*
   - **Nama Vendor / Bengkel:** `Bengkel Cat Berkah Jaya`
   - **Deskripsi:** `Cat ulang bumper depan lecet lelang + poles kap mesin`
   - **Nominal Biaya:** `Rp 1.200.000`
   - **Metode Pembayaran:** `Transfer BCA`
   - **Multi-Lampiran Bukti Pengeluaran (ProofUploadField):** Upload 2 file sekaligus (1 foto nota kuitansi stempel bengkel format JPG/PDF dan 1 foto progres pengerjaan bumper bodi).
   - Verifikasi thumbnail kedua file muncul dengan opsi hapus satuan atau klik untuk melihat ukuran penuh.
4. Klik **Simpan Biaya**.
5. Buka tab galeri foto kendaraan di halaman detail unit:
   - Verifikasi foto dokumentasi perbaikan yang diupload otomatis terarsip ke galeri kendaraan (`VehiclePhoto`).
6. Buka kembali menu titik tiga `[...]` pada baris mobil, pilih **Cetak Surat Jalan Bengkel (PDF)**.
7. Periksa file PDF yang terbuka di tab baru.

### ✅ Hasil yang Diharapkan:
- HPP Avanza bertambah menjadi **Rp 127.200.000** (Rp 126.0jt + Rp 1.2jt).
- Kas BCA showroom otomatis terpotong Rp 1.200.000 dengan keterangan pembayaran bengkel dan path `admin/finance` otomatis ter-revalidate seketika.
- Multi-lampiran nota kuitansi tersimpan permanen dan foto fisik mobil langsung terarsip di galeri kendaraan.
- PDF Surat Jalan tercetak rapi memuat nama sopir, plat nomor B 2489 KMR, rincian pekerjaan cat bumper, dan kolom tanda tangan serah terima.

---

## SKENARIO 06: INSPEKSI FISIK 11 PANEL (STANDAR ACV IBID)

### 🎯 Tujuan:
Menguji lembar kerja cek fisik 11 panel ketebalan cat bodi dan pencetakan sertifikat inspeksi PDF.

### 📝 Langkah Pengujian:
1. Buka menu **Sidebar > Inventori Unit**, klik tombol aksi utama biru: **Cek Fisik** (atau buka menu **Sidebar > Cek Fisik & Inspeksi** `/admin/inspections`, lalu pilih **Detail Cek** pada unit).
2. Masukkan data inspeksi 11 panel:
   - **Kap Mesin:** Ketebalan `110 µm` (Status: *ORIGINAL*).
   - **Bumper/Fender Kiri:** Ketebalan `180 µm` (Status: *REPAINT* rapi).
   - **Atap (Roof):** Ketebalan `95 µm` (Status: *ORIGINAL*).
   - Panel lainnya diisi standar pabrik (90-120 µm).
3. Beri penilaian Grade:
   - **Grade Rangka:** `Grade A` (Bebas tabrakan, apron utuh, bebas rendam banjir).
   - **Grade Mesin:** `Grade B` (Kering, suara halus, tidak ada rembes).
   - **Grade Interior:** `Grade B` (Bersih, wangi, jok orisinil).
   - **Grade Eksterior:** `Grade B` (Cat rapi).
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
1. Buka menu **Sidebar > Inventori Unit**, klik tombol aksi titik tiga `[...]` ➔ **Ubah Status Kendaraan**, lalu pilih **READY_FOR_SALE (Siap Dipasarkan)**.
2. Klik tombol aksi oranye: **Tag Spion** (`/api/pdf/spec-tag/[id]`).
3. Periksa tampilan dokumen PDF di browser.

### ✅ Hasil yang Diharapkan:
- Status unit berubah menjadi **READY_FOR_SALE** (hijau).
- Di dashboard, funnel *Siap Jual* bertambah 1 unit.
- PDF Price Tag Spion ter-generate dengan format vertikal siap potong/gantung, memuat tulisan *Toyota Avanza G 2019*, transmisi Manual, KM 62.000, plat B 2489 KMR, dan harga OTR Rp 148.000.000 Nego.

---

## SKENARIO 08: KATALOG PUBLIK & SIKLUS STOK SEGERA HADIR (UPCOMING)

### 🎯 Tujuan:
1. Memverifikasi unit baru masuk (`INTAKE`) dan sedang salon (`IN_REPAIR`) otomatis tayang sebagai **Segera Hadir (Upcoming Stock)** di homepage dan katalog publik.
2. Memverifikasi batasan privasi: hanya **1 foto teaser tampak depan serong kanan** yang dapat diakses publik, dan foto internal baret tidak bocor.
3. Memverifikasi format harga psikologis (contoh: `Estimasi Rp 150 Jutaan`) berjalan otomatis.
4. Memverifikasi halaman detail unit yang belum diinspeksi menampilkan kartu status `TAHAP CEK` dan pratinjau edukasi 4 pilar.
5. Memverifikasi unit yang beralih status ke `READY_FOR_SALE` otomatis membuka galeri 11 foto lengkap & laporan inspeksi digital.

### 📝 Langkah Pengujian:
1. Klik menu **Sidebar > Katalog Publik > Buka Katalog Web** (`/katalog`) atau buka `http://localhost:3000/`.
2. Scroll ke seksi **"Segera Hadir di Showroom (Upcoming Stock)"**.
3. Verifikasi badge oranye **`SEGERA HADIR`**, format harga estimasi ramah psikologis, dan teaser 1 foto depan.
4. Buka halaman detail unit (`/katalog/[slug]`), pastikan unit yang belum diinspeksi menampilkan **`TAHAP CEK — Kartu Skor & Grade Belum Diterbitkan`**.

---

## SKENARIO 09: TRANSAKSI PENJUALAN CASH TEMPO GARASI & SPK PASAL V

### 🎯 Tujuan:
Menguji penegakan kebijakan anti-leasing showroom: validasi DP minimal 70%, batas tempo maksimal 30 hari, peringatan penahanan BPKB/STNK asli, dan penerbitan SPK PDF dengan Pasal V.

### 📝 Langkah Pengujian:
1. Buka menu **Sidebar > Penjualan & Piutang** (`/admin/sales`).
2. Klik tombol **+ Input Penjualan Unit Baru** (`/admin/sales/new`).
3. Pilih mobil `Toyota Avanza 2019 (B 2489 KMR)` dan isi identitas pembeli:
   - **Nama Pembeli:** `Bpk. Agus Prasetyo`
   - **Nomor HP / WhatsApp:** `081388990011`
   - **Alamat:** `Jl. Melati No. 45, Jakarta Timur`
   - **Harga Jual Disepakati:** `Rp 146.000.000`
4. **Uji Validasi Penolakan DP < 70%:**
   - Coba masukkan DP: `Rp 50.000.000` (~34% dari harga jual).
   - Perhatikan validasi merah: *"Kebijakan Garasi: DP Minimal 70% (Rp 102.200.000)"* dan tombol simpan terkunci.
5. **Input Transaksi Valid Sesuai SOP:**
   - Masukkan DP yang valid: `Rp 106.000.000` (~72.6% dari harga jual).
   - Metode: `Transfer Bank (BCA)`.
   - Sisa piutang terhitung otomatis: `Rp 40.000.000`.
   - Pilih tanggal jatuh tempo: `20 hari dari hari ini` (valid <= 30 hari).
   - Perhatikan kotak informasi penahanan dokumen BPKB & STNK asli yang tampil di formulir.
6. Klik tombol **Simpan Transaksi Penjualan**.
7. Pada tabel penjualan, klik tombol **Cetak Surat Perjanjian Jual Beli / SPK (PDF)** (`/api/pdf/agreement/[id]`).
8. Buka file PDF SPK dan periksa bagian **PASAL V**.

### ✅ Hasil yang Diharapkan:
- Transaksi berhasil disimpan dengan DP Rp 106.000.000 dan sisa piutang Rp 40.000.000.
- Status unit mobil otomatis menjadi **BOOKED / AT_SHOWROOM_PENDING**.
- Kas BCA showroom otomatis bertambah Rp 106.000.000.
- Dokumen SPK PDF mencantumkan **PASAL V: KEBIJAKAN CASH TEMPO & PENAHANAN DOKUMEN FISIK**.

---

## SKENARIO 10: ALARM PROAKTIF PIUTANG TEMPO & 1-KLIK WA

### 🎯 Tujuan:
Menguji fungsi deteksi dini piutang di Dashboard Utama dan tombol penagihan WhatsApp otomatis.

### 📝 Langkah Pengujian:
1. Buka menu **Sidebar > Dashboard Utama** (`/admin`).
2. Perhatikan bagian alarm piutang tempo:
   - Terlihat tagihan atas nama `Bpk. Agus Prasetyo`, unit `Avanza B 2489 KMR`, sisa `Rp 40.000.000`.
3. Periksa widget **Proyeksi Arus Kas 14 Hari**:
   - Di daftar piutang masuk, transaksi Bpk. Agus terdaftar dengan estimasi kas masuk Rp 40.000.000.
4. Klik tombol hijau **Kirim WA Tagihan (1-Klik)** pada kartu alarm.
5. Periksa jendela WhatsApp Web/App yang terbuka.

### ✅ Hasil yang Diharapkan:
- WhatsApp Web terbuka dengan format pesan resmi pengingat jatuh tempo sopan dari Nur Mobil.

---

## SKENARIO 11: PELUNASAN, KUITANSI METERAI (PDF) & BAST (PDF)

### 🎯 Tujuan:
Menguji pencatatan pelunasan sisa piutang Rp 40.000.000 dan pencetakan dokumen penyerahan fisik kendaraan beserta BPKB & STNK asli.

### 📝 Langkah Pengujian:
1. Buka menu **Sidebar > Penjualan & Piutang** (`/admin/sales`), cari transaksi Bpk. Agus Prasetyo.
2. Klik tombol `+` **Catat Pembayaran Masuk** (`/admin/sales/[id]/payment`).
3. Di form pelunasan:
   - **Nominal Pembayaran:** Masukkan `Rp 40.000.000` (Lunas).
   - **Metode Pembayaran:** `Transfer Bank (BCA Rekening Showroom)`
   - **Bukti Pembayaran Pelunasan:** Upload file bukti transfer m-BCA (format JPG, PNG, atau PDF).
   - **Catatan:** `Pelunasan Cash Tempo transfer m-BCA Bpk. Agus Prasetyo`.
4. Perhatikan live badge di bawah: Status berubah menjadi `LUNAS 100% (Settled)`.
5. Klik tombol **Simpan Pembayaran Masuk**.

### ✅ Hasil yang Diharapkan:
- Sistem membuka **Settlement Success Dialog Modal**.
- Sisa piutang menjadi **Rp 0** dan status mobil berubah menjadi **SOLD_SETTLED**.
- Lampiran bukti pelunasan tersimpan aman dan kas BCA otomatis ter-revalidate seketika di `/admin/finance`.
- Di dalam dialog tersedia tombol **Cetak Kuitansi Lunas (PDF)** dan **Cetak BAST (PDF)**.

---

## SKENARIO 12: JEMBATAN OTOMATIS BAGI HASIL INVESTOR 1-KLIK

### 🎯 Tujuan:
Menguji eksekusi pembagian dividen laba ke investor langsung dari dialog pelunasan tanpa hitung manual.

### 📝 Langkah Pengujian:
1. Di dalam **Settlement Success Dialog Modal** yang sedang terbuka:
   - Perhatikan lencana oranye: *"Unit Sah Didanai Investor: Bpk. Hendra Gunawan"*.
   - Perhitungan Laba: Harga Jual Rp 146jt - HPP Total Rp 127.2jt = **Laba Bersih Rp 18.800.000**.
2. Klik tombol utama: **Eksekusi Bagi Hasil Investor Sekarang (1-Klik)**.
3. Perhatikan proses loading spinner dan konfirmasi:
   * *"Bagi Hasil Sukses Dieksekusi! Snapshot aturan deterministik tersimpan, mutasi Capital Ledger tercatat."*
4. Buka menu **Sidebar > Investor & Bagi Hasil > Riwayat Distribusi** (`/admin/investors/history`).
5. Periksa tabel riwayat pembagian dividen.

### ✅ Hasil yang Diharapkan:
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
- Investor mendapatkan transparansi penuh atas dana modalnya.

---

## SKENARIO 14: REKONSILIASI KAS BCA, MULTI-LAMPIRAN TRANSAKSI, PRIVE & ASISTEN AI GEMINI

### 🎯 Tujuan:
Menguji rekonsiliasi akhir saldo kas showroom, pencatatan transaksi kas masuk/keluar umum (`IN_OTHER`/`OUT_OTHER`), beban operasional (OpEx), ekuitas/prive pemilik dengan multi-lampiran bukti kwitansi digital, dan briefing AI.

### 📝 Langkah Pengujian:
1. Buka menu **Sidebar > Keuangan & Kas > Buku Kas & Mutasi** (`/admin/finance`):
   - Periksa mutasi masuk: DP Rp 106jt + Pelunasan Rp 40jt = Rp 146.000.000.
   - Periksa mutasi keluar: Beli unit lelang, admin, bengkel cat.
   - Saldo akhir BCA sinkron dengan mutasi fisik.
2. Uji fitur **+ Catat Kas Masuk/Keluar Manual** (`/admin/finance/transactions/new`):
   - Pilih jenis transaksi: `Penerimaan Kas Lainnya (IN_OTHER)` atau `Pengeluaran Kas Lainnya (OUT_OTHER)`.
   - Masukkan nominal: `Rp 250.000` (misal: Penjualan scrap/besi tua atau Biaya kurir dokumen BPKB).
   - Lampirkan multi-file bukti foto struk/nota via `ProofUploadField`.
   - Simpan transaksi dan verifikasi saldo kas BCA langsung terupdate seketika.
3. Buka menu **Sidebar > Keuangan & Kas > Beban & Prive (BCA)** (`/admin/finance/expenses`):
   - Uji tombol **+ Catat Biaya Operasional** (`/admin/finance/expenses/new`): Catat beban listrik PLN showroom Rp 750.000 lengkap dengan upload multi-lampiran struk pembayaran PLN.
   - Uji tombol **+ Tarik Prive (Pribadi)** (`/admin/finance/prive/new`): Masukkan nominal prive `Rp 5.000.000` lengkap dengan upload bukti transfer m-BCA ke rekening pribadi owner.
   - Uji tombol **+ Setor Modal Pemilik (Ekuitas)** (`/admin/finance/equity/new`): Masukkan setoran tambahan modal owner dengan lampiran bukti mutasi.
   - Pastikan HPP mobil tidak terganggu, saldo kas BCA berkurang wajar, dan revalidate otomatis bekerja.
4. Buka menu **Sidebar > Dashboard Utama** (`/admin`):
   - Klik **Generate Rangkuman Harian AI**.
   - Ajukan pertanyaan di kotak chat AI: *"Berapa sisa kas BCA saya setelah transaksi Avanza, operasional, dan bagi hasil Pak Hendra?"*.

### ✅ Hasil yang Diharapkan:
- Buku kas mencatat seluruh mutasi secara kronologis dengan dukungan kategori umum `IN_OTHER` dan `OUT_OTHER`.
- Setiap transaksi kas (OpEx, Prive, Ekuitas, Manual Kas) memiliki riwayat multi-lampiran file bukti transaksi yang tersimpan aman.
- Prive tercatat terpisah dari beban operasional showroom tanpa mengotori HPP mobil.
- Asisten AI Gemini merespons dengan data akurat sesuai riwayat transaksi.

---

## SKENARIO 15: RADAR ALARM PAJAK STNK & PLAT KALENG 5 TAHUNAN

### 🎯 Tujuan:
Menguji pendeteksian otomatis unit mobil yang mendekati jatuh tempo pajak STNK (H-30 Hari) maupun yang sudah lewat waktu (*Overdue*), serta verifikasi proyeksi beban kas PKB di Dashboard.

### 📝 Langkah Pengujian:
1. Buka menu **Sidebar > Inventori Unit** (`/admin/inventory`).
2. Periksa baris mobil `Avanza B 2489 KMR` yang diinput dengan jatuh tempo PKB 15 hari ke depan:
   - Amati kolom status pajak STNK: Tampil badge kuning bertuliskan **Jatuh Tempo (H-15)**.
3. Buka formulir edit mobil lain atau tambahkan unit uji kedua (`B 9999 DUMMY`):
   - Isi tanggal jatuh tempo PKB: `30 hari yang lalu` (Overdue).
   - Isi estimasi biaya PKB: `Rp 3.000.000`.
   - Simpan unit.
4. Periksa kembali tabel inventori:
   - Unit kedua menampilkan badge merah **OVERDUE (Pajak Mati)**.
5. Buka menu **Sidebar > Dashboard Utama** (`/admin`):
   - Cari widget **Radar Alarm Pajak STNK & Plat Kaleng**.
   - Periksa tab filter: *Semua*, *Jatuh Tempo H-30*, dan *Overdue*.
   - Periksa total estimasi biaya PKB yang harus disiapkan.

### ✅ Hasil yang Diharapkan:
- Sistem secara otomatis menghitung selisih hari tanggal hari ini vs tanggal jatuh tempo tanpa perlu refresh database manual.
- Widget Radar Alarm Pajak di Dashboard mendeteksi unit dengan visual kontras (kuning dan merah).

---

## SKENARIO 16: PENGUJIAN KEAMANAN HAK AKSES MULTI-PERAN (RBAC 4 ROLE)

### 🎯 Tujuan:
Menguji pembatasan wewenang antara `OWNER`, `STAFF_ADMIN`, `SALES`, dan `INVESTOR` untuk memastikan kerahasiaan keuangan dan kepatuhan operasional.

### 📝 Langkah Pengujian:

#### Bagian A: Pengujian Peran `SALES` (Marketing & Penjualan)
1. Buka halaman login (`/login`), pilih role **SALES**, masukkan kata sandi sesuai `.env` (atau master password), klik Masuk.
2. Buka menu navigasi Sidebar:
   - Verifikasi menu yang muncul: **Katalog Stok Ready** (`/admin/inventory`) dan **Buka Katalog Web** (`/katalog`).
   - Verifikasi menu yang **TIDAK MUNCUL / DISEMBUNYIKAN**: *Dashboard Utama, Cek Fisik & Inspeksi, Gudang Bahan & Alat, Penjualan & Piutang, Keuangan & Kas (Kas Bank BCA), Investor & Bagi Hasil, Sistem & Notifikasi*.
3. Coba akses rute terproteksi secara paksa via address bar browser:
   - Ketik URL: `http://localhost:3000/admin` ➔ Otomatis diredirect ke `/admin/inventory?status=READY_FOR_SALE`.
   - Ketik URL: `http://localhost:3000/admin/finance` ➔ Ditolak / Diredirect.
   - Ketik URL: `http://localhost:3000/admin/investors` ➔ Ditolak / Diredirect.
   - Ketik URL: `http://localhost:3000/admin/settings` ➔ Ditolak / Diredirect.

#### Bagian B: Pengujian Peran `STAFF_ADMIN` (Operasional Garasi)
1. Logout, lalu login kembali dengan role **STAFF_ADMIN**, masukkan kata sandi sesuai `.env`.
2. Buka menu navigasi Sidebar:
   - Menu yang muncul: **Dashboard Utama**, **Inventori Unit**, **Cek Fisik & Inspeksi**, **Gudang Bahan & Alat**, **Penjualan & Piutang**, dan **Buka Katalog Web**.
   - Menu yang **DISEMBUNYIKAN**: *Keuangan & Kas (Kas Besar BCA / Prive), Investor & Bagi Hasil, Sistem & Notifikasi*.
3. Buka menu **Sidebar > Gudang Bahan & Alat** (`/admin/workshop`):
   - Akses diizinkan: Admin garasi dapat mencatat stok oli dan alokasi servis mandiri tanpa melihat kas besar bank BCA.
4. Coba akses rute sensitif via address bar browser:
   - Ketik URL: `http://localhost:3000/admin/finance` (Kas Besar BCA) ➔ Ditolak dan diarahkan ke `/admin/inventory`.
   - Ketik URL: `http://localhost:3000/admin/investors` (Dividen Investor) ➔ Ditolak dan diarahkan ke `/admin/inventory`.
   - Ketik URL: `http://localhost:3000/admin/settings` (Pengaturan Sistem) ➔ Ditolak.

#### Bagian C: Pengujian Peran `INVESTOR` (Pemodal Mitra)
1. Logout, lalu login dengan role **INVESTOR**, masukkan kata sandi sesuai `.env`.
2. Verifikasi layar: Langsung diarahkan ke portal investor (`/investor`).
3. Coba ketik URL admin: `http://localhost:3000/admin` ➔ Otomatis ditolak dan dikembalikan ke `/investor`.

#### Bagian D: Pengujian Peran `OWNER` (Pemilik Showroom)
1. Logout, lalu login dengan role **OWNER**, masukkan kata sandi sesuai `.env`.
2. Verifikasi: Seluruh menu terbuka 100% tanpa ada batasan (Dashboard Utama, Inventori Unit, Cek Fisik & Inspeksi, Gudang Bahan & Alat, Penjualan & Piutang, Keuangan & Kas, Investor & Bagi Hasil, Sistem & Notifikasi).

### ✅ Hasil yang Diharapkan:
- Seluruh 4 peran bekerja presisi sesuai wewenangnya.
- Tidak ada kebocoran data kas showroom ke staf lapangan atau tenaga sales.
- Investor terisolasi di portal transparansi miliknya sendiri.

---

## SKENARIO 17: STRATEGI MULTI-LAYER BACKUP VPS SENDIRI & DISASTER RECOVERY

### 🎯 Tujuan:
Menguji fungsi pencadangan data mandiri (bebas biaya) untuk instalasi VPS sendiri, pengunduhan snapshot JSON via web, dan simulasi pemulihan database.

### 📝 Langkah Pengujian:

#### Bagian A: Unduh Snapshot Database Instan via Web UI
1. Login sebagai `OWNER`, buka menu **Sidebar > Sistem & Notifikasi** (`/admin/settings`).
2. Gulir ke bagian **Pencadangan Data & Pemulihan (Backup & Disaster Recovery)**.
3. Klik tombol **Unduh Snapshot Database (JSON)** (`/api/backup/download`).
4. Periksa folder Downloads di komputer Anda.
5. Buka file JSON yang terunduh dengan text editor:
   - Verifikasi keberadaan tabel: `vehicles`, `sales`, `payments`, `cashTransactions`, `investors`, `users`.

#### Bagian B: Pengujian Script Multi-Layer Backup di VPS
1. Buka terminal proyek di VPS / server lokal:
   ```bash
   chmod +x scripts/backup-multi-layer.sh scripts/restore-db.sh
   ./scripts/backup-multi-layer.sh
   ```
2. Periksa output log terminal:
   - Status Lapis 1 (Lokal Dump): Terbentuk file `.sql.gz` di folder `backups/db/`.
   - Status Auto-Purge: Pengecekan file kadaluarsa > 7 hari berjalan normal.
   - Status Lapis 2 (Telegram Bot): Menampilkan kesiapan token/chat ID atau notifikasi terkirim.
   - Status Lapis 3 (Google Drive Rclone): Menampilkan status remote rclone.
   - Status Lapis 4 (GitHub): Memverifikasi status commit git lokal.

#### Bagian C: Pengujian Script Pemulihan (Disaster Recovery Restore)
1. Jalankan script restore dengan parameter file backup:
   ```bash
   ./scripts/restore-db.sh backups/db/<nama_file_backup>.sql.gz
   ```
2. Verifikasi dialog keamanan:
   - Script meminta konfirmasi eksplisit (`Y/N`).
   - Script otomatis membuat cadangan darurat (*safety pre-restore backup*) sebelum melakukan overwrite.
   - Data berhasil di-restore dan aplikasi kembali aktif tanpa data korup.

### ✅ Hasil yang Diharapkan:
- Snapshot web JSON terunduh rapi dan lengkap.
- Script pencadangan 4 lapis berjalan mulus tanpa error syntax.
- Script pemulihan dilengkapi pengaman ganda untuk mencegah kehilangan data akibat salah ketik operator.

---

## 🏁 KESIMPULAN HASIL PENGETESAN

Jika seluruh **17 skenario pengetesan** di atas telah dijalankan dengan hasil checklist **PASSED (LULUS)**:
1. Sistem Showroom Nur Mobil dinyatakan **100% Siap Produksi (Enterprise & Production Ready)**.
2. Seluruh siklus bisnis mulai dari kulakan lelang, servis garasi mandiri, inspeksi bodi, display publik, penjualan cash tempo anti-leasing (DP 70% & 30 hari), alarm pajak STNK, dividen investor, hak akses RBAC 4 peran, hingga sistem pencadangan 4 lapis telah terhubung secara otomatis, presisi, dan aman.
