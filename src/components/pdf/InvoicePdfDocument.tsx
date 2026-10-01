import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatRupiah } from "@/lib/utils";
import { terbilangRupiah } from "@/lib/calculations/sale";

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#1C1917",
    backgroundColor: "#FFFFFF",
  },
  header: {
    borderBottom: "2px solid #D97706",
    paddingBottom: 12,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  logoText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#D97706",
    letterSpacing: -0.5,
  },
  subLogo: {
    fontSize: 8.5,
    color: "#6B6560",
    marginTop: 2,
  },
  docTitle: {
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "right",
    color: "#1C1917",
  },
  docNumber: {
    fontSize: 8.5,
    color: "#6B6560",
    textAlign: "right",
    marginTop: 2,
  },
  twoCol: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 14,
  },
  infoBox: {
    flex: 1,
    backgroundColor: "#F7F5F2",
    border: "1px solid #D9D4CB",
    borderRadius: 4,
    padding: 8,
  },
  infoTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#6B6560",
    textTransform: "uppercase",
    marginBottom: 4,
    borderBottom: "1px solid #EFECE8",
    paddingBottom: 2,
  },
  infoText: {
    fontSize: 8.5,
    color: "#1C1917",
    marginBottom: 2,
  },
  unitBox: {
    backgroundColor: "#EFECE8",
    border: "1px solid #D9D4CB",
    borderRadius: 4,
    padding: 8,
    marginBottom: 14,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  col4: {
    width: "25%",
    marginBottom: 2,
  },
  label: {
    fontSize: 7,
    color: "#6B6560",
    textTransform: "uppercase",
  },
  value: {
    fontSize: 8.5,
    fontWeight: "bold",
    color: "#1C1917",
    marginTop: 1,
  },
  table: {
    width: "100%",
    border: "1px solid #D9D4CB",
    borderRadius: 4,
    marginBottom: 12,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #EFECE8",
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  tableHeader: {
    backgroundColor: "#EFECE8",
    fontWeight: "bold",
    fontSize: 8,
    color: "#6B6560",
    borderBottom: "1px solid #D9D4CB",
  },
  colNo: { width: "8%" },
  colDate: { width: "22%" },
  colMethod: { width: "25%" },
  colNotes: { width: "25%" },
  colAmount: { width: "20%", textAlign: "right" },
  totalSection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 12,
  },
  totalBox: {
    width: "50%",
    border: "1px solid #D9D4CB",
    borderRadius: 4,
    backgroundColor: "#F7F5F2",
    padding: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  terbilangBox: {
    backgroundColor: "#FEF3C7",
    border: "1px solid #D97706",
    borderRadius: 4,
    padding: 8,
    marginBottom: 16,
  },
  terbilangLabel: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#92400E",
    textTransform: "uppercase",
  },
  terbilangText: {
    fontSize: 9,
    fontStyle: "italic",
    fontWeight: "bold",
    color: "#92400E",
    marginTop: 2,
  },
  signatures: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: "auto",
    paddingTop: 10,
    borderTop: "1px solid #D9D4CB",
  },
  sigBox: {
    width: "35%",
    textAlign: "center",
    alignItems: "center",
  },
  sigSpace: {
    height: 48,
  },
  sigLine: {
    borderBottom: "1px solid #1C1917",
    marginBottom: 2,
    width: "100%",
  },
  sigName: {
    fontSize: 8.5,
    fontWeight: "bold",
  },
  sigRole: {
    fontSize: 7,
    color: "#6B6560",
  },
  materaiBox: {
    width: 65,
    height: 42,
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
    fontSize: 6,
    color: "#4B5563",
    fontWeight: "bold",
    textAlign: "center",
  },
  materaiSubText: {
    fontSize: 5,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 1,
  },
});

interface InvoicePdfProps {
  sale: any;
  vehicle: any;
  buyer: any;
  payments: any[];
}

