# 📜 CHRONICLE & CHANGELOG LENGKAP SISTEM
## Aplikasi Manajemen Showroom & Bengkel Mandiri — Nur Mobil
*Perjalanan Lengkap Rancang Bangun Perangkat Lunak: Dari Inisialisasi Nol hingga Sistem Produksi Enterprise*

---

## 📊 KILAS BALIK PROYEK (AT A GLANCE)

| Indikator | Capaian | Keterangan |
| :--- | :---: | :--- |
| **Total Git Commits** | **42+ Commits** | Riwayat bersih dan terverifikasi dari awal mula proyek |
| **Siklus Sprint** | **8 Sprint (0 s/d 6 + Hardening)** | Eksekusi deterministik sesuai roadmap teknis |
| **Skenario Pengujian (QA)** | **17 Skenario End-to-End** | Menguji alur dari kulakan lelang sampai bagi hasil investor |
| **Buku Panduan Sistem** | **15 Bab Lengkap** | Dokumentasi SOP operasional, hukum SPK, dan manual pengguna |
| **Dokumen Legal Otomatis** | **6 Dokumen PDF Resmi** | SPK Pasal V, Kuitansi Meterai, BAST, Tag Spion, Surat Jalan, Inspeksi |
| **Proteksi Keamanan** | **4 Lapisan RBAC & Backup** | Kontrol hak akses multi-peran dan disaster recovery mandiri |

---

## 🗓️ GARIS WAKTU & RIWAYAT RILIS SISTEM (CHRONOLOGICAL RELEASES)

---

### [v1.7.0] — 4 Oktober 2026
#### 🚗 *Real Historical Sales Import & Active Garage Inventory Onboarding*

Pada rilis ini, seluruh data riwayat bisnis showroom dari tahun 2021 hingga unit terkini diimpor secara presisi ke dalam sistem produksi:

* **🌟 Pemisahan Bersih — Entitas Khusus Arsip & Benchmark (`HistoricalSale`):**
  - Mengarsipkan seluruh 127 penjualan mobil lama (2021-2025) ke tabel terpisah `HistoricalSale` agar tidak mengotori buku kas harian maupun memunculkan setoran modal semu.
  - Membuka halaman baru **`/admin/archive` (Arsip & Benchmark Harga)** lengkap dengan statistik akumulasi omzet Rp 14,94 Miliar, laba historis Rp 683,6 Juta, filter merk/tahun, serta modal pop-up rincian biaya HPP dan tombol edit.
* **🌟 Onboarding 13 Unit Stok Aktif Garasi (`Vehicle`):**
  - Hanya 13 unit mobil/motor riil yang masih ada di garasi yang masuk ke Inventori Aktif dengan status `READY_FOR_SALE` dan `IN_REPAIR` (Gran Max Blindvan).
  - Mengintegrasikan harga jual estimasi sebagai `targetSellingPrice` di katalog publik (Stargazer BK1953AEE, Stargazer BK1959AEE, Ertiga GX B2437TBZ, Ertiga Diesel DD1271YA, Confero L1229MX).
  - Masing-masing unit dapat diedit spesifikasi, harga pasang, rincian biaya, atau langsung dicatat penjualannya saat laku di dunia nyata.
* **🌟 Buku Kas Bersih & Murni (Clean Cash Flow):**
  - Buku kas toko dibersihkan dari 796 mutasi historis masa lalu dan saldo modal gaib 500jt. Buku kas siap mencatat saldo kas riil toko Anda dari hari ini ke depan.
* **🌟 Script Importer Terpadu (`npm run db:import-history`):**
  - Menambahkan script otomasi `prisma/seed-history.ts` dan dataset `prisma/history-data.json` agar sinkronisasi di server VPS produksi dapat dijalankan dalam satu perintah.

---

### [v1.6.0] — 3 Oktober 2026
#### 🚀 *Multi-Proof Digital Ecosystem, 7-Tier Profit Sharing & Financial Hardening*

Pada fase ini, sistem keuangan dan ekosistem investor disempurnakan hingga tingkat kepraktisan operasional tertinggi, menjawab kebutuhan riil penanganan mutasi bank dan keadilan bagi hasil keluarga.

