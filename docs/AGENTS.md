# SYSTEM RULES & OPERATIONAL CONVENTIONS (AGENTS.md)

Anda adalah Senior Full-Stack Engineer yang membangun sistem operasional showroom & jual-beli mobil **"Nur Mobil"** (Toko Bu Nur). Baca `PRD.md`, `ARCHITECTURE.md`, dan `prisma/schema.prisma` sebelum menulis kode apa pun.

## 1. TECH STACK MANDAT
- Next.js (App Router), TypeScript Strict Mode.
- Tailwind CSS + shadcn/ui.
- MariaDB (MySQL-compatible) + Prisma ORM.
- React Hook Form + Zod (validasi wajib sinkron client & server).
- Auth: Better Auth / Auth.js (session di MariaDB). Storage: MinIO / Local Volume Storage (bucket: `vehicle-docs`, `vehicle-photos`).
- PDF: `@react-pdf/renderer` (server-side). **Jangan** pakai headless browser/Puppeteer.
- Arsitektur: monolith modular satu Next.js app. **Jangan** membuat subdomain/app kedua, microservices, atau tRPC tanpa instruksi eksplisit.
- `Vehicle.transmission` menggunakan `enum TransmissionType` — **JANGAN** menggunakan String bebas. [Saran #4]

## 2. ATURAN INTEGRITAS KODE (ANTI-HALUSINASI)
- DILARANG membuat modul HR, absensi, atau payroll karyawan (lihat PRD.md §5 — di luar cakupan).
- DILARANG mengubah `prisma/schema.prisma` tanpa instruksi tertulis spesifik dari user.
- DILARANG menggunakan mock-data atau placeholder `TODO` di dalam fungsi kalkulasi keuangan (`lib/calculations/**`).
- DILARANG menginstal package/library baru di luar yang sudah disepakati di `ARCHITECTURE.md`.
- DILARANG membuat fitur dari Backlog v2/v3 (ROADMAP_TASKS.md) sebelum Sprint 0–6 selesai dan dikonfirmasi user.
- Selesaikan satu fitur secara vertikal (Zod schema → Server Action → UI) sebelum pindah fitur lain.
- Semua kalkulasi uang wajib `Decimal`/bilangan bulat Rupiah — **tidak pernah** floating point.
- DILARANG menggunakan plain `String` untuk field `Vehicle.transmission` — wajib pakai `TransmissionType` enum. [Saran #4]
- DILARANG membuat `CashTransaction` dengan `relatedVehicleId`/`relatedSaleId`/`relatedExpenseId` sebagai plain String yang tidak divalidasi — relasi wajib mengikuti skema @relation yang sudah didefinisikan. [Saran #1]
- DILARANG memanggil WA Gateway (Fonnte/Wablas) tanpa terlebih dahulu menulis `NotificationLog` dengan `status = PENDING` — dan wajib update statusnya menjadi `SENT` atau `FAILED` setelah request selesai. [Saran #7]

## 3. ATURAN LOGIKA BISNIS MUTLAK (tidak bisa dinegosiasikan oleh AI coding assistant)
1. `Total HPP Unit = purchasePrice + SUM(Expense.amount)`.
2. `Laba Kotor Unit = Sale.sellingPrice - Total HPP Unit`.
3. Distribusi laba (`ProfitDistribution`) HANYA boleh dieksekusi jika `SUM(SalePayment.amount) >= Sale.sellingPrice` — dihitung dari ledger pembayaran, **bukan** dari field boolean yang diedit manual.
4. Jika Laba Kotor negatif (rugi): pokok modal seluruh investor (Ibu maupun eksternal) dikembalikan 100%; seluruh nilai kerugian diserap akun Pemilik — dicatat eksplisit sebagai transaksi (`CapitalLedger` type `RETURNED` + `CashTransaction`), **bukan** pengurangan saldo diam-diam.
5. `VehicleInvestment.profitSharePercent` disimpan sebagai **0–100** (mis. `50.00` = 50%). **JANGAN PERNAH** memakai representasi 0–1 (mis. `0.50`) — ini sumber bug fatal jika tertukar. Validasi Zod harus menolak nilai di luar rentang 0–100.
6. Aturan bagi hasil bertingkat untuk 4 saudara (modal Ibu) **selalu** dibaca dari `ProfitShareRule` (tabel yang bisa diedit Owner) — **DILARANG hardcode** angka Rp1.000.000/Rp750.000/Rp500.000 langsung di kode.
7. Setiap `ProfitDistribution` **wajib** menyimpan snapshot (`grossProfitAtCalc`, `totalUnitCapitalAtCalc`, `agreedPercentAtCalc`, `ruleVersionId`) pada saat kalkulasi. **DILARANG** menghitung ulang distribusi lama dari `ProfitShareRule`/`VehicleInvestment` yang berlaku saat ini — riwayat harus tetap seperti saat dihitung, walau aturan berubah di masa depan.
8. `Vehicle.status` hanya boleh berpindah sesuai state machine di `ARCHITECTURE.md` §5 (`INTAKE → IN_REPAIR → READY_FOR_SALE → AT_SHOWROOM_PENDING → SOLD_SETTLED`). Transisi mundur/lompat harus ditolak di level Server Action lewat `canTransition()`.
9. DILARANG hard delete pada transaksi finansial yang sudah final (`Expense`, `Sale`, `SalePayment`, `ProfitDistribution`, `CapitalLedger`, `CashTransaction`). Koreksi hanya lewat baris baru bertipe `CORRECTION`/void, tidak pernah `DELETE`.
10. Setiap perubahan data finansial **wajib** menulis baris `AuditLog` (`actorUserId`, `action`, `entityType`, `entityId`, `beforeData`, `afterData`) dalam **database transaction yang sama** dengan mutasinya.
11. Public query (`/katalog/*`) **DILARANG** mengandung field: `purchasePrice`, `Expense`, `CapitalLedger`, `CashTransaction`, `ProfitDistribution`, atau data investor apa pun. Gunakan DTO/select eksplisit, jangan `select *`.
12. `SUPABASE_SERVICE_ROLE_KEY` tidak pernah diakses dari client component, tidak pernah prefix `NEXT_PUBLIC_`, tidak pernah dikembalikan di response API mana pun.
13. Aturan pajak (tarif, skema PPh/PPN, dsb) **DILARANG di-hardcode** ke dalam logika aplikasi (`if companyType == X then rate = Y`). `TaxRecord.taxType` adalah teks bebas yang diisi manual — keputusan tarif ada di tangan Owner/akuntan, bukan kode.
14. Jika sebuah requirement bisnis ambigu atau bertentangan dengan dokumen ini, **jangan berasumsi** — tandai sebagai *blocking clarification* dan tanyakan ke user sebelum melanjutkan.
   15. `Inspection.version` bersifat unik per kendaraan (`@@unique([vehicleId, version])`). Saat membuat inspeksi baru, wajib query `MAX(version)` untuk kendaraan tersebut lalu increment +1, dan set `isCurrent = true` sekaligus set inspeksi sebelumnya `isCurrent = false` — semuanya dalam satu database transaction. DILARANG insert dengan `version = 1` secara hardcode tanpa mengecek nilai yang sudah ada. [Saran #2]
   16. Saat INSERT atau UPDATE `ProfitShareRule`, wajib menjalankan fungsi validasi gap/overlap (`lib/validations/profit-share-rule.ts`) sebelum menyimpan. Tier dinyatakan valid hanya jika untuk setiap pasangan tier aktif yang berurutan berlaku `tier[i].maxProfit == tier[i+1].minProfit` (contiguous, tanpa celah dan tanpa tumpang-tindih). Jika tidak valid, tolak dengan error deskriptif. [Saran #3]
   17. Reversal distribusi laba DILARANG dilakukan dengan cara menghapus atau mengedit langsung `ProfitDistribution` yang sudah `isPaid = true`. Wajib mengikuti alur `reverseDistribution(saleId, actorUserId)` di `lib/calculations/profit-share.ts` sesuai ARCHITECTURE.md §13. Distribusi lama tetap ada sebagai riwayat — reversal menghasilkan entri CORRECTION baru, bukan penghapusan. [Saran #8]

## 4. WORKFLOW
- Kerjakan `ROADMAP_TASKS.md` berurutan per sprint, jangan lompat.
- Sprint 4a (Struktur Modal) harus selesai penuh sebelum Sprint 4b (Financial Engine) dimulai. [Saran #6]
- Sprint 4b adalah yang paling rawan bug — tulis test untuk setiap fungsi di `lib/calculations/profit-share.ts` **sebelum** menganggap sprint selesai, termasuk skenario: distribusi normal, distribusi saat rugi, dan reversal.
- Setelah menyelesaikan satu task, centang `[x]` di `ROADMAP_TASKS.md` di commit yang sama.

---

## 5. PONYTAIL — PRINSIP KODE MINIMAL (dari github.com/DietrichGebert/ponytail)

> "Kode terbaik adalah kode yang tidak pernah ditulis."
> Prinsip ini berlaku untuk SEMUA task koding: menulis, menambah, refactor, review, memilih library.
> **Pengecualian**: logika kalkulasi keuangan (`lib/calculations/**`) — di sana eksplisit lebih penting dari singkat.

### The Ladder — jalankan SEBELUM menulis kode apapun

Berhenti di tangga pertama yang cukup. Jangan loncat ke tangga bawah jika tangga atas sudah menyelesaikan masalah:

```
1. Apakah fitur/kode ini perlu ada?
   → Jika ini spekulatif atau "nanti mungkin butuh" → SKIP. YAGNI.
   → Catat dalam satu baris kenapa dilewati.

2. Sudah ada di codebase ini?
   → Cek modules/, components/, lib/ terlebih dulu.
   → Jangan tulis ulang apa yang sudah ada beberapa file di sebelah.

3. shadcn/ui atau Next.js sudah punya?
   → Gunakan komponen shadcn yang tersedia sebelum membuat komponen baru.
   → Gunakan fitur Next.js (Server Components, Image, Link) sebelum workaround.

4. Native platform / browser sudah bisa?
   → <input type="date"> > date picker library.
   → CSS > JavaScript untuk animasi sederhana.
   → DB constraint (schema.prisma) > validasi di application code.

5. Dependency yang sudah terinstall bisa menyelesaikannya?
   → Cek package.json sebelum mengusulkan package baru.
   → Jangan tambah dependency baru untuk sesuatu yang bisa diselesaikan 5 baris.

6. Bisa satu fungsi/satu file?
   → Satu fungsi lebih baik dari satu modul.
   → Satu file lebih baik dari satu direktori baru.

7. Baru kemudian: tulis kode minimum yang bekerja dan aman.
```

### Aturan Tambahan Ponytail

- **Tidak ada abstraksi yang tidak diminta**: tidak ada interface dengan satu implementasi, tidak ada factory untuk satu produk, tidak ada config untuk nilai yang tidak akan berubah.
- **Tidak ada boilerplate "untuk nanti"**: scaffold nanti kalau memang butuh, bukan sekarang sebagai antisipasi.
- **Hapus > tambah**: jika ada cara menghapus kode lama yang digantikan fitur baru, hapuslah.
- **Membosankan > pintar**: kode yang bisa dibaca jam 3 pagi lebih baik dari kode elegan yang membingungkan.
- **Bug fix = root cause, bukan symptom**: sebelum memperbaiki bug, grep semua caller dari fungsi yang akan disentuh. Satu perbaikan di fungsi bersama lebih baik dari perbaikan di setiap pemanggil.
- **Pahami dulu, baru tulis**: The Ladder dijalankan **setelah** memahami masalah, bukan menggantikan pemahaman masalah. Baca task dan kode yang akan disentuh, trace flow end-to-end, baru naiki tangga.

---

## 6. ANTI-SLOP UI — ATURAN VISUAL (dari github.com/miqdadbadjuber/anti-slop)

> Baca `DESIGN.md` terlebih dahulu sebelum menulis kode UI apapun.
> `DESIGN.md` memberikan *direction* (warna, tipografi, karakter brand).
> Bagian ini adalah *filter* — apa yang tidak boleh ada meski terlihat "bagus".
> Keduanya wajib dibaca bersama, bukan salah satu.

### Larangan Visual (semua ini DILARANG tanpa alasan tertulis)

**Warna & Efek**
- ❌ Gradient biru-ungu, biru-cyan, atau ungu-pink sebagai treatment warna utama — ini tanda paling jelas output AI generic. Gunakan palet di `DESIGN.md`.
- ❌ Glassmorphism (`backdrop-filter: blur`) di lebih dari 1–2 elemen per halaman. Glass adalah aksen, bukan karakter desain.
- ❌ Glow effect (`box-shadow` bercahaya) di lebih dari 1–2 elemen penting. Glow di mana-mana = tidak ada yang menonjol.
- ❌ Background grid, dot pattern, atau garis berulang sebagai dekorasi tanpa tujuan identitas.
- ❌ Semua elemen menggunakan `border-radius: 9999px` (pill shape) seragam — radius adalah alat hierarki, bukan karakter universal.
- ❌ Shadow besar di setiap komponen — elevasi kehilangan makna jika semua elemen melayang.
- ❌ Terlalu banyak warna aksen (lebih dari 3 core + 1 accent per halaman) — gunakan token warna dari `DESIGN.md`.
- ❌ Dark mode sebagai default hanya karena "terlihat tech" — mayoritas pengguna katalog adalah pembeli mobil via HP, bukan developer.

**Layout & Komponen**
- ❌ Template urutan section yang tidak dipikirkan: Hero → Feature cards → Testimonial → FAQ → CTA → Footer. Bangun urutan dari kebutuhan konten, bukan dari template.
- ❌ Bento grid kalau konten tidak secara natural berbeda ukuran — grid biasa lebih jujur.
- ❌ "How It Works" selalu 3 langkah dengan bulatan bernomor — gunakan jumlah langkah yang nyata.
- ❌ Logo bar "Dipercaya oleh 10.000+ pelanggan" atau angka yang dibuat-buat — Nur Mobil hanya mencantumkan data nyata.
- ❌ Spacing identik di semua section — variasikan spasi untuk menciptakan ritme dan hierarki.
- ❌ Feature cards dengan ukuran, tinggi, icon, dan padding yang seragam — konten yang berbeda bobot harus tampil berbeda.

**Copy & Teks**
- ❌ Emoji sebagai pengganti struktur konten (bullet poin emoji, judul dengan ✨).
- ❌ Angka statistik yang dibuat-buat ("99.9% Kepuasan Pelanggan", "Diverifikasi AI™").
- ❌ Klaim tanpa bukti ("Terpercaya", "Premium", "Terbaik") tanpa konteks spesifik.
- ❌ Komentar kode dekoratif: `// ======================== SECTION ========================`, `// Step 1:`, `// Initialize variable` di atas `let count = 0`.

### Yang Wajib Ada

- ✅ Foto mobil nyata dari garasi, bukan foto stock atau ilustrasi vektor.
- ✅ Data inspeksi yang dinyatakan apa adanya — ketebalan cat dalam µm, grade A–D secara eksplisit.
- ✅ Jawaban tiga pertanyaan pembeli dalam urutan: unit apa → kondisi bagaimana → harga berapa.
- ✅ Semua token warna dari `DESIGN.md §2` — tidak ada hex warna hardcoded di komponen.
- ✅ Komponen shadcn/ui dipakai sebelum membuat komponen UI custom.

### Saat Membangun UI Baru — Checklist Sebelum Commit

```
[ ] Tidak ada warna hex hardcoded di komponen — semua pakai CSS variable dari DESIGN.md
[ ] Tidak ada gradient biru-ungu atau ungu-pink
[ ] Glassmorphism: maksimal 1–2 elemen per halaman
[ ] Glow: maksimal 1–2 elemen per halaman
[ ] Tidak ada angka atau klaim yang dibuat-buat
[ ] Foto yang dipakai adalah foto nyata (bukan placeholder vektor)
[ ] Layout mengikuti kebutuhan konten, bukan template default
[ ] Mobile: tampil dan berfungsi dengan baik di viewport 375px
[ ] Tidak ada animasi berjalan otomatis tanpa trigger pengguna
[ ] Komentar kode: tidak ada separator dekoratif, tidak ada narasi alur
```

