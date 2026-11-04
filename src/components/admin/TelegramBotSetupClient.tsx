"use client";

import React, { useState } from "react";
import {
  Bot,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Copy,
  ExternalLink,
  Zap,
  MessageSquare,
  Camera,
  List,
  Receipt,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TelegramBotSetupClientProps {
  chatId: string;
  botToken: string;
  allowedChatIds: string;
  appPublicUrl: string;
}

const COMMANDS = [
  { cmd: "/start", desc: "Salam perkenalan & daftar perintah" },
  { cmd: "/daftar", desc: "Semua unit aktif di garasi" },
  { cmd: "/macet", desc: "Unit macet > 45 hari" },
  { cmd: "/ready", desc: "Unit siap jual & margin" },
  { cmd: "/cek BK1952AEE", desc: "Detail unit by plat nomor" },
  { cmd: "/biaya", desc: "Catat biaya via step-by-step" },
  { cmd: "biaya BK1952AEE ganti oli 150000", desc: "Catat biaya satu baris langsung" },
  { cmd: "/status", desc: "Ubah status unit via step-by-step" },
  { cmd: "status BK1952AEE ready", desc: "Ubah status satu baris (ready, bengkel, booked, dll)" },
  { cmd: "/foto", desc: "Upload foto unit via Telegram" },
  { cmd: "/intake", desc: "Daftarkan unit baru" },
  { cmd: "/laporan", desc: "Ringkasan keuangan hari ini" },
  { cmd: "/bantuan", desc: "Panduan lengkap semua perintah" },
  { cmd: "/batal", desc: "Batalkan alur percakapan aktif" },
];

export function TelegramBotSetupClient({
  chatId,
  botToken,
  allowedChatIds,
  appPublicUrl,
}: TelegramBotSetupClientProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; detail?: string } | null>(null);
  const [customUrl, setCustomUrl] = useState(appPublicUrl || "");
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const isConfigured = !!botToken && !!chatId;

  async function setupWebhook() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/telegram/setup-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl: customUrl || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setResult({
          success: true,
          message: "✅ Webhook berhasil didaftarkan! Bot siap menerima perintah.",
          detail: `URL: ${data.webhookUrl}`,
        });
      } else {
        setResult({ success: false, message: data.error || "Gagal mendaftarkan webhook." });
      }
    } catch (err: any) {
      setResult({ success: false, message: err.message || "Terjadi kesalahan jaringan." });
    } finally {
      setLoading(false);
    }
  }

  async function removeWebhook() {
    if (!confirm("Yakin ingin menonaktifkan Telegram Bot? Bot tidak akan menerima pesan sampai webhook didaftarkan ulang.")) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/telegram/setup-webhook", { method: "DELETE" });
      const data = await res.json();
      setResult({ success: data.success, message: data.message });
    } catch (err: any) {
      setResult({ success: false, message: err.message });
    } finally {
      setLoading(false);
    }
  }

  function copyCmd(cmd: string) {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 1500);
  }

  return (
    <div className="space-y-6">

      {/* STATUS KONFIGURASI */}
      <div className={cn(
        "flex items-start gap-3 p-4 rounded-xl border",
        isConfigured
          ? "bg-emerald-50 border-emerald-200"
          : "bg-amber-50 border-amber-200"
      )}>
        {isConfigured ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        )}
        <div>
          <p className={cn("font-semibold text-sm", isConfigured ? "text-emerald-800" : "text-amber-800")}>
            {isConfigured ? "Bot Telegram Dikonfigurasi" : "Konfigurasi Belum Lengkap"}
          </p>
          <p className={cn("text-xs mt-0.5", isConfigured ? "text-emerald-700" : "text-amber-700")}>
            {isConfigured
              ? `Chat ID: ${chatId}${allowedChatIds ? ` + ${allowedChatIds.split(",").filter(Boolean).length} ID tambahan` : ""}`
              : "Pastikan Telegram Bot Token dan Chat ID sudah diisi di tab Kunci API & Integrasi Layanan."}
          </p>
        </div>
      </div>

      {/* LANGKAH SETUP */}
      <div className="bg-[var(--bg)] border border-[var(--line)] rounded-xl p-5">
        <h3 className="font-bold text-sm text-[var(--ink)] mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-[var(--accent)]" />
          Langkah Setup Bot
        </h3>
        <ol className="space-y-3 text-sm text-[var(--ink)]">
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-[var(--accent)] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
            <div>
              <p className="font-semibold">Buat bot di BotFather</p>
              <p className="text-xs text-[var(--muted)] mt-0.5">Buka Telegram → cari <strong>@BotFather</strong> → ketik <code className="bg-[var(--line)] px-1 rounded">/newbot</code> → ikuti instruksi → salin <strong>Bot Token</strong>.</p>
              <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] mt-1 hover:underline">
                <ExternalLink className="w-3 h-3" /> Buka @BotFather
              </a>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-[var(--accent)] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
            <div>
              <p className="font-semibold">Dapatkan Chat ID Anda</p>
              <p className="text-xs text-[var(--muted)] mt-0.5">Cari <strong>@userinfobot</strong> di Telegram → klik Start → salin angka <strong>Id</strong> yang muncul → tempel di field Chat ID di tab Kunci API.</p>
              <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] mt-1 hover:underline">
                <ExternalLink className="w-3 h-3" /> Buka @userinfobot
              </a>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-[var(--accent)] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
            <div>
              <p className="font-semibold">Simpan Token & Chat ID di Settings</p>
              <p className="text-xs text-[var(--muted)] mt-0.5">Buka tab <strong>Kunci API & Integrasi</strong> → isi <strong>Telegram Bot Token</strong> dan <strong>Telegram Owner Chat ID</strong> → klik Simpan.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-[var(--accent)] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">4</span>
            <div>
              <p className="font-semibold">Daftarkan Webhook (di bawah ini)</p>
              <p className="text-xs text-[var(--muted)] mt-0.5">Klik tombol <strong>"Aktifkan Bot"</strong> di bawah. URL webhook akan otomatis terdaftar ke server Telegram.</p>
            </div>
          </li>
        </ol>
      </div>

      {/* SETUP WEBHOOK */}
      <div className="bg-white border border-[var(--line)] rounded-xl p-5 space-y-4">
        <h3 className="font-bold text-sm text-[var(--ink)] flex items-center gap-2">
          <Bot className="w-4 h-4 text-[var(--accent)]" />
          Aktifkan / Nonaktifkan Bot
        </h3>

        <div>
          <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
            URL Publik Aplikasi
          </label>
          <input
            type="url"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="https://showroom-anda.vercel.app"
            className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
          />
          <p className="text-[11px] text-[var(--muted)] mt-1">URL domain publik aplikasi ini. Webhook Telegram akan mengarah ke: <code className="bg-[var(--line)] px-1 rounded">{(customUrl || "https://...").replace(/\/$/, "")}/api/telegram/webhook</code></p>
        </div>

        {/* Result */}
        {result && (
          <div className={cn(
            "flex items-start gap-2 p-3 rounded-xl text-sm border",
            result.success ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"
          )}>
            {result.success ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
            <div>
              <p className="font-semibold">{result.message}</p>
              {result.detail && <p className="text-xs mt-0.5 font-mono opacity-80">{result.detail}</p>}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={setupWebhook}
            disabled={loading || !isConfigured}
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Aktifkan Bot (Daftarkan Webhook)
          </button>
          <button
            onClick={removeWebhook}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-red-50 border border-[var(--line)] hover:border-red-300 text-[var(--ink)] hover:text-red-700 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Nonaktifkan Bot
          </button>
        </div>
        {!isConfigured && (
          <p className="text-xs text-[var(--muted)]">⚠️ Isi Telegram Bot Token dan Chat ID di tab Kunci API terlebih dahulu.</p>
        )}
      </div>

      {/* DAFTAR PERINTAH BOT */}
      <div className="bg-[var(--bg)] border border-[var(--line)] rounded-xl p-5">
        <h3 className="font-bold text-sm text-[var(--ink)] mb-4 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[var(--accent)]" />
          Daftar Perintah Bot
        </h3>
        <div className="space-y-1.5">
          {COMMANDS.map(({ cmd, desc }) => (
            <div key={cmd} className="flex items-center justify-between gap-3 group bg-white hover:bg-[var(--bg)] border border-[var(--line)] rounded-lg px-3.5 py-2 transition-colors">
              <div className="flex items-start gap-2 min-w-0">
                <code className="text-xs font-mono font-bold text-[var(--accent)] bg-[var(--accent)]/8 px-1.5 py-0.5 rounded whitespace-nowrap shrink-0">{cmd}</code>
                <span className="text-xs text-[var(--muted)] mt-0.5 truncate">{desc}</span>
              </div>
              <button
                onClick={() => copyCmd(cmd)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-[var(--line)]"
                title="Salin"
              >
                {copiedCmd === cmd ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-[var(--muted)]" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* FITUR RINGKASAN */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: List, label: "Query Stok", desc: "Daftar, macet, ready" },
          { icon: Receipt, label: "Catat Biaya", desc: "HPP update langsung" },
          { icon: Camera, label: "Upload Foto", desc: "Foto unit via chat" },
          { icon: Plus, label: "Intake Unit", desc: "Daftar unit baru" },
        ].map(({ icon: Icon, label, desc }) => (
          <div key={label} className="bg-white border border-[var(--line)] rounded-xl p-4 flex flex-col items-center text-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <p className="text-xs font-bold text-[var(--ink)]">{label}</p>
            <p className="text-[11px] text-[var(--muted)]">{desc}</p>
          </div>
        ))}
      </div>

      {/* INFO MULTI USER */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <p className="font-semibold mb-1 flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> Multi-User</p>
        <p className="text-xs text-blue-700">
          Untuk memberikan akses ke staf lain, tambahkan Chat ID mereka (dari @userinfobot) ke field <strong>"Chat ID Tambahan"</strong> di tab Kunci API, dipisahkan dengan koma.
        </p>
        {allowedChatIds && (
          <p className="text-xs text-blue-700 mt-1">
            Saat ini terdaftar: <code className="bg-blue-100 px-1 rounded">{allowedChatIds}</code>
          </p>
        )}
      </div>

    </div>
  );
}