* **🌟 Komponen Reusable Multi-Lampiran Bukti Digital (`ProofUploadField`):**
  - Mengembangkan sistem upload banyak berkas serentak (*multi-file upload*) untuk format JPG, PNG, WEBP, dan PDF (hingga 10MB per berkas).
  - Dilengkapi preview thumbnail instan, indikator dokumen PDF, tombol hapus per berkas, serta tautan buka dokumen penuh di tab baru.
  - Diintegrasikan secara serentak ke seluruh 8 formulir keuangan showroom:
    1. *Transaksi Kas Masuk/Keluar Manual* (`/admin/finance/transactions/new`)
    2. *Beban Tetap Operasional / OpEx* (`/admin/finance/expenses/new`)
    3. *Setoran Modal Tambahan Pemilik / Ekuitas* (`/admin/finance/equity/new`)
    4. *Penarikan Dana Pribadi Pemilik / Prive* (`/admin/finance/prive/new`)
    5. *Pembelian Alat & Mesin Inventaris Garasi* (`/admin/workshop/assets/new`)
    6. *Pencatatan Biaya Servis Unit Mobil* (`VehicleExpenseNewClient`)
    7. *Pembayaran Angsuran / Pelunasan Penjualan* (`/admin/sales/[id]/payment`)
    8. *Setoran Modal Investor Pool Fund* (`/admin/investors/deposit/new`)
* **🌟 Auto-Arsip Galeri Mobil (`VehiclePhoto`):**
  - Bukti foto nota pengerjaan servis fisik pada mobil otomatis diarsipkan ke galeri foto kendaraan tanpa input ganda oleh staf admin.
* **🌟 7 Tingkatan Aturan Bagi Hasil Deterministik 4 Saudara (Skema Modal Ibu):**
  - Menerapkan rumus 7 tingkatan baku sesuai preferensi pemilik:
    - *Tier 1 (Laba Rp 0 s/d Rp 1.000.000):* Rp 50.000 / saudara (Total Rp 200.000 / 4 orang)
    - *Tier 2 (Laba Rp 1.000.001 s/d Rp 3.000.000):* Rp 100.000 / saudara (Total Rp 400.000)
    - *Tier 3 (Laba Rp 3.000.001 s/d Rp 5.000.000):* Rp 200.000 / saudara (Total Rp 800.000)
    - *Tier 4 (Laba Rp 5.000.001 s/d Rp 10.000.000):* Rp 300.000 / saudara (Total Rp 1.200.000)
    - *Tier 5 (Laba Rp 10.000.001 s/d Rp 15.000.000):* Rp 500.000 / saudara (Total Rp 2.000.000)
    - *Tier 6 (Laba Rp 15.000.001 s/d Rp 20.000.000):* Rp 750.000 / saudara (Total Rp 3.000.000)
    - *Tier 7 (Laba > Rp 20.000.000):* Rp 1.000.000 / saudara (Total Rp 4.000.000)
  - Fitur **+ Tambah Baris Tier** dan **Hapus Baris** interaktif di UI `/admin/investors/tier-rules`.
  - Kartu **Proteksi Laba <= Rp 0**: Bagi hasil terkunci Rp 0 saat unit impas/rugi sehingga modal pokok investor tetap utuh.
* **🌟 Manajemen Profil & Rekening Bank Investor:**
  - Penambahan kolom nomor rekening bank (BCA/Mandiri/BRI) saat pendaftaran investor untuk kemudahan transfer dividen.
  - Fitur *Edit Profil Investor* langsung di tabel daftar akun investor (`/admin/investors/accounts`).
* **🛠️ Bugfixes Kritis & Optimasi Backend:**
  - Sinkronisasi Enum Kategori Biaya: Menambahkan `TIRES_AND_WHEELS` dan `ELECTRICAL` ke Prisma schema, Zod, dan DB.
  - Sinkronisasi Enum Kas: Menambahkan tipe `IN_OTHER` dan `OUT_OTHER`, serta normalisasi `OUT_CAPITAL_RETURN`.
  - Mengatasi *Stale Data* via `revalidatePath('/admin/finance')` dan `revalidatePath('/admin/dashboard')` di seluruh Server Actions mutasi kas.
  - Memindahkan posisi *Dev Indicator* ke pojok kanan bawah agar navigasi sidebar bebas halangan.

