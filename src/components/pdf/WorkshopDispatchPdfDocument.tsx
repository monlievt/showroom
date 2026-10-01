import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatRupiah, formatDate } from "@/lib/utils";

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontSize: 8,
    fontFamily: "Helvetica",
    color: "#1C1917",
    backgroundColor: "#FFFFFF",
    lineHeight: 1.3,
  },
  header: {
    borderBottom: "2px solid #D97706",
    paddingBottom: 8,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  logoText: {
    fontSize: 18,
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
    fontSize: 11,
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
    fontSize: 7.5,
    color: "#44403C",
    marginBottom: 6,
  },
  twoCol: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 8,
  },
  box: {
    flex: 1,
    backgroundColor: "#F7F5F2",
    border: "1px solid #D9D4CB",
    borderRadius: 4,
    padding: 6,
  },
  boxTitle: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#92400E",
    textTransform: "uppercase",
    marginBottom: 3,
    borderBottom: "1px solid #EFECE8",
    paddingBottom: 2,
  },
  fieldRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  fieldLabel: {
    width: "40%",
    fontSize: 7.5,
    color: "#6B6560",
  },
  fieldVal: {
    width: "60%",
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#1C1917",
  },
  sectionTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#1C1917",
    textTransform: "uppercase",
    backgroundColor: "#EFECE8",
    paddingVertical: 2.5,
    paddingHorizontal: 5,
    borderRadius: 2,
    marginBottom: 4,
    marginTop: 3,
    borderLeft: "3px solid #D97706",
  },
  unitGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    border: "1px solid #D9D4CB",
    borderRadius: 4,
    padding: 5,
    marginBottom: 6,
    backgroundColor: "#FAFAF9",
  },
  col3: {
    width: "33.33%",
    marginBottom: 3,
  },
  col2: {
    width: "50%",
    marginBottom: 3,
  },
  table: {
    border: "1px solid #D9D4CB",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 6,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#EFECE8",
    borderBottom: "1px solid #D9D4CB",
    paddingVertical: 3,
    paddingHorizontal: 4,
    fontWeight: "bold",
    fontSize: 7.5,
    color: "#44403C",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #EFECE8",
    paddingVertical: 3,
    paddingHorizontal: 4,
    alignItems: "center",
  },
  clauseBox: {
    backgroundColor: "#FEF3C7",
    border: "1px solid #D97706",
    borderRadius: 4,
    padding: 6,
    marginBottom: 8,
  },
  clauseTitle: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#92400E",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  clauseText: {
    fontSize: 6.8,
    color: "#78350F",
    lineHeight: 1.25,
  },
  signatureContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  sigBox: {
    width: "31%",
    border: "1px solid #D9D4CB",
    borderRadius: 4,
    padding: 5,
    textAlign: "center",
    backgroundColor: "#FAFAF9",
  },
  sigTitle: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#44403C",
    marginBottom: 32,
  },
  sigName: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#1C1917",
    borderTop: "1px solid #A8A29E",
    paddingTop: 3,
  },
  sigRole: {
    fontSize: 6.5,
    color: "#6B6560",
    marginTop: 1,
  },
  fuelBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  fuelLevelItem: {
    paddingVertical: 1,
    paddingHorizontal: 4,
    border: "1px solid #D9D4CB",
    borderRadius: 2,
    fontSize: 6.5,
    color: "#44403C",
  },
});

export interface WorkshopDispatchData {
  dispatchNumber: string;
  dispatchDate: string | Date;
  workshopName: string;
  workshopAddress?: string | null;
  workshopPhone?: string | null;
  targetDays?: number | null;
  estimatedCost?: number | null;
  driverName?: string | null;
  vehicle: {
    plateNumber: string;
    brand: string;
    model: string;
    year: number;
    color: string;
    odometer: number;
    transmission: string;
    chassisNumber?: string | null;
    engineNumber?: string | null;
    fuelType?: string | null;
  };
  expenses?: Array<{
    category: string;
    description: string;
    amount: number;
  }>;
  customScopeNotes?: string | null;
}

