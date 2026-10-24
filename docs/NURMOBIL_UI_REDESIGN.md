# Nur Mobil – Instruksi Redesign UI (Konsep "Katalog Terang")

> Dokumen ini adalah brief untuk agen coding (Antigravity). Tujuan: merombak **seluruh tampilan** situs `showroom.monliev.my.id` menjadi gaya marketplace yang kalem, bersih, dan netral, **tanpa mengubah logika bisnis, data, rute, atau integrasi**.

---

## 0. Cara kerja yang diminta

1. **Pelajari dulu repo** sebelum mengubah apa pun. Tentukan framework (indikasi awal: Next.js, karena ada `meta-next-size-adjust`), sistem styling (Tailwind / CSS Modules / lainnya), dan struktur komponen. Sesuaikan semua instruksi di bawah dengan stack yang ditemukan, jangan memperkenalkan library baru kecuali perlu.
2. Buat **rencana kerja** (daftar file yang akan diubah) dan tunjukkan sebelum eksekusi besar.
3. Kerjakan berurutan: **design tokens → komponen dasar → layout global → halaman satu per satu**.
4. Setelah tiap halaman selesai, jalankan build/lint/type-check dan cek tampilan di lebar 375px, 768px, dan 1280px.
5. Jangan mengubah: route, query/data fetching, skema database, server action, API, tautan WhatsApp, isi teks bisnis (angka statistik, harga, plat, nama unit), maupun fitur admin. Yang berubah hanya markup presentasi, kelas styling, dan komposisi komponen.

## 1. Prinsip desain

- **Kalem dan netral.** Putih dan abu dingin sebagai dasar, satu aksen biru baja. Tanpa gradien dekoratif, tanpa efek kaca, tanpa bayangan keras, tanpa animasi masuk yang berlebihan.
- **Foto mobil adalah bintang.** UI hanya menjadi bingkai yang tenang.
- **Kejujuran terlihat.** Hasil uji mikron (34 titik) ditampilkan sebagai data kecil yang jelas di setiap kartu mobil, bukan slogan besar.
- **Kepadatan sedang.** Cukup lega untuk dibaca di HP, cukup padat untuk membandingkan unit.
- Hanya tema terang. Dark mode di luar cakupan.

## 2. Design tokens

Tambahkan sebagai CSS variables global (atau padanannya di `tailwind.config`).

```css
:root{
  /* warna */
  --bg:        #F6F7F9;  /* latar halaman */
  --surface:   #FFFFFF;  /* kartu, header, hero */
  --ink:       #1B2430;  /* teks utama */
  --muted:     #5E6A7A;  /* teks sekunder */
  --line:      #E3E7EC;  /* garis pemisah kartu */
  --line-input:#CFD5DD;  /* border input & tombol sekunder */
  --accent:    #2F5D8C;  /* aksen utama (tombol, tautan, logo) */
  --accent-hover:#274E78;
  --ok:        #2E8B6A;  /* panel cat original */
  --warn:      #E0A526;  /* panel repaint tipis */
  --bad:       #C0392B;  /* panel dempul tebal */

  /* bentuk */
  --r-btn: 8px;
  --r-card: 12px;
  --r-input: 12px;
  --shadow-sm: 0 2px 8px rgba(27,36,48,.05);

  /* tata letak */
  --container: 1180px;
  --gutter: 20px;
}
```

Kontras: teks `--ink` dan `--muted` di atas `--surface`/`--bg` sudah memenuhi WCAG AA. Teks putih di atas `--accent` juga lolos. Jangan memakai `--warn` sebagai warna teks di atas putih.

## 3. Tipografi

- **Font:** `Public Sans` (400, 500, 600, 700). Muat lewat `next/font/google` (atau `<link>` bila bukan Next.js). Fallback: `system-ui, sans-serif`.
- Satu keluarga huruf untuk semua. Hierarki dibangun dari ukuran dan bobot, bukan dari ganti font.

| Peran | Ukuran | Bobot | Catatan |
|---|---|---|---|
| H1 hero | `clamp(28px, 3.6vw, 42px)`, line-height 1.15 | 700 | letter-spacing -0.015em, lebar maks 760px |
| H2 seksi | 22px | 700 | letter-spacing -0.01em |
| H3 kartu fitur | 16px | 700 | |
| Judul kartu mobil (H4) | 16px | 700 (atau 600) | |
| Harga | 20px | 700 | |
| Body | 15px, line-height 1.55 | 400 | |
| Meta/spesifikasi | 12–14px | 400–500 | warna `--muted` |

Aturan: huruf kapital semua **tidak dipakai** untuk label. Pakai sentence case. Tidak ada aksen satu-kata berwarna di dalam judul.

