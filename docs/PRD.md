# PRODUCT REQUIREMENTS DOCUMENT (PRD)
**Proyek:** Nur Mobil — Sistem Manajemen Operasional & Katalog Transparansi
**Versi:** 2.0 (Konsolidasi final — Claude + Gemini + ChatGPT)
**Status:** Terkunci untuk Sprint 0

---

## 1. Latar Belakang & Masalah

Bisnis jual-beli mobil bekas (sumber: lelang eks operasional/leasing, makelar, beli sendiri) saat ini dijalankan lewat Excel multi-sheet. Berdasarkan data historis (80 unit):
- Rata-rata siklus beli→laku riil: 56 hari.
- Win rate 84%, tapi ada kasus rugi besar akibat kesalahan penilaian kondisi unit (mis. "bebas laka" ternyata eks laka).
- Modal berasal dari campuran: modal sendiri, modal Ibu (dengan skema bagi hasil bertingkat ke 4 saudara), dan investor eksternal (persentase custom per orang).
- Skema jual ke showroom: sebagian DP + pelunasan bertahap, menimbulkan risiko piutang.

## 2. Tujuan Sistem
1. Mencatat HPP dan laba per unit secara presisi dan auditable.
2. Standarisasi cek fisik dengan transparansi penuh (grade per komponen, ketebalan cat per panel, riwayat kecelakaan/cat ulang dinyatakan terbuka) — dasar diferensiasi brand "apa adanya".
3. Katalog publik + dokumen PDF hasil inspeksi yang bisa diunduh calon pembeli.
4. Mengelola piutang showroom dan distribusi bagi hasil investor secara tertib dan bisa diaudit.
5. Notifikasi WhatsApp otomatis untuk jatuh tempo pajak & piutang.

## 3. Peran Pengguna (Role Matrix)

| Peran | Akses |
|---|---|
| **Admin (Owner)** | Penuh: seluruh data operasional, keuangan, investor, laporan laba-rugi pribadi |
| **Investor** | Terbatas: hanya unit yang didanainya, saldo modalnya (`CapitalLedger`), status bagi hasil — dipetakan lewat `UserProfile.investorId` ke `auth.uid()` |
| **Publik (tanpa login)** | Katalog unit `READY_FOR_SALE`, galeri foto, unduh PDF inspeksi. **Tidak pernah** melihat harga beli/HPP/biaya/margin/data investor |

## 4. Aturan Bisnis Finansial (Terkunci — lihat ARCHITECTURE.md §4 untuk detail teknis)

- **HPP Unit** = Harga Beli + akumulasi Expense (transport ambil, servis/oli, cat, salon, sparepart, dokumen/mutasi).
- **Laba Kotor Unit** = Harga Jual − HPP Unit. (Istilah "kotor" sengaja dipakai, bukan "bersih" — supaya nanti bisa ditambah biaya penjualan/komisi tanpa mengubah makna field lama.)
- **Distribusi hanya dieksekusi saat unit lunas 100%** (`SUM(SalePayment.amount) >= Sale.sellingPrice`), bukan saat baru DP.
- **Investor eksternal**: bagian = (modal investor ÷ total modal unit) × persentase akad. Persentase disimpan sebagai 0–100 (mis. `50.00` = 50%), bukan 0–1 — dikunci di AGENTS.md agar tidak salah tafsir oleh AI coding assistant.
- **Modal Ibu → 4 saudara**: nominal bertingkat berdasarkan laba unit, diatur lewat `ProfitShareRule` yang bisa diedit Owner (bukan hardcode), dan **snapshot rule yang dipakai disimpan permanen** di `ProfitDistribution` — perubahan rule di masa depan tidak mengubah transaksi lama.
- **Rugi**: pokok modal seluruh investor dikembalikan 100%, kerugian 100% diserap akun Owner — dicatat eksplisit sebagai transaksi `CashTransaction`/`CapitalLedger`, bukan pengurangan saldo diam-diam.
- Semua mutasi data finansial **wajib tercatat di `AuditLog`**; tidak ada hard delete pada transaksi finalized — hanya void/koreksi.

## 5. Ruang Lingkup per Fase

### MVP (Sprint 1–6 — lihat ROADMAP_TASKS.md)
Inventory & Expense → Inspection (versioned) + PDF → Sale & Payment ledger → Investor & Capital/Cash Ledger + distribusi → Katalog publik → Reminder WhatsApp + hardening/audit.

### Backlog v2 (setelah MVP stabil, bukan bagian Sprint 1–6)
- Dashboard evaluasi & rekomendasi beli (analisis grade lelang × sumber × jenis mobil, mengembangkan analisis performa historis).
- Manajemen mitra bengkel (performa per bengkel: waktu, biaya, kualitas).
- Modul pajak lanjutan (tetap sebatas pencatatan fleksibel, **tidak pernah** hardcode aturan/tarif pajak ke logika aplikasi — tarif berubah, keputusan tetap di tangan Owner + akuntan).
- CRM calon pembeli, wishlist notifikasi, rating/testimoni, fitur bandingkan unit.
- OCR dokumen, feed otomatis ke marketplace lain, PWA.

### Di luar cakupan untuk saat ini (bukan ditolak, hanya belum — operasional masih solo, belum ada karyawan)
- Manajemen pegawai / absensi / payroll.
- Aplikasi mobile native, multi-cabang, GPS tracking fisik.
- Integrasi resmi ke sistem DJP/e-Faktur.

## 6. Branding
Nama: **Nur Mobil** (melanjutkan "Toko Bu Nur" — nama Ibu, Nurdiah; "Nur" = cahaya, selaras dengan positioning transparansi "apa adanya, rusak dibilang rusak, eks laka dibilang eks laka").

---
*Dokumen ini dikunci sebagai referensi Sprint 0. Perubahan scope MVP setelah Sprint 1 dimulai harus melalui revisi eksplisit, bukan penyisipan diam-diam.*
