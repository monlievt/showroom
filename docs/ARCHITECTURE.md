# TECHNICAL ARCHITECTURE (ARCHITECTURE.md)
**Sistem:** Nur Mobil — Platform Operasional & Transparansi
**Versi:** 2.0 (Konsolidasi final)

---

## 1. Tech Stack (Terkunci)

| Layer | Pilihan | Alasan |
|---|---|---|
| Framework | Next.js App Router + TypeScript (strict) | Satu codebase, server-first, cocok tim kecil |
| Styling | Tailwind CSS + shadcn/ui | Cepat, konsisten |
| Database | MariaDB (MySQL-compatible) + Prisma ORM | Relasional, cocok data finansial, self-hosted di VPS / homeserver |
| Form & Validasi | React Hook Form + Zod (sinkron client & server) | |
| Auth & Storage | Better Auth / Auth.js (session MariaDB) + MinIO / Local Volume Storage (`vehicle-docs`, `vehicle-photos`) | Mandiri di VPS / homeserver, tanpa dependensi SaaS berbayar |
| PDF | `@react-pdf/renderer`, server-side/on-the-fly | Ringan, tidak perlu headless browser |
| Notifikasi | Fonnte/Wablas (WhatsApp Gateway) via Cron Job | Terjangkau untuk skala UKM |
| Deployment | **VPS / Homeserver** (Docker Compose: Next.js + MariaDB + MinIO + Nginx Reverse Proxy) | Hemat biaya, full control di infrastruktur sendiri |
| Arsitektur | **Monolith modular** — satu Next.js app, satu domain, tanpa subdomain terpisah, tanpa microservices, tanpa tRPC di tahap ini | Kompleksitas infra harus proporsional dengan tim (masih solo) |

Prinsip: **Database adalah source of truth. Kalkulasi finansial deterministik. Transaksi finansial immutable (tidak pernah diedit langsung, hanya void/koreksi). Data publik selalu lewat DTO/query khusus yang membuang field finansial internal.**

> **Catatan Tech Stack tambahan:**
> - `Vehicle.transmission` menggunakan `enum TransmissionType { AUTOMATIC MANUAL CVT DCT }` — bukan String bebas — untuk menjaga konsistensi data katalog.
> - `CashTransaction` memiliki relasi formal (@relation) ke `Vehicle`, `Sale`, dan `Expense` untuk mencegah orphan data. `relatedLedgerId` (CapitalLedger) tetap plain String karena tidak memerlukan cascade.
> - `NotificationLog` adalah model wajib (bukan opsional) untuk audit trail dan mekanisme retry WA manual — lihat §12.

---

## 2. Struktur Direktori

```text
nur-mobil/
├── PRD.md
├── ARCHITECTURE.md
├── ROADMAP_TASKS.md
├── AGENTS.md
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
└── src/
    ├── app/
    │   ├── (public)/
    │   │   ├── page.tsx
    │   │   └── katalog/
    │   │       ├── page.tsx
    │   │       └── [slug]/page.tsx
    │   ├── admin/
    │   │   ├── page.tsx                 # Dashboard KPI
    │   │   ├── inventory/[...]
    │   │   ├── inspections/[id]/page.tsx
    │   │   ├── sales/[...]
    │   │   ├── finance/
    │   │   │   ├── page.tsx             # Laba & distribusi
    │   │   │   ├── investors/page.tsx   # Capital ledger per investor
    │   │   │   └── cash/page.tsx        # Cash ledger
    │   │   └── settings/page.tsx
    │   ├── investor/page.tsx            # Portal investor (read-only)
    │   ├── login/page.tsx
    │   └── api/
    │       ├── pdf/inspection/[id]/route.ts
    │       └── cron/reminders/route.ts
    ├── modules/                         # Domain-oriented, bukan cuma by-filetype
    │   ├── vehicles/
    │   ├── expenses/
    │   ├── inspections/
    │   ├── sales/
    │   ├── payments/
    │   ├── investors/
    │   ├── finance/
    │   └── catalog/
    ├── components/
    │   ├── ui/
    │   ├── shared/ (StatusBadge, RupiahInput, ConfirmDialog)
    │   ├── inspection/ (CarPanelVisualizer, GradeSelector)
    │   └── pdf/InspectionPdfDocument.tsx
    ├── lib/
    │   ├── auth/ (mapping auth.uid() ↔ UserProfile ↔ Investor)
    │   ├── db/ (prisma client singleton)
    │   ├── calculations/ (hpp.ts, profit-share.ts — server-only, deterministic)
    │   ├── validations/ (zod schemas)
    │   └── utils/ (currency.ts, dates.ts)
    ├── services/
    │   ├── whatsapp.ts
    │   └── storage.ts
    ├── actions/                         # Server Actions (semua mutasi lewat sini, dibungkus db transaction)
    └── types/
```

