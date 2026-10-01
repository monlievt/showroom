import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

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
  checklistTable: {
    border: "1px solid #D9D4CB",
    borderRadius: 4,
    marginBottom: 8,
    overflow: "hidden",
  },
  checkRow: {
    flexDirection: "row",
    borderBottom: "1px solid #EFECE8",
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  checkHeader: {
    backgroundColor: "#EFECE8",
    fontWeight: "bold",
    fontSize: 7.5,
    color: "#6B6560",
    borderBottom: "1px solid #D9D4CB",
  },
  colItem: { width: "40%" },
  colStatus: { width: "20%", textAlign: "center" },
  colNotes: { width: "40%" },
  signatures: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 8,
    borderTop: "1px solid #D9D4CB",
  },
  sigBox: {
    width: "40%",
    textAlign: "center",
    alignItems: "center",
  },
  sigRole: {
    fontSize: 7.5,
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
  sigSpace: {
    height: 48,
  },
});

interface BastPdfProps {
  sale: any;
  vehicle: any;
  buyer: any;
}

export function BastPdfDocument({ sale, vehicle, buyer }: BastPdfProps) {
  const dateFormatted = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logoText}>NUR MOBIL</Text>
            <Text style={styles.subLogo}>
              Toko Bu Nur • Garasi Showroom Jual-Beli Mobil Berkualitas
            </Text>
          </View>
          <View>
            <Text style={styles.docTitle}>BERITA ACARA SERAH TERIMA (BAST)</Text>
            <Text style={styles.docNumber}>
              No. BAST: #{sale.id.substring(0, 8).toUpperCase()} / BAST /{" "}
              {new Date().getFullYear()} • {dateFormatted}
            </Text>
          </View>
        </View>

        <Text style={styles.introText}>
          Pada hari ini, tanggal {dateFormatted}, telah dilakukan pemeriksaan fisik dan penyerahan unit kendaraan bermotor beserta seluruh kelengkapannya antara:
        </Text>

        {/* Pihak Terkait */}
        <View style={styles.twoCol}>
          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>PIHAK YANG MENYERAHKAN (PENJUAL):</Text>
            <Text style={[styles.partyText, { fontWeight: "bold" }]}>
              NUR MOBIL (Toko Bu Nur)
            </Text>
            <Text style={styles.partyText}>Kuasa Operasional Showroom</Text>
            <Text style={styles.partyText}>Telepon / WhatsApp: 0812-3456-7890</Text>
          </View>

          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>PIHAK YANG MENERIMA (PEMBELI):</Text>
            <Text style={[styles.partyText, { fontWeight: "bold" }]}>
              {buyer.name}
            </Text>
            <Text style={styles.partyText}>
              Status: {buyer.isShowroom ? "Showroom Rekanan (Konsinyasi/Tempo)" : "Konsumen Langsung"}
            </Text>
            <Text style={styles.partyText}>No. Telepon / WA: {buyer.phone || "-"}</Text>
          </View>
        </View>

        {/* Data Mobil */}
        <Text style={styles.sectionTitle}>I. IDENTITAS KENDARAAN DISERAHTERIMAKAN</Text>
        <View style={styles.unitGrid}>
          <View style={styles.col4}>
            <Text style={styles.label}>Nomor Plat</Text>
            <Text style={styles.value}>{vehicle.plateNumber}</Text>
          </View>
          <View style={styles.col4}>
            <Text style={styles.label}>Merk / Model</Text>
            <Text style={styles.value}>{vehicle.brand} {vehicle.model}</Text>
          </View>
          <View style={styles.col4}>
            <Text style={styles.label}>Tahun / Warna</Text>
            <Text style={styles.value}>{vehicle.year} • {vehicle.color}</Text>
          </View>
          <View style={styles.col4}>
            <Text style={styles.label}>Odometer Serah Terima</Text>
            <Text style={styles.value}>{vehicle.odometer ? `${vehicle.odometer.toLocaleString("id-ID")} KM` : "Sesuai Speedometer"}</Text>
          </View>
        </View>

        {/* Ceklist Kelengkapan */}
        <Text style={styles.sectionTitle}>II. CEKLIST DOKUMEN & KELENGKAPAN FISIK</Text>
        <View style={styles.checklistTable}>
          <View style={[styles.checkRow, styles.checkHeader]}>
            <Text style={styles.colItem}>Nama Dokumen / Item Kelengkapan</Text>
            <Text style={styles.colStatus}>Status Fisik</Text>
            <Text style={styles.colNotes}>Keterangan Tambahan</Text>
          </View>

          <View style={styles.checkRow}>
            <Text style={styles.colItem}>1. STNK Asli & Lembar Pajak</Text>
            <Text style={styles.colStatus}>[ V ] LENGKAP</Text>
            <Text style={styles.colNotes}>Masa berlaku aktif sesuai fisik</Text>
          </View>

          <View style={styles.checkRow}>
            <Text style={styles.colItem}>2. BPKB Asli & Faktur Pembelian</Text>
            <Text style={styles.colStatus}>
              {vehicle.bpkbStatus === "READY" ? "[ V ] LENGKAP" : "[ ! ] DALAM PROSES"}
            </Text>
            <Text style={styles.colNotes}>
              {vehicle.bpkbStatus === "READY"
                ? "Diserahkan bersamaan dengan BAST"
                : `Masih diproses balai lelang (~${vehicle.bpkbLeadDays || 14} hari kerja)`}
            </Text>
          </View>

          <View style={styles.checkRow}>
            <Text style={styles.colItem}>3. Kunci Kontak Utama & Cadangan</Text>
            <Text style={styles.colStatus}>[ V ] LENGKAP</Text>
            <Text style={styles.colNotes}>Kunci kontak + remote alarm berfungsi</Text>
          </View>

          <View style={styles.checkRow}>
            <Text style={styles.colItem}>4. Buku Servis & Buku Manual Pemilik</Text>
            <Text style={styles.colStatus}>[ V ] ADA</Text>
            <Text style={styles.colNotes}>Buku panduan dalam glovebox</Text>
          </View>

          <View style={styles.checkRow}>
            <Text style={styles.colItem}>5. Ban Cadangan, Dongkrak & Kunci Roda</Text>
            <Text style={styles.colStatus}>[ V ] LENGKAP</Text>
            <Text style={styles.colNotes}>Tekanan angin ban serep dicek normal</Text>
          </View>
        </View>

        {/* Pernyataan */}
        <Text style={{ fontSize: 7.5, color: "#44403C", textAlign: "justify", marginTop: 4 }}>
          Dengan ditandatanganinya Berita Acara ini, Pihak Kedua menyatakan telah menerima kendaraan beserta kelengkapannya dalam kondisi baik sesuai kesepakatan. Segala konsekuensi pemakaian dan tilang elektronik (ETLE) sejak serah terima ini sepenuhnya menjadi tanggung jawab Pihak Kedua.
        </Text>

        {/* Tanda Tangan */}
        <View style={styles.signatures}>
          <View style={styles.sigBox}>
            <Text style={styles.sigRole}>Pihak Yang Menerima (Pembeli),</Text>
            <View style={styles.sigSpace} />
            <View style={styles.sigLine} />
            <Text style={styles.sigName}>{buyer.name}</Text>
          </View>

          <View style={styles.sigBox}>
            <Text style={styles.sigRole}>Pihak Yang Menyerahkan (Nur Mobil),</Text>
            <View style={styles.sigSpace} />
            <View style={styles.sigLine} />
            <Text style={styles.sigName}>Toko Bu Nur (Management)</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