## 4. Komponen dasar

### 4.1 Button
- **Primary:** latar `--accent`, teks putih, radius 8px, padding `10px 18px`, font 600 14px. Hover `--accent-hover`.
- **Secondary (outline):** latar putih, teks `--ink`, border 1px `--line-input`. Hover: border `--ink`.
- Fokus keyboard wajib terlihat: `outline: 2px solid var(--accent); outline-offset: 2px`.
- Tidak ada panah (→) otomatis di akhir teks tombol.
- Tombol ikon telepon di "Hubungi Admin" boleh dipertahankan bila sudah ada.

### 4.2 Card
- Latar `--surface`, border 1px `--line`, radius 12px, tanpa bayangan (kecuali hero search).
- Padding isi 16px (kartu mobil) atau 20px (kartu fitur).
- Hover kartu mobil: border berubah ke `--line-input`. Tidak ada transform/zoom.

### 4.3 Form (select / input)
- Dipakai di bar pencarian dan di admin. Radius 12px (bar) atau 8px (field tunggal), border `--line-input`, latar putih.
- Label kecil 12px `--muted` di atas nilai. Nilai 15px, bobot 600.

### 4.4 Inspection bar (komponen khas Nur Mobil)
Deretan **8 segmen** kecil (tinggi 6px, radius 2px, gap 2px) yang merangkum hasil uji mikron per unit.
- Hijau `--ok` = cat original, kuning `--warn` = repaint tipis, merah `--bad` = dempul tebal.
- Data mentah 34 titik dikelompokkan jadi 8 zona (depan, atap, pintu kiri, pintu kanan, fender/quarter kiri, fender/quarter kanan, belakang, pilar). Bila struktur data berbeda, petakan seproporsional mungkin; **jangan mengarang data** jika unit belum diinspeksi, tampilkan bar abu `--line` dengan teks "Belum diinspeksi".
- Beri `aria-label` ringkas, misalnya "Uji mikron: 7 dari 8 zona cat original".
- Di bawahnya teks kecil 12px `--muted`: `Inspeksi 34 titik · {plat}`.

### 4.5 Badge status
Pill kecil (radius 999px, 12px, bobot 700). "READY" memakai teks `--ok` di atas latar putih/hijau sangat muda. Tidak berwarna mencolok.

## 5. Layout global

### 5.1 Header (semua halaman publik)
- Latar putih, border bawah `--line`, tinggi 64px, container 1180px.
- Kiri: logo (kotak 32×32 radius 8, latar `--accent`, huruf "N" putih) + teks "Nur Mobil" 18px/700. **Tagline "Apa Adanya & Bergaransi Cek Fisik" dipindah** ke hero atau footer agar header ringkas (di mobile tetap disembunyikan).
- Tengah/kanan: nav `Beranda`, `Katalog Unit`, `Portal Internal` (14px/500, `--muted`; halaman aktif `--ink`).
- Kanan: tombol primary "Hubungi Admin" (tetap ke `wa.me` yang sama).
- Mobile (<760px): nav disembunyikan ke menu hamburger/drawer sederhana; tombol admin tetap terlihat atau masuk ke drawer.
- Header tidak sticky bila tidak sticky sekarang; bila sudah sticky, pertahankan tanpa bayangan berlebih.

### 5.2 Footer
- Latar putih, border atas `--line`, 3 kolom (tentang, navigasi, garasi & kontak), teks 14px `--muted`, tautan hover `--ink`.
- Pertahankan semua isi dan tautan yang ada (termasuk Portal Investor dan Login Admin).
- Baris hak cipta di bawah, 13px.

### 5.3 Container & spasi
- Lebar maks 1180px, padding horizontal 20px. Jarak antar seksi 36–48px. Tidak ada seksi dengan latar berwarna mencolok; pembeda antar seksi cukup lewat `--bg` vs `--surface`.

## 6. Halaman per halaman

### 6.1 Beranda `/`
Urutan seksi:

1. **Hero** (latar `--surface`, border bawah `--line`, padding `44px 0 40px`)
   - H1 (teks tetap): "Beli Mobil Bekas Tanpa Was-Was. Rusak Dibilang Rusak, Eks Laka Dibilang Eks Laka." Rata kiri, **tanpa** warna khusus pada frasa mana pun.
   - Paragraf pendukung 15–16px `--muted`, lebar maks 640px (pertahankan teks asli atau versi ringkas, jangan menambah klaim baru).
   - **Bar pencarian**: satu kartu putih, border `--line-input`, radius 12px, `--shadow-sm`, lebar maks 860px. Tiga field berdampingan (Merek, Harga, Tahun) dipisah garis vertikal, plus tombol primary "Cari {jumlah} unit" di kanan. Mobile: field menumpuk vertikal, tombol penuh. Hubungkan ke filter katalog yang sudah ada (query string ke `/katalog`); jika belum ada, kirim ke `/katalog` tanpa filter.
   - Tombol sekunder "Konsultasi Langsung via WA" (outline) diletakkan di bawah bar pencarian atau di samping, tautan WA tetap.
   - **Baris kepercayaan** di bawah bar: 4 item teks 14px `--muted` dengan tanda centang hijau kecil: "124+ unit terjual sejak 2021", "Uji mikron 34 titik", "Dokumen 100% sah", "Garansi buyback tertulis". Ini menggantikan kartu statistik besar. Angka diambil dari sumber yang sama dengan yang dipakai sekarang.
