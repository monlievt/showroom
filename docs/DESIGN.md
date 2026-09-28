# DESIGN.md — Nur Mobil: Visual Direction & Creative Brief

> **Dokumen ini adalah "direction", bukan style guide teknis.**
> Dibaca bersama `AGENTS.md` setiap kali mengerjakan UI (Sprint 5, halaman publik, komponen admin).
> `AGENTS.md` menyaring apa yang tidak boleh ada; dokumen ini mengisi ruang yang tersisa dengan karakter brand yang nyata.
> Jika ada konflik antara pola default AI dan dokumen ini → dokumen ini menang.

---

## 1. Brand Essence (Baca Ini Dulu)

**Nama:** Nur Mobil (dari nama Ibu, Nurdiah. "Nur" = cahaya dalam bahasa Arab)

**Satu kalimat:** Showroom jual-beli mobil bekas yang jujur — rusak dibilang rusak, eks laka dibilang eks laka.

**Karakter brand:**
- Seperti mekanik kepercayaan yang sudah lama Anda kenal — kompeten, tidak bertele-tele, tidak menjual mimpi.
- Hangat karena ini bisnis keluarga, bukan korporat dingin.
- Transparan karena itu satu-satunya diferensiasi yang nyata di pasar mobil bekas yang penuh ketidakpercayaan.
- Tidak berusaha terlihat lebih besar atau lebih mewah dari yang sebenarnya.

**Anti-persona brand** (apa yang Nur Mobil BUKAN):
- ❌ Bukan dealer mewah: tidak ada efek parallax mewah, tidak ada foto hitam-putih dramatis, tidak ada tagline "Experience Luxury".
- ❌ Bukan tech startup: tidak ada "Powered by AI™", tidak ada gradient purple-biru, tidak ada animasi partikel.
- ❌ Bukan marketplace anonim: tidak ada desain steril tanpa karakter, tidak ada foto mobil dengan background putih saja.
- ❌ Bukan hard-sell: tidak ada badge merah "PROMO!!!", tidak ada countdown timer palsu.

---

## 2. Palet Warna

### Filosofi Warna
"Nur" = cahaya. Bukan neon, bukan sorot lampu. Cahaya pagi — hangat, jelas, jujur.

### Token Warna (gunakan persis ini, jangan improvisasi)

```css
/* ──────────────────────────────────────────
   CORE — Base Palette
   ────────────────────────────────────────── */

/* Neutral — dasar halaman, bukan putih steril */
--color-surface:       #F7F5F2;   /* off-white hangat, bukan #FFFFFF */
--color-surface-alt:   #EFECE8;   /* kartu, sidebar background */
--color-border:        #D9D4CB;   /* garis batas, divider */

/* Dark — teks dan elemen gelap */
--color-ink:           #1C1917;   /* teks utama, bukan #000000 */
--color-ink-muted:     #6B6560;   /* teks sekunder, label, placeholder */

/* ──────────────────────────────────────────
   ACCENT — Cahaya / Amber Hangat
   Digunakan HANYA pada elemen fokus: CTA utama,
   badge status penting, highlight inspeksi.
   Jangan dipakai di lebih dari 2–3 elemen per halaman.
   ────────────────────────────────────────── */
--color-accent:        #D97706;   /* amber-600 — warna utama aksen */
--color-accent-light:  #FEF3C7;   /* amber-100 — background badge, highlight */
--color-accent-dark:   #92400E;   /* amber-800 — hover state, teks di atas accent-light */

/* ──────────────────────────────────────────
   SEMANTIC — Status & Inspeksi
   Gunakan hanya untuk makna, bukan dekorasi.
   ────────────────────────────────────────── */
--color-ok:            #16A34A;   /* hijau — ketebalan cat original (< 120µm), status aman */
--color-ok-light:      #DCFCE7;
--color-warn:          #CA8A04;   /* kuning — repaint / perlu perhatian (120–200µm) */
--color-warn-light:    #FEF9C3;
--color-danger:        #DC2626;   /* merah — dempul tebal (> 200µm), eks laka, jatuh tempo */
--color-danger-light:  #FEE2E2;
--color-neutral-tag:   #64748B;   /* abu — status netral, info */
--color-neutral-light: #F1F5F9;
```

### Aturan Palet
1. **Satu aksen per area fokus.** Amber hanya untuk CTA utama dan status penting. Jika ragu, gunakan ink/ink-muted.
2. **Tidak ada gradient sebagai identitas.** Gradient hanya boleh untuk pemisah section yang disengaja, bukan sebagai "tampilan". Jika dipakai, tulis alasannya dalam komentar kode.
3. **Status colors hanya untuk makna.** Warna hijau/kuning/merah di atas adalah untuk sistem inspeksi — tidak untuk dekorasi layout.
4. **Dark mode.** Jika diimplementasikan nanti, gunakan token CSS yang sama dengan nilai berbeda — jangan rancang ulang palette dari nol.

