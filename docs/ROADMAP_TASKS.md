# STEP-BY-STEP IMPLEMENTATION TASKS
Kerjakan berurutan. Jangan lompat sprint. Sprint 0 wajib selesai sebelum baris kode fitur pertama ditulis.

## SPRINT 0 — Foundation & Architecture Lock
- [ ] 0.1: Konfirmasi final PRD.md, ARCHITECTURE.md, schema.prisma (dokumen ini) — tidak ada perubahan business rule finansial setelah sprint ini dimulai tanpa revisi eksplisit.
- [ ] 0.2: Inisialisasi Next.js (App Router) + TypeScript strict + Tailwind + shadcn/ui.
- [ ] 0.3: Setup MariaDB (local/Docker) + Prisma client, `npx prisma db push` dari `schema.prisma`, konfigurasi Auth & storage bucket (`vehicle-docs`, `vehicle-photos`).
- [ ] 0.4: Buat `UserProfile` seed pertama (Owner/Admin) dan alur login dasar.
- [ ] 0.5: Implementasikan `canTransition(from, to)` untuk state machine Vehicle (ARCHITECTURE.md §5) + unit test.

## SPRINT 1 — Inventory & Expense
- [ ] 1.1: Halaman `/admin/inventory` (tabel + filter status).
- [ ] 1.2: Form input unit baru (Zod validation) — plat, merk, tipe, tahun, sumber, harga beli, balai lelang.
- [ ] 1.3: Modul "Catat Biaya" (Expense) per kategori, otomatis update HPP (`lib/calculations/hpp.ts`).
- [ ] 1.4: Badge visual durasi hari sejak `purchaseDate` (merah jika > 45 hari) — dasar deteksi unit macet.
- [ ] 1.5: Upload `VehicleDocument` & `VehiclePhoto` (kategori `CONDITION_INTAKE` dulu).

## SPRINT 2 — Inspection (Versioned) + PDF
- [ ] 2.1: Form `/admin/inspections/[vehicleId]/new` — grade Mesin/Interior/Eksterior/Rangka (enum `Grade`), checkbox laka/banjir, 11 panel body (termasuk spakbor depan kanan/kiri) dengan input mikron + kondisi.
- [ ] 2.2: Logika `isCurrent` — inspeksi baru otomatis set inspeksi sebelumnya `isCurrent = false`, tag `stage` (INTAKE/AFTER_REPAIR/FINAL_LISTING).
- [ ] 2.3: Komponen `InspectionPdfDocument.tsx` (`@react-pdf/renderer`) — layout 1 halaman A4 terinspirasi JBA/Hybid/AUKSI tapi lebih transparan.
- [ ] 2.4: Endpoint `GET /api/pdf/inspection/[id]` streaming PDF.

## SPRINT 3 — Sales & Payment Ledger
- [ ] 3.1: Form pencatatan penjualan: harga jual, channel (Showroom/Direct), buyer, `dueDate`.
- [ ] 3.2: `SalePayment` — form tambah pembayaran (bisa berkali-kali), hitung `paidAmount`/`remaining`/`isFullyPaid` secara live (bukan field manual).
- [ ] 3.3: Tampilan piutang (aging receivables) di dashboard admin.
- [ ] 3.4: Komponen `InvoicePdfDocument.tsx` (`@react-pdf/renderer`) + Endpoint `GET /api/pdf/invoice/[saleId]` — kuitansi tanda jadi DP & pelunasan / faktur jual-beli resmi.
- [ ] 3.5: Dukungan alur Tukar Tambah (Trade-In) — intake mobil lama sebagai unit baru (`DIRECT_BUY`) dan alokasi nilai taksirannya ke `SalePayment` (`method: 'TRADE_IN'`, `tradeInVehicleId`).