---

### [v1.5.0] — 3 Oktober 2026
#### 🚀 *Upcoming Stock Lifecycle, Anti-Fake Grade & Handover Compliance*

Fase ini berfokus pada etalase stok baru tiba, transparansi publik, dan ketertiban administrasi serah terima kendaraan.

* **🌟 Siklus Stok Segera Hadir (Upcoming Stock / Dalam Persiapan):**
  - Mobil berstatus `INTAKE` (baru masuk dari lelang) dan `IN_REPAIR` (sedang salon/bengkel) otomatis tayang di etalase publik homepage dan halaman katalog.
  - **Strategi Teaser 1 Foto Depan:** Publik hanya melihat foto serong kanan depan (`FRONT_3_4`), menjaga dokumentasi baret/cacat internal tetap rahasia garasi.
  - **Format Harga Psikologis:** Penampilan estimasi ramah konsumen (*contoh: "Estimasi Rp 150 Jutaan"*) mencegah showroom terikat komitmen sebelum HPP riil selesai dihitung.
* **🌟 Kartu Skor Anti-Grade Palsu:**
  - Unit yang belum diinspeksi menampilkan kartu status tegas: **`TAHAP CEK — Kartu Skor & Grade Belum Diterbitkan`**. Mencegah misleading informasi grade kepada konsumen.
  - Pratinjau edukatif 4 pilar inspeksi dan lembar kerja 160 titik transparan.
* **🌟 Kepatuhan Dokumen Serah Terima Kendaraan (Handover Compliance):**
  - Formulir penjualan dilengkapi pengunggahan berkas fisik serah terima: Foto serah terima unit bersama konsumen, BAST bertandatangan basah, kuitansi bermeterai, dan foto KTP pembeli.
  - Checklist serah terima: Kunci cadangan, buku servis, tool kit, dongkrak, ban serep, dan STNK asli.
  - Pencatatan komisi makelar/broker langsung saat transaksi penjualan.
* **🌟 Kemandirian Modul Gudang Bahan & Peralatan:**
  - Memisahkan modul Gudang Bahan & Alat ke rute mandiri `/admin/workshop` dari modul Keuangan, memberikan ruang kerja leluasa bagi tim teknis garasi.
* **🛠️ Edge Runtime Authentication Fix:**
  - Mengonversi verifikasi token sesi di middleware Next.js menggunakan Web Crypto API standar browser/Edge, mengeliminasi dependensi Node.js crypto native.

---

### [v1.4.0] — 2 Oktober 2026
#### 🚀 *Certified Inspection Standard, Digital Dossier & Public Catalog Transparency*

Fase ini mengangkat standar kualitas inspeksi fisik setara balai lelang papan atas nasional dan memperkuat identitas brand showroom.

* **🌟 Standarisasi Inspeksi Bodi 15 Panel (Blueprint ACV):**
  - Lembar kerja cek fisik 15 panel bodi mobil dengan pengukuran mikron cat digital (`ORIGINAL`, `REPAINT`, `HEAVY_PUTTY`).
  - Grading komprehensif 4 pilar: Mesin, Rangka Bebas Laka/Banjir, Interior, dan Eksterior.
* **🌟 Rebranding Mandiri: "Nur Mobil Certified":**
  - Menghilangkan ketergantungan merek pihak ketiga (ACV IBID / Astra) menjadi sertifikasi independen milik Nur Mobil dengan klausul disclaimer legal industri.
* **🌟 Digital Web Certificate Viewer & Dossier Multi-Halaman:**
  - Halaman sertifikat inspeksi digital yang mobile-first, ramah dibuka oleh calon pembeli via smartphone.
  - Generator PDF Dossier multi-halaman dengan pin code titik kerusakan, ilustrasi bodi luar, dan QR Code verifikasi dokumen.
* **🌟 Keamanan PDF & Enterprise Hardening:**
  - Mekanisme anti-hotlink headers, disk caching dokumen PDF, dan sanitasi input dari risiko injeksi/XSS.