export function InvoicePdfDocument({
  sale,
  vehicle,
  buyer,
  payments,
}: InvoicePdfProps) {
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
            <Text style={styles.subLogo}>Toko Bu Nur • Showroom Jual-Beli Mobil Berkualitas & Amanah</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>
              {isSettled ? "KUITANSI PELUNASAN RESMI" : "KUITANSI PEMBAYARAN & PIUTANG"}
            </Text>
            <Text style={styles.docNumber}>
              No. KWT #{sale.id.substring(0, 8).toUpperCase()} • {saleDateFormatted}
            </Text>
          </View>
        </View>

        {/* ── PIHAK TERKAIT ───────────────────────────────────────── */}
        <View style={styles.twoCol}>
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Penerima Pembayaran (Penjual):</Text>
            <Text style={[styles.infoText, { fontWeight: "bold" }]}>NUR MOBIL (Toko Bu Nur)</Text>
            <Text style={styles.infoText}>Garasi Utama Showroom Mobil Bekas</Text>
            <Text style={styles.infoText}>Telepon / WhatsApp: 0812-3456-7890</Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Telah Terima Dari (Pembeli):</Text>
            <Text style={[styles.infoText, { fontWeight: "bold" }]}>{buyer.name}</Text>
            <Text style={styles.infoText}>
              Status: {buyer.isShowroom ? "Showroom Rekanan (Wholesale)" : "Konsumen Langsung (Retail)"}
            </Text>
            <Text style={styles.infoText}>No. Telp / WA: {buyer.phone || "-"}</Text>
            {buyer.address && <Text style={styles.infoText}>Alamat: {buyer.address}</Text>}
          </View>
        </View>

        {/* ── DETAIL UNIT KENDARAAN ────────────────────────────────── */}
        <View style={styles.unitBox}>
          <View style={styles.grid}>
            <View style={styles.col4}>
              <Text style={styles.label}>Nomor Plat</Text>
              <Text style={styles.value}>{vehicle.plateNumber}</Text>
            </View>
            <View style={styles.col4}>
              <Text style={styles.label}>Merk & Tipe</Text>
              <Text style={styles.value}>{vehicle.brand} {vehicle.model}</Text>
            </View>
            <View style={styles.col4}>
              <Text style={styles.label}>Tahun / Warna</Text>
              <Text style={styles.value}>{vehicle.year} • {vehicle.color}</Text>
            </View>
            <View style={styles.col4}>
              <Text style={styles.label}>Jalur Penjualan</Text>
              <Text style={styles.value}>{sale.saleType}</Text>
            </View>
          </View>
        </View>

        {/* ── TABEL MUTASI PEMBAYARAN ──────────────────────────────── */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.colNo}>No</Text>
            <Text style={styles.colDate}>Tanggal Bayar</Text>
            <Text style={styles.colMethod}>Metode Bayar</Text>
            <Text style={styles.colNotes}>Keterangan</Text>
            <Text style={styles.colAmount}>Nominal (Rp)</Text>
          </View>

          {payments.map((p, index) => {
            const pDate = new Intl.DateTimeFormat("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }).format(new Date(p.paidAt));

            return (
              <View key={p.id || index} style={styles.tableRow}>
                <Text style={styles.colNo}>{index + 1}</Text>
                <Text style={styles.colDate}>{pDate}</Text>
                <Text style={styles.colMethod}>
                  {p.method === "TRADE_IN" 
                    ? `Tukar Tambah (${p.tradeInVehicle ? p.tradeInVehicle.plateNumber : "Unit Mobil"})` 
                    : p.method}
                </Text>
                <Text style={styles.colNotes}>{p.notes || "-"}</Text>
                <Text style={styles.colAmount}>{formatRupiah(Number(p.amount))}</Text>
              </View>
            );
          })}
        </View>

        {/* ── TOTAL & SISA PIUTANG ─────────────────────────────────── */}
        <View style={styles.totalSection}>
          <View style={styles.totalBox}>
            <View style={styles.totalRow}>
              <Text style={{ fontSize: 8, color: "#6B6560" }}>Total Harga Kesepakatan:</Text>
              <Text style={{ fontSize: 8.5, fontWeight: "bold" }}>{formatRupiah(Number(sale.sellingPrice))}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={{ fontSize: 8, color: "#16A34A" }}>Total Terbayar Masuk:</Text>
              <Text style={{ fontSize: 8.5, fontWeight: "bold", color: "#16A34A" }}>{formatRupiah(totalPaid)}</Text>
            </View>
            <View style={[styles.totalRow, { borderTop: "1px solid #D9D4CB", paddingTop: 4, marginTop: 2 }]}>
              <Text style={{ fontSize: 8.5, fontWeight: "bold", color: isSettled ? "#16A34A" : "#DC2626" }}>
                {isSettled ? "STATUS: LUNAS 100%" : "Sisa Piutang (Kurang Bayar):"}
              </Text>
              <Text style={{ fontSize: 9.5, fontWeight: "bold", color: isSettled ? "#16A34A" : "#DC2626" }}>
                {isSettled ? "LUNAS" : formatRupiah(remaining)}
              </Text>
            </View>
            {!isSettled && sale.dueDate && (
              <View style={[styles.totalRow, { marginTop: 2 }]}>
                <Text style={{ fontSize: 7.5, color: "#6B6560" }}>Jatuh Tempo Pelunasan:</Text>
                <Text style={{ fontSize: 7.5, fontWeight: "bold", color: "#DC2626" }}>
                  {new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(sale.dueDate))}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── TERBILANG BOX ────────────────────────────────────────── */}
        <View style={styles.terbilangBox}>
          <Text style={styles.terbilangLabel}>Terbilang Total Pembayaran Diterima:</Text>
          <Text style={styles.terbilangText}># {terbilangRupiah(totalPaid)} #</Text>
        </View>

        {/* ── TANDA TANGAN ─────────────────────────────────────────── */}
        <View style={styles.signatures}>
          <View style={styles.sigBox}>
            <Text style={styles.sigRole}>Pihak Pembeli / Penerima Kendaraan,</Text>
            <View style={styles.sigSpace} />
            <View style={styles.sigLine} />
            <Text style={styles.sigName}>{buyer.name}</Text>
            <Text style={styles.sigRole}>Tanda Tangan & Nama Terang</Text>
          </View>

          <View style={styles.sigBox}>
            <Text style={styles.sigRole}>Kasir / Pengelola Showroom Nur Mobil,</Text>
            <View style={styles.materaiBox}>
              <Text style={styles.materaiText}>METERAI</Text>
              <Text style={styles.materaiText}>TEMPEL</Text>
              <Text style={styles.materaiSubText}>Rp 10.000</Text>
            </View>
            <View style={styles.sigLine} />
            <Text style={styles.sigName}>Toko Bu Nur (Management)</Text>
            <Text style={styles.sigRole}>Tanda Tangan & Cap Sah</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
