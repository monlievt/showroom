/**
 * Template CSV dan Panduan Impor Data Spreadsheet Showroom Nur Mobil
 * Menggunakan format CSV dengan UTF-8 BOM agar langsung rapi dibuka di Microsoft Excel dan Google Sheets.
 */

export const VEHICLE_IMPORT_TEMPLATE_CSV = `Plat Nomor,Merk,Model,Tahun,Warna,Transmisi,Kilometer,Kapasitas Mesin,Tanggal Beli,Harga Beli,Target Jual,Batas Bawah Harga,Status BPKB,Status Unit,Sumber Unit,Lokasi,Catatan
N 8821 CD,Daihatsu,Gran Max Pick Up 1.5 AC PS,2021,Putih,MANUAL,42000,1495,2026-09-12,95000000,115000000,110000000,READY,READY_FOR_SALE,DIRECT_BUY,Garasi Niaga,Bak mulus tangan pertama
L 1092 EF,Toyota,Avanza 1.5 G CVT TSS,2022,Silver Mica Metallic,CVT,19800,1496,2026-09-10,205000000,235000000,228000000,READY,READY_FOR_SALE,DIRECT_BUY,Garasi Utama,Pajak hidup STNK Surabaya
AG 1455 XY,Honda,Brio RS 1.2 Urbanite CVT,2022,Kuning Karnaval,CVT,28000,1199,2026-08-28,155000000,178000000,172000000,READY,READY_FOR_SALE,DIRECT_BUY,Garasi Depan,Kondisi istimewa servis rutin Honda
W 1934 QZ,Mitsubishi,Xpander Ultimate 1.5 AT,2020,Putih Mutiara,AUTOMATIC,36200,1499,2026-09-02,188000000,228000000,220000000,READY,READY_FOR_SALE,DIRECT_BUY,Garasi Utama,Interior bersih bebas asap rokok
B 1234 NMB,Toyota,Innova Reborn 2.4 V AT Diesel,2019,Hitam Metalik,AUTOMATIC,52000,2393,2026-08-15,280000000,325000000,315000000,PROCESS_1_2_WEEKS,READY_FOR_SALE,AUCTION,Garasi Utama,BPKB proses leasing 14 hari
DK 5678 CD,Suzuki,Ertiga GL 1.5 MT,2018,Abu-abu Metalik,MANUAL,64000,1462,2026-09-15,130000000,158000000,150000000,READY,INTAKE,DIRECT_BUY,Garasi Samping,Baru masuk butuh salon poles`;

export const EXPENSE_IMPORT_TEMPLATE_CSV = `Plat Nomor Mobil,Kategori Biaya,Keterangan Biaya,Nominal Biaya,Tanggal Biaya,Vendor Bengkel
N 8821 CD,DETAILING_SALON,Poles bodi 3 step & salon interior,650000,2026-09-13,Garasi Auto Detailing
L 1092 EF,OIL_AND_SERVICE,Ganti oli mesin TMO 5W-30 & filter oli,450000,2026-09-11,Bengkel Resmi Toyota
AG 1455 XY,BODY_PAINT,Sol baret bumper depan kiri & poles,850000,2026-08-29,Bengkel Cat Barokah
W 1934 QZ,SPAREPARTS,Ganti karet wiper & kampas rem depan,550000,2026-09-04,Toko Onderdil Lancar
B 1234 NMB,OIL_AND_SERVICE,Tune up diesel & ganti filter solar,750000,2026-08-18,Bengkel Diesel Mandiri`;

export const SALES_IMPORT_TEMPLATE_CSV = `Plat Nomor Mobil,Tanggal Terjual,Nama Pembeli,No HP Pembeli,Alamat Pembeli,Harga Terjual,Jumlah Pembayaran,Status Lunas
AG 1892 RD,2026-08-20,Bpk. Supriyanto,081233445566,Kediri Kota,126000000,126000000,LUNAS
N 4321 AA,2026-08-10,Ibu Rina Wijaya,081399887766,Malang Kota,165000000,165000000,LUNAS`;

/**
 * Trigger download file CSV langsung di browser dengan UTF-8 BOM
 */
export function downloadCsvTemplate(
  filename: string,
  content: string
) {
  // \uFEFF adalah UTF-8 Byte Order Mark (BOM) agar Excel mengenali encoding UTF-8 secara otomatis
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