2. **Unit siap pakai**
   - Header seksi: H2 "Unit siap pakai" kiri, tautan "Lihat semua unit" (warna `--accent`, 14px/600) kanan.
   - Grid `repeat(auto-fill, minmax(270px, 1fr))`, gap 18px. Kartu mobil lihat 7.1.
3. **Tiga keunggulan** (menggantikan 3 kartu ikon lama dan sebagian tabel)
   - Grid 3 kolom (1 kolom di mobile). Tiap kartu: H3 + 1–2 kalimat 14px `--muted`. Tanpa ikon berwarna. Judul: "Uji mikron cat 34 titik", "Rangka bebas laka & banjir", "Bawa montir sendiri".
4. **Tabel perbandingan "Mengapa Nur Mobil berbeda"** (pertahankan konten, ubah gaya)
   - Dibungkus kartu putih, border `--line`, radius 12, `overflow-x:auto`. Header kolom 13px/600 `--muted`. Kolom "Nur Mobil" diberi latar `--accent` 6% dan teks bobot 600. Baris dipisah garis `--line`, tanpa zebra.
5. **Alur transaksi** (3 langkah)
   - Daftar vertikal sederhana dalam satu kartu: judul langkah di kiri (lebar ~200px), deskripsi di kanan; pemisah garis `--line`. Penomoran hanya "Langkah 1/2/3" teks biasa karena ini memang urutan.
6. **Area layanan** (Kediri, Malang Raya, dst.)
   - Chip pill netral: latar putih, border `--line`, 13px.
7. Footer.

### 6.2 Katalog `/katalog`
- Header halaman: H1 "Katalog unit" 28px + jumlah unit ready di teks `--muted`.
- **Layout dua kolom di desktop** (≥860px): sidebar filter 250px di kiri (kartu putih, sticky `top: 76px`), hasil di kanan. Mobile: filter menjadi tombol "Filter" yang membuka drawer/sheet.
- Filter (gunakan yang sudah didukung data; jangan menambah filter tanpa data): merek (checkbox), rentang harga (slider atau dua input), tahun, transmisi. Accent checkbox/slider `--accent`.
- Bar atas hasil: "Menampilkan X dari Y unit" kiri, dropdown urutkan kanan.
- Hasil: grid kartu mobil (sama dengan 7.1). Opsional toggle grid/daftar bila mudah; **grid adalah default**.
- Empty state: teks jelas "Belum ada unit yang cocok dengan filter ini" + tombol "Reset filter". Tidak ada ilustrasi dekoratif.

### 6.3 Detail unit `/katalog/[slug]`
- Breadcrumb kecil (`Katalog Unit / {nama unit}`), 13px `--muted`.
- Dua kolom (≥960px): kiri galeri foto (foto utama radius 12 + thumbnail strip), kanan kartu ringkasan sticky.
- **Kartu ringkasan:** nama unit (H1 24–28px), baris meta (tahun · transmisi · KM · plat), harga 28px/700 (atau "Hubungi Kami"), badge READY, tombol primary "Tanya via WhatsApp" (tautan existing), tombol sekunder "Jadwalkan cek fisik" bila fitur sudah ada.
- **Hasil inspeksi 34 titik:** kartu lebar penuh di bawah. Tampilkan inspection bar (4.4) di atas, lalu tabel/daftar per panel: nama panel, nilai mikron (µm), status (Original / Repaint / Dempul) dengan titik berwarna **dan** teks status (jangan hanya warna). Data diambil dari sumber yang sudah ada.
- Seksi spesifikasi & dokumen: daftar dua kolom label–nilai, garis pemisah `--line`.
- Garansi: satu kartu dengan 3 poin singkat (buyback bermaterai, bebas laka & banjir, dokumen sah).