---

## 3. Hak Akses & Security Matrix

| Jalur | Target | Proteksi | Filter Data |
|---|---|---|---|
| `/katalog/*` | Publik | Tanpa login | Hanya unit `READY_FOR_SALE`. DTO publik **tidak pernah** membawa `purchasePrice`, `Expense`, `CapitalLedger`, `ProfitDistribution`, margin. |
| `/admin/*` | Owner (`role=ADMIN`) | Auth session (cookie-based) | Akses penuh |
| `/investor/*` | Investor (`role=INVESTOR`) | Auth session (cookie-based) | Hanya baris `CapitalLedger`/`VehicleInvestment`/`ProfitDistribution` milik `UserProfile.investorId == session.user.id → investorId` |
| `/api/cron/*` | Scheduled Job | Header `Authorization: Bearer CRON_SECRET` | — |

`AUTH_SECRET`: tidak pernah diekspos ke client component, tidak pernah `NEXT_PUBLIC_`, tidak pernah dikembalikan di response API.

---

## 4. Prinsip Kalkulasi Finansial

1. **HPP** = `purchasePrice + SUM(Expense.amount)`.
2. **Laba Kotor Unit** = `Sale.sellingPrice - HPP` (dihitung saat `isFullyPaid`, lihat §6 SalePayment).
3. **Distribusi hanya dieksekusi sekali per settlement**, kecuali lewat alur reversal/koreksi eksplisit (tidak pernah re-run diam-diam).
4. **Snapshot wajib**: setiap `ProfitDistribution` menyimpan `grossProfitAtCalc`, `totalUnitCapitalAtCalc`, `investorCapitalAtCalc`, `agreedPercentAtCalc`, dan referensi `ruleVersionId` — supaya perubahan `ProfitShareRule` di masa depan tidak pernah mengubah angka transaksi lama.
5. **Rugi**: modal investor kembali 100% (`CapitalLedger` type `RETURNED`), selisih rugi dicatat sebagai `CashTransaction` type `OUT_PROFIT_DISTRIBUTION`/koreksi ke akun Owner — **eksplisit, bukan pengurangan saldo diam-diam**.
6. Semua nominal uang pakai `Decimal`, **tidak pernah** floating point.
7. Semua mutasi finansial dibungkus **database transaction** dan menulis baris ke `AuditLog`.
8. **Tidak ada hard delete** pada `Expense`/`Sale`/`SalePayment`/`ProfitDistribution`/`CapitalLedger`/`CashTransaction` yang sudah final — koreksi lewat baris baru bertipe `CORRECTION`, bukan edit/hapus baris lama.
9. **Validasi gap/overlap `ProfitShareRule`**: sebelum INSERT/UPDATE tier bagi hasil, layer service (`lib/calculations/profit-share.ts`) wajib memverifikasi bahwa seluruh tier aktif bersifat *contiguous* — `tier[i].maxProfit == tier[i+1].minProfit`, tanpa gap maupun overlap. Ini juga divalidasi ulang di Zod schema (`lib/validations/profit-share-rule.ts`).

---

## 5. State Machine — Vehicle Status

```text
INTAKE → IN_REPAIR → READY_FOR_SALE ⇄ BOOKED
                                   ↓         ↓
                         AT_SHOWROOM_PENDING ↓
                                   ↓         ↓
                              SOLD_SETTLED ←─┘
```
Aturan transisi:
1. `INTAKE → IN_REPAIR`: unit masuk pengerjaan/bengkel/salon.
2. `IN_REPAIR → READY_FOR_SALE`: pengerjaan selesai, unit siap tayang di katalog.
3. `READY_FOR_SALE → BOOKED`: pembeli menitipkan uang Tanda Jadi / DP Booking.
4. `BOOKED → READY_FOR_SALE`: booking batal atau leasing ditolak (unit kembali bebas dipasarkan).
5. `BOOKED → SOLD_SETTLED`: pembeli retail melunasi pembayaran 100%.
6. `READY_FOR_SALE → AT_SHOWROOM_PENDING`: unit dikirim/konsinyasi ke showroom rekanan (tempo/DP).
7. `AT_SHOWROOM_PENDING → SOLD_SETTLED`: showroom rekanan melunasi 100%.

