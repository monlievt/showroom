import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { 
  PANEL_LABELS, 
  CONDITION_LABELS, 
  getPaintMicronCategory, 
  getBrandPaintStandard,
  calculateOverallVehiclePaint,
  calculateMultiPointAnalysis
} from "@/lib/calculations/inspection";

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#1C1917",
    backgroundColor: "#FFFFFF",
  },
  headerContainer: {
    borderBottom: "2px solid #D97706",
    paddingBottom: 10,
    marginBottom: 12,
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
    fontSize: 8,
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
    fontSize: 8,
    color: "#6B6560",
    textAlign: "right",
    marginTop: 2,
  },
  unitCard: {
    backgroundColor: "#F7F5F2",
    borderRadius: 4,
    padding: 8,
    marginBottom: 10,
    border: "1px solid #D9D4CB",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  col3: {
    width: "33.3%",
    marginBottom: 4,
  },
  col2: {
    width: "50%",
    marginBottom: 4,
  },
  label: {
    fontSize: 7,
    color: "#6B6560",
    textTransform: "uppercase",
  },
  value: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#1C1917",
    marginTop: 1,
  },
  gradeSection: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  gradeBox: {
    flex: 1,
    border: "1px solid #D9D4CB",
    borderRadius: 4,
    padding: 6,
    textAlign: "center",
    backgroundColor: "#F7F5F2",
  },
  gradeLetter: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#D97706",
    marginTop: 2,
  },
  statusRibbon: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  ribbonItem: {
    flex: 1,
    padding: 6,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  ribbonSuccess: {
    backgroundColor: "#DCFCE7",
    border: "1px solid #16A34A",
    color: "#16A34A",
  },
  ribbonDanger: {
    backgroundColor: "#FEE2E2",
    border: "1px solid #DC2626",
    color: "#DC2626",
  },
  ribbonText: {
    fontSize: 8,
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#1C1917",
    marginBottom: 4,
    marginTop: 4,
    textTransform: "uppercase",
    borderBottom: "1px solid #D9D4CB",
    paddingBottom: 2,
  },
  table: {
    width: "100%",
    border: "1px solid #D9D4CB",
    borderRadius: 4,
    marginBottom: 10,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #EFECE8",
    paddingVertical: 3.5,
    paddingHorizontal: 6,
    alignItems: "center",
  },
  tableHeader: {
    backgroundColor: "#EFECE8",
    fontWeight: "bold",
    fontSize: 7.5,
    color: "#6B6560",
    borderBottom: "1px solid #D9D4CB",
  },
  colPanel: { width: "24%" },
  colPoint: { width: "10%", textAlign: "center" },
  colAvg: { width: "12%", textAlign: "center" },
  colDelta: { width: "10%", textAlign: "center" },
  colCategory: { width: "24%" },
  badgeOk: { color: "#16A34A", fontWeight: "bold" },
  badgeWarn: { color: "#CA8A04", fontWeight: "bold" },
  badgeDanger: { color: "#DC2626", fontWeight: "bold" },
  badgeBelang: { color: "#D97706", fontWeight: "bold" },
  paintSummaryCard: {
    backgroundColor: "#FAF9F6",
    border: "1px solid #D9D4CB",
    borderRadius: 4,
    padding: 6,
    marginBottom: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paintSummaryTitle: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#6B6560",
    textTransform: "uppercase",
  },
  paintSummaryValue: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#1C1917",
  },
  notesBox: {
    backgroundColor: "#F7F5F2",
    borderRadius: 4,
    padding: 6,
    border: "1px solid #D9D4CB",
    marginBottom: 8,
  },
  notesTitle: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#6B6560",
    marginBottom: 2,
  },
  notesText: {
    fontSize: 8,
    color: "#1C1917",
    lineHeight: 1.3,
  },
  footer: {
    borderTop: "1px solid #D9D4CB",
    paddingTop: 8,
    marginTop: "auto",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  disclaimer: {
    fontSize: 6.5,
    color: "#6B6560",
    width: "65%",
    lineHeight: 1.3,
  },
  signatureBox: {
    width: "30%",
    textAlign: "center",
  },
  sigLine: {
    borderBottom: "1px solid #1C1917",
    marginTop: 24,
    marginBottom: 3,
  },
});

interface InspectionPdfProps {
  inspection: any;
  vehicle: any;
}