---

## 3. Tipografi

### Font
```css
/* Heading — karakter kuat, tidak korporat */
--font-heading: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;

/* Body — bersih, mudah dibaca di layar kecil */
--font-body:    'Inter', system-ui, sans-serif;

/* Monospace — untuk plat nomor, kode unit, angka teknis */
--font-mono:    'JetBrains Mono', 'Fira Code', monospace;
```

> Kedua font tersedia via Google Fonts. Load hanya weight yang dipakai:
> - Plus Jakarta Sans: 600, 700
> - Inter: 400, 500, 600

### Skala Ukuran (Mobile-first)
```css
--text-xs:   0.75rem;   /* 12px — label, caption, badge teks */
--text-sm:   0.875rem;  /* 14px — body kecil, metadata */
--text-base: 1rem;      /* 16px — body utama */
--text-lg:   1.125rem;  /* 18px — subjudul kecil */
--text-xl:   1.25rem;   /* 20px — heading kartu */
--text-2xl:  1.5rem;    /* 24px — heading section */
--text-3xl:  1.875rem;  /* 30px — heading halaman */
--text-4xl:  2.25rem;   /* 36px — hero headline */
```

### Aturan Tipografi
- Plat nomor kendaraan selalu `font-mono`, huruf kapital.
- Angka Rupiah selalu `font-mono` atau `font-body` + `tabular-nums` — tidak boleh proporsional agar kolom sejajar.
- Heading halaman publik maksimal 2 baris di mobile. Jika lebih, persingkat.

---

## 4. Identitas Visual & Nada

### Yang Harus Ada
- **Foto mobil nyata** — bukan ilustrasi vektor, bukan foto stock generic. Foto dari garasi, dengan pencahayaan alami.
- **Angka yang jujur** — ketebalan cat dalam µm, grade A–D yang dideklarasikan terbuka.
- **Nama pemilik yang nyata** — "Nur Mobil (Toko Bu Nur)" bukan "NurMobil™ Verified™ AI-Powered™".

### Yang Tidak Boleh Ada (diambil dari anti-slop)
- ❌ Gradient biru-ungu atau ungu-pink sebagai treatment warna utama.
- ❌ Glassmorphism di lebih dari 1–2 elemen (navbar atau card highlight maksimal, sisanya solid).
- ❌ Glow effect di lebih dari 1–2 elemen penting.
- ❌ Grid/dot pattern dekoratif di background.
- ❌ Border radius pill (terlalu bulat) secara seragam di semua elemen.
- ❌ Bento grid kalau konten tidak secara natural berbeda ukuran.
- ❌ Logo bar "Dipercaya oleh 10.000+ pelanggan" — data palsu.
- ❌ Pricing card "Most Popular" kalau kita tidak punya pricing tier.
- ❌ Animasi hero yang bergerak tanpa tujuan (parallax, partikel, confetti).
- ❌ Dark mode secara default hanya karena "terlihat tech" — mayoritas pengguna adalah pembeli mobil via HP, bukan developer.

### Nada Halaman Publik
Bayangkan seseorang yang baru kenal Nur Mobil membuka `/katalog` dari HP di parkiran. Mereka tidak punya waktu membaca banyak. Mereka ingin tahu: **ini unit apa, kondisinya bagaimana, dan berapa harganya**.

Desain harus menjawab tiga pertanyaan itu dalam urutan itu, sebelum apapun lainnya.

---

## 5. Komponen Visual — Panduan per Elemen

### Badge Status Unit
```
INTAKE             → border abu, teks abu (--color-neutral-tag)
IN_REPAIR          → border kuning, teks amber gelap (--color-warn)
READY_FOR_SALE     → border hijau, teks hijau (--color-ok), tampil di katalog
AT_SHOWROOM_PENDING → border amber, teks amber (--color-accent)
SOLD_SETTLED       → background abu muda, teks abu (--color-neutral-light)
```

### Badge Ketebalan Cat (Inspeksi Panel)
```
< 120µm  → background --color-ok-light, teks --color-ok        (ORIGINAL)
120–200µm → background --color-warn-light, teks amber          (REPAINT)
> 200µm  → background --color-danger-light, teks --color-danger (DEMPUL)
```

### Kartu Unit di Katalog
- Foto: rasio 4:3, object-fit: cover, tidak ada crop aneh.
- Plat nomor: `font-mono`, uppercase, tampil kecil di pojok foto.
- Grade mesin/interior/eksterior/rangka: 4 badge kecil berderet, warna sesuai grade:
  - A → ok-light
  - B → neutral-light
  - C → warn-light
  - D → danger-light
- Harga: satu-satunya teks yang boleh lebih besar dari body. Tidak ada coret-coretan "Harga Asli: Rp X".
- Tombol CTA: background `--color-accent`, teks putih, radius yang sama dengan tombol lain di halaman (jangan lebih besar atau lebih bulat).