Transisi di luar rute di atas ditolak di level Server Action via `canTransition(from, to): boolean` di `lib/calculations/vehicle-state.ts`.

---

## 6. Standarisasi Cek Fisik (Inspection Engine)

- **Inspection bersifat historis/berversi** (`Inspection[]` per Vehicle, bukan 1:1) — tahapan: `INTAKE` (saat datang) → `AFTER_REPAIR` → `FINAL_LISTING` (sebelum masuk katalog). Ini bukan cuma soal data model — **ini bagian dari cerita transparansi**: pembeli bisa lihat progres kondisi dari waktu ke waktu, bukan cuma snapshot akhir.
- **11 Panel Body wajib** (enum `InspectionPanelType`, bukan string bebas): `HOOD`, `ROOF`, `FENDER_FRONT_RIGHT`, `FENDER_FRONT_LEFT`, `FRONT_DOOR_RIGHT`, `FRONT_DOOR_LEFT`, `REAR_DOOR_RIGHT`, `REAR_DOOR_LEFT`, `TRUNK_LID`, `QUARTER_PANEL_RIGHT`, `QUARTER_PANEL_LEFT`.
- **Grade** (`enum Grade { A B C D }`) untuk Mesin/Interior/Eksterior/Rangka — bukan string bebas.
- **Interpretasi ketebalan cat (mikron/µm)** per panel:
  - `< 120 µm` → Original pabrik (hijau)
  - `120–200 µm` → Repaint/semprot ulang tipis (kuning)
  - `> 200 µm` → Indikasi dempul tebal (merah)
- Foto per panel disimpan dengan kategori (`VehiclePhoto.category`): `CONDITION_INTAKE`, `CONDITION_BEFORE_REPAIR`, `CONDITION_AFTER_REPAIR`, `FINAL_LISTING`, `DOCUMENT_PROOF`.

---

## 7. Generator Dokumen PDF

- Data satu sumber, **rendering terpisah** untuk Web View vs PDF View — jangan mencoba memakai HTML yang identik untuk keduanya, itu jebakan maintenance.
- **Dua Template Dokumen Resmi:**
  1. `src/components/pdf/InspectionPdfDocument.tsx`: Hasil inspeksi fisik transparan (1 lembar A4). Endpoint: `GET /api/pdf/inspection/[id]`.
  2. `src/components/pdf/InvoicePdfDocument.tsx`: Kuitansi tanda jadi & pelunasan / Faktur Jual-Beli resmi berlogo Nur Mobil lengkap dengan data No. Rangka/Mesin, nominal terbilang, dan tanda tangan digital. Endpoint: `GET /api/pdf/invoice/[saleId]`.

---

## 8. Sale & Payment (Ledger, bukan flat field)

- `Sale` tidak lagi menyimpan `dpAmount`/`remainingAmount`/`isFullyPaid` sebagai field yang diedit manual.
- `SalePayment[]` mencatat setiap transaksi masuk (DP, cicilan 1, cicilan 2, dst).
- `isFullyPaid` **dihitung**, bukan disimpan sebagai sumber kebenaran:
  ```text
  paidAmount = SUM(SalePayment.amount WHERE saleId = X)
  remaining  = Sale.sellingPrice - paidAmount
  isFullyPaid = remaining <= 0
  ```
- Distribusi bagi hasil (§4) hanya boleh dijalankan setelah kondisi ini terpenuhi.

