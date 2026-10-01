"use client";

import React, { useState } from "react";
import {
  KeyRound,
  Sparkles,
  ShieldCheck,
  Send,
  MessageSquare,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Bot,
  Zap,
  Save,
  HelpCircle,
  Check,
  Power,
  CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SettingItem,
  saveSystemSettingsBatchAction,
  saveSingleServiceAction,
  toggleSystemSettingAction,
  testGeminiApiKeyAction,
  testTelegramBotAction,
} from "@/app/actions/setting";

interface ApiKeySettingsProps {
  initialSettings: SettingItem[];
}

function ToggleSwitch({
  enabled,
  onChange,
  disabled,
  label,
}: {
  enabled: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={cn(
          "text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full flex items-center gap-1.5 transition-all tracking-wider",
          enabled
            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
            : "bg-stone-100 text-stone-500 border border-stone-300"
        )}
      >
        <span
          className={cn(
            "w-2 h-2 rounded-full",
            enabled ? "bg-emerald-600 animate-pulse" : "bg-stone-400"
          )}
        />
        {enabled ? "AKTIF" : "NONAKTIF"}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={disabled}
        onClick={() => onChange(!enabled)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50",
          enabled ? "bg-emerald-600" : "bg-stone-300"
        )}
        title={label || (enabled ? "Klik untuk menonaktifkan" : "Klik untuk mengaktifkan")}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
            enabled ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}

