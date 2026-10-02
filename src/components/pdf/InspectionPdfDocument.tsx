import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { 
  PANEL_LABELS, 
  CONDITION_LABELS, 
  getPaintMicronCategory, 
  getBrandPaintStandard,
  calculateOverallVehiclePaint,
  calculateMultiPointAnalysis,
  calculateTotalGrade,
  INSPECTION_LEGAL_DISCLAIMER,
  GRADE_LABELS
} from "@/lib/calculations/inspection";

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 8.5,
    fontFamily: "Helvetica",
    color: "#1C1917",
    backgroundColor: "#FFFFFF",
  },
  headerContainer: {
    borderBottom: "2px solid #D97706",
    paddingBottom: 8,
    marginBottom: 10,
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
  unitCard: {
    backgroundColor: "#F7F5F2",
    borderRadius: 4,
    padding: 7,
    marginBottom: 8,
    border: "1px solid #D9D4CB",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  col3: {
    width: "33.3%",
    marginBottom: 3,
  },
  col4: {
    width: "25%",
    marginBottom: 3,
  },
  label: {
    fontSize: 6.5,
    color: "#6B6560",
    textTransform: "uppercase",
  },
  value: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#1C1917",
    marginTop: 1,
  },
  gradeSection: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
  },
  totalGradeBox: {
    flex: 1.2,
    border: "2px solid #D97706",
    borderRadius: 4,
    padding: 5,
    textAlign: "center",
    backgroundColor: "#FEF3C7",
  },
  gradeBox: {
    flex: 1,
    border: "1px solid #D9D4CB",
    borderRadius: 4,
    padding: 5,
    textAlign: "center",
    backgroundColor: "#F7F5F2",
  },
  totalGradeLetter: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#B45309",
    marginTop: 1,
  },
  gradeLetter: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1C1917",
    marginTop: 1,
  },
  statusRibbon: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
  },
  ribbonItem: {
    flex: 1,
    padding: 5,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  ribbonSuccess: {
    backgroundColor: "#DCFCE7",
    border: "1px solid #86EFAC",
  },
  ribbonDanger: {
    backgroundColor: "#FEE2E2",
    border: "1px solid #FCA5A5",
  },
  ribbonText: {
    fontSize: 7.5,
    fontWeight: "bold",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#1C1917",
    marginBottom: 4,
    marginTop: 4,
  },
  paintSummaryCard: {
    backgroundColor: "#FAF9F6",
    border: "1px solid #EBE7E1",
    borderRadius: 4,
    padding: 5,
    marginBottom: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paintSummaryTitle: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#1C1917",
  },
  paintSummaryValue: {
    fontSize: 8.5,
    fontWeight: "bold",
    color: "#D97706",
  },
  table: {
    border: "1px solid #D9D4CB",
    borderRadius: 3,
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #EFECE8",
    paddingVertical: 3,
    paddingHorizontal: 4,
    alignItems: "center",
  },
  tableHeader: {
    backgroundColor: "#EFECE8",
    borderBottom: "1px solid #D9D4CB",
    fontWeight: "bold",
  },
  colPanel: {
    width: "28%",
    fontSize: 7.5,
  },
  colPoint: {
    width: "10%",
    textAlign: "center",
    fontSize: 7,
  },
  colAvg: {
    width: "12%",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 7.5,
  },
  colDefect: {
    width: "10%",
    textAlign: "center",
    fontSize: 7.5,
    fontWeight: "bold",
  },
  colCategory: {
    width: "30%",
    textAlign: "right",
    fontSize: 7,
  },
  badgeOk: {
    color: "#16A34A",
    fontWeight: "bold",
  },
  badgeWarn: {
    color: "#D97706",
    fontWeight: "bold",
  },
  badgeDanger: {
    color: "#DC2626",
    fontWeight: "bold",
  },
  notesBox: {
    backgroundColor: "#F7F5F2",
    borderRadius: 3,
    padding: 5,
    marginBottom: 4,
    border: "1px solid #D9D4CB",
  },
  notesTitle: {
    fontSize: 6.5,
    fontWeight: "bold",
    color: "#6B6560",
    marginBottom: 1,
    textTransform: "uppercase",
  },
  notesText: {
    fontSize: 7.5,
    color: "#1C1917",
    lineHeight: 1.25,
  },
  disclaimerBox: {
    backgroundColor: "#FAF9F6",
    border: "1px solid #D9D4CB",
    borderRadius: 4,
    padding: 6,
    marginTop: 6,
  },
  disclaimerTitle: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#B45309",
    marginBottom: 3,
    textTransform: "uppercase",
  },
  disclaimerPoint: {
    fontSize: 6,
    color: "#57534E",
    lineHeight: 1.25,
    marginBottom: 2,
  },
  footer: {
    borderTop: "1px solid #D9D4CB",
    paddingTop: 6,
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  signatureBox: {
    width: "30%",
    textAlign: "center",
  },
  sigLine: {
    borderBottom: "1px solid #1C1917",
    marginTop: 18,
    marginBottom: 2,
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

  const totalGrade =
    inspection.totalGrade ||
    calculateTotalGrade(
      inspection.engineGrade,
      inspection.interiorGrade,
      inspection.exteriorGrade,
      inspection.frameGrade,
      inspection.accidentHistory
    );

  const cal = getBrandPaintStandard(vehicle?.brand);
  const overallStats = inspection.panels
    ? calculateOverallVehiclePaint(inspection.panels, vehicle?.brand)
    : null;

  return (
    <Document>
      {/* ── HALAMAN 1: IDENTITAS, GRADE, UJI MIKRON & CEK FISIK ── */}
      <Page size="A4" style={styles.page}>
        {/* ── HEADER ── */}
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.logoText}>NUR MOBIL</Text>
            <Text style={styles.subLogo}>Sistem Transparansi Inspeksi Kendaraan & Valuasi Fisik • Standar Terbuka</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>LEMBAR HASIL INSPEKSI FISIK</Text>
            <Text style={styles.docNumber}>
              Dokumen #{inspection.id.substring(0, 8).toUpperCase()} • Versi {inspection.version} ({inspection.stage})
            </Text>
          </View>
        </View>

        {/* ── UNIT CARD ── */}
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
              <Text style={styles.value}>{vehicle.chassisNumber || "-"}</Text>
            </View>
            <View style={styles.col3}>
              <Text style={styles.label}>Nomor Mesin</Text>
              <Text style={styles.value}>{vehicle.engineNumber || "-"}</Text>
            </View>
            <View style={styles.col3}>
              <Text style={styles.label}>Tanggal Uji Fisik</Text>
              <Text style={styles.value}>{inspDate}</Text>
            </View>
          </View>
        </View>

        {/* ── GRADE SUMMARY (5 PILAR DENGAN TOTAL GRADE ACV) ── */}
        <View style={styles.gradeSection}>
          <View style={styles.totalGradeBox}>
            <Text style={[styles.label, { color: "#B45309", fontWeight: "bold" }]}>Total Grade ACV</Text>
            <Text style={styles.totalGradeLetter}>{totalGrade}</Text>
          </View>
          <View style={styles.gradeBox}>
            <Text style={styles.label}>Mesin & Mekanikal</Text>
            <Text style={styles.gradeLetter}>{inspection.engineGrade}</Text>
          </View>
          <View style={styles.gradeBox}>
            <Text style={styles.label}>Interior & Kabin</Text>
            <Text style={styles.gradeLetter}>{inspection.interiorGrade}</Text>
          </View>
          <View style={styles.gradeBox}>
            <Text style={styles.label}>Bodi & Eksterior</Text>
            <Text style={styles.gradeLetter}>{inspection.exteriorGrade}</Text>
          </View>
          <View style={styles.gradeBox}>
            <Text style={styles.label}>Rangka & Sasis</Text>
            <Text style={styles.gradeLetter}>{inspection.frameGrade}</Text>
          </View>
        </View>

        {/* ── STATUS LAKA, BANJIR & KELENGKAPAN RIBBON ── */}
        <View style={styles.statusRibbon}>
          <View style={[styles.ribbonItem, inspection.accidentHistory ? styles.ribbonDanger : styles.ribbonSuccess]}>
            <Text style={styles.ribbonText}>
              {inspection.accidentHistory ? "PERINGATAN: TERDETEKSI BEKAS TABRAKAN" : "TERVERIFIKASI: BEBAS TABRAKAN BERAT"}
            </Text>
          </View>
          <View style={[styles.ribbonItem, inspection.floodHistory ? styles.ribbonDanger : styles.ribbonSuccess]}>
            <Text style={styles.ribbonText}>
              {inspection.floodHistory ? "PERINGATAN: TERDETEKSI BEKAS BANJIR" : "TERVERIFIKASI: BEBAS RENDAMAN BANJIR"}
            </Text>
          </View>
          <View style={[styles.ribbonItem, inspection.hasSpareKey && inspection.hasServiceBook ? styles.ribbonSuccess : styles.ribbonDanger]}>
            <Text style={styles.ribbonText}>
              {inspection.hasSpareKey ? "KUNCI SEREP: LENGKAP" : "KUNCI SEREP: 1 BH"} • {inspection.hasServiceBook ? "BUKU SERVIS: ADA" : "BUKU SERVIS: TDK ADA"}
            </Text>
          </View>
        </View>

        {/* ── 15 PANEL TABLE (LOGAM & PLASTIK BUMPER) ── */}
        <Text style={styles.sectionTitle}>
          Pemeriksaan 15 Panel Bodi (13 Panel Logam & 2 Bumper Plastik) • Kalibrasi OEM: {cal.brandGroupName}
        </Text>

        {overallStats && overallStats.totalPoints > 0 && (
          <View style={styles.paintSummaryCard}>
            <View>
              <Text style={styles.paintSummaryTitle}>
                Rata-rata Ketebalan Cat Keseluruhan Panel Logam (Standar IBID ACV Astra)
              </Text>
              <Text style={{ fontSize: 6.5, color: "#6B6560", marginTop: 1 }}>
                {overallStats.totalPoints} Titik Uji Sensor Digital • Rentang: {overallStats.minMicron}–{overallStats.maxMicron} µm • Bumper plastik non-mikron tidak dihitung.
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
            <Text style={styles.colPanel}>Bagian Panel Kendaraan</Text>
            <Text style={styles.colPoint}>Kanan</Text>
            <Text style={styles.colPoint}>Tengah</Text>
            <Text style={styles.colPoint}>Kiri</Text>
            <Text style={styles.colAvg}>Rata-rata</Text>
            <Text style={styles.colDefect}>Kode</Text>
            <Text style={styles.colCategory}>Status & Kondisi</Text>
          </View>

          {inspection.panels &&
            inspection.panels.map((panel: any) => {
              const isBumper = panel.panelType === "BUMPER_FRONT" || panel.panelType === "BUMPER_REAR";
              const points = [panel.pointRight, panel.pointCenter, panel.pointLeft, panel.pointExtra].filter(
                (val): val is number => typeof val === "number" && !isNaN(val)
              );
              const pointStats = points.length > 0 ? calculateMultiPointAnalysis(points, 30) : null;
              const effectiveMicron = isBumper ? null : pointStats?.average ?? panel.paintThickness;
              const category = isBumper ? null : getPaintMicronCategory(effectiveMicron, vehicle?.brand);

              return (
                <View key={panel.id} style={styles.tableRow}>
                  <Text style={styles.colPanel}>
                    {PANEL_LABELS[panel.panelType] || panel.panelType}
                    {isBumper ? " (Plastik ABS)" : ""}
                  </Text>
                  <Text style={styles.colPoint}>
                    {isBumper ? "-" : panel.pointRight !== null && panel.pointRight !== undefined ? `${panel.pointRight}` : "-"}
                  </Text>
                  <Text style={styles.colPoint}>
                    {isBumper ? "-" : panel.pointCenter !== null && panel.pointCenter !== undefined ? `${panel.pointCenter}` : "-"}
                  </Text>
                  <Text style={styles.colPoint}>
                    {isBumper ? "-" : panel.pointLeft !== null && panel.pointLeft !== undefined ? `${panel.pointLeft}` : "-"}
                  </Text>
                  <Text style={styles.colAvg}>
                    {isBumper ? "Non-Mikron" : effectiveMicron ? `${effectiveMicron} µm` : "-"}
                  </Text>
                  <Text style={styles.colDefect}>{panel.defectCode || "✓"}</Text>
                  <Text style={styles.colCategory}>
                    {isBumper ? (
                      <Text style={{ color: "#D97706" }}>Plastik ABS ({CONDITION_LABELS[panel.condition] || panel.condition})</Text>
                    ) : (
                      <>
                        {category === "ORIGINAL" && <Text style={styles.badgeOk}>Original </Text>}
                        {category === "REPAINT" && <Text style={styles.badgeWarn}>Repaint </Text>}
                        {category === "THICK_FILLER" && <Text style={styles.badgeDanger}>Dempul </Text>}
                        <Text style={{ color: "#6B6560" }}>
                          ({CONDITION_LABELS[panel.condition] || panel.condition})
                        </Text>
                      </>
                    )}
                  </Text>
                </View>
              );
            })}
        </View>

        {/* ── CATATAN EKSEKUTIF PER PILAR (STANDAR IBID ACV) ── */}
        <View style={styles.grid}>
          {inspection.engineNotes && (
            <View style={[styles.col4, styles.notesBox, { marginRight: 3 }]}>
              <Text style={styles.notesTitle}>Catatan Mesin:</Text>
              <Text style={styles.notesText}>{inspection.engineNotes}</Text>
            </View>
          )}
          {inspection.interiorNotes && (
            <View style={[styles.col4, styles.notesBox, { marginRight: 3 }]}>
              <Text style={styles.notesTitle}>Catatan Interior:</Text>
              <Text style={styles.notesText}>{inspection.interiorNotes}</Text>
            </View>
          )}
          {inspection.exteriorNotes && (
            <View style={[styles.col4, styles.notesBox, { marginRight: 3 }]}>
              <Text style={styles.notesTitle}>Catatan Eksterior:</Text>
              <Text style={styles.notesText}>{inspection.exteriorNotes}</Text>
            </View>
          )}
          {inspection.frameNotes && (
            <View style={[styles.col4, styles.notesBox]}>
              <Text style={styles.notesTitle}>Catatan Rangka:</Text>
              <Text style={styles.notesText}>{inspection.frameNotes}</Text>
            </View>
          )}
        </View>

        {/* ── KLAUSUL SYARAT & KETENTUAN HUKUM (STANDAR IBID ASTRA) ── */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerTitle}>
            ⚖️ Syarat, Ketentuan & Batasan Tanggung Jawab Inspeksi (Legal Disclaimer)
          </Text>
          {INSPECTION_LEGAL_DISCLAIMER.points.map((pt) => (
            <Text key={pt.num} style={styles.disclaimerPoint}>
              <Text style={{ fontWeight: "bold" }}>{pt.num}. {pt.title}: </Text>
              {pt.text}
            </Text>
          ))}
        </View>

        {/* ── FOOTER & TANDA TANGAN ── */}
        <View style={styles.footer}>
          <Text style={{ fontSize: 6, color: "#6B6560", width: "65%", lineHeight: 1.25 }}>
            Sertifikat transparansi fisik ini diterbitkan oleh Divisi Inspeksi & Quality Control Nur Mobil. Pengecekan dilakukan secara profesional untuk transparansi data objektif konsumen.
          </Text>
          <View style={styles.signatureBox}>
            <Text style={{ fontSize: 6.5, color: "#6B6560" }}>Inspektur Pemeriksa,</Text>
            <View style={styles.sigLine} />
            <Text style={{ fontSize: 7.5, fontWeight: "bold" }}>{inspection.inspectedBy}</Text>
            <Text style={{ fontSize: 6, color: "#6B6560" }}>Nur Mobil Quality Inspectorate</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