### 8.1 Alur Tukar Tambah (Trade-In Mechanism)
Jika pembeli membeli Unit A dan menukarkan mobil lamanya (Unit B):
1. **Intake Unit Lama:** Mobil lama didaftarkan sebagai `Vehicle` baru dengan `sourceType = DIRECT_BUY` dan `purchasePrice = [Nilai Taksiran Disepakati]`.
2. **Pembayaran Unit Baru:** Pada `Sale` Unit A, dibuat baris `SalePayment` dengan `method = "TRADE_IN"`, `amount = [Nilai Taksiran]`, dan `tradeInVehicleId = [ID Unit B]`.
3. **Sisa Pembayaran:** Sisa tagihan dibayar via transfer/cash atau dicatat sebagai piutang tempo.
*Dengan pola ini, arus kas dan HPP kedua unit terlacak presisi tanpa perlu modul akuntansi rumit.*

---

## 9. Auth ↔ Investor Mapping

`UserProfile.authUserId` (Auth `session.user.id`) ↔ `UserProfile.investorId` (opsional, hanya untuk role `INVESTOR`) ↔ `Investor.id`. Query di `/investor/*` selalu difilter lewat `UserProfile` milik sesi aktif, tidak pernah lewat `investorId` yang dikirim dari client.

---

## 10. Integrasi WhatsApp (Cron & Click-to-Chat)

### 10.1 Reminder Otomatis (Cron)
`POST /api/cron/reminders`, dijalankan harian (mis. 08:00 WIB) via Scheduled Job:
1. **Piutang showroom**: unit `AT_SHOWROOM_PENDING` dengan `remaining > 0` dan `dueDate` H-3/H-0 → kirim WA ke showroom.
2. **Pajak kendaraan**: unit belum terjual dengan `taxExpiryDate` H-30/H-7 → kirim WA internal ke Owner.

### 10.2 Click-to-WhatsApp (Fast-Closing & Admin Helper)
Untuk memfasilitasi interaksi kilat tanpa friksi ala K-Cunk, disediakan utility helper `lib/utils/whatsapp.ts` yang membuat tautan `https://wa.me/{phone}?text={encodedText}`:
1. **Katalog Publik (Tanya Unit / Booking Cepat):**
   > *"Halo Admin Nur Mobil, saya tertarik unit {brand} {model} {year} (Plat {plateNumber}) seharga Rp {targetSellingPrice}. Apakah unit ini masih READY atau sudah BOOKED? Link katalog: {url}"*
2. **Follow-up Piutang / Pelunasan (Dashboard Admin):**
   > *"Halo Pak/Bu {buyerName}, konfirmasi pelunasan unit {brand} {model} (Plat {plateNumber}). Sisa piutang sebesar Rp {remaining} jatuh tempo pada {dueDate}. Mohon konfirmasi bukti transfer jika sudah melakukan pembayaran."*

---

## 11. Ekspor Data Pajak (bukan integrasi resmi)

`TaxRecord` menyimpan periode, jumlah kena pajak, jumlah dibayar, dan `taxType` sebagai **teks bebas yang diisi manual** (mis. "PPh Final 0,5%" atau "PPh Badan 22%") — **tidak ada logika `if companyType == X then rate = Y` di kode**. Keputusan tarif/skema pajak sepenuhnya keputusan Owner + akuntan di luar aplikasi; aplikasi hanya mencatat dan mengekspor CSV untuk pelaporan.

---

## 12. Notifikasi WhatsApp — Log & Retry

Setiap panggilan ke Fonnte/Wablas dari `/api/cron/reminders` **wajib** menulis baris `NotificationLog` sebelum dan sesudah request HTTP:

1. **Sebelum kirim**: tulis baris `status = PENDING`.
2. **Jika sukses**: update `status = SENT`, isi `sentAt`.
3. **Jika gagal** (timeout/error gateway): update `status = FAILED`, isi `failureReason`, **jangan throw** — lanjut ke notifikasi berikutnya.
4. **Retry manual**: Admin dapat melihat daftar `NotificationLog` dengan `status = FAILED` di `/admin/settings` dan mentrigger ulang satu per satu. Setiap retry incrementasi `retryCount` dan update `status`.

Ini memastikan notifikasi bukan *fire-and-forget* — ada visibilitas penuh atas kegagalan pengiriman.

---

## 13. Reversal & Koreksi Distribusi Laba

