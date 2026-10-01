import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { formatRupiah } from "@/lib/utils";

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontFamily: "Helvetica",
    color: "#1C1917",
    backgroundColor: "#F7F5F2",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: 320,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    border: "2px solid #D9D4CB",
    padding: 16,
    alignItems: "center",
  },
  hangerHole: {
    width: 44,
    height: 44,
    borderRadius: 22,
    border: "2px dashed #92400E",
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  hangerHoleText: {
    fontSize: 6,
    fontWeight: "bold",
    color: "#92400E",
    textAlign: "center",
  },
  brandHeader: {
    alignItems: "center",
    marginBottom: 8,
    borderBottom: "1.5px solid #EFECE8",
    paddingBottom: 6,
    width: "100%",
  },
  showroomName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#D97706",
    letterSpacing: 1,
  },
  showroomTagline: {
    fontSize: 7,
    color: "#6B6560",
    marginTop: 1,
  },
  guaranteeBadge: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 8,
  },
  badgeItem: {
    backgroundColor: "#DCFCE7",
    border: "1px solid #16A34A",
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 6.5,
    fontWeight: "bold",
    color: "#15803D",
  },
  unitTitleBox: {
    backgroundColor: "#1C1917",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  plateNumber: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#F59E0B",
    letterSpacing: 1,
  },
  unitModel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 2,
    textAlign: "center",
  },
  unitYearColor: {
    fontSize: 8,
    color: "#D6D3D1",
    marginTop: 1,
  },
  specsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
    backgroundColor: "#F7F5F2",
    borderRadius: 6,
    border: "1px solid #D9D4CB",
    padding: 6,
    marginBottom: 10,
  },
  specItem: {
    width: "50%",
    marginBottom: 4,
  },
  specLabel: {
    fontSize: 6.5,
    color: "#6B6560",
  },
  specVal: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#1C1917",
  },
  priceBox: {
    width: "100%",
    backgroundColor: "#FEF3C7",
    border: "1.5px solid #D97706",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  priceLabel: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#92400E",
    textTransform: "uppercase",
  },
  cashPrice: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#92400E",
    marginTop: 2,
  },
  creditHint: {
    fontSize: 7,
    color: "#78350F",
    marginTop: 3,
    textAlign: "center",
  },
  qrContainer: {
    width: "100%",
    border: "1px solid #D9D4CB",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    padding: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  qrImage: {
    width: 90,
    height: 90,
    marginBottom: 4,
  },
  qrPrompt: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#1C1917",
  },
  qrSubtext: {
    fontSize: 6,
    color: "#6B6560",
    textAlign: "center",
    marginTop: 1,
    maxWidth: 220,
  },
  footer: {
    width: "100%",
    borderTop: "1px solid #EFECE8",
    paddingTop: 6,
    alignItems: "center",
  },
  footerHotline: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#1C1917",
  },
  footerSub: {
    fontSize: 6,
    color: "#78716C",
    marginTop: 1,
  },
});

export interface SpecTagData {
  vehicle: {
    plateNumber: string;
    brand: string;
    model: string;
    year: number;
    color: string;
    odometer: number;
    transmission: string;
    fuelType?: string | null;
    engineCapacity: number;
    targetSellingPrice?: number | null;
  };
  qrDataUrl: string;
  catalogUrl: string;
  showroomName?: string;
  phoneHotline?: string;
}

export function SpecTagPdfDocument({ data }: { data: SpecTagData }) {
  const { vehicle, qrDataUrl } = data;
  const cashPrice = vehicle.targetSellingPrice ? Number(vehicle.targetSellingPrice) : 0;
  
  // Estimasi paket kredit representatif (DP ~15% & Cicilan ~3-4 thn)
  const estDp = cashPrice > 0 ? Math.round((cashPrice * 0.15) / 1000000) * 1000000 : 0;
  const estInstallment = cashPrice > 0 ? Math.round(((cashPrice - estDp) * 1.25 / 48) / 100000) * 100000 : 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.card}>
          {/* ── LUBANG GANTUNGAN SPION TENGAH ── */}
          <View style={styles.hangerHole}>
            <Text style={styles.hangerHoleText}>LUBANG</Text>
            <Text style={styles.hangerHoleText}>SPION</Text>
          </View>

          {/* ── SHOWROOM HEADER ── */}
          <View style={styles.brandHeader}>
            <Text style={styles.showroomName}>{data.showroomName || "NUR MOBIL"}</Text>
            <Text style={styles.showroomTagline}>Pilihan Terbaik Mobil Bekas Berkualitas & Terpercaya</Text>
          </View>

          {/* ── BADGE GARANSI ── */}
          <View style={styles.guaranteeBadge}>
            <View style={styles.badgeItem}>
              <Text style={styles.badgeText}>✓ BEBAS TABRAK BESAR</Text>
            </View>
            <View style={styles.badgeItem}>
              <Text style={styles.badgeText}>✓ BEBAS BANJIR 100%</Text>
            </View>
            <View style={styles.badgeItem}>
              <Text style={styles.badgeText}>✓ DOKUMEN SAH & LENGKAP</Text>
            </View>
          </View>

          {/* ── KOTAK JUDUL MOBIL ── */}
          <View style={styles.unitTitleBox}>
            <Text style={styles.plateNumber}>{vehicle.plateNumber}</Text>
            <Text style={styles.unitModel}>{vehicle.brand} {vehicle.model}</Text>
            <Text style={styles.unitYearColor}>Tahun {vehicle.year} • Warna {vehicle.color}</Text>
          </View>

          {/* ── SPESIFIKASI SINGKAT ── */}
          <View style={styles.specsGrid}>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Transmisi:</Text>
              <Text style={styles.specVal}>{vehicle.transmission}</Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Jarak Tempuh:</Text>
              <Text style={styles.specVal}>{vehicle.odometer.toLocaleString("id-ID")} KM</Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Kapasitas Mesin:</Text>
              <Text style={styles.specVal}>{vehicle.engineCapacity.toLocaleString("id-ID")} CC</Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Bahan Bakar:</Text>
              <Text style={styles.specVal}>{vehicle.fuelType || "Bensin"}</Text>
            </View>
          </View>

          {/* ── KOTAK PENAWARAN HARGA ── */}
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>Harga Cash Istimewa</Text>
            <Text style={styles.cashPrice}>
              {cashPrice > 0 ? formatRupiah(cashPrice) : "Hubungi Sales"}
            </Text>
            {cashPrice > 0 && (
              <Text style={styles.creditHint}>
                Paket Kredit: TDP Mulai {formatRupiah(estDp)} • Angsuran ~{formatRupiah(estInstallment)}/bln
              </Text>
            )}
          </View>

          {/* ── QR CODE INTERAKTIF ── */}
          <View style={styles.qrContainer}>
            {qrDataUrl && <Image src={qrDataUrl} style={styles.qrImage} />}
            <Text style={styles.qrPrompt}>SCAN PAKAI KAMERA HP ANDA</Text>
            <Text style={styles.qrSubtext}>
              Lihat galeri foto detail, video walkaround & hasil sertifikat inspeksi lengkap unit ini di website kami.
            </Text>
          </View>

          {/* ── FOOTER SHOWROOM ── */}
          <View style={styles.footer}>
            <Text style={styles.footerHotline}>
              WhatsApp / Telp: {data.phoneHotline || "0812-3456-7890"}
            </Text>
            <Text style={styles.footerSub}>
              Bisa Cash / Kredit / Tukar Tambah Unit Lama Anda
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