### 6.4 Portal internal `/admin/inventory` (dan sub-halaman admin)
Gunakan token yang sama agar konsisten, tetapi **utamakan keterbacaan dan kecepatan kerja**:
- Layout: sidebar kiri 220px (putih, border kanan `--line`) berisi navigasi admin; konten di kanan di atas `--bg`.
- Tabel inventori: kartu putih, header `--bg` 13px/600, baris 48px, hover baris `--bg`, kolom status memakai badge (4.5). Aksi per baris sebagai tombol ikon/teks sekunder.
- Form tambah/ubah unit: kartu putih, grid 2 kolom di desktop, label di atas field, pesan error 13px berwarna `--bad` di bawah field dengan teks jelas, tombol simpan primary di kanan bawah.
- Jangan ubah alur autentikasi, validasi, atau nama field.
- Halaman `/investor` (jika ada): perlakuan sama dengan admin; angka/grafik memakai `--accent` sebagai satu-satunya warna seri, `--ink` untuk sumbu.

## 7. Komponen khusus

### 7.1 Kartu mobil (`CarCard`)
Struktur dari atas ke bawah:
1. Area foto rasio ±16:10 (tinggi ~165px di grid), `object-fit: cover`, sudut atas radius 12. Bila tidak ada foto, tampilkan placeholder abu `#E7EAEE` dengan teks "foto unit". Badge "READY" di pojok kiri atas foto (putih, 12px/700, `--ok`).
2. Isi (padding 14px 16px 16px):
   - Meta: `{tahun} · {transmisi} · {KM}` 12px `--muted`
   - Judul: nama unit 16px/700
   - Harga 20px/700 (atau "Hubungi Kami")
   - Inspection bar (4.4)
   - Teks kecil: `Inspeksi 34 titik · {plat}`
3. Seluruh kartu adalah satu tautan ke halaman detail (satu target klik, fokus keyboard terlihat). Tidak perlu tombol terpisah "Lihat Detail" di grid; teks tombol lama dihapus agar kartu ringkas.

### 7.2 Bar pencarian hero
Lihat 6.1. Komponen dipakai ulang di katalog bila relevan.

## 8. Responsif

- Titik patah: 760px (nav → drawer, bar pencarian vertikal), 860px (sidebar filter → drawer), 960px (detail unit satu kolom).
- Target sentuh minimal 44px.
- Tabel lebar wajib punya `overflow-x:auto` di dalam kartu; halaman tidak boleh scroll horizontal.
- Gambar selalu `max-width:100%`, pakai komponen gambar framework dengan ukuran eksplisit untuk menghindari layout shift.

## 9. Aksesibilitas & kinerja

- Fokus keyboard terlihat di semua elemen interaktif.
- Warna tidak menjadi satu-satunya penanda (status panel selalu disertai teks).
- `alt` bermakna pada foto unit ("Hyundai Stargazer Trend MT 2023, tampak depan").
- Hormati `prefers-reduced-motion`; hindari animasi non-esensial. Transisi hover maksimal 150ms pada warna/border.
- Tidak menambah dependensi font selain Public Sans; gunakan `display: swap`.

## 10. Copywriting

- Bahasa Indonesia, nada lugas, sentence case, kata kerja aktif.
- Pertahankan klaim asli (34 titik, buyback, bebas laka & banjir). **Jangan menambah klaim, testimoni, atau angka baru.**
- Gunakan tanda kutip lengkung “ ” dan apostrof ’ pada teks yang tampil ke pengguna.

## 11. Kriteria selesai (checklist)

- [ ] Semua halaman publik memakai token & komponen baru; tidak ada sisa warna oranye/cokelat lama.
- [ ] Header, footer, kartu mobil, bar pencarian, tabel, dan form konsisten di semua halaman.
- [ ] Inspection bar tampil di kartu mobil dan halaman detail dengan data nyata (tanpa data palsu).
- [ ] Portal admin tetap berfungsi penuh (login, CRUD unit) dengan tampilan baru.
- [ ] Tidak ada perubahan pada route, API, skema data, dan tautan WhatsApp.
- [ ] Build, lint, dan type-check lolos tanpa error.
- [ ] Tampilan diperiksa di 375px, 768px, dan 1280px tanpa scroll horizontal atau teks terpotong.
- [ ] Skor Lighthouse Accessibility ≥ 95 pada Beranda dan Katalog.
- [ ] Ringkasan perubahan (daftar file, keputusan penting, hal yang belum bisa dikerjakan) disampaikan di akhir.

## 12. Referensi visual

Pratinjau konsep yang disetujui ("G · Katalog Terang") tersedia sebagai prototipe HTML interaktif: https://claude.ai/artifact/1WNm9pRkWX2BGcE3WgV2MG (pilih tab "G · Katalog Terang"). Prototipe ini adalah **acuan rasa visual**, bukan kode untuk disalin; terapkan polanya ke komponen yang sudah ada di repo.