* **🌟 Pembaruan Pengalaman Katalog Publik:**
  - Menghadirkan 5 tab status katalog: *Semua Unit*, *Tersedia di Showroom*, *Segera Hadir*, *Sudah Dibooking*, dan *Terjual Lunas*.
  - Seluruh kartu mobil 100% dapat diklik (*fully clickable*).
  - Penanganan unit terjual: Watermark sold out transparan, harga coret, dan perlindungan privasi alamat garasi mobil yang telah laku.

---

### [v1.3.0] — 1 Oktober 2026
#### 🚀 *AI Executive Dashboard & Zero-Cost 4-Layer Disaster Recovery Suite*

Fase ini melengkapi pemilik showroom dengan kemampuan analitik kecerdasan buatan dan ketenangan pikiran melalui sistem pencadangan mandiri.

* **🌟 AI Executive Briefing Orchestrator (Google Gemini AI):**
  - Mengubah chat AI mentah menjadi orchestrator dashboard eksekutif.
  - Menghasilkan skor kesehatan bisnis (*Business Health Score*), kartu tindakan direktif (*Directive Action Cards*), serta engine JSON bebas pemotongan token (*zero-truncation*).
  - Tanya jawab interaktif seputar arus kas, stok macet, dan proyeksi bagi hasil investor.
* **🌟 Strategi Backup 4 Lapis Bebas Biaya untuk VPS Mandiri:**
  - **Lapis 1 (Lokal Snapshot):** Auto dump database MySQL `.sql.gz` harian dengan rotasi pembersihan otomatis (*auto-purge*) file > 7 hari.
  - **Lapis 2 (Telegram Bot Cloud):** Pengiriman file backup terenkripsi secara otomatis ke channel pribadi Telegram pemilik sebagai remote offsite cadangan.
  - **Lapis 3 (Google Drive Rclone):** Sinkronisasi otomatis ke akun Google Drive gratis via Rclone.
  - **Lapis 4 (GitHub Code Repository):** Sinkronisasi repositori kode git terjadwal.
  - **Web UI Snapshot:** Tombol unduh data snapshot JSON instan di `/admin/settings`.
  - **Script Pemulihan Bencana (`restore-db.sh`):** Dilengkapi dialog konfirmasi ganda dan backup keselamatan sebelum penimpaan database.

---

### [v1.2.0] — 1 Oktober 2026
#### 🚀 *Nur Mobil Cash Tempo Policy (Anti-Leasing) & STNK Tax Radar*

Fase fundamental dalam mendefinisikan jati diri bisnis Nur Mobil yang syari, mandiri, dan berhati-hati dalam manajemen risiko.

* **🌟 Penegakan Kebijakan Cash Tempo Garasi (Anti-Leasing & Bebas Riba):**
  - Validasi ketat formulir penjualan: **Uang Muka (DP) Minimal 70%** (sistem menolak jika DP di bawah batas).
  - Batas waktu pelunasan **Maksimal 30 Hari** kalender tanpa bunga, tanpa denda keterlambatan riba.
  - Peringatan penahanan fisik dokumen asli BPKB & STNK di brankas showroom sampai lunas 100%.
* **🌟 Dokumen Hukum SPK Pasal V:**
  - Penerbitan otomatis Surat Perjanjian Jual Beli (SPK) PDF bermeterai yang memuat klausul khusus **Pasal V**: Hak penguasaan fisik kendaraan, larangan memindahtangankan/membawa unit keluar pulau, serta dasar hukum penarikan jika wanprestasi.
* **🌟 Radar Alarm Pajak STNK & Plat Kaleng 5 Tahunan:**
  - Widget radar otomatis mendeteksi unit yang mendekati jatuh tempo pajak PKB (H-30 Hari) maupun yang sudah lewat waktu (*Overdue*).
  - Menghitung otomatis proyeksi kebutuhan kas pembayaran pajak STNK di dashboard.
* **🌟 Pengamanan Multi-Peran (RBAC 4 Role):**
  - Pembagian hak akses mutlak: `OWNER` (Akses Penuh), `STAFF_ADMIN` (Operasional Garasi & Unit), `SALES` (Katalog Siap Jual Saja), dan `INVESTOR` (Portal Transparansi Khusus).
  - Proteksi rute sensitif: Menyembunyikan buku kas besar, rekening BCA, dan dividen dari staf lapangan dan sales.