export function ApiKeySettingsClient({ initialSettings }: ApiKeySettingsProps) {
  const [settings, setSettings] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    initialSettings.forEach((item) => {
      map[item.key] = item.value;
    });
    return map;
  });

  const [showSecretMap, setShowSecretMap] = useState<Record<string, boolean>>({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [savingService, setSavingService] = useState<string | null>(null);
  const [testingGemini, setTestingGemini] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);

  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [testResult, setTestResult] = useState<{
    target: "gemini" | "telegram";
    success: boolean;
    message: string;
  } | null>(null);

  const showNotification = (message: string, type: "success" | "error") => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 5000);
  };

  const toggleShowSecret = (key: string) => {
    setShowSecretMap((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleInputChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Helper cek status aktif toggle switch
  const isEnabled = (key: string, defaultVal: boolean = false) => {
    if (settings[key] === undefined) {
      const item = initialSettings.find((s) => s.key === key);
      if (item && item.value) return item.value === "true";
      return defaultVal;
    }
    return settings[key] === "true";
  };

  // Handler toggle switch instan
  const handleToggle = async (key: string, currentVal: boolean, serviceName: string) => {
    const newVal = !currentVal;
    setSettings((prev) => ({ ...prev, [key]: newVal ? "true" : "false" }));

    const res = await toggleSystemSettingAction(key, newVal);
    if (res.success) {
      showNotification(`${serviceName} kini ${newVal ? "Diaktifkan (ON)" : "Dinonaktifkan (OFF)"}. Dashboard diperbarui!`, "success");
    } else {
      showNotification(res.error || "Gagal mengubah status", "error");
      setSettings((prev) => ({ ...prev, [key]: currentVal ? "true" : "false" }));
    }
  };

  // Simpan parsial per layanan kartu
  const handleSaveSingleCard = async (
    serviceId: string,
    serviceTitle: string,
    keys: Array<{ key: string; isSecret?: boolean }>
  ) => {
    setSavingService(serviceId);
    const items = keys.map((k) => ({
      key: k.key,
      value: settings[k.key] ?? "",
      isSecret: k.isSecret,
    }));

    const res = await saveSingleServiceAction(items);
    setSavingService(null);

    if (res.success) {
      showNotification(`Konfigurasi ${serviceTitle} berhasil disimpan & diterapkan!`, "success");
    } else {
      showNotification(res.error || "Gagal menyimpan konfigurasi", "error");
    }
  };

  // Simpan Semua Sekaligus
  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);

    const payload = initialSettings.map((item) => ({
      key: item.key,
      value: settings[item.key] ?? "",
      group: item.group,
      label: item.label,
      isSecret: item.isSecret,
    }));

    const res = await saveSystemSettingsBatchAction(payload);
    setSaveLoading(false);

    if (res.success) {
      showNotification("Semua Kunci API & Pengaturan Integrasi berhasil disimpan dan aktif!", "success");
    } else {
      showNotification(res.error || "Gagal menyimpan pengaturan", "error");
    }
  };

  const handleTestGemini = async () => {
    setTestingGemini(true);
    setTestResult(null);

    const apiKey = settings["GEMINI_API_KEY"];
    const res = await testGeminiApiKeyAction(apiKey);
    setTestingGemini(false);

    setTestResult({
      target: "gemini",
      success: res.success,
      message: res.success ? (res.message || "Koneksi Google Gemini Sukses! Model merespon dengan baik.") : (res.error || "Koneksi gagal"),
    });
  };

  const handleTestTelegram = async () => {
    setTestingTelegram(true);
    setTestResult(null);

    const token = settings["TELEGRAM_BOT_TOKEN"];
    const chatId = settings["TELEGRAM_CHAT_ID"];
    const res = await testTelegramBotAction(token, chatId);
    setTestingTelegram(false);

    setTestResult({
      target: "telegram",
      success: res.success,
      message: res.success ? (res.message || "Koneksi Telegram Sukses!") : (res.error || "Koneksi gagal"),
    });
  };

  const getSettingItem = (key: string) => initialSettings.find((s) => s.key === key);

  return (
    <form onSubmit={handleSaveAll} className="space-y-8">
      {/* Toast Notification */}
      {feedback && (
        <div
          className={cn(
            "p-4 rounded-xl text-sm font-medium flex items-center justify-between border shadow-sm transition-all",
            feedback.type === "success"
              ? "bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]"
              : "bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]"
          )}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs underline hover:opacity-80 cursor-pointer font-bold ml-4"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Test Result Banner */}
      {testResult && (
        <div
          className={cn(
            "p-4 rounded-2xl border text-xs sm:text-sm font-medium flex items-start justify-between gap-3 shadow-sm",
            testResult.success
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          )}
        >
          <div className="flex items-start gap-2.5">
            {testResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            )}
            <div>
              <strong className="font-bold block">
                {testResult.target === "gemini" ? "Hasil Pengujian Google Gemini AI:" : "Hasil Pengujian Telegram Bot:"}
              </strong>
              <p className="mt-0.5 leading-relaxed">{testResult.message}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTestResult(null)}
            className="text-xs underline hover:opacity-80 shrink-0 cursor-pointer font-bold"
          >
            Tutup
          </button>
        </div>
      )}

      {/* =========================================================================
          SEKSI 1: GOOGLE GEMINI AI (DECISION MAKING & ASISTEN SHOWROOM)
          ========================================================================= */}
      <div className="bg-white rounded-3xl border border-[#D9D4CB] p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EBE7E1] pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-amber-500 text-white flex items-center justify-center shadow-md shadow-purple-500/20 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-[#1C1917] text-base sm:text-lg">
                  Google Gemini AI (Asisten Keputusan & Briefing)
                </h3>
                <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">
                  Versi Free (1500 req/hari)
                </span>
              </div>
              <p className="text-xs text-[#6B6560] mt-0.5">
                Menganalisa perputaran kas, stok unit macet, reminder BPKB, dan rekomendasi beli unit di Dashboard Utama.
              </p>
            </div>
          </div>

          {/* Toggle Switch & Card Actions */}
          <div className="flex items-center gap-3 self-end md:self-center flex-wrap">
            <ToggleSwitch
              enabled={isEnabled("GEMINI_ENABLED", true)}
              onChange={(val) => handleToggle("GEMINI_ENABLED", isEnabled("GEMINI_ENABLED", true), "Google Gemini AI")}
              label="Sakelar On/Off Gemini AI"
            />
            <button
              type="button"
              onClick={() =>
                handleSaveSingleCard("gemini", "Gemini AI", [
                  { key: "GEMINI_ENABLED" },
                  { key: "GEMINI_API_KEY", isSecret: true },
                  { key: "GEMINI_MODEL" },
                ])
              }
              disabled={savingService === "gemini"}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#D97706] hover:bg-[#B45309] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingService === "gemini" ? "Menyimpan..." : "Simpan Gemini"}</span>
            </button>
          </div>
        </div>

        {/* Input Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Gemini API Key */}
          <div className="md:col-span-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1C1917] uppercase tracking-wider flex items-center gap-1.5">
                <span>Gemini API Key</span>
                <span className="text-red-500">*</span>
              </label>
              {getSettingItem("GEMINI_API_KEY")?.isSet && (
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200 flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" />
                  Kunci Tersimpan di Database
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type={showSecretMap["GEMINI_API_KEY"] ? "text" : "password"}
                placeholder={getSettingItem("GEMINI_API_KEY")?.maskedValue || "Tempelkan API Key (AIzaSy...)"}
                value={settings["GEMINI_API_KEY"] || ""}
                onChange={(e) => handleInputChange("GEMINI_API_KEY", e.target.value)}
                className="w-full pl-3 pr-10 py-2.5 border border-[#D9D4CB] rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20 bg-[#F7F5F2] focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => toggleShowSecret("GEMINI_API_KEY")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6560] hover:text-[#1C1917] cursor-pointer"
                title={showSecretMap["GEMINI_API_KEY"] ? "Sembunyikan" : "Tampilkan"}
              >
                {showSecretMap["GEMINI_API_KEY"] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#6B6560] pt-0.5">
              <span>Kosongkan jika tidak ingin mengubah kunci yang sudah tersimpan.</span>
              <div className="flex items-center gap-3">
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#D97706] hover:underline font-semibold"
                >
                  <span>Dapatkan Kunci Gratis</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  type="button"
                  onClick={handleTestGemini}
                  disabled={testingGemini}
                  className="inline-flex items-center gap-1 text-purple-700 hover:text-purple-900 font-bold underline cursor-pointer"
                >
                  <Zap className="w-3 h-3 text-purple-600" />
                  <span>{testingGemini ? "Menguji..." : "Tes Koneksi"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Gemini Model */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1C1917] uppercase tracking-wider block">
              Pilihan Model AI
            </label>
            <select
              value={settings["GEMINI_MODEL"] || "gemini-2.5-flash"}
              onChange={(e) => handleInputChange("GEMINI_MODEL", e.target.value)}
              className="w-full p-2.5 border border-[#D9D4CB] rounded-xl text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="gemini-2.5-flash">gemini-2.5-flash (Rekomendasi: Tercepat & Cerdas)</option>
              <option value="gemini-flash-latest">gemini-flash-latest (Versi Selalu Terkini)</option>
              <option value="gemini-2.5-pro">gemini-2.5-pro (Penalaran Kompleks & Mendalam)</option>
              <option value="gemini-3-flash-preview">gemini-3-flash-preview (Next-Gen Preview)</option>
            </select>
            <p className="text-[11px] text-[#6B6560]">
              Disarankan <code>gemini-2.5-flash</code> untuk kecepatan kilat dan kuota gratis terbesar.
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SEKSI 2: GOOGLE RECAPTCHA (KEAMANAN FORM & LOGIN)
          ========================================================================= */}
      <div className="bg-white rounded-3xl border border-[#D9D4CB] p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EBE7E1] pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-[#1C1917] text-base sm:text-lg">
                  Google reCAPTCHA (Proteksi Bot, Form & Login)
                </h3>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                  v2 / v3
                </span>
              </div>
              <p className="text-xs text-[#6B6560] mt-0.5">
                Mencegah bot spam mengirim pesan palsu pada katalog showroom dan melindungi halaman login dari brute-force.
              </p>
            </div>
          </div>

          {/* Toggle Switch & Card Actions */}
          <div className="flex items-center gap-3 self-end md:self-center flex-wrap">
            <ToggleSwitch
              enabled={isEnabled("RECAPTCHA_ENABLED", false)}
              onChange={(val) => handleToggle("RECAPTCHA_ENABLED", isEnabled("RECAPTCHA_ENABLED", false), "Google reCAPTCHA")}
              label="Sakelar On/Off Proteksi reCAPTCHA"
            />
            <button
              type="button"
              onClick={() =>
                handleSaveSingleCard("recaptcha", "Google reCAPTCHA", [
                  { key: "RECAPTCHA_ENABLED" },
                  { key: "RECAPTCHA_ON_LOGIN" },
                  { key: "RECAPTCHA_ON_INQUIRIES" },
                  { key: "RECAPTCHA_SITE_KEY" },
                  { key: "RECAPTCHA_SECRET_KEY", isSecret: true },
                ])
              }
              disabled={savingService === "recaptcha"}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingService === "recaptcha" ? "Menyimpan..." : "Simpan reCAPTCHA"}</span>
            </button>
          </div>
        </div>

        {/* Sub-toggles / Scope Proteksi */}
        <div className="bg-[#F7F5F2] border border-[#EBE7E1] rounded-2xl p-4 space-y-3">
          <span className="text-xs font-bold text-[#1C1917] uppercase tracking-wider block">
            Cakupan Proteksi reCAPTCHA:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <label className="flex items-start gap-2.5 cursor-pointer select-none bg-white p-3 rounded-xl border border-[#D9D4CB]">
              <input
                type="checkbox"
                checked={isEnabled("RECAPTCHA_ON_LOGIN", true)}
                onChange={(e) => handleInputChange("RECAPTCHA_ON_LOGIN", e.target.checked ? "true" : "false")}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
              />
              <div>
                <strong className="text-[#1C1917] block font-bold">Halaman Login Admin & Investor</strong>
                <span className="text-[#6B6560] text-[11px] block mt-0.5">
                  Mencegah robot pembobol password dan serangan brute-force login.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer select-none bg-white p-3 rounded-xl border border-[#D9D4CB]">
              <input
                type="checkbox"
                checked={isEnabled("RECAPTCHA_ON_INQUIRIES", true)}
                onChange={(e) => handleInputChange("RECAPTCHA_ON_INQUIRIES", e.target.checked ? "true" : "false")}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
              />
              <div>
                <strong className="text-[#1C1917] block font-bold">Form Kontak & Komentar Katalog Publik</strong>
                <span className="text-[#6B6560] text-[11px] block mt-0.5">
                  Menyaring form pesan WhatsApp palsu, formulir penawaran, dan spam bot komentar.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Input Keys */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Site Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1C1917] uppercase tracking-wider">
                reCAPTCHA Site Key (Kunci Publik)
              </label>
              {getSettingItem("RECAPTCHA_SITE_KEY")?.isSet && (
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                  Tersimpan
                </span>
              )}
            </div>
            <input
              type="text"
              placeholder="Contoh: 6Ld..."
              value={settings["RECAPTCHA_SITE_KEY"] || ""}
              onChange={(e) => handleInputChange("RECAPTCHA_SITE_KEY", e.target.value)}
              className="w-full px-3 py-2.5 border border-[#D9D4CB] rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-[#F7F5F2] focus:bg-white transition-all"
            />
            <div className="flex items-center justify-between text-[11px] text-[#6B6560]">
              <span>Kunci publik untuk memuat widget di sisi browser.</span>
              <a
                href="https://www.google.com/recaptcha/admin"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:underline font-semibold"
              >
                <span>Daftar reCAPTCHA</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Secret Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1C1917] uppercase tracking-wider">
                reCAPTCHA Secret Key (Kunci Rahasia)
              </label>
              {getSettingItem("RECAPTCHA_SECRET_KEY")?.isSet && (
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                  Tersimpan di Sistem
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type={showSecretMap["RECAPTCHA_SECRET_KEY"] ? "text" : "password"}
                placeholder={getSettingItem("RECAPTCHA_SECRET_KEY")?.maskedValue || "Contoh: 6Ld..."}
                value={settings["RECAPTCHA_SECRET_KEY"] || ""}
                onChange={(e) => handleInputChange("RECAPTCHA_SECRET_KEY", e.target.value)}
                className="w-full pl-3 pr-10 py-2.5 border border-[#D9D4CB] rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-[#F7F5F2] focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => toggleShowSecret("RECAPTCHA_SECRET_KEY")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6560] hover:text-[#1C1917] cursor-pointer"
                title={showSecretMap["RECAPTCHA_SECRET_KEY"] ? "Sembunyikan" : "Tampilkan"}
              >
                {showSecretMap["RECAPTCHA_SECRET_KEY"] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-[#6B6560]">
              Kunci rahasia server untuk memverifikasi validitas token pengunjung.
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SEKSI 3: TELEGRAM BOT NOTIFIKASI HP OWNER (100% GRATIS)
          ========================================================================= */}
      <div className="bg-white rounded-3xl border border-[#D9D4CB] p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EBE7E1] pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-md shadow-sky-500/20 shrink-0">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-[#1C1917] text-base sm:text-lg">
                  Telegram Bot Notifikasi (Langsung ke HP)
                </h3>
                <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-bold">
                  Gratis 100% & Realtime
                </span>
              </div>
              <p className="text-xs text-[#6B6560] mt-0.5">
                Menerima notifikasi instan langsung di aplikasi Telegram HP Anda saat ada mobil laku, alarm BPKB, atau reminder servis.
              </p>
            </div>
          </div>

          {/* Toggle Switch & Card Actions */}
          <div className="flex items-center gap-3 self-end md:self-center flex-wrap">
            <ToggleSwitch
              enabled={isEnabled("TELEGRAM_ENABLED", false)}
              onChange={(val) => handleToggle("TELEGRAM_ENABLED", isEnabled("TELEGRAM_ENABLED", false), "Telegram Bot Notifikasi")}
              label="Sakelar On/Off Notifikasi Telegram"
            />
            <button
              type="button"
              onClick={() =>
                handleSaveSingleCard("telegram", "Telegram Bot", [
                  { key: "TELEGRAM_ENABLED" },
                  { key: "TELEGRAM_BOT_TOKEN", isSecret: true },
                  { key: "TELEGRAM_CHAT_ID" },
                ])
              }
              disabled={savingService === "telegram"}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingService === "telegram" ? "Menyimpan..." : "Simpan Telegram"}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Bot Token */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1C1917] uppercase tracking-wider">
                Telegram Bot Token
              </label>
              {getSettingItem("TELEGRAM_BOT_TOKEN")?.isSet && (
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                  Tersimpan di Sistem
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type={showSecretMap["TELEGRAM_BOT_TOKEN"] ? "text" : "password"}
                placeholder={getSettingItem("TELEGRAM_BOT_TOKEN")?.maskedValue || "Contoh: 1234567890:ABCdef..."}
                value={settings["TELEGRAM_BOT_TOKEN"] || ""}
                onChange={(e) => handleInputChange("TELEGRAM_BOT_TOKEN", e.target.value)}
                className="w-full pl-3 pr-10 py-2.5 border border-[#D9D4CB] rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/20 bg-[#F7F5F2] focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => toggleShowSecret("TELEGRAM_BOT_TOKEN")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6560] hover:text-[#1C1917] cursor-pointer"
                title={showSecretMap["TELEGRAM_BOT_TOKEN"] ? "Sembunyikan" : "Tampilkan"}
              >
                {showSecretMap["TELEGRAM_BOT_TOKEN"] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-[#6B6560]">
              Dapatkan token bot dengan membuka chat dengan <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-sky-600 underline font-semibold">@BotFather</a> di Telegram.
            </p>
          </div>

          {/* Owner Chat ID */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1C1917] uppercase tracking-wider">
                Chat ID Telegram HP Anda
              </label>
              {getSettingItem("TELEGRAM_CHAT_ID")?.isSet && (
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                  Terpasang
                </span>
              )}
            </div>
            <input
              type="text"
              placeholder="Contoh: 987654321"
              value={settings["TELEGRAM_CHAT_ID"] || ""}
              onChange={(e) => handleInputChange("TELEGRAM_CHAT_ID", e.target.value)}
              className="w-full px-3 py-2.5 border border-[#D9D4CB] rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/20 bg-[#F7F5F2] focus:bg-white transition-all"
            />
            <div className="flex items-center justify-between text-[11px] text-[#6B6560]">
              <span>Cek ID Anda lewat bot <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="text-sky-600 underline font-semibold">@userinfobot</a>.</span>
              <button
                type="button"
                onClick={handleTestTelegram}
                disabled={testingTelegram}
                className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-800 font-bold underline cursor-pointer"
              >
                <Zap className="w-3 h-3 text-sky-500" />
                <span>{testingTelegram ? "Mengirim..." : "Kirim Uji Coba ke HP"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SEKSI 4: WHATSAPP GATEWAY (FONNTE / WAHA / WABLAS)
          ========================================================================= */}
      <div className="bg-white rounded-3xl border border-[#D9D4CB] p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EBE7E1] pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-[#1C1917] text-base sm:text-lg">
                  WhatsApp Gateway Endpoint
                </h3>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  Kuitansi & Notifikasi WA
                </span>
              </div>
              <p className="text-xs text-[#6B6560] mt-0.5">
                Kirim kuitansi PDF otomatis ke pembeli dan update bagi hasil berkala ke investor via nomor WhatsApp.
              </p>
            </div>
          </div>

          {/* Toggle Switch & Card Actions */}
          <div className="flex items-center gap-3 self-end md:self-center flex-wrap">
            <ToggleSwitch
              enabled={isEnabled("WHATSAPP_ENABLED", false)}
              onChange={(val) => handleToggle("WHATSAPP_ENABLED", isEnabled("WHATSAPP_ENABLED", false), "WhatsApp Gateway")}
              label="Sakelar On/Off Notifikasi WhatsApp"
            />
            <button
              type="button"
              onClick={() =>
                handleSaveSingleCard("whatsapp", "WhatsApp Gateway", [
                  { key: "WHATSAPP_ENABLED" },
                  { key: "WHATSAPP_GATEWAY_URL" },
                  { key: "WHATSAPP_API_KEY", isSecret: true },
                ])
              }
              disabled={savingService === "whatsapp"}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingService === "whatsapp" ? "Menyimpan..." : "Simpan WhatsApp"}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Gateway URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1C1917] uppercase tracking-wider block">
              Gateway Endpoint URL
            </label>
            <input
              type="text"
              placeholder="https://api.fonnte.com/send atau http://localhost:3001/send"
              value={settings["WHATSAPP_GATEWAY_URL"] || ""}
              onChange={(e) => handleInputChange("WHATSAPP_GATEWAY_URL", e.target.value)}
              className="w-full px-3 py-2.5 border border-[#D9D4CB] rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-[#F7F5F2] focus:bg-white transition-all"
            />
          </div>

          {/* API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1C1917] uppercase tracking-wider">
                WhatsApp API Key / Token
              </label>
              {getSettingItem("WHATSAPP_API_KEY")?.isSet && (
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                  Tersimpan di Sistem
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type={showSecretMap["WHATSAPP_API_KEY"] ? "text" : "password"}
                placeholder={getSettingItem("WHATSAPP_API_KEY")?.maskedValue || "Token WA Gateway..."}
                value={settings["WHATSAPP_API_KEY"] || ""}
                onChange={(e) => handleInputChange("WHATSAPP_API_KEY", e.target.value)}
                className="w-full pl-3 pr-10 py-2.5 border border-[#D9D4CB] rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-[#F7F5F2] focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => toggleShowSecret("WHATSAPP_API_KEY")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6560] hover:text-[#1C1917] cursor-pointer"
                title={showSecretMap["WHATSAPP_API_KEY"] ? "Sembunyikan" : "Tampilkan"}
              >
                {showSecretMap["WHATSAPP_API_KEY"] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SEKSI 5: PAYMENT GATEWAY (MIDTRANS ONLINE PAYMENT)
          ========================================================================= */}
      <div className="bg-white rounded-3xl border border-[#D9D4CB] p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EBE7E1] pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-600/20 shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-[#1C1917] text-base sm:text-lg">
                  Payment Gateway (Midtrans QRIS & Virtual Account)
                </h3>
                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                  Snap Payment
                </span>
              </div>
              <p className="text-xs text-[#6B6560] mt-0.5">
                Menerima pembayaran tanda jadi (booking fee) dan pelunasan unit secara otomatis via QRIS / VA perbankan.
              </p>
            </div>
          </div>

          {/* Toggle Switch & Card Actions */}
          <div className="flex items-center gap-3 self-end md:self-center flex-wrap">
            <ToggleSwitch
              enabled={isEnabled("MIDTRANS_ENABLED", false)}
              onChange={(val) => handleToggle("MIDTRANS_ENABLED", isEnabled("MIDTRANS_ENABLED", false), "Midtrans Payment Gateway")}
              label="Sakelar On/Off Midtrans"
            />
            <button
              type="button"
              onClick={() =>
                handleSaveSingleCard("midtrans", "Midtrans Payment", [
                  { key: "MIDTRANS_ENABLED" },
                  { key: "MIDTRANS_SERVER_KEY", isSecret: true },
                  { key: "MIDTRANS_CLIENT_KEY" },
                ])
              }
              disabled={savingService === "midtrans"}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingService === "midtrans" ? "Menyimpan..." : "Simpan Midtrans"}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Server Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1C1917] uppercase tracking-wider">
                Midtrans Server Key
              </label>
              {getSettingItem("MIDTRANS_SERVER_KEY")?.isSet && (
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                  Tersimpan di Sistem
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type={showSecretMap["MIDTRANS_SERVER_KEY"] ? "text" : "password"}
                placeholder={getSettingItem("MIDTRANS_SERVER_KEY")?.maskedValue || "SB-Mid-server-..."}
                value={settings["MIDTRANS_SERVER_KEY"] || ""}
                onChange={(e) => handleInputChange("MIDTRANS_SERVER_KEY", e.target.value)}
                className="w-full pl-3 pr-10 py-2.5 border border-[#D9D4CB] rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20 bg-[#F7F5F2] focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => toggleShowSecret("MIDTRANS_SERVER_KEY")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6560] hover:text-[#1C1917] cursor-pointer"
                title={showSecretMap["MIDTRANS_SERVER_KEY"] ? "Sembunyikan" : "Tampilkan"}
              >
                {showSecretMap["MIDTRANS_SERVER_KEY"] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Client Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1C1917] uppercase tracking-wider">
                Midtrans Client Key
              </label>
              {getSettingItem("MIDTRANS_CLIENT_KEY")?.isSet && (
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                  Tersimpan
                </span>
              )}
            </div>
            <input
              type="text"
              placeholder="SB-Mid-client-..."
              value={settings["MIDTRANS_CLIENT_KEY"] || ""}
              onChange={(e) => handleInputChange("MIDTRANS_CLIENT_KEY", e.target.value)}
              className="w-full px-3 py-2.5 border border-[#D9D4CB] rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20 bg-[#F7F5F2] focus:bg-white transition-all"
            />
          </div>
        </div>
      </div>

      {/* Floating / Sticky Save Bar */}
      <div className="sticky bottom-6 z-20 bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-[#D9D4CB] shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 text-xs text-[#6B6560]">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-[#D97706] shrink-0">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-[#1C1917] block">Penyimpanan Terenkripsi & Revalidasi Otomatis</span>
            <span>Setiap sakelar (toggle) dan tombol simpan langsung memperbarui status di Dashboard dan Katalog.</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={saveLoading}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#D97706] hover:bg-[#B45309] text-white px-7 py-3 rounded-xl text-sm font-bold shadow-md transition-all cursor-pointer disabled:opacity-50 shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>{saveLoading ? "Menyimpan Perubahan..." : "Simpan Semua Pengaturan API"}</span>
        </button>
      </div>
    </form>
  );
}
