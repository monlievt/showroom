"use client";

import React, { useState } from "react";
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  RefreshCw,
  HelpCircle,
  FileText,
  Car,
  Wrench,
  Check,
  X
} from "lucide-react";
import { formatRupiah, cn } from "@/lib/utils";
import {
  VEHICLE_IMPORT_TEMPLATE_CSV,
  EXPENSE_IMPORT_TEMPLATE_CSV,
  SALES_IMPORT_TEMPLATE_CSV,
  downloadCsvTemplate,
} from "@/lib/templates/spreadsheet-templates";
import {
  importVehiclesAction,
  importExpensesAction,
  ParsedVehicleRow,
  ParsedExpenseRow,
} from "@/app/actions/import-data";
import { cleanNumber } from "@/lib/utils/spreadsheet-parser";

export function ImportSpreadsheetPanel() {
  const [activeImportType, setActiveImportType] = useState<"VEHICLES" | "EXPENSES">("VEHICLES");
  const [pastedText, setPastedText] = useState("");
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Import options
  const [onDuplicate, setOnDuplicate] = useState<"SKIP" | "UPDATE">("SKIP");
  const [recordCashExpense, setRecordCashExpense] = useState(false);

  // Helper parsing CSV atau TSV dari Excel / Google Sheets
  const parseSpreadsheetData = (text: string, type: "VEHICLES" | "EXPENSES") => {
    setParsingError(null);
    setResultMessage(null);

    if (!text.trim()) {
      setParsedRows([]);
      return;
    }

    const lines = text
      .trim()
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      setParsingError("Data spreadsheet minimal harus memiliki 1 baris judul kolom (header) dan 1 baris data.");
      setParsedRows([]);
      return;
    }

    // Deteksi pemisah: Tab (\t), Titik Koma (;), atau Koma (,)
    const firstLine = lines[0];
    let delimiter = ",";
    if (firstLine.includes("\t")) {
      delimiter = "\t";
    } else if (firstLine.includes(";") && !firstLine.includes(",")) {
      delimiter = ";";
    }

    const headers = lines[0].split(delimiter).map((h) => h.trim().toLowerCase());
    const rowsData = lines.slice(1);

    if (type === "VEHICLES") {
      const parsed: ParsedVehicleRow[] = [];

      for (let i = 0; i < rowsData.length; i++) {
        const cols = rowsData[i].split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ""));
        if (cols.length < 3) continue;

        // Cari index kolom berdasarkan nama header atau index default
        const getCol = (possibleHeaders: string[], fallbackIdx: number) => {
          for (const ph of possibleHeaders) {
            const idx = headers.findIndex((h) => h.includes(ph));
            if (idx !== -1 && cols[idx] !== undefined) return cols[idx];
          }
          return cols[fallbackIdx] || "";
        };

        const plate = getCol(["plat", "nopol", "nomor polisi"], 0);
        const brand = getCol(["merk", "brand", "pabrikan"], 1);
        const model = getCol(["model", "tipe", "seri"], 2);
        const year = Number(getCol(["tahun", "thn"], 3)) || new Date().getFullYear();
        const color = getCol(["warna", "colour"], 4) || "Hitam";
        const transRaw = getCol(["transmisi", "trans"], 5).toUpperCase();
        const odo = cleanNumber(getCol(["kilometer", "km", "odometer"], 6)) || 20000;
        const cc = cleanNumber(getCol(["kapasitas mesin", "cc", "mesin"], 7)) || 1500;
        const buyDate = getCol(["tanggal beli", "tgl beli", "tanggal"], 8) || new Date().toISOString().split("T")[0];
        const buyPrice = cleanNumber(getCol(["harga beli", "beli", "purchase"], 9));
        const targetPrice = cleanNumber(getCol(["target jual", "target", "harga jual"], 10)) || buyPrice * 1.15;
        const minPrice = cleanNumber(getCol(["batas bawah", "min jual", "bottom"], 11)) || buyPrice * 1.08;
        const bpkbRaw = getCol(["status bpkb", "bpkb"], 12).toUpperCase();
        const statusRaw = getCol(["status unit", "status"], 13).toUpperCase();
        const sourceRaw = getCol(["sumber", "source"], 14).toUpperCase();
        const loc = getCol(["lokasi", "location"], 15) || "Garasi Utama";
        const notes = getCol(["catatan", "keterangan", "notes"], 16) || "";

        // Normalisasi transmisi
        let transmission: "MANUAL" | "AUTOMATIC" | "CVT" | "DCT" = "AUTOMATIC";
        if (transRaw.includes("MAN")) transmission = "MANUAL";
        else if (transRaw.includes("CVT")) transmission = "CVT";
        else if (transRaw.includes("DCT")) transmission = "DCT";

        // Normalisasi BPKB
        let bpkbStatus: "READY" | "PROCESS_1_2_WEEKS" | "LOST_NEED_REPLACEMENT" | "MUTATION_REQUIRED" = "READY";
        if (bpkbRaw.includes("PROSES") || bpkbRaw.includes("LEASING") || bpkbRaw.includes("PROCESS")) {
          bpkbStatus = "PROCESS_1_2_WEEKS";
        }

        // Normalisasi status unit
        let status: "INTAKE" | "IN_REPAIR" | "READY_FOR_SALE" | "BOOKED" | "AT_SHOWROOM_PENDING" | "SOLD_SETTLED" = "READY_FOR_SALE";
        if (statusRaw.includes("INTAKE") || statusRaw.includes("BARU")) status = "INTAKE";
        else if (statusRaw.includes("REPAIR") || statusRaw.includes("BENGKEL") || statusRaw.includes("CAT")) status = "IN_REPAIR";
        else if (statusRaw.includes("TERJUAL") || statusRaw.includes("SOLD") || statusRaw.includes("LUNAS")) status = "SOLD_SETTLED";
        else if (statusRaw.includes("BOOK")) status = "BOOKED";

        if (plate && brand && model) {
          parsed.push({
            plateNumber: plate.toUpperCase(),
            brand,
            model,
            year,
            color,
            transmission,
            odometer: odo,
            engineCapacity: cc,
            purchaseDate: buyDate,
            purchasePrice: buyPrice,
            targetSellingPrice: targetPrice,
            minSellingPrice: minPrice,
            bpkbStatus,
            status,
            sourceType: sourceRaw.includes("AUCTION") || sourceRaw.includes("LELANG") ? "AUCTION" : "DIRECT_BUY",
            currentLocation: loc,
            notes,
          });
        }
      }

      setParsedRows(parsed);
      if (parsed.length === 0) {
        setParsingError("Gagal membaca baris data. Pastikan kolom memiliki Plat Nomor, Merk, dan Model.");
      }
    } else {
      // Parsing Biaya Perbaikan (Expenses)
      const parsedExpenses: ParsedExpenseRow[] = [];
      for (let i = 0; i < rowsData.length; i++) {
        const cols = rowsData[i].split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ""));
        if (cols.length < 3) continue;

        const plate = cols[0] || "";
        const catRaw = (cols[1] || "").toUpperCase();
        const desc = cols[2] || "Biaya perbaikan";
        const amount = cleanNumber(cols[3] || 0);
        const date = cols[4] || new Date().toISOString().split("T")[0];
        const vendor = cols[5] || "";

        let category: any = "OTHER";
        if (catRaw.includes("SALON") || catRaw.includes("POLES") || catRaw.includes("DETAIL")) category = "DETAILING_SALON";
        else if (catRaw.includes("CAT") || catRaw.includes("BODY") || catRaw.includes("SOL")) category = "BODY_PAINT";
        else if (catRaw.includes("OLI") || catRaw.includes("SERVICE") || catRaw.includes("SERVIS")) category = "OIL_AND_SERVICE";
        else if (catRaw.includes("SPARE") || catRaw.includes("PART") || catRaw.includes("ONDERDIL")) category = "SPAREPARTS";

        if (plate && amount > 0) {
          parsedExpenses.push({
            plateNumber: plate.toUpperCase(),
            category,
            description: desc,
            amount,
            date,
            vendorName: vendor,
          });
        }
      }
      setParsedRows(parsedExpenses);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        setPastedText(content);
        parseSpreadsheetData(content, activeImportType);
      }
    };
    reader.readAsText(file);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setPastedText(text);
    parseSpreadsheetData(text, activeImportType);
  };

  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) return;

    setLoading(true);
    setResultMessage(null);

    if (activeImportType === "VEHICLES") {
      const res = await importVehiclesAction(parsedRows, {
        onDuplicate,
        recordCashExpense,
      });
      setLoading(false);

      if (res.success) {
        setResultMessage({ type: "success", text: res.message || "Impor berhasil!" });
        setPastedText("");
        setParsedRows([]);
      } else {
        setResultMessage({ type: "error", text: res.error || "Gagal mengimpor data." });
      }
    } else {
      const res = await importExpensesAction(parsedRows);
      setLoading(false);

      if (res.success) {
        setResultMessage({ type: "success", text: res.message || "Impor biaya berhasil!" });
        setPastedText("");
        setParsedRows([]);
      } else {
        setResultMessage({ type: "error", text: res.error || "Gagal mengimpor biaya." });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* ── HEADER & TEMPLATE DOWNLOADS ── */}
      <div className="bg-white rounded-2xl border border-[#D9D4CB] p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EBE7E1] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#D97706]/10 text-[#D97706] flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#1C1917] tracking-tight">
                Import & Migrasi Data Spreadsheet Lama
              </h3>
              <p className="text-xs text-[#6B6560] mt-0.5">
                Migrasikan ribuan baris data mobil, harga beli, dan catatan servis dari Microsoft Excel atau Google Sheets.
              </p>
            </div>
          </div>

          {/* Download Template Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() =>
                downloadCsvTemplate(
                  "template-inventori-mobil-nurmobil.csv",
                  VEHICLE_IMPORT_TEMPLATE_CSV
                )
              }
              className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Download file template Excel/CSV siap pakai"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Download Template Mobil (Excel)</span>
            </button>

            <button
              onClick={() =>
                downloadCsvTemplate(
                  "template-biaya-servis-nurmobil.csv",
                  EXPENSE_IMPORT_TEMPLATE_CSV
                )
              }
              className="flex items-center gap-1.5 bg-white hover:bg-[#F7F5F2] border border-[#D9D4CB] text-[#1C1917] px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
              title="Download template biaya servis/salon"
            >
              <Download className="w-3.5 h-3.5 text-[#D97706]" />
              <span>Template Biaya Servis</span>
            </button>
          </div>
        </div>

        {/* Step Guide */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#6B6560]">
          <div className="p-3 bg-[#F7F5F2] rounded-xl border border-[#EBE7E1] space-y-1">
            <strong className="text-[#1C1917] font-bold block">1. Download Template</strong>
            <p>Klik tombol download di atas untuk mendapatkan contoh template dengan judul kolom standar.</p>
          </div>
          <div className="p-3 bg-[#F7F5F2] rounded-xl border border-[#EBE7E1] space-y-1">
            <strong className="text-[#1C1917] font-bold block">2. Buka di Excel / Google Sheets</strong>
            <p>Buka file CSV, salin (copy) baris-baris data mobil lama Anda, lalu paste ke kotak di bawah.</p>
          </div>
          <div className="p-3 bg-[#F7F5F2] rounded-xl border border-[#EBE7E1] space-y-1">
            <strong className="text-[#1C1917] font-bold block">3. Pratinjau & Simpan</strong>
            <p>Sistem akan memvalidasi format angka, plat, dan tanggal secara otomatis sebelum dimasukkan.</p>
          </div>
        </div>
      </div>

      {/* ── TABS PEMILIHAN DATA ── */}
      <div className="flex border-b border-[#D9D4CB] gap-4 text-sm font-semibold">
        <button
          onClick={() => {
            setActiveImportType("VEHICLES");
            setParsedRows([]);
            setPastedText("");
          }}
          className={cn(
            "pb-3 -mb-px transition-colors cursor-pointer flex items-center gap-2",
            activeImportType === "VEHICLES"
              ? "border-b-2 border-[#D97706] text-[#D97706] font-bold"
              : "text-[#6B6560] hover:text-[#1C1917]"
          )}
        >
          <Car className="w-4 h-4" />
          <span>Import Data Mobil & Harga Beli</span>
        </button>

        <button
          onClick={() => {
            setActiveImportType("EXPENSES");
            setParsedRows([]);
            setPastedText("");
          }}
          className={cn(
            "pb-3 -mb-px transition-colors cursor-pointer flex items-center gap-2",
            activeImportType === "EXPENSES"
              ? "border-b-2 border-[#D97706] text-[#D97706] font-bold"
              : "text-[#6B6560] hover:text-[#1C1917]"
          )}
        >
          <Wrench className="w-4 h-4" />
          <span>Import Biaya Perbaikan / Salon Unit</span>
        </button>
      </div>

      {/* ── UPLOAD FILE & COPY-PASTE BOX ── */}
      <div className="bg-white rounded-2xl border border-[#D9D4CB] p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-bold text-sm text-[#1C1917]">
              {activeImportType === "VEHICLES"
                ? "Masukkan Data Mobil (Upload File atau Paste Teks)"
                : "Masukkan Data Biaya Perbaikan (Upload File atau Paste Teks)"}
            </h4>
            <p className="text-xs text-[#6B6560]">
              Anda dapat mengunggah file <code>.csv</code> atau langsung menempelkan (*Ctrl+V*) baris dari Excel.
            </p>
          </div>

          {/* File Picker */}
          <div>
            <label className="flex items-center gap-2 bg-[#F7F5F2] hover:bg-[#EFECE8] border border-[#D9D4CB] text-[#1C1917] px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-[#D97706]" />
              <span>Pilih File CSV...</span>
              <input
                type="file"
                accept=".csv, .txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Text Area */}
        <textarea
          rows={5}
          placeholder={
            activeImportType === "VEHICLES"
              ? "Tempel (paste) baris data dari Excel di sini...\nContoh:\nPlat Nomor,Merk,Model,Tahun,Warna,Transmisi,Kilometer,Kapasitas Mesin,Tanggal Beli,Harga Beli,Target Jual\nN 8821 CD,Daihatsu,Gran Max,2021,Putih,MANUAL,42000,1500,2026-09-12,95000000,115000000"
              : "Tempel (paste) baris data biaya perbaikan di sini...\nContoh:\nPlat Nomor Mobil,Kategori Biaya,Keterangan Biaya,Nominal Biaya,Tanggal Biaya\nN 8821 CD,DETAILING_SALON,Poles bodi 3 step,650000,2026-09-13"
          }
          value={pastedText}
          onChange={handleTextChange}
          className="w-full p-3.5 border border-[#D9D4CB] rounded-xl text-xs font-mono bg-[#F7F5F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D97706]/20 transition-all leading-relaxed"
        />

        {parsingError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{parsingError}</span>
          </div>
        )}

        {resultMessage && (
          <div
            className={cn(
              "p-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 border transition-all",
              resultMessage.type === "success"
                ? "bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]"
                : "bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]"
            )}
          >
            {resultMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0" />
            )}
            <span>{resultMessage.text}</span>
          </div>
        )}
      </div>

      {/* ── LIVE PREVIEW TABLE ── */}
      {parsedRows.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#D9D4CB] overflow-hidden shadow-xs space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EBE7E1] pb-4">
            <div>
              <h4 className="font-extrabold text-sm text-[#1C1917] flex items-center gap-2">
                <span>Pratinjau Data yang Siap Diimpor</span>
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                  {parsedRows.length} Baris Terbaca
                </span>
              </h4>
              <p className="text-xs text-[#6B6560] mt-0.5">
                Periksa kembali data di bawah sebelum dieksekusi ke database.
              </p>
            </div>

            {/* Import Options for Vehicles */}
            {activeImportType === "VEHICLES" && (
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-2 bg-[#F7F5F2] px-3 py-1.5 rounded-xl border border-[#D9D4CB]">
                  <span className="text-[#6B6560] font-semibold">Jika Plat Sama:</span>
                  <label className="flex items-center gap-1 cursor-pointer font-bold text-[#1C1917]">
                    <input
                      type="radio"
                      name="onDuplicate"
                      checked={onDuplicate === "SKIP"}
                      onChange={() => setOnDuplicate("SKIP")}
                    />
                    <span>Lewati (Skip)</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer font-bold text-[#1C1917]">
                    <input
                      type="radio"
                      name="onDuplicate"
                      checked={onDuplicate === "UPDATE"}
                      onChange={() => setOnDuplicate("UPDATE")}
                    />
                    <span>Perbarui (Update)</span>
                  </label>
                </div>

                <label className="flex items-center gap-2 cursor-pointer font-medium text-[#1C1917]">
                  <input
                    type="checkbox"
                    checked={recordCashExpense}
                    onChange={(e) => setRecordCashExpense(e.target.checked)}
                    className="rounded text-[#D97706]"
                  />
                  <span>Potong Kas Rekening BCA</span>
                </label>
              </div>
            )}
          </div>

          {/* Table Preview */}
          <div className="overflow-x-auto max-h-96 border border-[#EBE7E1] rounded-xl">
            {activeImportType === "VEHICLES" ? (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#EFECE8] text-[#6B6560] uppercase text-[10px] font-bold tracking-wider sticky top-0 border-b border-[#D9D4CB]">
                  <tr>
                    <th className="py-2.5 px-3">Plat Nomor</th>
                    <th className="py-2.5 px-3">Merk & Model</th>
                    <th className="py-2.5 px-3">Tahun</th>
                    <th className="py-2.5 px-3">Transmisi</th>
                    <th className="py-2.5 px-3 text-right">Harga Beli</th>
                    <th className="py-2.5 px-3 text-right">Target Jual</th>
                    <th className="py-2.5 px-3">Status BPKB</th>
                    <th className="py-2.5 px-3">Status Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBE7E1]">
                  {parsedRows.map((row: ParsedVehicleRow, idx) => (
                    <tr key={idx} className="hover:bg-[#F7F5F2]">
                      <td className="py-2.5 px-3 font-bold text-[#1C1917] whitespace-nowrap">{row.plateNumber}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">{row.brand} {row.model}</td>
                      <td className="py-2.5 px-3">{row.year}</td>
                      <td className="py-2.5 px-3">
                        <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded font-bold">
                          {row.transmission}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium">{formatRupiah(row.purchasePrice)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700">{formatRupiah(row.targetSellingPrice || 0)}</td>
                      <td className="py-2.5 px-3">
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                          row.bpkbStatus === "READY" ? "bg-emerald-100 text-emerald-800" : "bg-purple-100 text-purple-800"
                        )}>
                          {row.bpkbStatus}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full font-bold">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#EFECE8] text-[#6B6560] uppercase text-[10px] font-bold tracking-wider sticky top-0 border-b border-[#D9D4CB]">
                  <tr>
                    <th className="py-2.5 px-3">Plat Mobil</th>
                    <th className="py-2.5 px-3">Kategori Biaya</th>
                    <th className="py-2.5 px-3">Keterangan</th>
                    <th className="py-2.5 px-3 text-right">Nominal</th>
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">Bengkel / Vendor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBE7E1]">
                  {parsedRows.map((row: ParsedExpenseRow, idx) => (
                    <tr key={idx} className="hover:bg-[#F7F5F2]">
                      <td className="py-2.5 px-3 font-bold text-[#1C1917] whitespace-nowrap">{row.plateNumber}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full font-bold">
                          {row.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">{row.description}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-rose-700">{formatRupiah(row.amount)}</td>
                      <td className="py-2.5 px-3">{row.date}</td>
                      <td className="py-2.5 px-3 text-[#6B6560]">{row.vendorName || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Action Button */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-[#6B6560]">
              Periksa kecocokan kolom. Jika sudah pas, klik tombol di sebelah kanan.
            </span>

            <button
              onClick={handleExecuteImport}
              disabled={loading}
              className="flex items-center gap-2 bg-[#D97706] hover:bg-[#B45309] text-white px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              <span>
                {loading
                  ? "Sedang Mengimpor Data..."
                  : `Mulai Impor ${parsedRows.length} Data ke Showroom`}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