### Visualisator Panel Mobil
Komponen `CarPanelVisualizer` menampilkan outline sedan/SUV dari atas (top-view) dengan warna fill per panel berdasarkan kondisi:
- ORIGINAL → hijau (`--color-ok`)
- REPAINTED → kuning (`--color-warn`)
- DENTED_SCRATCHED → merah (`--color-danger`)
- REPLACED → abu (`--color-neutral-tag`)

Outline mobil: stroke tipis `--color-border`, fill `--color-surface`. Tidak ada shadow atau efek 3D.

---

## 6. Layout & Spasi

### Grid System
Gunakan grid 12 kolom via CSS Grid atau Tailwind's built-in grid. Tidak ada library layout tambahan.

```
Mobile  (< 640px):  1 kolom, padding horizontal 1rem
Tablet  (≥ 768px):  2 kolom grid untuk kartu unit
Desktop (≥ 1024px): 3 kolom grid untuk kartu unit, sidebar filter 1 kolom
Desktop (≥ 1280px): 4 kolom grid untuk kartu unit
```

### Spacing Scale (konsisten, jangan ad-hoc)
```css
--space-1:  0.25rem;  /* 4px */
--space-2:  0.5rem;   /* 8px */
--space-3:  0.75rem;  /* 12px */
--space-4:  1rem;     /* 16px */
--space-6:  1.5rem;   /* 24px */
--space-8:  2rem;     /* 32px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

### Border Radius
```css
--radius-sm:   0.25rem;  /* 4px  — input kecil, badge */
--radius-md:   0.5rem;   /* 8px  — kartu, tombol */
--radius-lg:   0.75rem;  /* 12px — modal, panel besar */
--radius-full: 9999px;   /* pill — hanya untuk badge status kecil */
```
> **Aturan:** `radius-full` (pill) hanya boleh untuk badge satu kata, bukan untuk tombol atau kartu.

---

## 7. Motion & Interaksi

### Prinsip
Animasi harus **responsif terhadap aksi pengguna**, bukan berjalan sendiri.

### Yang Diizinkan
- Hover state: transition `150ms ease` pada warna background dan shadow.
- Skeleton loading: fade-in `300ms` saat data tiba.
- Toast/notifikasi: slide-in dari bawah `200ms`, auto-dismiss `4s`.
- Accordion/dropdown: expand `200ms ease-out`.

### Yang TIDAK Diizinkan
- Animasi hero yang berjalan otomatis saat halaman dibuka (parallax, float, pulse pada elemen dekoratif).
- Scroll-triggered animations yang menggerakkan konten teks — mengganggu keterbacaan di mobile.
- Partikel, confetti, atau elemen yang bergerak tanpa trigger.
- Transition lebih dari `300ms` pada elemen interaktif — terasa lambat di HP entry-level.

---

## 8. Halaman Admin vs Halaman Publik

Dua wajah yang **berbeda karakter** tapi menggunakan design system yang sama:

| Aspek | Admin (`/admin/*`) | Publik (`/katalog/*`) |
|---|---|---|
| Tujuan | Efisiensi operasional, data dense | Kepercayaan & keputusan beli |
| Tone | Fungsional, no-nonsense | Hangat, terbuka |
| Warna dominan | --color-surface-alt (lebih abu) | --color-surface (lebih hangat) |
| Tipografi | Lebih banyak monospace (angka) | Lebih banyak heading besar |
| Foto | Thumbnail kecil, cukup | Full-bleed, prioritas |
| Info yang tampil | Semua (HPP, biaya, dll.) | Hanya kondisi, bukan finansial |

---

## 9. Catatan Implementasi (untuk AI coding agent)

1. **CSS Variables dulu.** Semua token warna dan spacing di atas harus didefinisikan di `src/app/globals.css` atau `src/index.css` sebelum komponen apapun ditulis. Jangan hardcode hex color di komponen.

2. **Tailwind.** Semua token di atas dipetakan ke `tailwind.config.ts` sebagai `extend.colors` dan `extend.spacing`. Gunakan class Tailwind yang mengacu ke token, bukan arbitrary value `text-[#D97706]`.

3. **shadcn/ui theme.** Gunakan CSS variables di atas untuk override CSS variables default shadcn (`--primary`, `--accent`, dll.) di `globals.css`. Jangan fork komponen shadcn hanya untuk ganti warna.

4. **Mobile-first.** Setiap komponen baru ditulis untuk mobile terlebih dahulu. Breakpoint desktop adalah augmentasi, bukan default.

5. **Tidak ada keputusan warna ad-hoc.** Jika warna yang dibutuhkan tidak ada di palet ini, minta klarifikasi ke Owner — jangan pilih sendiri.

---

*Dokumen ini adalah creative brief, bukan kode. Perubahan pada palet, tipografi, atau nada visual membutuhkan persetujuan eksplisit dari Owner sebelum diimplementasikan.*