---

### [v1.1.0] — 1 Oktober 2026
#### 🚀 *Core Showroom Engine, Workshop Garage & Investor Profit Sharing*

Pembangunan mesin inti logika bisnis showroom, pencatatan HPP komprehensif, dan pembagian dividen otomatis.

* **🌟 Manajemen Inventori & HPP Multi-Komponen:**
  - Kalkulasi HPP akurat: Harga Beli Lelang + Biaya Admin + Towing + Servis Mesin + Cat Bodi + Salon Detailing + Suku Cadang.
  - Indikator unit macet (*aging inventory badge*) jika mobil belum terjual lebih dari 45 hari.
* **🌟 Gudang Bahan Habis Pakai & Laba Garasi Mandiri:**
  - Pencatatan stok grosir oli mesin galon dan filter oli.
  - Pemotongan stok otomatis saat servis dan pengakuan **Laba Jasa Garasi Mandiri** (selisih tarif ke mobil vs modal grosir bahan).
  - Inventarisasi mesin dan peralatan kerja bengkel (mesin cuci steam, dongkrak buaya, kunci pas).
* **🌟 Monitoring Piutang & Alarm WhatsApp 1-Klik:**
  - Buku piutang penjualan dengan indikator status tempo (*ON_SCHEDULE*, *DUE_SOON*, *OVERDUE*).
  - Tombol WhatsApp 1-klik untuk mengirim pesan penagihan ramah dan resmi kepada konsumen.
* **🌟 Jembatan Otomatis Bagi Hasil Investor (1-Click Settlement Bridge):**
  - Saat penjualan lunas 100%, modal pop-up pelunasan mendeteksi unit investor dan menyediakan tombol eksekusi bagi hasil instan.
  - Mutasi modal pokok dan pencatatan dividen di *Capital Ledger* secara deterministik dan tak dapat dimanipulasi manual.
* **🌟 Portal Khusus Investor (`/investor`):**
  - Halaman transparansi bagi pemodal untuk memantau status modal, unit yang didanai, dan riwayat dividen yang diterima tanpa melihat dapur keuangan internal showroom.

---

### [v1.0.0] — 29 September 2026
#### 🚀 *Initial Foundation, Next.js App Router & MariaDB / Prisma Schema*

Fondasi awal arsitektur perangkat lunak modern untuk mendukung operasional jangka panjang.

* **🌟 Inisialisasi Arsitektur Stack Modern:**
  - Setup Next.js App Router berbasis TypeScript Strict Mode.
  - Penataan sistem desain UI dengan Vanilla CSS dan Tailwind CSS yang elegan, cepat, dan responsif.
  - Skema database relasional MySQL / MariaDB via Prisma ORM (`Vehicle`, `Sale`, `SalePayment`, `CashTransaction`, `Investor`, `CapitalLedger`, `Inspection`, `WorkshopSupply`).
* **🌟 Struktur State Machine Siklus Hidup Kendaraan:**
  - Implementasi alur status unit: `INTAKE` ➔ `IN_REPAIR` ➔ `READY_FOR_SALE` ➔ `BOOKED` ➔ `SOLD_SETTLED` / `ARCHIVED`.

---

## 🏛️ ARSITEKTUR & PRINSIP UTAMA APLIKASI

1. **Integritas Akuntansi Tanpa Rekayasa:** Setiap rupiah kas yang masuk atau keluar memiliki catatan pasangan (*double-entry philosophy*), terikat pada unit mobil, beban operasional, atau akun investor.
2. **Kemandirian Operasional Garasi:** Upah mekanik internal diakui sebagai keuntungan jasa garasi mandiri untuk showroom, bukan beban yang terbuang ke bengkel luar.
3. **Kepatuhan Transaksi Syariah:** Bebas dari skema pembiayaan leasing ribawi, menerapkan batas aman DP minimal 70% dan tempo maksimal 30 hari.
4. **Kesiapan Menghadapi Bencana (Disaster Ready):** Seluruh data transaksi dilindungi strategi pencadangan 4 lapis yang berjalan otomatis di VPS tanpa ketergantungan biaya langganan cloud pihak ketiga yang mahal.
