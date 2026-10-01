# 📖 BUKU PANDUAN PENGGUNAAN LENGKAP SISTEM
## Aplikasi Manajemen Showroom & Bengkel Mandiri — Nur Mobil
*Versi Sistem: Produksi 2026 | Berbasis Next.js App Router, Prisma ORM, MySQL & Gemini AI*

---

## 📑 DAFTAR ISI UTAMA

1. [Bab 1: Ikhtisar Arsitektur & Filosofi Sistem](#bab-1-ikhtisar-arsitektur--filosofi-sistem)
2. [Bab 2: Katalog Publik & Halaman Konsumen (Customer-Facing)](#bab-2-katalog-publik--halaman-konsumen-customer-facing)
3. [Bab 3: Portal Khusus Investor (Investor Portal)](#bab-3-portal-khusus-investor-investor-portal)
4. [Bab 4: Dashboard Eksekutif & Asisten AI Gemini](#bab-4-dashboard-eksekutif--asisten-ai-gemini)
5. [Bab 5: Manajemen Data Mobil (Inventori) & Alur Status](#bab-5-manajemen-data-mobil-inventori--alur-status)
6. [Bab 6: Intake Unit Baru, Balai Lelang & Next-Step Dialog](#bab-6-intake-unit-baru-balai-lelang--next-step-dialog)
7. [Bab 7: Lembar Kerja Cek Fisik & Inspeksi 11 Panel (Standar ACV IBID)](#bab-7-lembar-kerja-cek-fisik--inspeksi-11-panel-standar-acv-ibid)
8. [Bab 8: Gudang Bahan Habis Pakai, Servis Mandiri & Aset Peralatan](#bab-8-gudang-bahan-habis-pakai-servis-mandiri--aset-peralatan)
9. [Bab 9: Penjualan, Buku Piutang & Alarm Jatuh Tempo 14 Hari](#bab-9-penjualan-buku-piutang--alarm-jatuh-tempo-14-hari)
10. [Bab 10: Pelunasan Pembayaran & Jembatan Bagi Hasil Investor](#bab-10-pelunasan-pembayaran--jembatan-bagi-hasil-investor)
11. [Bab 11: Modul Keuangan: Buku Kas BCA, Biaya Operasional & Prive](#bab-11-modul-keuangan-buku-kas-bca-biaya-operasional--prive)
12. [Bab 12: Manajemen Investor, Pool Modal & Aturan Tiering](#bab-12-manajemen-investor-pool-modal--aturan-tiering)
13. [Bab 13: Dokumen Legal & Cetak PDF Otomatis (Standar Industri)](#bab-13-dokumen-legal--cetak-pdf-otomatis-standar-industri)
14. [Bab 14: Pengaturan Sistem, Kunci API Gemini & Backup Data](#bab-14-pengaturan-sistem-kunci-api-gemini--backup-data)

---

## BAB 1: IKHTISAR ARSITEKTUR & FILOSOFI SISTEM

Aplikasi **Nur Mobil Showroom** dibangun untuk mengatasi kesenjangan antara akuntansi konvensional dan realitas lapangan bisnis jual-beli mobil bekas di Indonesia:
1. **Harga Pokok Penjualan (HPP) Multi-Komponen:** Modal satu unit mobil bukan hanya harga beli lelang, tetapi penjumlahan otomatis dari: *Harga Beli Faktur Lelang + Biaya Admin Balai Lelang + Ongkos Towing/Kirim + Servis Mesin + Cat Bodi + Salon Detailing + Suku Cadang*.
2. **Pengakuan Upah Servis Mandiri:** Pekerjaan ringan seperti ganti oli mesin, ganti filter, bohlam, dan pembersihan interior dikerjakan sendiri oleh tim garasi. Selisih tarif servis yang dibebankan ke mobil vs harga beli grosir bahan diakui sebagai **Laba Jasa Garasi Mandiri**, sehingga tidak ada uang kas yang bocor ke bengkel luar.
3. **Pengawalan Ketat Arus Kas 14 Hari:** Berdasarkan data historis, mayoritas pembeli showroom tempo melunasi dalam 14 hari. Sistem proaktif mengawasi piutang ini dengan alarm visual dan reminder WhatsApp 1-klik.
4. **Pemisahan Peran & Transparansi:** Sistem memisahkan secara ketat antara kas operasional showroom, modal saham pemilik, dan titipan dana investor luar dengan laporan dividen deterministik.

---

## BAB 2: KATALOG PUBLIK & HALAMAN KONSUMEN (CUSTOMER-FACING)

Website publik dapat diakses langsung oleh calon pembeli tanpa perlu login.

### 1. Halaman Beranda (Landing Page — `/`)
- **Hero Showcase:** Menampilkan unit-unit unggulan yang berstatus *READY_FOR_SALE*.
- **Pencarian Cepat:** Konsumen dapat memfilter mobil berdasarkan merk (Toyota, Honda, Daihatsu, Mitsubishi, Suzuki), rentang harga (di bawah 100jt, 100-150jt, di atas 150jt), transmisi (Manual/Matic), dan tahun perakitan.
- **Kredibilitas Garasi:** Menampilkan komitmen bebas laka berat, bebas banjir, dokumen BPKB/STNK terjamin keabsahannya, dan garansi mesin/transmisi.

### 2. Katalog Lengkap Mobil (`/katalog`)
- **Daftar Unit Real-Time:** Mobil yang sudah di-DP (*BOOKED*) otomatis diberi lencana khusus *"Sedang Dibooking"*, dan unit yang lunas (*SOLD_SETTLED*) disembunyikan otomatis dari listing publik.
- **Kartu Unit Informatif:** Menampilkan foto utama, plat nomor (disamarkan sebagian jika perlu), jarak tempuh (odometer), transmisi, tahun, dan harga jual OTR tunai.

### 3. Detail Mobil & Click-to-WhatsApp (`/katalog/[id]`)
- **Galeri Foto High-Definition:** Foto eksterior depan, belakang, samping, interior, odometer, dan ruang mesin.
- **Rincian Spesifikasi & Kondisi:** Hasil inspeksi fisik grade mesin, transmisi, dan rangka.
- **Kalkulator Simulasi DP:** Membantu calon konsumen menghitung estimasi cicilan per bulan.
- **Tombol WhatsApp Konsultasi (1-Klik):** Menghubungkan langsung konsumen ke nomor WhatsApp resmi showroom dengan pesan otomatis:
  > *"Halo Admin Nur Mobil, saya tertarik dengan unit Toyota Avanza G 2019 (Plat B 1234 ABC) seharga Rp 145.000.000. Apakah unit ini masih READY?"*

---

## BAB 3: PORTAL KHUSUS INVESTOR (INVESTOR PORTAL)

Portal khusus dapat diakses melalui rute `/investor` untuk memberikan transparansi penuh kepada pemodal perorangan tanpa memperlihatkan dapur operasional internal showroom.

### Fitur yang Dilihat Investor:
1. **Ringkasan Modal Berjalan:** Total dana modal yang disetor investor, berapa persen yang sedang aktif dibelikan mobil, dan berapa dana mengendap (*cash balance*).
2. **Daftar Mobil yang Dibiayai:** Rincian mobil yang dibeli menggunakan dana investor tersebut, lengkap dengan foto unit, tanggal beli, HPP berjalan, dan status unit (*Proses Perbaikan*, *Siap Jual*, atau *Terjual*).
3. **Riwayat Dividen Laba (Pencairan Hasil):** Tabel tanggal pencairan bagi hasil, nominal dividen yang ditransfer, nomor referensi mutasi BCA, dan persentase pembagian laba yang disepakati.

---

## BAB 4: DASHBOARD EKSEKUTIF & ASISTEN AI GEMINI
*Lokasi: Sidebar > Menu Utama > Dashboard (`/admin`)*

Dashboard dirancang sebagai ruang komando harian pemilik showroom.

### 1. Panel Asisten AI Showroom (Gemini AI Flash)
- **Tombol "Generate Rangkuman Harian AI":** Menganalisis kondisi showroom saat ini secara instan dan menyajikan poin-poin eksekutif:
  * Berapa unit yang harus segera dijual minggu ini.
  * Berapa kas yang aman dipakai kulakan ke lelang.
  * Peringatan dokumen BPKB yang belum diserahkan balai lelang.
- **Kotak Tanya-Jawab AI Interaktif:** Pemilik dapat mengetikkan pertanyaan bebas seperti:
  * *"Ada tawaran Innova Reborn 2017 harga 210jt eks perusahaan, aman diambil gak dengan sisa kas sekarang?"*
  * *"Unit mana yang marginnya paling tebal untuk promo akhir pekan?"*

### 2. Funnel Status Operasional Garasi
Widget KPI visual yang menampilkan pergerakan mobil secara horizontal:
- **Di Garasi:** Total seluruh unit fisik yang sedang ada di showroom.
- **Siap Jual (Ready for Sale):** Unit yang sudah selesai salon & servis, siap transaksi.
- **Baru Masuk (Intake):** Mobil yang baru tiba dari lelang, menunggu cek fisik.
- **Dalam Perbaikan (In Repair):** Mobil yang sedang dicat, ganti oli, atau di bengkel luar.
- **Booked:** Mobil yang sudah diikat tanda jadi (DP) oleh calon pembeli.
- **Stagnant (> 45 Hari):** Mobil macet yang perlu dievaluasi harga jualnya agar modal berputar.

### 3. Pipeline Balai Lelang & Tracking BPKB Tiba
- **Pemisahan Kategori Lot:** Memisahkan stok antara *Eks Perusahaan* (umumnya BPKB cepat tiba 7-14 hari) dan *Eks Tarikan Leasing* (BPKB rawan lambat 14-30 hari).
- **Alarm BPKB Estimasi Tiba (7 Hari):** Daftar mobil yang masa tunggu BPKB-nya jatuh tempo dalam 7 hari ke depan untuk segera ditagih ke panitia lelang.

### 4. Proyeksi Arus Kas 14 Hari (14-Day Cashflow)
- **Proyeksi Kas Masuk (Est.):** Nominal piutang tempo yang diperkirakan cair dalam 2 minggu.
- **Proyeksi Kas Keluar (Est.):** Beban operasional setengah bulan + estimasi biaya perbaikan unit *in repair*.
- **Net Cashflow 14 Hari:** Estimasi surplus atau defisit kas.
- **Cash Runway:** Berapa hari showroom dapat bertahan hidup jika sama sekali tidak ada mobil yang laku.

### 5. Alarm Proaktif Piutang Tempo 14 Hari + 1-Klik WA Reminder
- Banner peringatan warna rose/amber yang mendeteksi setiap penjualan tempo yang terlambat atau mendekati jatuh tempo.
- **Tombol 1-Klik Kirim WA:** Membuka WhatsApp secara instan dengan teks tagihan resmi atas nama Nur Mobil.

### 6. Rekomendasi Keputusan Kulakan Unit Baru
- Menganalisis sisa kas BCA bebas dikurangi dana cadangan (*reserve fund*).
- Memberikan saran konkret: Beli berapa unit, rentang budget maksimal, dan segmen mobil terlaris (misal: *Avanza/Xenia/Brio*).

---

## BAB 5: MANAJEMEN DATA MOBIL (INVENTORI) & ALUR STATUS
*Lokasi: Sidebar > Menu Operasional > Data Mobil (`/admin/inventory`)*

### 1. Daftar Tabel Inventori Cerdas
- Menampilkan foto mini unit, plat nomor, merk, varian tahun, transmisi, HPP modal terkini, target harga jual, dan margin proyeksi.
- **Filter Cepat:** Tab status *Semua*, *Intake*, *Perbaikan*, *Siap Jual*, *Booking*, dan *Terjual Lunas*.
- **Pencarian Cepat:** Pencarian instan berdasarkan plat nomor, nama merk, tipe, atau warna mobil.

### 2. Sistem 1 Tombol Aksi Utama Kontekstual + Dropdown `[...]`
Menggantikan ikon kecil yang membingungkan dengan tindakan paling logis berdasarkan siklus unit:
- Unit **INTAKE** ➔ Tombol Utama: **Cek Fisik** (warna biru)
- Unit **IN_REPAIR** ➔ Tombol Utama: **Catat Servis** (warna oranye)
- Unit **READY_FOR_SALE** ➔ Tombol Utama: **Tag Spion** (cetak price tag kaca)
- Unit **BOOKED** ➔ Tombol Utama: **Update Status**
- Unit **SOLD_SETTLED** ➔ Tombol Utama: **Terjual Lunas**
- Menu Titik Tiga `[...]` memuat aksi sekunder: Ubah data, Ganti Oli Mandiri, Cetak Surat Jalan Bengkel, Upload Foto, dan Hapus Unit.

### 3. Update Status Manual (`/admin/inventory/[id]/status`)
Digunakan untuk memindahkan status mobil secara manual disertai catatan log perubahan.

### 4. Upload Foto & Dokumen Media (`/admin/inventory/[id]/media`)
- Mendukung multi-upload foto tampilan luar, interior, dan ruang mesin.
- Fitur drag-and-drop dokumen digital: Foto BPKB, STNK, Lembar Pajak, dan Faktur Pembelian.

### 5. Catat Pengeluaran Unit Mobil (`/admin/inventory/[id]/expenses/new`)
Setiap kali ada biaya eksternal:
- Kategori pengeluaran: *Body Paint (Cat Bodi)*, *Mechanical (Kaki-kaki/Mesin)*, *Detailing Salon*, *Sparepart*, *Towing/Pengiriman*, *Pajak/Mutasi*, atau *Lainnya*.
- Masukkan nama vendor (misal: Bengkel Cat Pak Joko), tanggal, nominal, dan metode pembayaran.
- Nominal otomatis menambah HPP modal unit tersebut dan tercatat di buku kas.

### 6. Import Data Massal Spreadsheet (`/admin/inventory/import`)
- Mendukung upload file Excel (`.xlsx`) atau `.csv`.
- Memungkinkan showroom baru yang sudah punya daftar mobil di Excel langsung mengimpor puluhan unit sekaligus dalam hitungan detik.

---

## BAB 6: INTAKE UNIT BARU, BALAI LELANG & NEXT-STEP DIALOG
*Lokasi: Sidebar > Menu Operasional > Data Mobil > + Tambah Mobil Baru (`/admin/inventory/new`)*

### A. Panduan Pengisian Form Intake:
1. **Identitas Kendaraan:**
   - Plat Nomor (wajib huruf kapital, contoh: `B 1984 ZMR`).
   - Merk, Model, Varian, Tahun Pembuatan, Warna, Jenis Transmisi (Manual / Automatic), Jarak Tempuh (KM).
2. **Sumber Perolehan Unit:**
   - **AUCTION (Balai Lelang):** Masukkan nama balai lelang (IBID, JBA, Balindo, Caready), Nomor Lot Lelang, dan pilih Tipe Lot:
     * *Eks Perusahaan:* Mobil operasional PT, dokumen BPKB umumnya aman & cepat.
     * *Eks Tarikan Leasing:* Mobil tarikan kredit macet, pantau keabsahan surat pelepasan hak & masa tunggu BPKB.
   - **DIRECT_PURCHASE (Beli Langsung dari Pemilik)** atau **TRADE_IN (Tukar Tambah Konsumen)**.
3. **Komponen Finansial Awal:**
   - Harga Beli Faktur (Hammer Price).
   - Biaya Administrasi Lelang.
   - Target Harga Jual dan Batas Minimal Harga Jual (*Bottom Price* untuk negosiasi sales).
4. **Status Dokumen & Masa Tunggu:**
   - Status BPKB: *READY* (langsung ada) atau *PENDING_ARRIVAL* (menunggu kedatangan).
   - Estimasi Hari Tunggu (default: 7 hari untuk lelang).

### B. Next-Step Success Dialog (Interaktif):
Setelah Anda menekan tombol **Simpan Unit Baru**, sistem memunculkan dialog pop-up konfirmasi yang menawarkan 4 opsi cepat:
1. **Ganti Oli Mandiri Sekarang:** Membuka pop-up alokasi oli dari gudang garasi Nur Mobil.
2. **Cetak Surat Jalan Bengkel (PDF):** Langsung mengunduh PDF surat jalan pengantar untuk sopir jika mobil langsung dikirim ke bengkel cat/perbaikan.
3. **Mulai Cek Fisik & Inspeksi:** Membuka lembar kerja inspeksi 11 panel cat bodi.
4. **Upload Foto & Dokumen:** Mengunggah foto-foto unit yang baru tiba.

---

## BAB 7: LEMBAR KERJA CEK FISIK & INSPEKSI 11 PANEL
*Lokasi: Sidebar > Menu Operasional > Cek Fisik Unit (`/admin/inspections`)*

Fitur ini mengadopsi standar inspeksi profesional balai lelang ACV IBID untuk menjamin kejujuran kondisi unit kepada pembeli.

### 1. 11 Panel Bodi yang Diinspeksi:
1. Kap Mesin (Hood)
2. Atap (Roof)
3. Pintu Depan Kanan
4. Pintu Belakang Kanan
5. Fender Depan Kanan
6. Quarter Panel Belakang Kanan
7. Pintu Depan Kiri
8. Pintu Belakang Kiri
9. Fender Depan Kiri
10. Quarter Panel Belakang Kiri
11. Pintu Bagasi (Trunk/Tailgate)

### 2. Standar Ketebalan Cat (Mikron Meter / µm):
Inspektor mengukur dengan alat *Coating Thickness Gauge*:
- **80 – 130 µm:** Cat Asli / Pabrik (*ORIGINAL*).
- **140 – 220 µm:** Cat Ulang Tipis (*REPAINT*).
- **> 230 µm:** Bekas Dempul Tebal (*PUTTY/BODY REPAIR*).

### 3. Grading Kendaraan:
- **Grade Rangka (Chassis):** Grade A (Bebas tabrakan dan bebas karat banjir) hingga Grade D (Pernah kena pilar/apron).
- **Grade Mesin & Transmisi:** Grade A s/d D berdasarkan suara, getaran, kebocoran oli, dan kelancaran perpindahan gigi.
- **Grade Interior & Eksterior.**
- **Hasil:** Tersedia tombol cetak **Lembar Laporan Inspeksi Fisik PDF** resmi dengan diagram bodi mobil (*Car Blueprint Diagram*) untuk ditunjukkan ke calon pembeli.

---

## BAB 8: GUDANG BAHAN HABIS PAKAI, SERVIS MANDIRI & ASET PERALATAN
*Lokasi: Sidebar > Menu Operasional > Gudang Bahan & Alat (`/admin/finance/assets`)*

### 1. Tab 1: Stok Bahan Habis Pakai (Supplies)
Menampung barang-barang yang dibeli grosir:
- Oli Mesin (10W-40, 5W-30, 0W-20), Oli Transmisi, Minyak Rem.
- Filter Oli (Toyota, Honda, Suzuki, Daihatsu), Filter Udara, Filter AC.
- Bohlam Lampu Utama, Bohlam Rem, Sekring (Fuse).
- Sampo Mobil, Kompon Poles Kasar/Halus, Pad Poles, Lap Microfiber, Semir Ban.
- Setiap bahan memiliki pencatatan *Stok Masuk*, *Stok Terpakai*, dan *Sisa Stok Terkini*.

### 2. Mekanisme Alokasi Mandiri (Upah Garasi)
- Klik tombol **Pakai ke Mobil** pada bahan yang ingin digunakan.
- Pilih mobil yang sedang dikerjakan.
- Masukkan jumlah pakai (misal: 1 galon oli + 1 filter).
- Masukkan **Tarif Servis yang Dibebankan ke HPP Mobil** (misal: Rp 500.000).
- **Efek Akuntansi Otomatis:**
  * Modal HPP Mobil bertambah Rp 500.000 (vendor otomatis: *"Garasi Mandiri Nur Mobil"*).
  * Stok oli berkurang 1 galon di gudang.
  * Selisih untung (misal: Rp 500.000 tarif - Rp 320.000 modal grosir = **Rp 180.000**) dicatat ke metrik **Total Laba Jasa Garasi Terkumpul**.

### 3. Tab 2: Aset Tetap & Peralatan Garasi
Mencatat inventaris alat kerja bengkel:
- Mesin Cuci Steam High Pressure, Kompresor Angin, Mesin Poles Rotary/Dual Action, Dongkrak Buaya 3 Ton, Jack Stand, Toolkit Kunci Pas/Shock.
- Nilai aset tercatat sebagai inventaris tetap showroom dan tidak habis dalam sekali pakai.

### 4. Tab 3: Riwayat Alokasi ke Mobil
Daftar kronologis seluruh servis dan detailing mandiri yang pernah dilakukan pada unit, memuat tanggal, plat nomor, jenis bahan yang digunakan, dan laba jasa yang dihasilkan.

---

## BAB 9: PENJUALAN, BUKU PIUTANG & ALARM JATUH TEMPO 14 HARI
*Lokasi: Sidebar > Menu Operasional > Penjualan & Piutang (`/admin/sales`)*

### 1. Input Penjualan Baru (`/admin/sales/new`)
- Pilih unit mobil yang terjual.
- Pilih jenis pembeli: **Konsumen Retail Perorangan** atau **Showroom Rekanan**.
- Masukkan identitas pembeli: Nama, Nomor HP/WhatsApp, Alamat, dan Catatan.
- Masukkan **Harga Jual Kesepakatan**.
- Masukkan **Uang Muka (DP) / Pembayaran Awal** dan pilih metode pembayaran (Transfer BCA, Tunai/Cash, atau Tukar Tambah).
- Jika ada sisa piutang tempo: Masukkan **Tanggal Jatuh Tempo Pelunasan** (sistem otomatis memberi rekomendasi 14 hari).

### 2. Buku Piutang & Status Lencana Tempo (Receivable Badges)
Setiap transaksi tempo memiliki indikator visual otomatis:
- 🟢 **ON_SCHEDULE:** Sisa hari masih banyak (> 3 hari).
- 🟡 **DUE_SOON:** Sisa 1 hingga 3 hari sebelum tempo (hari ke-11 s/d 13).
- 🔴 **OVERDUE:** Lewat dari tanggal jatuh tempo pelunasan.
- 🟢 **Lunas 100%:** Transaksi telah selesai (*settled*).

### 3. Click-to-WhatsApp Tagihan 1-Klik
Di samping baris piutang, klik ikon WhatsApp hijau untuk langsung mengirim pesan pengingat yang ramah, sopan, dan formal tanpa repot mengetik ulang nama pembeli, nomor plat, dan sisa nominal.

---

## BAB 10: PELUNASAN PEMBAYARAN & JEMBATAN BAGI HASIL INVESTOR
*Lokasi: Tabel Penjualan > Tombol `+` Catat Pembayaran (`/admin/sales/[id]/payment`)*

### 1. Mencatat Pembayaran Angsuran:
- Masukkan nominal pembayaran yang masuk.
- Pilih metode: Transfer Bank BCA, Cash Tunai, atau Tukar Tambah (Trade-In).
- Masukkan tanggal dan catatan transfer bank (misal: *Transfer m-BCA a.n. Sutrisno*).
- Sistem menampilkan perhitungan live sisa piutang baru.

### 2. Settlement Success Dialog (Jembatan Otomatis ke Investor):
Saat pembayaran mencapai 100% (sisa piutang menjadi Rp 0):
- Layar memunculkan dialog pop-up **Pembayaran Lunas Berhasil Dicatat**.
- **Jika Mobil Dibiayai Investor:**
  * Dialog langsung menampilkan lencana oranye: *"Unit Sah Didanai Investor"*.
  * Menampilkan nama pemodal yang berhak menerima dividen.
  * Menyediakan **Tombol Eksekusi Bagi Hasil Investor Sekarang (1-Klik)**:
    - Admin cukup menekan tombol ini langsung di dalam pop-up.
    - Sistem menjalankan transaksi database deterministik: memotong modal pokok, menghitung dividen laba sesuai aturan tiering, mencatat mutasi di *Capital Ledger*, dan menghasilkan snapshot permanen.
  * Tautan langsung ke halaman riwayat bagi hasil investor.
- **Jika Mobil Modal Sendiri (100% Showroom):**
  * Dialog mengonfirmasi bahwa seluruh laba kotor unit telah masuk kas showroom.
- **Tombol Dokumen Lunas Langsung:** Tersedia tombol cetak BAST dan Kuitansi Lunas di tempat.

---

## BAB 11: MODUL KEUANGAN: BUKU KAS BCA, BIAYA OPERASIONAL & PRIVE
*Lokasi: Sidebar > Menu Keuangan (`/admin/finance`)*

### 1. Buku Kas & Rekening BCA (`/admin/finance`)
- Menampilkan Saldo Kas Berjalan riil rekening BCA showroom.
- **Mutasi Masuk:** Otomatis tercatat saat ada DP penjualan, pelunasan konsumen, atau setoran modal investor/owner.
- **Mutasi Keluar:** Otomatis tercatat saat kulakan unit lelang, pembayaran bengkel perbaikan, biaya operasional garasi, penarikan dividen investor, atau prive owner.

### 2. Biaya Operasional Showroom (`/admin/finance/expenses`)
Mencatat beban tetap bulanan yang tidak melekat pada satu unit mobil tertentu:
- Sewa Lahan/Garasi Showroom.
- Tagihan Listrik PLN & Air PDAM Garasi.
- Biaya Konsumsi Mekanik & Penjaga Showroom.
- Gaji Karyawan & Komisi Penjualan Marketing.
- Kuota Internet, Pembelian Wi-Fi, dan ATK Kantor.

### 3. Penarikan Dana Pribadi Pemilik / Prive (`/admin/finance/prive/new`)
Setiap kali pemilik showroom mengambil uang kas untuk keperluan pribadi keluarga:
- Dicatat sebagai transaksi **PRIVE**.
- Mengurangi saldo kas BCA showroom tanpa merusak perhitungan laba-rugi bersih unit mobil yang dijual.

### 4. Setoran Modal Tambahan Pemilik / Ekuitas (`/admin/finance/equity/new`)
Digunakan saat pemilik menyuntikkan dana pribadi baru ke rekening BCA showroom untuk memperbesar modal kerja kulakan.

---

## BAB 12: MANAJEMEN INVESTOR, POOL MODAL & ATURAN TIERING
*Lokasi: Sidebar > Menu Keuangan > Manajemen Investor (`/admin/investors`)*

### 1. Unit Siap Bagi Hasil (`/admin/investors`)
Daftar seluruh mobil yang sudah terjual lunas 100% namun dividen labanya belum dibagikan kepada pemodal. Memuat harga beli, total HPP, harga jual, dan laba kotor riil.

### 2. Daftar Akun Investor (`/admin/investors/accounts`)
Mencatat profil pemodal rekanan:
- Nama Lengkap Investor, Nomor WhatsApp, Nomor Rekening Bank BCA/Mandiri untuk transfer dividen, dan Jenis Investor (*Pemodal Tetap / Konsorsium / Pemodal Khusus 1 Unit*).

### 3. Setoran Modal Investor (`/admin/investors/deposit/new`)
Mencatat penerimaan transfer dana modal dari investor ke rekening showroom. Dana ini otomatis masuk ke saldo kas BCA dan menambah modal siap dialokasikan (*Active Allocated Capital*).

### 4. Riwayat Eksekusi Bagi Hasil (`/admin/investors/history`)
Laporan audit permanen setiap pembagian dividen yang pernah dilakukan:
- Snapshot tanggal eksekusi.
- Rincian pembagian: Berapa bagian laba untuk Investor (misal 50%) dan berapa untuk Owner/Garasi (misal 50%).
- Fitur *Reverse Distribution* (jika terjadi salah input transaksi dengan proteksi rollback mutasi modal).

### 5. Aturan Pembagian Laba Berjenjang (Tier Rules — `/admin/investors/tier-rules`)
Showroom dapat mengatur aturan pembagian dividen otomatis berdasarkan besaran keuntungan unit:
- **Tier 1 (Laba Standar, misal Rp 0 s/d Rp 10.000.000):** Pembagian 50% Investor : 50% Showroom.
- **Tier 2 (Laba Tebal, misal > Rp 10.000.000):** Pembagian 60% Showroom : 40% Investor (atau sebaliknya sesuai kesepakatan tertulis).
- Aturan dieksekusi secara otomatis oleh sistem tanpa ada perselisihan hitungan manual.

---

## BAB 13: DOKUMEN LEGAL & CETAK PDF OTOMATIS (STANDAR INDUSTRI)

Sistem dilengkapi generator dokumen PDF berstandar legal industri showroom mobil:

### 1. Surat Perjanjian Jual Beli / SPK (`/api/pdf/agreement/[saleId]`)
- Memuat klausul kesepakatan nomor rangka, nomor mesin, dan kelengkapan dokumen.
- Pasal garansi keabsahan dokumen (BPKB & STNK asli sah terdaftar di Samsat).
- Pasal batas waktu jatuh tempo pelunasan sisa piutang.

### 2. Kuitansi / Faktur Pembayaran Lunas (`/api/pdf/invoice/[saleId]`)
- Format resmi nota penjualan bermeterai Rp 10.000.
- Mencantumkan nomor kwitansi unik, tanggal bayar, terbilang rupiah, dan tanda tangan penerima showroom.

### 3. Berita Acara Serah Terima / BAST (`/api/pdf/bast/[saleId]`)
- Dokumen serah terima fisik kendaraan saat mobil dibawa keluar showroom oleh konsumen.
- Memuat checklist kelengkapan: Kunci cadangan, Buku servis, Buku manual, Dongkrak, Ban serep, STNK asli, Surat jalan, dan BPKB asli.

### 4. Price Tag Gantung Kaca Spion (`/api/pdf/spec-tag/[vehicleId]`)
- Dokumen desain vertikal yang siap dicetak dan digantung pada kaca spion tengah mobil di lantai showroom.
- Memuat merk, tipe, tahun, transmisi, keunggulan fitur, dan harga listing siap nego.

### 5. Surat Jalan Pengantar Bengkel Luar (`/api/pdf/workshop-dispatch/[vehicleId]`)
- Dokumen resmi pengantar saat mobil dikirim keluar showroom untuk pengerjaan perbaikan bodi, cat oven, atau perbaikan AC.
- Berfungsi mencegah penyalahgunaan mobil oleh sopir atau pihak bengkel rekanan.

### 6. Lembar Laporan Inspeksi Cek Fisik (`/api/pdf/inspection/[id]`)
- Lembar penilaian kondisi bodi, cat per panel (mikron), mesin, dan rangka bebas laka/banjir untuk ditunjukkan ke konsumen saat negosiasi.

---

## BAB 14: PENGATURAN SISTEM, KUNCI API GEMINI & BACKUP DATA
*Lokasi: Sidebar > Menu Pengaturan (`/admin/settings`)*

### 1. Kunci API Google Gemini (AI):
- Masukkan API Key gratis dari Google AI Studio (`AIzaSy...`) untuk mengaktifkan asisten AI eksekutif.
- Tersedia tombol sakelar cepat (ON/OFF) untuk menyalakan/mematikan fitur briefing AI.

### 2. Identitas Profil Showroom:
- Nama Showroom: **Nur Mobil**
- Alamat Lengkap Garasi & Nomor Telepon Hotline.
- Nomor Rekening Resmi Showroom (BCA) untuk dicetak pada kuitansi dan SPK.

### 3. Backup & Keamanan Database:
- Database MySQL tersinkronisasi dengan skema Prisma ORM.
- Tersedia script pencadangan database berkala di folder `scripts/backup-db.sh`.
- Seluruh kode sumber tersinkronisasi aman di repository resmi GitHub: `https://github.com/monlievt/showroom`.

---
*Buku panduan ini merupakan dokumen resmi operasional sistem Nur Mobil Showroom.*