> **[Saran #8]** Alur reversal yang sebelumnya tidak terdokumentasi.

Skenario: distribusi sudah dieksekusi (`ProfitDistribution.isPaid = true`) namun ditemukan kesalahan (mis. harga jual salah input, atau pembayaran yang dianggap lunas ternyata cek bounced).

### Aturan:
- **Tidak ada hard delete** atau edit langsung pada `ProfitDistribution` yang sudah final.
- Reversal dilakukan melalui **alur koreksi eksplisit** yang mencakup:

### Langkah Reversal Distribusi:
```text
1. Owner membuat "Reversal Request" — dicatat di AuditLog dengan action "REVERSAL_INITIATED",
   beforeData berisi snapshot ProfitDistribution lama.

2. Untuk setiap ProfitDistribution yang di-reverse:
   a. Set ProfitDistribution.isPaid = false (jika belum benar-benar dibayar tunai),
      ATAU buat entri baru ProfitDistribution dengan calculatedAmount negatif
      (bertipe CORRECTION) jika dana sudah benar-benar berpindah rekening.
   b. Tulis CapitalLedger type = CORRECTION untuk setiap investor yang terdampak.
   c. Tulis CashTransaction type = CORRECTION pasangan yang berpasangan.

3. Setelah data diperbaiki (Sale/SalePayment dikoreksi), jalankan ulang kalkulasi
   distribusi dari awal — ini akan menghasilkan set ProfitDistribution BARU
   dengan snapshot baru. ProfitDistribution lama tetap ada sebagai riwayat.

4. Seluruh langkah 1–3 dibungkus dalam satu database transaction.
   AuditLog ditulis di awal dan akhir dengan action "REVERSAL_COMPLETED".
```

### Implementasi:
- Fungsi: `lib/calculations/profit-share.ts` — ekspor fungsi `reverseDistribution(saleId, actorUserId)`.
- Hanya boleh dipanggil dari Server Action khusus: `actions/finance/reverseDistribution.ts`.
- Tidak ada UI self-service untuk investor — hanya Admin/Owner yang bisa mentrigger.

---

## 14. FONDASI SKALABILITAS

Bagian ini mendokumentasikan keputusan arsitektur yang dibuat **sebelum Sprint 0** khusus untuk mengantisipasi pertumbuhan bisnis (dari ~1-2 unit/minggu ke 10+ unit aktif bersamaan, dari ~3 investor ke banyak investor, dari satu showroom ke multi-showroom partner).

### 14.1 AuctionLotType — Eks Perusahaan vs Eks Tarikan Leasing

`Vehicle.auctionLotType` (enum `AuctionLotType`) membedakan tipe lot lelang:

| Tipe | BPKB Lead | Risiko Dokumen | Sesuai Preferensi? |
|---|---|---|---|
| `EKS_PERUSAHAAN` | 7–14 hari | Rendah — dokumen umumnya bersih | ✅ Diutamakan |
| `EKS_TARIKAN_LEASING` | 14–28 hari | Tinggi — potensial pajak mati (+7 hr), STNK hilang (+14 hr), mutasi (+30 hr) | ⚠️ Hindari/verifikasi dulu |
| `UNKNOWN` | — | — | Default saat intake, wajib diupdate |

Field ini digunakan untuk:
- Kalkulasi `estimatedReadyDate` yang akurat saat unit baru masuk
- Filter dashboard "unit berisiko panjang prosesnya"
- Analisis historis: apakah eks leasing benar-benar lebih lama dan lebih sering rugi?

### 14.2 Buyer Entity — Multi-Showroom Tracking

`Sale.buyerName` (String) digantikan relasi ke model `Buyer`. Ini memungkinkan:
- Riwayat semua unit yang dijual ke showroom yang sama
- Track record ketepatan pembayaran per buyer (`Buyer.notes`)
- Analisis: showroom mana yang paling cepat lunasi DP vs yang sering terlambat

Saat membuat `Sale` baru, Server Action wajib:
1. Cek apakah buyer sudah ada (`findFirst` by name + phone)
2. Jika ada → reuse `buyerId`
3. Jika belum → `create` Buyer baru dalam transaksi yang sama

### 14.3 YouTube Integration — Katalog Publik

`Vehicle.youtubeVideoId` menyimpan hanya ID video (bukan full URL). Contoh:

```
URL YouTube: https://www.youtube.com/watch?v=dQw4w9WgXcQ
Yang disimpan: "dQw4w9WgXcQ"

Embed di katalog:
<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" />
```

**Mengapa YouTube, bukan local/object storage?**
- Video walkaround bisa 200MB–2GB per unit — terlalu membebani disk VPS & bandwidth
- YouTube menyediakan CDN global gratis, adaptive bitrate otomatis
- Bisa sekaligus membangun channel YouTube sebagai saluran marketing organik

**Rule:** Jika `youtubeVideoId` null, embed tidak ditampilkan di katalog — tidak ada placeholder "video coming soon".

### 14.4 estimatedReadyDate — Proyeksi Arus Kas

`Vehicle.estimatedReadyDate` diisi saat intake berdasarkan formula:

```
estimatedReadyDate = purchaseDate
  + MAX(bpkbLeadDays, bodyWorkDays)  // BPKB dan pengerjaan berjalan paralel
  + stnkLeadDays (jika ada)          // tambahan khusus eks leasing
  + salonDays (estimasi 7 hari)
```

Field ini bukan kalkulasi otomatis — **diisi manual oleh Admin saat intake**, dan diupdate jika ada delay nyata. Tujuannya:
- Dashboard "unit yang akan siap minggu ini" untuk proyeksi kapan modal kembali
- Alert jika unit sudah lewat `estimatedReadyDate` tapi masih `IN_REPAIR`
- Input untuk perencanaan: "minggu depan ada 2 unit ready, berarti ada modal untuk beli 1 unit baru"

### 14.5 Pagination & Index Strategy (Wajib untuk semua list endpoint)

**Aturan:**
1. **Semua list endpoint** (inventory, expenses, audit log, dll) wajib menggunakan **cursor-based pagination** via Prisma (`cursor` + `take`), bukan offset-based (`skip` + `take`). Cursor-based lebih efisien untuk dataset besar dan tidak memiliki masalah "page drift" saat data baru masuk.
2. **Semua field yang dipakai untuk filter atau sort** wajib memiliki `@@index` di schema. Pelanggaran ini akan menyebabkan full table scan yang lambat pada skala 1000+ baris.
3. **Default page size:** 20 item. Maksimal 100 item per request.

**Index yang sudah ada dan alasannya:**
```
Vehicle:    status, plateNumber, purchaseDate, estimatedReadyDate, auctionLotType
Sale:       buyerId, saleDate
Expense:    vehicleId
AuditLog:   entityType+entityId, actorUserId, createdAt
NotificationLog: status, type+status, createdAt
```

**Menambah index baru:** Jangan tambahkan index tanpa alasan tertulis (query apa yang dioptimalkan). Index berlebihan memperlambat write operation.

### 14.6 Storage & Foto — Antisipasi Volume Besar

Saat unit aktif mencapai 50+, volume foto bisa ratusan file per bulan:

- **Kompresi wajib sebelum upload:** gunakan `browser-image-compression` di client sebelum upload ke MinIO / local storage. Target: < 500KB per foto tanpa kehilangan kualitas visual yang signifikan.
- **Lazy loading:** komponen `VehiclePhoto` di katalog publik wajib menggunakan `loading="lazy"` atau Next.js `<Image>` dengan `lazy`.
- **Naming convention bucket/folder:** `vehicle-photos/{vehicleId}/{category}/{timestamp}.webp`

### 14.7 Backup & Recovery Database (Homeserver / VPS Mandiri)

Karena tidak menggunakan managed database cloud, backup otomatis adalah keharusan mutlak:
1. **Automated Cron Backup:** skrip `scripts/backup-db.sh` dieksekusi harian (jam 02:00 WIB) menjalankan `docker exec nur-mobil-db mariadb-dump -u nur_user -p nur_mobil | gzip > /backups/nur_mobil_$(date +%Y%m%d).sql.gz`.
2. **Rotasi:** simpan 7 hari backup harian lokal + sinkronisasi otomatis ke cloud storage (Google Drive / Telegram Bot via `rclone`).
3. **Disaster Recovery:** pemulihan database cukup satu perintah: `gunzip < backup.sql.gz | docker exec -i nur-mobil-db mariadb -u nur_user -p nur_mobil`.

---

*Fondasi §14 ini diputuskan sebelum Sprint 0 agar tidak perlu migrasi data atau refactor besar saat bisnis tumbuh. Keputusan di sini sudah mempertimbangkan pertumbuhan 10x dari kondisi saat ini.*

