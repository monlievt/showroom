import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatRupiah } from "@/lib/utils";
import { terbilangRupiah } from "@/lib/calculations/sale";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 8.5,
    fontFamily: "Helvetica",
    color: "#1C1917",
    backgroundColor: "#FFFFFF",
    lineHeight: 1.35,
  },
  header: {
    borderBottom: "2px solid #D97706",
    paddingBottom: 8,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  logoText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#D97706",
    letterSpacing: -0.5,
  },
  subLogo: {
    fontSize: 7.5,
    color: "#6B6560",
    marginTop: 2,
  },
  docTitle: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "right",
    color: "#1C1917",
  },
  docNumber: {
    fontSize: 7.5,
    color: "#6B6560",
    textAlign: "right",
    marginTop: 2,
  },
  introText: {
    fontSize: 8,
    color: "#44403C",
    marginBottom: 8,
    textAlign: "justify",
  },
  twoCol: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },
  partyBox: {
    flex: 1,
    backgroundColor: "#F7F5F2",
    border: "1px solid #D9D4CB",
    borderRadius: 4,
    padding: 7,
  },
  partyTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#92400E",
    textTransform: "uppercase",
    marginBottom: 4,
    borderBottom: "1px solid #EFECE8",
    paddingBottom: 2,
  },
  partyText: {
    fontSize: 8,
    color: "#1C1917",
    marginBottom: 1.5,
  },
  sectionTitle: {
    fontSize: 8.5,
    fontWeight: "bold",
    color: "#1C1917",
    textTransform: "uppercase",
    backgroundColor: "#EFECE8",
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 2,
    marginBottom: 6,
    marginTop: 4,
    borderLeft: "3px solid #D97706",
  },
  unitGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    border: "1px solid #D9D4CB",
    borderRadius: 4,
    padding: 6,
    marginBottom: 8,
    backgroundColor: "#FAFAF9",
  },
  col3: {
    width: "33.33%",
    marginBottom: 4,
  },
  col4: {
    width: "25%",
    marginBottom: 4,
  },
  label: {
    fontSize: 6.5,
    color: "#78716C",
    textTransform: "uppercase",
    fontWeight: "bold",
  },
  value: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#1C1917",
    marginTop: 1,
  },
  financialBox: {
    flexDirection: "row",
    border: "1px solid #D9D4CB",
    borderRadius: 4,
    padding: 7,
    marginBottom: 8,
    backgroundColor: "#FEF3C7",
    justifyContent: "space-between",
    alignItems: "center",
  },
  finCol: {
    alignItems: "flex-start",
  },
  terbilangBox: {
    padding: 5,
    backgroundColor: "#F5F5F4",
    border: "1px solid #E7E5E4",
    borderRadius: 3,
    marginBottom: 8,
  },
  articlesBox: {
    borderTop: "1px solid #D9D4CB",
    paddingTop: 6,
    marginBottom: 8,
  },
  articleHeading: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#1C1917",
    marginTop: 3,
    marginBottom: 1,
  },
  articleBody: {
    fontSize: 7,
    color: "#44403C",
    textAlign: "justify",
    marginBottom: 3,
    lineHeight: 1.3,
  },
  signatures: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTop: "1px solid #D9D4CB",
  },
  sigBox: {
    width: "30%",
    textAlign: "center",
    alignItems: "center",
  },
  sigRole: {
    fontSize: 7,
    color: "#6B6560",
    marginBottom: 3,
  },
  sigLine: {
    borderBottom: "1px solid #1C1917",
    marginBottom: 2,
    width: "100%",
  },
  sigName: {
    fontSize: 8,
    fontWeight: "bold",
  },
  materaiBox: {
    width: 60,
    height: 38,
    borderWidth: 1,
    borderColor: "#9CA3AF",
    borderStyle: "dashed",
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    backgroundColor: "#F9FAFB",
  },
  materaiText: {
    fontSize: 5.5,
    color: "#4B5563",
    fontWeight: "bold",
    textAlign: "center",
  },
  materaiSubText: {
    fontSize: 4.5,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 0.5,
  },
  sigSpace: {
    height: 38,
  },
});

interface SaleAgreementPdfProps {
  sale: any;
  vehicle: any;
  buyer: any;
  payments: any[];
}