## SPRINT 4a — Investor & Struktur Modal
> **[Saran #6]** Sprint 4 dipecah menjadi 4a dan 4b karena kompleksitas tinggi masing-masing bagian.
> Sprint 4b tidak boleh dimulai sebelum seluruh task 4a selesai dan diverifikasi.
- [ ] 4a.1: CRUD `Investor` + `UserProfile` mapping (auth ↔ investor).
- [ ] 4a.2: `VehicleInvestment` — input kontribusi modal per investor per unit + `profitSharePercent` (format 0–100, validasi Zod eksplisit menolak nilai 0–1 dan nilai > 100).
- [ ] 4a.3: `CapitalLedger` — service layer untuk setiap event (DEPOSIT/ALLOCATED/RETURNED/PROFIT_PAID/CORRECTION), selalu update `runningBalance` dalam 1 db transaction.
- [ ] 4a.4: `CashTransaction` — buku kas tunggal, setiap Expense/Sale/CapitalLedger event menulis baris cash yang berpasangan. Gunakan relasi formal (@relation) ke Vehicle/Sale/Expense sesuai schema.
- [ ] 4a.5: Portal `/investor` — hanya baca, difilter lewat `UserProfile` sesi aktif.

## SPRINT 4b — Financial Engine: Distribusi & Kalkulasi Laba
> Paling rawan bug — **wajib tulis test** untuk setiap fungsi di `lib/calculations/profit-share.ts` sebelum menganggap sprint ini selesai.
- [ ] 4b.1: `ProfitShareRule` — seed aturan bertingkat saudara (>10jt→1jt, 5-10jt→750rb, 3-5jt→500rb, <3jt→0/sesuai kesepakatan), UI untuk Owner mengedit tanpa deploy ulang.
- [ ] 4b.2: Implementasi validasi gap/overlap antar tier `ProfitShareRule` di Zod (`lib/validations/profit-share-rule.ts`) DAN di service layer sebelum INSERT/UPDATE — lihat ARCHITECTURE.md §4 poin 9.
- [ ] 4b.3: `lib/calculations/profit-share.ts` — engine distribusi: validasi `isFullyPaid`, hitung, **simpan snapshot penuh** ke `ProfitDistribution`, tulis `AuditLog`.
- [ ] 4b.4: Alur rugi: kembalikan pokok investor 100%, catat kerugian eksplisit ke akun Owner.
- [ ] 4b.5: Fungsi `reverseDistribution(saleId, actorUserId)` — alur reversal eksplisit sesuai ARCHITECTURE.md §13. Wajib ada unit test untuk skenario: distribusi normal, distribusi saat rugi, dan reversal.

## SPRINT 5 — Katalog Publik
- [ ] 5.1: `/katalog` (grid, filter merk/harga/transmisi) — hanya unit `READY_FOR_SALE`, DTO publik menghapus field finansial.
- [ ] 5.2: `/katalog/[slug]` — galeri foto, grade & catatan per panel, riwayat laka/banjir dinyatakan terbuka, tombol "Unduh Lembar Inspeksi (PDF)", tombol Click-to-WhatsApp dinamis (`lib/utils/whatsapp.ts`).
- [ ] 5.3: Responsif mobile-first (mayoritas trafik dari HP).

## SPRINT 6 — Automation & Hardening
- [ ] 6.1: `/api/cron/reminders` — piutang showroom (H-3, H-0) & pajak STNK (H-30, H-7) via Fonnte/Wablas.
- [ ] 6.2: **`NotificationLog`** — setiap panggilan WA Gateway wajib menulis baris `NotificationLog` (PENDING → SENT/FAILED) dalam satu transaction. Jangan fire-and-forget. Lihat ARCHITECTURE.md §12.
- [ ] 6.3: UI retry manual notifikasi gagal di `/admin/settings` (filter `NotificationLog.status = FAILED`, tombol trigger ulang per baris).
- [ ] 6.4: `AuditLog` ditulis di **semua** Server Action yang memutasi data finansial (review menyeluruh, bukan hanya modul investor).
- [ ] 6.5: Review keamanan: RBAC per route, session cookie aman & `AUTH_SECRET` tidak bocor ke client, DTO publik diaudit ulang.
- [ ] 6.6: Backup harian terjadwal via `scripts/backup-db.sh`, retensi ≥7 hari.

---

## Backlog v2/v3 (JANGAN dikerjakan sebelum Sprint 0–6 selesai & stabil)
Dashboard evaluasi & rekomendasi beli · Manajemen mitra bengkel · CRM calon pembeli · Wishlist notifikasi · Rating/testimoni · Fitur bandingkan unit · OCR dokumen · Feed otomatis ke marketplace lain · PWA · HR/absensi/payroll · Mobile app native · Multi-cabang · GPS tracking fisik · Integrasi resmi DJP/e-Faktur.