export function WorkshopDispatchPdfDocument({ data }: { data: WorkshopDispatchData }) {
  const { vehicle } = data;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logoText}>NUR MOBIL</Text>
            <Text style={styles.subLogo}>Spesialis Mobil Bekas Berkualitas & Bergaransi</Text>
            <Text style={styles.subLogo}>Jl. Raya Showroom Otomotif No. 88 | Telp: 0812-3456-7890</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>SURAT JALAN & PERINTAH KERJA BENGKEL</Text>
            <Text style={styles.docNumber}>No. SPK: {data.dispatchNumber}</Text>
            <Text style={styles.docNumber}>Tanggal Kirim: {formatDate(data.dispatchDate)}</Text>
          </View>
        </View>

        <Text style={styles.introText}>
          Surat jalan ini merupakan bukti resmi pengiriman unit kendaraan dari pihak Showroom Nur Mobil kepada pihak Bengkel Rekanan
          untuk keperluan rekondisi, perbaikan bodi/cat, detailing salon, atau servis mekanis dengan rincian sebagai berikut:
        </Text>

        {/* ── IDENTITAS BENGKEL & STATUS KELUAR ── */}
        <View style={styles.twoCol}>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>Pihak Bengkel Penerima</Text>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Nama Bengkel:</Text>
              <Text style={styles.fieldVal}>{data.workshopName || "Bengkel Rekanan Rekondisi"}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Alamat / Area:</Text>
              <Text style={styles.fieldVal}>{data.workshopAddress || "Workshop / Body Repair Rekanan"}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Kontak / Telp:</Text>
              <Text style={styles.fieldVal}>{data.workshopPhone || "-"}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Target Selesai (SLA):</Text>
              <Text style={styles.fieldVal}>
                {data.targetDays ? `${data.targetDays} Hari Kerja` : "3 - 5 Hari Kerja"}
              </Text>
            </View>
          </View>

          <View style={styles.box}>
            <Text style={styles.boxTitle}>Status Saat Unit Keluar Garasi</Text>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Kilometer (Odo):</Text>
              <Text style={styles.fieldVal}>{vehicle.odometer.toLocaleString("id-ID")} KM</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Driver Pengantar:</Text>
              <Text style={styles.fieldVal}>{data.driverName || "Kru Operasional Showroom"}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Posisi BBM:</Text>
              <View style={styles.fuelBarContainer}>
                <Text style={styles.fuelLevelItem}>[ ] E</Text>
                <Text style={styles.fuelLevelItem}>[X] 1/4</Text>
                <Text style={styles.fuelLevelItem}>[ ] 1/2</Text>
                <Text style={styles.fuelLevelItem}>[ ] Full</Text>
              </View>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Bahan Bakar:</Text>
              <Text style={styles.fieldVal}>{vehicle.fuelType || "Bensin"}</Text>
            </View>
          </View>
        </View>

        {/* ── IDENTITAS KENDARAAN ── */}
        <Text style={styles.sectionTitle}>1. Identitas Unit Kendaraan</Text>
        <View style={styles.unitGrid}>
          <View style={styles.col3}>
            <Text style={{ fontSize: 7, color: "#6B6560" }}>Nomor Polisi:</Text>
            <Text style={{ fontSize: 9.5, fontWeight: "bold", color: "#1C1917" }}>{vehicle.plateNumber}</Text>
          </View>
          <View style={styles.col3}>
            <Text style={{ fontSize: 7, color: "#6B6560" }}>Merk & Tipe:</Text>
            <Text style={{ fontSize: 8, fontWeight: "bold" }}>{vehicle.brand} {vehicle.model}</Text>
          </View>
          <View style={styles.col3}>
            <Text style={{ fontSize: 7, color: "#6B6560" }}>Tahun / Warna:</Text>
            <Text style={{ fontSize: 8, fontWeight: "bold" }}>{vehicle.year} / {vehicle.color}</Text>
          </View>
          <View style={styles.col3}>
            <Text style={{ fontSize: 7, color: "#6B6560" }}>Transmisi:</Text>
            <Text style={{ fontSize: 8, fontWeight: "bold" }}>{vehicle.transmission}</Text>
          </View>
          <View style={styles.col3}>
            <Text style={{ fontSize: 7, color: "#6B6560" }}>Nomor Rangka (VIN):</Text>
            <Text style={{ fontSize: 7.5, fontWeight: "bold" }}>{vehicle.chassisNumber || "Sesuai Fisik Unit"}</Text>
          </View>
          <View style={styles.col3}>
            <Text style={{ fontSize: 7, color: "#6B6560" }}>Nomor Mesin:</Text>
            <Text style={{ fontSize: 7.5, fontWeight: "bold" }}>{vehicle.engineNumber || "Sesuai Fisik Unit"}</Text>
          </View>
        </View>

        {/* ── CEKLIST KELENGKAPAN FISIK / ANTI-KANIBALISASI ── */}
        <Text style={styles.sectionTitle}>2. Ceklist Inventaris Fisik (Pencegahan Kanibalisasi)</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={{ width: "8%" }}>Status</Text>
            <Text style={{ width: "42%" }}>Item Inventaris Bawaan</Text>
            <Text style={{ width: "8%" }}>Status</Text>
            <Text style={{ width: "42%" }}>Item Inventaris Bawaan</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={{ width: "8%", fontWeight: "bold", color: "#16A34A" }}>[ OK ]</Text>
            <Text style={{ width: "42%" }}>Ban Cadangan / Serep</Text>
            <Text style={{ width: "8%", fontWeight: "bold", color: "#16A34A" }}>[ OK ]</Text>
            <Text style={{ width: "42%" }}>Karpet Bawaan Kabin (Set)</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={{ width: "8%", fontWeight: "bold", color: "#16A34A" }}>[ OK ]</Text>
            <Text style={{ width: "42%" }}>Dongkrak & Tuas Stang Asli</Text>
            <Text style={{ width: "8%", fontWeight: "bold", color: "#16A34A" }}>[ OK ]</Text>
            <Text style={{ width: "42%" }}>Head Unit / Audio & Speaker</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={{ width: "8%", fontWeight: "bold", color: "#16A34A" }}>[ OK ]</Text>
            <Text style={{ width: "42%" }}>Kunci Roda & Toolkit Kit</Text>
            <Text style={{ width: "8%", fontWeight: "bold", color: "#16A34A" }}>[ OK ]</Text>
            <Text style={{ width: "42%" }}>Aki Kendaraan (Kondisi Aktif/Tersegel)</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={{ width: "8%", fontWeight: "bold", color: "#16A34A" }}>[ OK ]</Text>
            <Text style={{ width: "42%" }}>Kunci Kontak & Remot Alarm</Text>
            <Text style={{ width: "8%", fontWeight: "bold", color: "#16A34A" }}>[ OK ]</Text>
            <Text style={{ width: "42%" }}>Kaca Spion & Antena Luar</Text>
          </View>
        </View>

        {/* ── SCOPE OF WORK / PERINTAH KERJA ── */}
        <Text style={styles.sectionTitle}>3. Lingkup Pekerjaan yang Diinstruksikan (Scope of Work)</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={{ width: "8%" }}>No</Text>
            <Text style={{ width: "25%" }}>Kategori Perbaikan</Text>
            <Text style={{ width: "47%" }}>Rincian Pekerjaan / Area Pengerjaan</Text>
            <Text style={{ width: "20%", textAlign: "right" }}>Estimasi Biaya</Text>
          </View>
          {data.expenses && data.expenses.length > 0 ? (
            data.expenses.map((exp, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={{ width: "8%" }}>{idx + 1}</Text>
                <Text style={{ width: "25%", fontWeight: "bold" }}>{exp.category}</Text>
                <Text style={{ width: "47%" }}>{exp.description}</Text>
                <Text style={{ width: "20%", textAlign: "right", fontWeight: "bold" }}>
                  {formatRupiah(exp.amount)}
                </Text>
              </View>
            ))
          ) : (
            <>
              <View style={styles.tableRow}>
                <Text style={{ width: "8%" }}>1</Text>
                <Text style={{ width: "25%", fontWeight: "bold" }}>Cat & Bodi (Body Repair)</Text>
                <Text style={{ width: "47%" }}>Sol / Repaint baret bumper depan & poles bodi halus</Text>
                <Text style={{ width: "20%", textAlign: "right" }}>Sesuai Kesepakatan</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={{ width: "8%" }}>2</Text>
                <Text style={{ width: "25%", fontWeight: "bold" }}>Salon & Detailing</Text>
                <Text style={{ width: "47%" }}>Pembersihan ruang mesin, cuci kolong, dan uap interior</Text>
                <Text style={{ width: "20%", textAlign: "right" }}>Sesuai Kesepakatan</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={{ width: "8%" }}>3</Text>
                <Text style={{ width: "25%", fontWeight: "bold" }}>Mekanis & Servis</Text>
                <Text style={{ width: "47%" }}>Pengecekan oli, minyak rem, filter, dan kelistrikan</Text>
                <Text style={{ width: "20%", textAlign: "right" }}>Sesuai Kesepakatan</Text>
              </View>
            </>
          )}
        </View>

        {/* ── KETENTUAN HUKUM & OPERASIONAL BENGKEL ── */}
        <View style={styles.clauseBox}>
          <Text style={styles.clauseTitle}>Ketentuan Baku Showroom Nur Mobil:</Text>
          <Text style={styles.clauseText}>
            1. <Text style={{ fontWeight: "bold" }}>Larangan Penggunaan Liar (Anti-Joyriding):</Text> Bengkel dilarang keras mengoperasikan unit di luar keperluan pengujian teknis resmi (*test run* maksimal radius 5 KM dari workshop).
          </Text>
          <Text style={styles.clauseText}>
            2. <Text style={{ fontWeight: "bold" }}>Persetujuan Biaya Tambahan:</Text> Pengerjaan atau penggantian suku cadang di luar SPK ini WAJIB memperoleh persetujuan tertulis pihak Nur Mobil terlebih dahulu. Biaya sepihak tidak akan dibayarkan.
          </Text>
          <Text style={styles.clauseText}>
            3. <Text style={{ fontWeight: "bold" }}>Tanggung Jawab Kehilangan / Kerusakan:</Text> Kerusakan baru, kehilangan part/aksesori, atau insiden selama unit berada dalam penguasaan bengkel rekanan menjadi tanggung jawab penuh pihak bengkel penerima.
          </Text>
        </View>

        {/* ── TANDA TANGAN ── */}
        <View style={styles.signatureContainer}>
          <View style={styles.sigBox}>
            <Text style={styles.sigTitle}>Diserahkan Oleh (Driver),</Text>
            <Text style={styles.sigName}>{data.driverName || "Driver / Operasional"}</Text>
            <Text style={styles.sigRole}>Kru Nur Mobil</Text>
          </View>
          <View style={styles.sigBox}>
            <Text style={styles.sigTitle}>Diterima Oleh (Bengkel),</Text>
            <Text style={styles.sigName}>____________________</Text>
            <Text style={styles.sigRole}>Kepala Bengkel / Mandor</Text>
          </View>
          <View style={styles.sigBox}>
            <Text style={styles.sigTitle}>Disetujui Oleh,</Text>
            <Text style={styles.sigName}>Manajemen Nur Mobil</Text>
            <Text style={styles.sigRole}>Kepala Operasional Showroom</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