export function SaleAgreementPdfDocument({
  sale,
  vehicle,
  buyer,
  payments,
}: SaleAgreementPdfProps) {
  const saleDateFormatted = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(sale.saleDate));

  const totalPaid = payments.reduce((acc, p) => acc + Number(p.amount), 0);
  const remaining = Number(sale.sellingPrice) - totalPaid;
  const isSettled = remaining <= 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ── HEADER ──────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logoText}>NUR MOBIL</Text>
            <Text style={styles.subLogo}>
              Toko Bu Nur • Showroom Jual-Beli Mobil Bekas Berkualitas & Terpercaya
            </Text>
          </View>
          <View>
            <Text style={styles.docTitle}>
              SURAT PERJANJIAN JUAL BELI KENDARAAN (SPK)
            </Text>
            <Text style={styles.docNumber}>
              No. SPK: #{sale.id.substring(0, 8).toUpperCase()} / NM /{" "}
              {new Date(sale.saleDate).getFullYear()} • {saleDateFormatted}
            </Text>
          </View>
        </View>

        <Text style={styles.introText}>
          Pada hari ini, tanggal {saleDateFormatted}, telah disepakati perjanjian jual beli kendaraan bermotor roda empat (bekas) antara pihak-pihak yang bertanda tangan di bawah ini:
        </Text>

        {/* ── PARA PIHAK ─────────────────────────────────────────── */}
        <View style={styles.twoCol}>
          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>PIHAK PERTAMA (PENJUAL):</Text>
            <Text style={[styles.partyText, { fontWeight: "bold" }]}>
              NUR MOBIL (Toko Bu Nur)
            </Text>
            <Text style={styles.partyText}>Kuasa/Pengelola: Manajemen Showroom Nur Mobil</Text>
            <Text style={styles.partyText}>Domisili: Garasi Utama Nur Mobil</Text>
            <Text style={styles.partyText}>No. Telepon / WA: 0812-3456-7890</Text>
          </View>

          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>PIHAK KEDUA (PEMBELI):</Text>
            <Text style={[styles.partyText, { fontWeight: "bold" }]}>
              {buyer.name}
            </Text>
            <Text style={styles.partyText}>
              Status: {buyer.isShowroom ? "Showroom Rekanan (Wholesale / Tempo)" : "Konsumen Langsung (Retail)"}
            </Text>
            <Text style={styles.partyText}>No. WhatsApp / HP: {buyer.phone || "-"}</Text>
            <Text style={styles.partyText}>Alamat: {buyer.address || "Sesuai KTP Terlampir"}</Text>
          </View>
        </View>

        {/* ── OBJEK KENDARAAN ────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>
          PASAL I: IDENTITAS OBJEK KENDARAAN BERMOTOR
        </Text>
        <View style={styles.unitGrid}>
          <View style={styles.col4}>
            <Text style={styles.label}>Nomor Polisi (Plat)</Text>
            <Text style={styles.value}>{vehicle.plateNumber}</Text>
          </View>
          <View style={styles.col4}>
            <Text style={styles.label}>Merk / Pabrikan</Text>
            <Text style={styles.value}>{vehicle.brand}</Text>
          </View>
          <View style={styles.col4}>
            <Text style={styles.label}>Tipe & Model</Text>
            <Text style={styles.value}>{vehicle.model}</Text>
          </View>
          <View style={styles.col4}>
            <Text style={styles.label}>Tahun Pembuatan</Text>
            <Text style={styles.value}>{vehicle.year}</Text>
          </View>
          <View style={styles.col4}>
            <Text style={styles.label}>Warna Kendaraan</Text>
            <Text style={styles.value}>{vehicle.color}</Text>
          </View>
          <View style={styles.col4}>
            <Text style={styles.label}>Transmisi</Text>
            <Text style={styles.value}>{vehicle.transmission}</Text>
          </View>
          <View style={styles.col4}>
            <Text style={styles.label}>Nomor Rangka (VIN)</Text>
            <Text style={styles.value}>{vehicle.chassisNumber || "Sesuai Fisik & BPKB"}</Text>
          </View>
          <View style={styles.col4}>
            <Text style={styles.label}>Nomor Mesin</Text>
            <Text style={styles.value}>{vehicle.engineNumber || "Sesuai Fisik & BPKB"}</Text>
          </View>
        </View>

        {/* ── NILAI TRANSAKSI & PEMBAYARAN ───────────────────────── */}
        <Text style={styles.sectionTitle}>
          PASAL II: KESEPAKATAN HARGA & KETENTUAN PEMBAYARAN
        </Text>
        <View style={styles.financialBox}>
          <View style={styles.finCol}>
            <Text style={styles.label}>Total Harga Kesepakatan:</Text>
            <Text style={[styles.value, { fontSize: 10, color: "#1C1917" }]}>
              {formatRupiah(Number(sale.sellingPrice))}
            </Text>
          </View>
          <View style={styles.finCol}>
            <Text style={styles.label}>Uang Muka / Terbayar (DP):</Text>
            <Text style={[styles.value, { fontSize: 10, color: "#16A34A" }]}>
              {formatRupiah(totalPaid)}
            </Text>
          </View>
          <View style={styles.finCol}>
            <Text style={styles.label}>Sisa Pelunasan (Tempo Piutang):</Text>
            <Text style={[styles.value, { fontSize: 10, color: isSettled ? "#16A34A" : "#DC2626" }]}>
              {isSettled ? "LUNAS (0)" : formatRupiah(remaining)}
            </Text>
          </View>
          {!isSettled && sale.dueDate && (
            <View style={styles.finCol}>
              <Text style={styles.label}>Jatuh Tempo Pelunasan:</Text>
              <Text style={[styles.value, { fontSize: 9, color: "#DC2626" }]}>
                {new Intl.DateTimeFormat("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }).format(new Date(sale.dueDate))}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.terbilangBox}>
          <Text style={{ fontSize: 7, color: "#6B6560", fontStyle: "italic" }}>
            Terbilang: #{terbilangRupiah(Number(sale.sellingPrice))}#
          </Text>
        </View>

        {/* ── SYARAT DAN KETENTUAN HUKUM BAKU ────────────────────── */}
        <View style={styles.articlesBox}>
          <Text style={styles.articleHeading}>
            PASAL III: JAMINAN KEABSAHAN DOKUMEN & LEGALITAS HUKUM
          </Text>
          <Text style={styles.articleBody}>
            1. Pihak Pertama menjamin sepenuhnya bahwa kendaraan yang dijual adalah milik sah, terdaftar resmi di Kepolisian Negara Republik Indonesia, bukan hasil tindak pidana, serta bebas dari sengketa, sitaan bank/leasing, atau blokir kriminal. Apabila di kemudian hari terbukti dokumen palsu atau terblokir sebelum tanggal serah terima, Pihak Pertama bertanggung jawab penuh dan bersedia mengembalikan dana pembelian 100% utuh.
          </Text>

          <Text style={styles.articleHeading}>
            PASAL IV: KONDISI KENDARAAN & PRINSIP PEMERIKSAAN BERSAMA
          </Text>
          <Text style={styles.articleBody}>
            2. Pihak Kedua menyatakan telah memeriksa kondisi fisik, nomor rangka, nomor mesin, fungsi kelistrikan, serta telah melakukan uji jalan (test drive) kendaraan tersebut. Transaksi ini berlaku atas asas kesepakatan bersama (&quot;As Is Where Is&quot;). Segala keausan wajar komponen setelah serah terima menjadi tanggung jawab Pihak Kedua.
          </Text>

          <Text style={styles.articleHeading}>
            PASAL V: KETENTUAN TEMPO PELUNASAN & KETENTUAN SANKSI
          </Text>
          <Text style={styles.articleBody}>
            3. Khusus pembelian dengan sistem tempo / konsinyasi showroom rekanan (pelunasan berjangka hingga 14 hari kerja), Pihak Kedua wajib menyelesaikan pelunasan sesuai tanggal jatuh tempo yang telah disepakati. Apabila Pihak Kedua lalai (wanprestasi) melewati batas waktu tanpa kesepakatan tertulis baru, Pihak Pertama memiliki hak mutlak untuk menarik kembali unit kendaraan dan uang muka yang disetorkan dapat dipotong biaya operasional.
          </Text>

          <Text style={styles.articleHeading}>
            PASAL VI: PENGALIHAN RESIKO & PELANGGARAN LALU LINTAS (ETLE)
          </Text>
          <Text style={styles.articleBody}>
            4. Sejak Surat Perjanjian ini ditandatangani dan kendaraan diserahterimakan, segala resiko kecelakaan, kehilangan, denda tilang elektronik (ETLE), serta tuntutan hukum dari pihak ketiga sepenuhnya beralih menjadi tanggung jawab Pihak Kedua.
          </Text>
        </View>

        {/* ── TANDA TANGAN BERSAMA ─────────────────────────────────── */}
        <View style={styles.signatures}>
          <View style={styles.sigBox}>
            <Text style={styles.sigRole}>PIHAK KEDUA (PEMBELI),</Text>
            <View style={styles.sigSpace} />
            <View style={styles.sigLine} />
            <Text style={styles.sigName}>{buyer.name}</Text>
            <Text style={styles.sigRole}>Tanda Tangan & Nama Terang</Text>
          </View>

          <View style={styles.sigBox}>
            <Text style={styles.sigRole}>SAKSI SHOWROOM,</Text>
            <View style={styles.sigSpace} />
            <View style={styles.sigLine} />
            <Text style={styles.sigName}>Staff Operasional Nur Mobil</Text>
            <Text style={styles.sigRole}>Saksi Serah Terima</Text>
          </View>

          <View style={styles.sigBox}>
            <Text style={styles.sigRole}>PIHAK PERTAMA (PENJUAL),</Text>
            <View style={styles.materaiBox}>
              <Text style={styles.materaiText}>METERAI</Text>
              <Text style={styles.materaiText}>TEMPEL</Text>
              <Text style={styles.materaiSubText}>Rp 10.000</Text>
            </View>
            <View style={styles.sigLine} />
            <Text style={styles.sigName}>NUR MOBIL (Toko Bu Nur)</Text>
            <Text style={styles.sigRole}>Cap Resmi & Tanda Tangan Mengena Meterai</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
