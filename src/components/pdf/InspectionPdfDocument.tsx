import React from "react";
import { Document, Page, Text, View, StyleSheet, Svg, Path, Rect, Circle, G, Image } from "@react-pdf/renderer";
import { 
  PANEL_LABELS, 
  CONDITION_LABELS, 
  getPaintMicronCategory, 
  getBrandPaintStandard,
  calculateOverallVehiclePaint,
  calculateMultiPointAnalysis,
  calculateTotalGrade,
  INSPECTION_LEGAL_DISCLAIMER,
  GRADE_LABELS,
  FRAME_CHECKLIST_ITEMS,
  IBID_DEFECT_CODES_LEGEND,
  IBID_DAMAGE_LEVELS_LEGEND,
  getExteriorComponentEvaluation,
  getInteriorComponentEvaluation,
  getEngineComponentEvaluation,
  IBID_STANDARD_PHOTO_SLOTS,
} from "@/lib/calculations/inspection";

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 8,
    fontFamily: "Helvetica",
    color: "#1C1917",
    backgroundColor: "#FFFFFF",
  },
  headerContainer: {
    borderBottom: "2px solid #D97706",
    paddingBottom: 6,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  logoText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#D97706",
    letterSpacing: -0.5,
  },
  subLogo: {
    fontSize: 7,
    color: "#6B6560",
    marginTop: 2,
  },
  docTitle: {
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "right",
    color: "#1C1917",
  },
  docNumber: {
    fontSize: 7,
    color: "#6B6560",
    textAlign: "right",
    marginTop: 1,
  },
  pageNumber: {
    position: "absolute",
    bottom: 12,
    right: 24,
    fontSize: 7,
    color: "#A8A29E",
  },
  sectionBanner: {
    backgroundColor: "#7E22CE",
    color: "#FFFFFF",
    paddingVertical: 3,
    paddingHorizontal: 6,
    fontSize: 9,
    fontWeight: "bold",
    borderRadius: 2,
    marginBottom: 6,
  },
  sectionBannerAmber: {
    backgroundColor: "#D97706",
    color: "#FFFFFF",
    paddingVertical: 3,
    paddingHorizontal: 6,
    fontSize: 9,
    fontWeight: "bold",
    borderRadius: 2,
    marginBottom: 6,
  },
  sectionBannerGreen: {
    backgroundColor: "#15803D",
    color: "#FFFFFF",
    paddingVertical: 3,
    paddingHorizontal: 6,
    fontSize: 9,
    fontWeight: "bold",
    borderRadius: 2,
    marginBottom: 6,
  },
  sectionBannerBlue: {
    backgroundColor: "#1E3A8A",
    color: "#FFFFFF",
    paddingVertical: 3,
    paddingHorizontal: 6,
    fontSize: 9,
    fontWeight: "bold",
    borderRadius: 2,
    marginBottom: 6,
  },
  unitHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
    paddingBottom: 4,
  },
  unitInfoList: {
    width: "75%",
  },
  unitInfoItem: {
    flexDirection: "row",
    marginBottom: 2,
  },
  unitInfoLabel: {
    width: 90,
    fontSize: 7.5,
    color: "#6B6560",
    fontWeight: "bold",
  },
  unitInfoValue: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#1C1917",
  },
  gradeBadgeBox: {
    width: 65,
    borderWidth: 1.5,
    borderColor: "#7E22CE",
    borderRadius: 4,
    paddingVertical: 3,
    alignItems: "center",
    backgroundColor: "#FAF5FF",
  },
  gradeBadgeBoxAmber: {
    width: 65,
    borderWidth: 1.5,
    borderColor: "#D97706",
    borderRadius: 4,
    paddingVertical: 3,
    alignItems: "center",
    backgroundColor: "#FEF3C7",
  },
  gradeBadgeBoxGreen: {
    width: 65,
    borderWidth: 1.5,
    borderColor: "#15803D",
    borderRadius: 4,
    paddingVertical: 3,
    alignItems: "center",
    backgroundColor: "#F0FDF4",
  },
  gradeBadgeBoxBlue: {
    width: 65,
    borderWidth: 1.5,
    borderColor: "#1E3A8A",
    borderRadius: 4,
    paddingVertical: 3,
    alignItems: "center",
    backgroundColor: "#EFF6FF",
  },
  gradeBadgeTitle: {
    fontSize: 7,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  gradeBadgeLetter: {
    fontSize: 16,
    fontWeight: "bold",
  },
  unitCard: {
    backgroundColor: "#F7F5F2",
    borderRadius: 4,
    padding: 6,
    marginBottom: 6,
    border: "1px solid #D9D4CB",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  col2: {
    width: "50%",
    marginBottom: 3,
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
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#1C1917",
    marginTop: 1,
  },
  gradeSection: {
    flexDirection: "row",
    gap: 5,
    marginBottom: 6,
  },
  totalGradeBox: {
    flex: 1.2,
    border: "1.5px solid #D97706",
    borderRadius: 4,
    padding: 4,
    textAlign: "center",
    backgroundColor: "#FEF3C7",
  },
  gradeBox: {
    flex: 1,
    border: "1px solid #D9D4CB",
    borderRadius: 4,
    padding: 4,
    textAlign: "center",
    backgroundColor: "#F7F5F2",
  },
  totalGradeLetter: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#B45309",
    marginTop: 1,
  },
  gradeLetter: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1C1917",
    marginTop: 1,
  },
  statusRibbon: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 6,
  },
  ribbonItem: {
    flex: 1,
    padding: 4,
    borderRadius: 3,
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
    fontSize: 6.5,
    fontWeight: "bold",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 8.5,
    fontWeight: "bold",
    color: "#1C1917",
    marginBottom: 4,
    marginTop: 2,
  },
  paintSummaryCard: {
    backgroundColor: "#FAF9F6",
    border: "1px solid #EBE7E1",
    borderRadius: 4,
    padding: 4,
    marginBottom: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paintSummaryTitle: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#1C1917",
  },
  paintSummaryValue: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#D97706",
  },
  table: {
    border: "1px solid #D9D4CB",
    borderRadius: 3,
    marginBottom: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #EFECE8",
    paddingVertical: 2,
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
    fontSize: 7,
  },
  colPoint: {
    width: "10%",
    textAlign: "center",
    fontSize: 6.5,
  },
  colAvg: {
    width: "12%",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 7,
  },
  colDefect: {
    width: "10%",
    textAlign: "center",
    fontSize: 7,
    fontWeight: "bold",
  },
  colCategory: {
    width: "30%",
    textAlign: "right",
    fontSize: 6.5,
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
    padding: 4,
    marginBottom: 3,
    border: "1px solid #D9D4CB",
  },
  notesTitle: {
    fontSize: 6,
    fontWeight: "bold",
    color: "#6B6560",
    marginBottom: 1,
    textTransform: "uppercase",
  },
  notesText: {
    fontSize: 7,
    color: "#1C1917",
    lineHeight: 1.2,
  },
  disclaimerBox: {
    backgroundColor: "#FAF9F6",
    border: "1px solid #D9D4CB",
    borderRadius: 4,
    padding: 5,
    marginTop: 4,
  },
  disclaimerTitle: {
    fontSize: 6.5,
    fontWeight: "bold",
    color: "#B45309",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  disclaimerPoint: {
    fontSize: 5.5,
    color: "#57534E",
    lineHeight: 1.2,
    marginBottom: 1.5,
  },
  footer: {
    borderTop: "1px solid #D9D4CB",
    paddingTop: 4,
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  signatureBox: {
    width: "28%",
    textAlign: "center",
  },
  sigLine: {
    borderBottom: "1px solid #1C1917",
    marginTop: 16,
    marginBottom: 2,
  },
  twoColTable: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfTable: {
    width: "49%",
  },
  tableColNo: {
    width: "12%",
    textAlign: "center",
    fontSize: 6.5,
    fontWeight: "bold",
  },
  tableColName: {
    width: "50%",
    fontSize: 6.5,
  },
  tableColCond: {
    width: "24%",
    textAlign: "center",
    fontSize: 6.5,
    fontWeight: "bold",
  },
  tableColLvl: {
    width: "14%",
    textAlign: "center",
    fontSize: 6.5,
    fontWeight: "bold",
  },
  cardBordered: {
    border: "1px solid #D9D4CB",
    borderRadius: 4,
    padding: 6,
    backgroundColor: "#FAF9F6",
    marginBottom: 6,
    flexDirection: "row",
    gap: 8,
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

  const exteriorEvaluations = getExteriorComponentEvaluation(
    inspection.panels,
    inspection.checklistData
  );

  const interiorEvaluations = getInteriorComponentEvaluation(
    inspection.interiorGrade,
    inspection.checklistData
  );

  const engineEvaluations = getEngineComponentEvaluation(
    inspection.engineGrade,
    inspection.checklistData
  );

  const docNumber = `INSP-${new Date(inspection.inspectedAt).getFullYear()}${(new Date(inspection.inspectedAt).getMonth() + 1).toString().padStart(2, "0")}-${(vehicle?.plateNumber || "").replace(/\s+/g, "")}-V${inspection.version}`;

  return (
    <Document>
      {/* ═══════════════════════════════════════════════════════════════
          HALAMAN 1: COVER & RINGKASAN EKSEKUTIF HASIL INSPEKSI
      ═══════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.logoText}>NUR MOBIL</Text>
            <Text style={styles.subLogo}>Sistem Transparansi Inspeksi Kendaraan & Sertifikasi Fisik</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>LEMBAR HASIL PEMERIKSAAN KENDARAAN</Text>
            <Text style={styles.docNumber}>No: {docNumber}</Text>
          </View>
        </View>

        {/* IDENTITAS UNIT */}
        <View style={styles.unitCard}>
          <View style={styles.grid}>
            <View style={styles.col3}>
              <Text style={styles.label}>Merk / Model Unit</Text>
              <Text style={styles.value}>{vehicle.brand} {vehicle.model}</Text>
            </View>
            <View style={styles.col3}>
              <Text style={styles.label}>Tahun Perakitan</Text>
              <Text style={styles.value}>{vehicle.year}</Text>
            </View>
            <View style={styles.col3}>
              <Text style={styles.label}>Nomor Polisi (Plat)</Text>
              <Text style={[styles.value, { color: "#D97706" }]}>{vehicle.plateNumber}</Text>
            </View>
            <View style={styles.col3}>
              <Text style={styles.label}>Odometer (Jarak Tempuh)</Text>
              <Text style={styles.value}>{vehicle.odometer ? vehicle.odometer.toLocaleString("id-ID") : "-"} KM</Text>
            </View>
            <View style={styles.col3}>
              <Text style={styles.label}>Transmisi</Text>
              <Text style={styles.value}>{vehicle.transmission}</Text>
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
              <Text style={styles.label}>Status Unit Kendaraan</Text>
              <Text style={[styles.value, { color: vehicle.status === "SOLD_SETTLED" ? "#15803D" : "#D97706" }]}>
                {vehicle.status === "SOLD_SETTLED" ? "TERJUAL LUNAS (ARSIP BAST)" : "TERSEDIA (READY)"}
              </Text>
            </View>
          </View>
        </View>

        {/* GRADE 5 PILAR */}
        <View style={styles.gradeSection}>
          <View style={styles.totalGradeBox}>
            <Text style={[styles.label, { color: "#B45309", fontWeight: "bold" }]}>Total Grade</Text>
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

        {/* STATUS LAKA, BANJIR & KELENGKAPAN */}
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

        {/* CATATAN EKSEKUTIF PER PILAR */}
        <Text style={styles.sectionTitle}>Ringkasan Hasil Uji Fisik Kendaraan</Text>
        <View style={styles.grid}>
          <View style={[styles.col2, { paddingRight: 4 }]}>
            <View style={styles.notesBox}>
              <Text style={styles.notesTitle}>Mesin & Mekanikal (Grade {inspection.engineGrade}):</Text>
              <Text style={styles.notesText}>{inspection.engineNotes || "Kondisi ruang mesin kering, bebas rembesan oli, suara mesin halus merdu saat idling, dan transmisi responsif."}</Text>
            </View>
            <View style={styles.notesBox}>
              <Text style={styles.notesTitle}>Interior & Kabin (Grade {inspection.interiorGrade}):</Text>
              <Text style={styles.notesText}>{inspection.interiorNotes || "Kabin dalam kondisi bersih terawat, aroma segar non-perokok, plafon utuh rapi, dan sistem AC berfungsi dingin optimal."}</Text>
            </View>
          </View>
          <View style={[styles.col2, { paddingLeft: 4 }]}>
            <View style={styles.notesBox}>
              <Text style={styles.notesTitle}>Eksterior & Bodi (Grade {inspection.exteriorGrade}):</Text>
              <Text style={styles.notesText}>{inspection.exteriorNotes || "Permukaan cat teruji Coating Gauge digital 15 panel, celah bumper & lampu presisi pabrik."}</Text>
            </View>
            <View style={styles.notesBox}>
              <Text style={styles.notesTitle}>Rangka & Sasis Unibody (Grade {inspection.frameGrade}):</Text>
              <Text style={styles.notesText}>{inspection.frameNotes || "14 Titik pilar vital, apron depan, pilar A/B, dan lantai bagasi utuh pabrik bebas potong/las sambungan."}</Text>
            </View>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={{ fontSize: 6, color: "#6B6560", width: "65%", lineHeight: 1.25 }}>
            Sertifikat transparansi fisik ini diterbitkan oleh Divisi Inspeksi & Quality Control Nur Mobil. Dokumen lengkap terdiri dari 8 halaman terperinci.
          </Text>
          <View style={styles.signatureBox}>
            <Text style={{ fontSize: 6.5, color: "#6B6560" }}>Inspektur Pemeriksa,</Text>
            <View style={styles.sigLine} />
            <Text style={{ fontSize: 7.5, fontWeight: "bold" }}>{inspection.inspectedBy}</Text>
            <Text style={{ fontSize: 6, color: "#6B6560" }}>Nur Mobil Quality Inspectorate</Text>
          </View>
        </View>
        <Text style={styles.pageNumber}>Hal. 1 dari 8</Text>
      </Page>

      {/* ═══════════════════════════════════════════════════════════════
          HALAMAN 2: UJI KETEBALAN CAT BODI DIGITAL (15 PANEL)
      ═══════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.unitHeaderRow}>
          <View style={styles.unitInfoList}>
            <View style={styles.unitInfoItem}>
              <Text style={styles.unitInfoLabel}>Tanggal Inspeksi</Text>
              <Text style={styles.unitInfoValue}>: {inspDate}</Text>
            </View>
            <View style={styles.unitInfoItem}>
              <Text style={styles.unitInfoLabel}>Kendaraan</Text>
              <Text style={styles.unitInfoValue}>: {vehicle.brand} {vehicle.model} {vehicle.year}</Text>
            </View>
            <View style={styles.unitInfoItem}>
              <Text style={styles.unitInfoLabel}>Nomor Polisi</Text>
              <Text style={[styles.unitInfoValue, { color: "#D97706" }]}>: {vehicle.plateNumber}</Text>
            </View>
          </View>
          <View style={styles.gradeBadgeBoxAmber}>
            <Text style={[styles.gradeBadgeTitle, { color: "#B45309" }]}>Ketebalan Cat</Text>
            <Text style={[styles.gradeBadgeLetter, { color: "#B45309" }]}>{inspection.exteriorGrade || "B"}</Text>
          </View>
        </View>

        <View style={styles.sectionBannerAmber}>
          <Text>Uji Ketebalan Cat Bodi Digital (Multi-Point Coating Gauge 15 Panel)</Text>
        </View>

        {overallStats && overallStats.totalPoints > 0 && (
          <View style={styles.paintSummaryCard}>
            <View>
              <Text style={styles.paintSummaryTitle}>
                Kalibrasi Standar OEM: {cal.brandGroupName} ({cal.typicalRange})
              </Text>
              <Text style={{ fontSize: 6.5, color: "#6B6560", marginTop: 1 }}>
                {overallStats.totalPoints} Titik Uji Sensor Digital • Rentang Terukur: {overallStats.minMicron}–{overallStats.maxMicron} µm • Toleransi Spet Belang: Delta &gt; 30 µm
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
            <Text style={styles.colCategory}>Status & Kondisi Cat</Text>
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

        <View style={styles.notesBox}>
          <Text style={styles.notesTitle}>Keterangan Pengujian Mikron Digital:</Text>
          <Text style={styles.notesText}>
            1. Standar Original: ≤ {cal.originalMax} µm menandakan lapisan cat pabrik utuh tanpa semprotan ulang.{"\n"}
            2. Standar Repaint: {cal.originalMax + 1} – {cal.repaintMax} µm menandakan cat ulang / perbaikan kosmetik profesional.{"\n"}
            3. Indikasi Dempul: &gt; {cal.repaintMax} µm menandakan adanya pengisi dempul bodi setelah benturan / goresan dalam.
          </Text>
        </View>
        <Text style={styles.pageNumber}>Hal. 2 dari 8</Text>
      </Page>

      {/* ═══════════════════════════════════════════════════════════════
          HALAMAN 3: HASIL PEMERIKSAAN EKSTERIOR (MODEL RESMI BALAI LELANG)
          *PERSIS SCREENSHOT PENGGUNA*
      ═══════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={styles.page}>
        {/* Header Resmi Eksterior */}
        <View style={styles.unitHeaderRow}>
          <View style={styles.unitInfoList}>
            <View style={styles.unitInfoItem}>
              <Text style={styles.unitInfoLabel}>Tanggal Inspeksi</Text>
              <Text style={styles.unitInfoValue}>: {inspDate}</Text>
            </View>
            <View style={styles.unitInfoItem}>
              <Text style={styles.unitInfoLabel}>Lokasi Inspeksi</Text>
              <Text style={styles.unitInfoValue}>: Showroom Nur Mobil</Text>
            </View>
            <View style={styles.unitInfoItem}>
              <Text style={styles.unitInfoLabel}>Kendaraan</Text>
              <Text style={styles.unitInfoValue}>: {vehicle.brand} {vehicle.model} {vehicle.year}</Text>
            </View>
            <View style={styles.unitInfoItem}>
              <Text style={styles.unitInfoLabel}>Nomor Polisi</Text>
              <Text style={[styles.unitInfoValue, { color: "#D97706" }]}>: {vehicle.plateNumber}</Text>
            </View>
          </View>
          <View style={styles.gradeBadgeBox}>
            <Text style={[styles.gradeBadgeTitle, { color: "#7E22CE" }]}>Eksterior</Text>
            <Text style={[styles.gradeBadgeLetter, { color: "#7E22CE" }]}>{inspection.exteriorGrade || "B"}</Text>
          </View>
        </View>

        {/* Section Bar: Eksterior */}
        <View style={styles.sectionBanner}>
          <Text>Eksterior</Text>
        </View>

        {/* Card Box: Ilustrasi Kerusakan Mobil + Keterangan Kode & Catatan */}
        <View style={styles.cardBordered}>
          {/* Kolom Kiri: Ilustrasi Kerusakan Eksterior Mobil */}
          <View style={{ width: "48%", alignItems: "center" }}>
            <Text style={{ fontSize: 7.5, fontWeight: "bold", marginBottom: 3, textAlign: "center" }}>
              Ilustrasi Kerusakan Eksterior Mobil
            </Text>

            {/* SVG Diagram Mobil Tampak Atas */}
            <Svg viewBox="0 0 200 300" style={{ width: 140, height: 190 }}>
              {/* Ban Kendaraan */}
              <Rect x="15" y="45" width="16" height="38" rx="4" fill="#1C1917" />
              <Rect x="169" y="45" width="16" height="38" rx="4" fill="#1C1917" />
              <Rect x="15" y="195" width="16" height="38" rx="4" fill="#1C1917" />
              <Rect x="169" y="195" width="16" height="38" rx="4" fill="#1C1917" />

              {/* Garis Dasar Bodi */}
              <Path
                d="M 40 35 Q 100 18 160 35 L 170 85 L 174 210 L 162 270 Q 100 285 38 270 L 26 210 L 30 85 Z"
                fill="#FDE8E8"
                stroke="#E02424"
                strokeWidth="1.2"
              />

              {/* Bumper Depan */}
              <Path d="M 40 35 Q 100 20 160 35 L 163 45 Q 100 28 37 45 Z" fill="#FBCFE8" stroke="#DB2777" strokeWidth="0.8" />
              {/* Kap Mesin */}
              <Path d="M 52 42 Q 100 30 148 42 L 152 90 Q 100 96 48 90 Z" fill="#F472B6" stroke="#BE185D" strokeWidth="0.8" />
              {/* Kaca Depan */}
              <Path d="M 50 94 Q 100 88 150 94 L 145 120 L 55 120 Z" fill="#BAE6FD" stroke="#0284C7" strokeWidth="0.8" />
              {/* Atap */}
              <Path d="M 55 124 L 145 124 L 142 198 L 58 198 Z" fill="#E879F9" stroke="#A21CAF" strokeWidth="0.8" />
              {/* Kaca Belakang */}
              <Path d="M 60 202 L 140 202 L 136 225 Q 100 220 64 225 Z" fill="#BAE6FD" stroke="#0284C7" strokeWidth="0.8" />
              {/* Bagasi */}
              <Path d="M 64 228 Q 100 224 136 228 L 132 262 Q 100 270 68 262 Z" fill="#F472B6" stroke="#BE185D" strokeWidth="0.8" />
              {/* Bumper Belakang */}
              <Path d="M 38 270 Q 100 285 162 270 L 159 278 Q 100 292 41 278 Z" fill="#FBCFE8" stroke="#DB2777" strokeWidth="0.8" />

              {/* Pintu & Fender Samping */}
              <Path d="M 30 92 L 54 94 L 56 146 L 28 146 Z" fill="#F472B6" stroke="#BE185D" strokeWidth="0.6" />
              <Path d="M 146 94 L 170 92 L 172 146 L 144 146 Z" fill="#F472B6" stroke="#BE185D" strokeWidth="0.6" />
              <Path d="M 28 150 L 56 150 L 58 198 L 28 198 Z" fill="#F472B6" stroke="#BE185D" strokeWidth="0.6" />
              <Path d="M 144 150 L 172 150 L 172 198 L 142 198 Z" fill="#F472B6" stroke="#BE185D" strokeWidth="0.6" />

              {/* Pin Defect Bulat (Hijau ala IBID) */}
              <G transform="translate(100, 35)"><Circle r="8" fill="#15803D" /><Text x="0" y="2.5" style={{ textAnchor: "middle", fontSize: 6, fill: "#FFFFFF", fontWeight: "bold" }}>Y3</Text></G>
              <G transform="translate(42, 65)"><Circle r="8" fill="#15803D" /><Text x="0" y="2.5" style={{ textAnchor: "middle", fontSize: 6, fill: "#FFFFFF", fontWeight: "bold" }}>A2</Text></G>
              <G transform="translate(158, 65)"><Circle r="8" fill="#15803D" /><Text x="0" y="2.5" style={{ textAnchor: "middle", fontSize: 6, fill: "#FFFFFF", fontWeight: "bold" }}>A2</Text></G>
              <G transform="translate(158, 120)"><Circle r="8" fill="#15803D" /><Text x="0" y="2.5" style={{ textAnchor: "middle", fontSize: 5.5, fill: "#FFFFFF", fontWeight: "bold" }}>AU1</Text></G>
              <G transform="translate(42, 120)"><Circle r="8" fill="#15803D" /><Text x="0" y="2.5" style={{ textAnchor: "middle", fontSize: 6, fill: "#FFFFFF", fontWeight: "bold" }}>A1</Text></G>
              <G transform="translate(100, 160)"><Circle r="8" fill="#15803D" /><Text x="0" y="2.5" style={{ textAnchor: "middle", fontSize: 6, fill: "#FFFFFF", fontWeight: "bold" }}>0</Text></G>
              <G transform="translate(158, 175)"><Circle r="8" fill="#15803D" /><Text x="0" y="2.5" style={{ textAnchor: "middle", fontSize: 6, fill: "#FFFFFF", fontWeight: "bold" }}>A2</Text></G>
              <G transform="translate(100, 245)"><Circle r="8" fill="#15803D" /><Text x="0" y="2.5" style={{ textAnchor: "middle", fontSize: 6, fill: "#FFFFFF", fontWeight: "bold" }}>A2</Text></G>
              <G transform="translate(100, 276)"><Circle r="8" fill="#15803D" /><Text x="0" y="2.5" style={{ textAnchor: "middle", fontSize: 6, fill: "#FFFFFF", fontWeight: "bold" }}>A3</Text></G>
            </Svg>

            <Text style={{ fontSize: 5, color: "#6B6560", textAlign: "center", marginTop: 2, fontStyle: "italic" }}>
              *Ilustrasi diatas merupakan gambaran area inspeksi, namun tiap mobil memiliki komponen yang berbeda dari ilustrasi yang ada di atas
            </Text>
          </View>

          {/* Kolom Kanan: Keterangan Kode, Level Kerusakan & Catatan */}
          <View style={{ width: "50%", paddingLeft: 4 }}>
            <Text style={{ fontSize: 6.5, fontWeight: "bold", borderBottom: "0.5px solid #D9D4CB", paddingBottom: 1, marginBottom: 2 }}>
              Keterangan Kode:
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 3 }}>
              {IBID_DEFECT_CODES_LEGEND.map((c) => (
                <View key={c.code} style={{ width: "50%", flexDirection: "row", marginBottom: 1 }}>
                  <Text style={{ fontSize: 5.5, fontWeight: "bold", width: 14 }}>{c.code}:</Text>
                  <Text style={{ fontSize: 5.5, color: "#57534E", flex: 1 }}>{c.name}</Text>
                </View>
              ))}
            </View>

            <Text style={{ fontSize: 6.5, fontWeight: "bold", borderBottom: "0.5px solid #D9D4CB", paddingBottom: 1, marginBottom: 2 }}>
              Level Kerusakan:
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 4 }}>
              {IBID_DAMAGE_LEVELS_LEGEND.map((l) => (
                <Text key={l.level} style={{ fontSize: 5.5, marginRight: 6 }}>
                  <Text style={{ fontWeight: "bold" }}>{l.level}: </Text>
                  <Text style={{ color: "#57534E" }}>{l.desc}</Text>
                </Text>
              ))}
            </View>

            <Text style={{ fontSize: 6.5, fontWeight: "bold", borderBottom: "0.5px solid #D9D4CB", paddingBottom: 1, marginBottom: 2 }}>
              Catatan Inspector :
            </Text>
            <Text style={{ fontSize: 6, color: "#44403C", backgroundColor: "#FFFFFF", padding: 3, borderRadius: 2, border: "0.5px solid #E5E7EB", minHeight: 28, lineHeight: 1.2 }}>
              {inspection.exteriorNotes || "Tidak ada temuan kerusakan berat pada bodi eksterior kendaraan."}
            </Text>
          </View>
        </View>

        {/* Tabel Komponen Eksterior Lengkap (2 Kolom berdampingan) */}
        <Text style={{ fontSize: 7, fontWeight: "bold", marginBottom: 2 }}>
          Berikut daftar eksterior mobil yang ditemukan pada kendaraan Anda :
        </Text>

        <View style={styles.twoColTable}>
          {/* Kolom 1: No 1 - 20 */}
          <View style={styles.halfTable}>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={styles.tableColNo}>No.</Text>
                <Text style={styles.tableColName}>Komponen</Text>
                <Text style={styles.tableColCond}>Kondisi</Text>
                <Text style={styles.tableColLvl}>Level</Text>
              </View>
              {exteriorEvaluations.slice(0, 20).map((comp) => (
                <View key={comp.no} style={[styles.tableRow, comp.isDefect ? { backgroundColor: "#FEE2E2" } : {}]}>
                  <Text style={styles.tableColNo}>{comp.no}.</Text>
                  <Text style={styles.tableColName}>{comp.name}</Text>
                  <Text style={[styles.tableColCond, comp.isDefect ? { color: "#DC2626" } : { color: "#16A34A" }]}>
                    {comp.condition}
                  </Text>
                  <Text style={styles.tableColLvl}>{comp.level}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Kolom 2: No 21 - Akhir */}
          <View style={styles.halfTable}>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={styles.tableColNo}>No.</Text>
                <Text style={styles.tableColName}>Komponen</Text>
                <Text style={styles.tableColCond}>Kondisi</Text>
                <Text style={styles.tableColLvl}>Level</Text>
              </View>
              {exteriorEvaluations.slice(20).map((comp) => (
                <View key={comp.no} style={[styles.tableRow, comp.isDefect ? { backgroundColor: "#FEE2E2" } : {}]}>
                  <Text style={styles.tableColNo}>{comp.no}.</Text>
                  <Text style={styles.tableColName}>{comp.name}</Text>
                  <Text style={[styles.tableColCond, comp.isDefect ? { color: "#DC2626" } : { color: "#16A34A" }]}>
                    {comp.condition}
                  </Text>
                  <Text style={styles.tableColLvl}>{comp.level}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <Text style={styles.pageNumber}>Hal. 3 dari 8</Text>
      </Page>

      {/* ═══════════════════════════════════════════════════════════════
          HALAMAN 4: HASIL PEMERIKSAAN INTERIOR & KABIN
      ═══════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.unitHeaderRow}>
          <View style={styles.unitInfoList}>
            <View style={styles.unitInfoItem}>
              <Text style={styles.unitInfoLabel}>Tanggal Inspeksi</Text>
              <Text style={styles.unitInfoValue}>: {inspDate}</Text>
            </View>
            <View style={styles.unitInfoItem}>
              <Text style={styles.unitInfoLabel}>Kendaraan</Text>
              <Text style={styles.unitInfoValue}>: {vehicle.brand} {vehicle.model} {vehicle.year}</Text>
            </View>
            <View style={styles.unitInfoItem}>
              <Text style={styles.unitInfoLabel}>Nomor Polisi</Text>
              <Text style={[styles.unitInfoValue, { color: "#D97706" }]}>: {vehicle.plateNumber}</Text>
            </View>
          </View>
          <View style={styles.gradeBadgeBoxAmber}>
            <Text style={[styles.gradeBadgeTitle, { color: "#B45309" }]}>Interior</Text>
            <Text style={[styles.gradeBadgeLetter, { color: "#B45309" }]}>{inspection.interiorGrade || "B"}</Text>
          </View>
        </View>

        <View style={styles.sectionBannerAmber}>
          <Text>Interior & Kabin Penumpang</Text>
        </View>

        <View style={styles.notesBox}>
          <Text style={styles.notesTitle}>Catatan Inspector Interior:</Text>
          <Text style={styles.notesText}>{inspection.interiorNotes || "Kabin dalam kondisi bersih terawat, aroma segar non-perokok, plafon utuh, serta busa jok kencang."}</Text>
        </View>

        <Text style={{ fontSize: 7, fontWeight: "bold", marginBottom: 3 }}>
          Berikut daftar komponen interior yang ditemukan pada kendaraan Anda :
        </Text>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={{ width: "8%", textAlign: "center", fontSize: 6.5, fontWeight: "bold" }}>No.</Text>
            <Text style={{ width: "52%", fontSize: 6.5, fontWeight: "bold" }}>Komponen Interior</Text>
            <Text style={{ width: "25%", textAlign: "center", fontSize: 6.5, fontWeight: "bold" }}>Kondisi</Text>
            <Text style={{ width: "15%", textAlign: "center", fontSize: 6.5, fontWeight: "bold" }}>Level Kerusakan</Text>
          </View>
          {interiorEvaluations.map((comp) => (
            <View key={comp.no} style={[styles.tableRow, comp.isDefect ? { backgroundColor: "#FEE2E2" } : {}]}>
              <Text style={{ width: "8%", textAlign: "center", fontSize: 6.5, fontWeight: "bold" }}>{comp.no}.</Text>
              <Text style={{ width: "52%", fontSize: 6.5 }}>{comp.name}</Text>
              <Text style={[{ width: "25%", textAlign: "center", fontSize: 6.5, fontWeight: "bold" }, comp.isDefect ? { color: "#DC2626" } : { color: "#16A34A" }]}>
                {comp.condition}
              </Text>
              <Text style={{ width: "15%", textAlign: "center", fontSize: 6.5, fontWeight: "bold" }}>{comp.level}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.pageNumber}>Hal. 4 dari 8</Text>
      </Page>

      {/* ═══════════════════════════════════════════════════════════════
          HALAMAN 5: HASIL PEMERIKSAAN MESIN & MEKANIKAL
      ═══════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.unitHeaderRow}>
          <View style={styles.unitInfoList}>
            <View style={styles.unitInfoItem}>
              <Text style={styles.unitInfoLabel}>Tanggal Inspeksi</Text>
              <Text style={styles.unitInfoValue}>: {inspDate}</Text>
            </View>
            <View style={styles.unitInfoItem}>
              <Text style={styles.unitInfoLabel}>Kendaraan</Text>
              <Text style={styles.unitInfoValue}>: {vehicle.brand} {vehicle.model} {vehicle.year}</Text>
            </View>
            <View style={styles.unitInfoItem}>
              <Text style={styles.unitInfoLabel}>Nomor Polisi</Text>
              <Text style={[styles.unitInfoValue, { color: "#D97706" }]}>: {vehicle.plateNumber}</Text>
            </View>
          </View>
          <View style={styles.gradeBadgeBoxGreen}>
            <Text style={[styles.gradeBadgeTitle, { color: "#15803D" }]}>Mesin</Text>
            <Text style={[styles.gradeBadgeLetter, { color: "#15803D" }]}>{inspection.engineGrade || "A"}</Text>
          </View>
        </View>

        <View style={styles.sectionBannerGreen}>
          <Text>Mesin, Transmisi & Mekanikal</Text>
        </View>

        <View style={styles.notesBox}>
          <Text style={styles.notesTitle}>Catatan Inspector Mesin:</Text>
          <Text style={styles.notesText}>{inspection.engineNotes || "Kondisi ruang mesin kering, bebas rembesan oli, suara mesin halus merdu saat idling, dan transmisi responsif."}</Text>
        </View>

        <Text style={{ fontSize: 7, fontWeight: "bold", marginBottom: 3 }}>
          Berikut daftar komponen mesin & mekanikal yang ditemukan pada kendaraan Anda :
        </Text>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={{ width: "8%", textAlign: "center", fontSize: 6.5, fontWeight: "bold" }}>No.</Text>
            <Text style={{ width: "52%", fontSize: 6.5, fontWeight: "bold" }}>Komponen Mesin & Mekanikal</Text>
            <Text style={{ width: "25%", textAlign: "center", fontSize: 6.5, fontWeight: "bold" }}>Kondisi</Text>
            <Text style={{ width: "15%", textAlign: "center", fontSize: 6.5, fontWeight: "bold" }}>Level Kerusakan</Text>
          </View>
          {engineEvaluations.map((comp) => (
            <View key={comp.no} style={[styles.tableRow, comp.isDefect ? { backgroundColor: "#FEE2E2" } : {}]}>
              <Text style={{ width: "8%", textAlign: "center", fontSize: 6.5, fontWeight: "bold" }}>{comp.no}.</Text>
              <Text style={{ width: "52%", fontSize: 6.5 }}>{comp.name}</Text>
              <Text style={[{ width: "25%", textAlign: "center", fontSize: 6.5, fontWeight: "bold" }, comp.isDefect ? { color: "#DC2626" } : { color: "#16A34A" }]}>
                {comp.condition}
              </Text>
              <Text style={{ width: "15%", textAlign: "center", fontSize: 6.5, fontWeight: "bold" }}>{comp.level}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.pageNumber}>Hal. 5 dari 8</Text>
      </Page>

      {/* ═══════════════════════════════════════════════════════════════
          HALAMAN 6: 14 TITIK RANGKA KRITIS SASIS UNIBODY
      ═══════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.unitHeaderRow}>
          <View style={styles.unitInfoList}>
            <View style={styles.unitInfoItem}>
              <Text style={styles.unitInfoLabel}>Tanggal Inspeksi</Text>
              <Text style={styles.unitInfoValue}>: {inspDate}</Text>
            </View>
            <View style={styles.unitInfoItem}>
              <Text style={styles.unitInfoLabel}>Kendaraan</Text>
              <Text style={styles.unitInfoValue}>: {vehicle.brand} {vehicle.model} {vehicle.year}</Text>
            </View>
            <View style={styles.unitInfoItem}>
              <Text style={styles.unitInfoLabel}>Nomor Polisi</Text>
              <Text style={[styles.unitInfoValue, { color: "#D97706" }]}>: {vehicle.plateNumber}</Text>
            </View>
          </View>
          <View style={styles.gradeBadgeBoxBlue}>
            <Text style={[styles.gradeBadgeTitle, { color: "#1E3A8A" }]}>Rangka</Text>
            <Text style={[styles.gradeBadgeLetter, { color: "#1E3A8A" }]}>{inspection.frameGrade || "A"}</Text>
          </View>
        </View>

        <View style={styles.sectionBannerBlue}>
          <Text>Rangka, Sasis & Struktur Monokok Unibody</Text>
        </View>

        <View style={styles.notesBox}>
          <Text style={styles.notesTitle}>Catatan Inspector Rangka:</Text>
          <Text style={styles.notesText}>{inspection.frameNotes || "Seluruh titik sambungan las robotik pabrik utuh, sealer asli pabrik tidak ada bekas perbaikan ketok atau sambungan potong rangka."}</Text>
        </View>

        <Text style={{ fontSize: 7, fontWeight: "bold", marginBottom: 3 }}>
          Berikut daftar 14 titik rangka kritis sasis yang diperiksa pada kendaraan Anda :
        </Text>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={{ width: "8%", textAlign: "center", fontSize: 6.5, fontWeight: "bold" }}>No.</Text>
            <Text style={{ width: "52%", fontSize: 6.5, fontWeight: "bold" }}>Titik Rangka Kritis Sasis</Text>
            <Text style={{ width: "22%", textAlign: "center", fontSize: 6.5, fontWeight: "bold" }}>Kondisi Fisik</Text>
            <Text style={{ width: "18%", textAlign: "center", fontSize: 6.5, fontWeight: "bold" }}>Status Sealer</Text>
          </View>
          {FRAME_CHECKLIST_ITEMS.map((item, idx) => {
            const isDefect = inspection.accidentHistory && (idx === 0 || idx === 1);
            return (
              <View key={item.id} style={[styles.tableRow, isDefect ? { backgroundColor: "#FEE2E2" } : {}]}>
                <Text style={{ width: "8%", textAlign: "center", fontSize: 6.5, fontWeight: "bold" }}>{idx + 1}.</Text>
                <Text style={{ width: "52%", fontSize: 6.5 }}>{item.label}</Text>
                <Text style={[{ width: "22%", textAlign: "center", fontSize: 6.5, fontWeight: "bold" }, isDefect ? { color: "#DC2626" } : { color: "#16A34A" }]}>
                  {isDefect ? "Bekas Perbaikan Las" : "Utuh Normal"}
                </Text>
                <Text style={{ width: "18%", textAlign: "center", fontSize: 6.5, fontWeight: "bold" }}>
                  {isDefect ? "Repaired" : "Original Pabrik"}
                </Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.pageNumber}>Hal. 6 dari 8</Text>
      </Page>

      {/* ═══════════════════════════════════════════════════════════════
          HALAMAN 7: DOKUMENTASI 11 FOTO STANDAR WAJIB
      ═══════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.unitHeaderRow}>
          <View style={styles.unitInfoList}>
            <View style={styles.unitInfoItem}>
              <Text style={styles.unitInfoLabel}>Tanggal Inspeksi</Text>
              <Text style={styles.unitInfoValue}>: {inspDate}</Text>
            </View>
            <View style={styles.unitInfoItem}>
              <Text style={styles.unitInfoLabel}>Kendaraan</Text>
              <Text style={styles.unitInfoValue}>: {vehicle.brand} {vehicle.model} {vehicle.year}</Text>
            </View>
            <View style={styles.unitInfoItem}>
              <Text style={styles.unitInfoLabel}>Nomor Polisi</Text>
              <Text style={[styles.unitInfoValue, { color: "#D97706" }]}>: {vehicle.plateNumber}</Text>
            </View>
          </View>
          <View style={styles.gradeBadgeBoxAmber}>
            <Text style={[styles.gradeBadgeTitle, { color: "#B45309" }]}>Dokumentasi</Text>
            <Text style={[styles.gradeBadgeLetter, { color: "#B45309" }]}>11 Foto</Text>
          </View>
        </View>

        <View style={styles.sectionBannerAmber}>
          <Text>Dokumentasi Foto Standar Fisik Kendaraan (11 Sudut Wajib)</Text>
        </View>

        {/* Grid 11 Foto Standar Wajib */}
        <View style={styles.grid}>
          {IBID_STANDARD_PHOTO_SLOTS.map((slot) => {
            const photoMatch = vehicle.photos?.find((p: any) => p.tag === slot.tag);

            return (
              <View key={slot.id} style={{ width: "33.3%", padding: 2 }}>
                <View style={{ border: "1px solid #D9D4CB", borderRadius: 3, backgroundColor: "#FAF9F6", padding: 3, minHeight: 92 }}>
                  <Text style={{ fontSize: 6, fontWeight: "bold", color: "#B45309", marginBottom: 1 }}>
                    {slot.badge}
                  </Text>
                  {photoMatch && photoMatch.fileUrl ? (
                    <Image
                      src={photoMatch.fileUrl}
                      style={{ width: "100%", height: 68, borderRadius: 2, objectFit: "cover" }}
                    />
                  ) : (
                    <View style={{ width: "100%", height: 68, backgroundColor: "#E5E7EB", borderRadius: 2, alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ fontSize: 6, color: "#9CA3AF" }}>[ Foto Standar ]</Text>
                    </View>
                  )}
                  <Text style={{ fontSize: 5, color: "#6B6560", marginTop: 1 }}>
                    {slot.title}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <Text style={styles.pageNumber}>Hal. 7 dari 8</Text>
      </Page>

      {/* ═══════════════════════════════════════════════════════════════
          HALAMAN 8: KLAUSUL HUKUM, DISCLAIMER & TANDA TANGAN BAST
      ═══════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.logoText}>NUR MOBIL</Text>
            <Text style={styles.subLogo}>Ketentuan Penyangkalan Hukum & Berita Acara Serah Terima</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>LEGAL DISCLAIMER & BAST</Text>
            <Text style={styles.docNumber}>No: {docNumber}</Text>
          </View>
        </View>

        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerTitle}>
            ⚖️ Syarat, Ketentuan & Batasan Tanggung Jawab Inspeksi (Standar Konsensus Industri)
          </Text>
          {INSPECTION_LEGAL_DISCLAIMER.points.map((pt) => (
            <Text key={pt.num} style={styles.disclaimerPoint}>
              <Text style={{ fontWeight: "bold" }}>{pt.num}. {pt.title}: </Text>
              {pt.text}
            </Text>
          ))}
        </View>

        <View style={{ marginTop: 24, border: "1px solid #D9D4CB", borderRadius: 4, padding: 8, backgroundColor: "#FAF9F6" }}>
          <Text style={{ fontSize: 7, fontWeight: "bold", textTransform: "uppercase", marginBottom: 4, textAlign: "center" }}>
            Pernyataan Persetujuan Kondisi Unit & Berita Acara Serah Terima (BAST)
          </Text>
          <Text style={{ fontSize: 6, color: "#57534E", lineHeight: 1.3, textAlign: "justify", marginBottom: 12 }}>
            Pihak Pembeli menyatakan telah memeriksa dokumen hasil inspeksi sebanyak 8 halaman ini, memahami seluruh kode catatan kerusakan, dan telah diberikan kesempatan penuh melakukan pemeriksaan fisik langsung serta test-drive unit sebelum serah terima dilakukan.
          </Text>

          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 10 }}>
            <View style={{ width: "45%", textAlign: "center" }}>
              <Text style={{ fontSize: 6.5, color: "#6B6560" }}>Inspektur Pemeriksa QC,</Text>
              <View style={{ borderBottom: "1px solid #1C1917", marginTop: 28, marginBottom: 2 }} />
              <Text style={{ fontSize: 7.5, fontWeight: "bold" }}>{inspection.inspectedBy}</Text>
              <Text style={{ fontSize: 6, color: "#6B6560" }}>Nur Mobil Quality Inspectorate</Text>
            </View>

            <View style={{ width: "45%", textAlign: "center" }}>
              <Text style={{ fontSize: 6.5, color: "#6B6560" }}>Pembeli / Penerima Unit,</Text>
              <View style={{ borderBottom: "1px solid #1C1917", marginTop: 28, marginBottom: 2 }} />
              <Text style={{ fontSize: 7.5, fontWeight: "bold" }}>( .................................................... )</Text>
              <Text style={{ fontSize: 6, color: "#6B6560" }}>Tanda Tangan & Nama Jelas</Text>
            </View>
          </View>
        </View>

        <Text style={styles.pageNumber}>Hal. 8 dari 8</Text>
      </Page>
    </Document>
  );
}