export function InspectionPdfDocument({ inspection, vehicle }: InspectionPdfProps) {
  const inspDate = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(inspection.inspectedAt));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ── HEADER ──────────────────────────────────────────────── */}
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.logoText}>NUR MOBIL</Text>
            <Text style={styles.subLogo}>Sistem Transparansi Inspeksi Kendaraan • Toko Bu Nur</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>LEMBAR HASIL INSPEKSI FISIK</Text>
            <Text style={styles.docNumber}>
              Dokumen #{inspection.id.substring(0, 8).toUpperCase()} • Versi {inspection.version} ({inspection.stage})
            </Text>
          </View>
        </View>

        {/* ── UNIT CARD (DETAIL IDENTITAS & SPESIFIKASI) ─────────── */}
        <View style={styles.unitCard}>
          <View style={styles.grid}>
            <View style={styles.col3}>
              <Text style={styles.label}>Plat Nomor</Text>
              <Text style={styles.value}>{vehicle.plateNumber}</Text>
            </View>
            <View style={styles.col3}>
              <Text style={styles.label}>Merk & Tipe</Text>
              <Text style={styles.value}>{vehicle.brand} {vehicle.model}</Text>
            </View>
            <View style={styles.col3}>
              <Text style={styles.label}>Tahun / Odometer</Text>
              <Text style={styles.value}>
                {vehicle.year} • {Number(vehicle.odometer).toLocaleString("id-ID")} km
              </Text>
            </View>
            <View style={styles.col3}>
              <Text style={styles.label}>Transmisi / Kapasitas</Text>
              <Text style={styles.value}>{vehicle.transmission} • {vehicle.engineCapacity} cc</Text>
            </View>
            <View style={styles.col3}>
              <Text style={styles.label}>Bahan Bakar / Penggerak</Text>
              <Text style={styles.value}>{vehicle.fuelType || "BENSIN"} • {vehicle.driveType || "4x2"}</Text>
            </View>
            <View style={styles.col3}>
              <Text style={styles.label}>Warna Kendaraan</Text>
              <Text style={styles.value}>{vehicle.color}</Text>
            </View>
            <View style={styles.col3}>
              <Text style={styles.label}>Nomor Rangka (VIN)</Text>
              <Text style={styles.value}>{vehicle.chassisNumber || "MHKAB1BY5NK031897"}</Text>
            </View>
            <View style={styles.col3}>
              <Text style={styles.label}>Nomor Mesin</Text>
              <Text style={styles.value}>{vehicle.engineNumber || "2GD885717"}</Text>
            </View>
            <View style={styles.col3}>
              <Text style={styles.label}>Tanggal Inspeksi Fisik</Text>
              <Text style={styles.value}>{inspDate}</Text>
            </View>
          </View>
        </View>

        {/* ── GRADE SUMMARY (4 PILAR) ─────────────────────────────── */}
        <View style={styles.gradeSection}>
          <View style={styles.gradeBox}>
            <Text style={styles.label}>Mesin & Penggerak</Text>
            <Text style={styles.gradeLetter}>{inspection.engineGrade}</Text>
          </View>
          <View style={styles.gradeBox}>
            <Text style={styles.label}>Interior & Kelistrikan</Text>
            <Text style={styles.gradeLetter}>{inspection.interiorGrade}</Text>
          </View>
          <View style={styles.gradeBox}>
            <Text style={styles.label}>Bodi & Eksterior</Text>
            <Text style={styles.gradeLetter}>{inspection.exteriorGrade}</Text>
          </View>
          <View style={styles.gradeBox}>
            <Text style={styles.label}>Rangka & Sasis (Laka)</Text>
            <Text style={styles.gradeLetter}>{inspection.frameGrade}</Text>
          </View>
        </View>

        {/* ── STATUS LAKA & BANJIR RIBBON ─────────────────────────── */}
        <View style={styles.statusRibbon}>
          <View style={[styles.ribbonItem, inspection.accidentHistory ? styles.ribbonDanger : styles.ribbonSuccess]}>
            <Text style={styles.ribbonText}>
              {inspection.accidentHistory ? "PERINGATAN: TERDETEKSI BEKAS TABRAKAN" : "TERVERIFIKASI: BEBAS TABRAKAN BERAT"}
            </Text>
          </View>
          <View style={[styles.ribbonItem, inspection.floodHistory ? styles.ribbonDanger : styles.ribbonSuccess]}>
            <Text style={styles.ribbonText}>
              {inspection.floodHistory ? "PERINGATAN: TERDETEKSI BEKAS TERENDAM BANJIR" : "TERVERIFIKASI: BEBAS RENDAMAN BANJIR"}
            </Text>
          </View>
        </View>

        {/* ── 11 PANEL BODY TABLE (STANDAR IBID ACV 3-TITIK) ────────── */}
        {(() => {
          const cal = getBrandPaintStandard(vehicle?.brand);
          const overallStats = inspection.panels
            ? calculateOverallVehiclePaint(inspection.panels, vehicle?.brand)
            : null;

          return (
            <>
              <Text style={styles.sectionTitle}>
                Cek Fisik 11 Panel Logam & Ketebalan Cat (Kalibrasi OEM: {cal.brandGroupName})
              </Text>

              {overallStats && overallStats.totalPoints > 0 && (
                <View style={styles.paintSummaryCard}>
                  <View>
                    <Text style={styles.paintSummaryTitle}>
                      Hasil Rata-rata Keseluruhan (Standar IBID ACV Astra)
                    </Text>
                    <Text style={{ fontSize: 7, color: "#6B6560", marginTop: 1 }}>
                      {overallStats.totalPoints} Titik Sensor Digital • Rentang: {overallStats.minMicron}–{overallStats.maxMicron} µm
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.paintSummaryValue}>
                      {overallStats.overallAverage} µm ({overallStats.overallConditionLabel})
                    </Text>
                    <Text style={{ fontSize: 6.5, color: overallStats.belangPanelsCount === 0 ? "#16A34A" : "#D97706" }}>
                      {overallStats.belangPanelsCount === 0 ? "Presisi Merata (Delta ≤ 30 µm)" : `Terdeteksi ${overallStats.belangPanelsCount} Panel Belang/Spet`}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <Text style={styles.colPanel}>Bagian Panel Bodi</Text>
                  <Text style={styles.colPoint}>Kanan</Text>
                  <Text style={styles.colPoint}>Tengah</Text>
                  <Text style={styles.colPoint}>Kiri</Text>
                  <Text style={styles.colAvg}>Rata-rata</Text>
                  <Text style={styles.colDelta}>Delta</Text>
                  <Text style={styles.colCategory}>Status & Kondisi</Text>
                </View>

                {inspection.panels &&
                  inspection.panels.map((panel: any) => {
                    const points = [panel.pointRight, panel.pointCenter, panel.pointLeft, panel.pointExtra].filter(
                      (val): val is number => typeof val === "number" && !isNaN(val)
                    );
                    const pointStats = points.length > 0 ? calculateMultiPointAnalysis(points, 30) : null;
                    const effectiveMicron = pointStats?.average ?? panel.paintThickness;
                    const category = getPaintMicronCategory(effectiveMicron, vehicle?.brand);

                    return (
                      <View key={panel.id} style={styles.tableRow}>
                        <Text style={styles.colPanel}>{PANEL_LABELS[panel.panelType] || panel.panelType}</Text>
                        <Text style={styles.colPoint}>{panel.pointRight !== null && panel.pointRight !== undefined ? `${panel.pointRight}` : "-"}</Text>
                        <Text style={styles.colPoint}>{panel.pointCenter !== null && panel.pointCenter !== undefined ? `${panel.pointCenter}` : "-"}</Text>
                        <Text style={styles.colPoint}>{panel.pointLeft !== null && panel.pointLeft !== undefined ? `${panel.pointLeft}` : "-"}</Text>
                        <Text style={styles.colAvg}>{effectiveMicron ? `${effectiveMicron} µm` : "-"}</Text>
                        <Text style={styles.colDelta}>
                          {pointStats ? (
                            <Text style={pointStats.isBelang ? styles.badgeBelang : styles.badgeOk}>
                              {pointStats.isBelang ? `Δ${pointStats.delta}!` : `Δ${pointStats.delta}`}
                            </Text>
                          ) : "-"}
                        </Text>
                        <Text style={styles.colCategory}>
                          {category === "ORIGINAL" && (
                            <Text style={styles.badgeOk}>Original </Text>
                          )}
                          {category === "REPAINT" && (
                            <Text style={styles.badgeWarn}>Repaint </Text>
                          )}
                          {category === "THICK_FILLER" && (
                            <Text style={styles.badgeDanger}>Dempul </Text>
                          )}
                          <Text style={{ color: "#6B6560" }}>
                            ({CONDITION_LABELS[panel.condition] || panel.condition})
                          </Text>
                        </Text>
                      </View>
                    );
                  })}
              </View>
            </>
          );
        })()}

        {/* ── NOTES SUMMARY ────────────────────────────────────────── */}
        <View style={styles.grid}>
          {inspection.engineNotes && (
            <View style={[styles.col3, styles.notesBox, { marginRight: 4 }]}>
              <Text style={styles.notesTitle}>Catatan Mesin:</Text>
              <Text style={styles.notesText}>{inspection.engineNotes}</Text>
            </View>
          )}
          {inspection.interiorNotes && (
            <View style={[styles.col3, styles.notesBox, { marginRight: 4 }]}>
              <Text style={styles.notesTitle}>Catatan Interior:</Text>
              <Text style={styles.notesText}>{inspection.interiorNotes}</Text>
            </View>
          )}
          {inspection.exteriorNotes && (
            <View style={[styles.col3, styles.notesBox]}>
              <Text style={styles.notesTitle}>Catatan Eksterior:</Text>
              <Text style={styles.notesText}>{inspection.exteriorNotes}</Text>
            </View>
          )}
        </View>

        {/* ── FOOTER & SIGNATURE ───────────────────────────────────── */}
        <View style={styles.footer}>
          <Text style={styles.disclaimer}>
            Lembar inspeksi ini diterbitkan secara independen oleh tim teknis Nur Mobil berdasarkan pengecekan fisik nyata menggunakan coating thickness gauge digital. Hasil ini disajikan apa adanya demi menjaga transparansi dan kepercayaan penuh konsumen.
          </Text>
          <View style={styles.signatureBox}>
            <Text style={{ fontSize: 7, color: "#6B6560" }}>Inspektur Pemeriksa,</Text>
            <View style={styles.sigLine} />
            <Text style={{ fontSize: 8, fontWeight: "bold" }}>{inspection.inspectedBy}</Text>
            <Text style={{ fontSize: 6.5, color: "#6B6560" }}>Nur Mobil Inspectorate</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
