# 📋 CHANGELOG & CATATAN PERUBAHAN SISTEM
## Aplikasi Manajemen Showroom & Bengkel Mandiri — Nur Mobil

Dokumen ini mencatat seluruh riwayat pembaruan, penambahan fitur, bugfix teknis, dan sinkronisasi skenario pengujian pada sistem Nur Mobil.

---

### [Update Terkini] - 3 Oktober 2026

#### 🌟 Fitur Baru (New Features)
1. **Komponen Multi-Lampiran Bukti Digital (`ProofUploadField`)**
   - Mendukung pengunggahan banyak berkas sekaligus (*multi-file upload*) untuk format JPG, PNG, WEBP, dan PDF (maksimal 10MB/file).
   - Pratinjau thumbnail interaktif dengan deteksi ikon format PDF, tombol hapus per file, serta tautan buka dokumen ukuran penuh di tab baru.
   - Diterapkan secara menyeluruh ke seluruh modul formulir keuangan:
     - **Buku Kas:** Transaksi Kas Masuk/Keluar Manual (`CashTransactionNewClient`).
     - **Beban & Operasional:** Beban Tetap Showroom / OpEx (`OpExNewClient`).
     - **Ekuitas Pemilik:** Setoran Tambahan Modal Owner (`OwnerEquityNewClient`).
     - **Prive Pribadi:** Penarikan Dana Prive Pemilik (`OwnerDrawNewClient`).
     - **Inventaris Garasi:** Pembelian Alat & Mesin Bengkel (`AssetNewClient`).
     - **Biaya Unit Mobil:** Perbaikan Bengkel Luar / Servis Unit (`VehicleExpenseNewClient`).
     - **Penjualan Unit:** Pembayaran Angsuran & Pelunasan Cash Tempo (`SalePaymentNewClient`).
     - **Investor:** Setoran Modal Pool Fund (`InvestorDepositNewClient`).

2. **Auto-Arsip Galeri Kendaraan (`VehiclePhoto`)**
   - File foto bukti nota/pengerjaan servis pada unit mobil otomatis diarsipkan ke galeri foto kendaraan internal tanpa perlu upload ulang.

3. **7 Tingkatan Aturan Bagi Hasil Deterministik 4 Saudara (Skema Modal Ibu)**
   - Penerapan 7 tingkatan baku sesuai preferensi operasional:
     - Tier 1 (Laba Rp 0 s/d Rp 1.000.000): Rp 50.000 / saudara (Total Rp 200.000 / 4 orang).
     - Tier 2 (Laba Rp 1.000.001 s/d Rp 3.000.000): Rp 100.000 / saudara (Total Rp 400.000).
     - Tier 3 (Laba Rp 3.000.001 s/d Rp 5.000.000): Rp 200.000 / saudara (Total Rp 800.000).
     - Tier 4 (Laba Rp 5.000.001 s/d Rp 10.000.000): Rp 300.000 / saudara (Total Rp 1.200.000).
     - Tier 5 (Laba Rp 10.000.001 s/d Rp 15.000.000): Rp 500.000 / saudara (Total Rp 2.000.000).
     - Tier 6 (Laba Rp 15.000.001 s/d Rp 20.000.000): Rp 750.000 / saudara (Total Rp 3.000.000).
     - Tier 7 (Laba > Rp 20.000.000): Rp 1.000.000 / saudara (Total Rp 4.000.000).
   - Fitur **+ Tambah Baris Tier** dan **Hapus Baris** dinamis di UI `/admin/investors/tier-rules`.
   - Visualisasi kartu **Proteksi Unit Rugi (Laba <= Rp 0)**: Dividen otomatis Rp 0 dan modal pokok tetap aman.

4. **Rekening Bank & Manajemen Profil Investor**
   - Penambahan kolom nama bank dan nomor rekening pada registrasi akun investor untuk pencairan dividen.
   - Fitur **Edit Profil Investor** langsung dari halaman `/admin/investors/accounts`.

---

#### 🛠️ Perbaikan Teknis & Bug Fixes (Technical Fixes)
1. **Sinkronisasi Enum Kategori Biaya Kendaraan (ExpenseCategoryEnum)**
   - Penambahan enum baru `TIRES_AND_WHEELS` (Ban & Velg) dan `ELECTRICAL` (Kelistrikan & Aki) ke Prisma Schema, validasi Zod, dan database.
   - Sinkronisasi nilai enum di formulir UI agar sesuai dengan schema validasi (mencegah penolakan validasi saat simpan biaya servis).

2. **Perluasan Enum Tipe Transaksi Kas (CashTransactionTypeEnum)**
   - Penambahan tipe `IN_OTHER` (Penerimaan Kas Lainnya) dan `OUT_OTHER` (Pengeluaran Kas Lainnya) pada schema Prisma dan validasi Zod.
   - Koreksi payload UI `OUT_CAPITAL_WITHDRAWAL` menjadi `OUT_CAPITAL_RETURN` sesuai skema database.
   - Refactor logika helper `isIncoming` agar mengenali prefix `IN_` dan `OUT_` secara dinamis.

3. **Revalidasi Data Halaman Keuangan (`revalidatePath`)**
   - Menambahkan pemanggilan `revalidatePath('/admin/finance')` dan `revalidatePath('/admin/dashboard')` pada Server Actions `createExpenseAction`, `createSaleAction`, dan `addSalePaymentAction`.
   - Mengeliminasi isu *stale data* pada tabel mutasi kas bank BCA pasca transaksi.

4. **Penataan Tampilan Dev Indicator**
   - Memindahkan posisi indikator debug / role switcher ke pojok kanan bawah layar untuk memastikan seluruh menu navigasi sidebar kiri tetap leluasa diakses.

---

#### 📚 Pembaruan Dokumentasi & Skenario Pengujian (Documentation Sync)
1. **`docs/SKENARIO_PENGUJIAN_END_TO_END.md`**
   - **Skenario 01:** Diperbarui dengan pengujian profil rekening bank investor, edit profil investor, upload bukti transfer modal, dan 7 tingkatan tier aturan 4 saudara.
   - **Skenario 05:** Diperbarui dengan pengujian upload multi-lampiran nota kuitansi bengkel cat dan auto-arsip ke galeri unit.
   - **Skenario 11:** Diperbarui dengan pengujian upload multi-lampiran bukti transfer pelunasan konsumen dan auto-revalidate kas.
   - **Skenario 14:** Diperbarui dengan pengujian multi-lampiran bukti transaksi kas umum (`IN_OTHER`/`OUT_OTHER`), OpEx, Prive, dan Ekuitas.

2. **`docs/PANDUAN_PENGGUNAAN_SISTEM.md`**
   - **Bab 11:** Penambahan penjelasan sistem multi-lampiran bukti digital (`ProofUploadField`) dan auto-arsip foto servis.
   - **Bab 12:** Penambahan dokumentasi 7 tingkatan tier 4 saudara, tabel dinamis, proteksi laba rugi, dan kelengkapan nomor rekening bank investor.
