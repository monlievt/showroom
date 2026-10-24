"use client";

import React, { useState } from "react";
import {
  Phone,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Save,
  Star,
  ExternalLink,
  MessageSquare,
  Power,
  RotateCcw,
  X,
} from "lucide-react";
import {
  WhatsAppAdminContact,
  DEFAULT_WHATSAPP_ADMINS,
  normalizeWhatsAppNumber,
  generateDirectWhatsAppLink,
} from "@/lib/utils/whatsapp";
import { saveWhatsAppContactsAction } from "@/app/actions/contact";
import { cn } from "@/lib/utils";

interface WhatsAppContactsSettingsProps {
  initialContacts: WhatsAppAdminContact[];
}

export function WhatsAppContactsSettingsClient({
  initialContacts,
}: WhatsAppContactsSettingsProps) {
  const [contacts, setContacts] = useState<WhatsAppAdminContact[]>(
    initialContacts && initialContacts.length > 0 ? initialContacts : DEFAULT_WHATSAPP_ADMINS
  );
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<WhatsAppAdminContact | null>(null);
  const [formName, setFormName] = useState("");
  const [formRole, setFormRole] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formIsPrimary, setFormIsPrimary] = useState(false);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState("");

  const showNotification = (message: string, type: "success" | "error") => {
    setFeedback({ message, type });
    setTimeout(() => {
      setFeedback((prev) => (prev?.message === message ? null : prev));
    }, 5000);
  };

  const handleOpenAddModal = () => {
    setEditingContact(null);
    setFormName("");
    setFormRole("Konsultasi & Negosiasi Unit");
    setFormPhone("");
    setFormIsPrimary(contacts.length === 0);
    setFormIsActive(true);
    setFormError("");
    setModalOpen(true);
  };

  const handleOpenEditModal = (contact: WhatsAppAdminContact) => {
    setEditingContact(contact);
    setFormName(contact.name);
    setFormRole(contact.role);
    setFormPhone(contact.phone);
    setFormIsPrimary(Boolean(contact.isPrimary));
    setFormIsActive(contact.isActive !== false);
    setFormError("");
    setModalOpen(true);
  };

  const handleSaveContactModal = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formName.trim()) {
      setFormError("Nama admin tidak boleh kosong.");
      return;
    }
    if (!formPhone.trim()) {
      setFormError("Nomor WhatsApp tidak boleh kosong.");
      return;
    }

    const cleanPhone = normalizeWhatsAppNumber(formPhone);
    if (cleanPhone.length < 9) {
      setFormError("Nomor telepon tidak valid. Masukkan format 08xx atau 628xx.");
      return;
    }

    let updated: WhatsAppAdminContact[];

    if (editingContact) {
      // Mode Edit
      updated = contacts.map((c) => {
        if (c.id === editingContact.id) {
          return {
            ...c,
            name: formName.trim(),
            role: formRole.trim() || "Admin Showroom",
            phone: cleanPhone,
            isPrimary: formIsPrimary,
            isActive: formIsActive,
          };
        }
        // Jika yang diedit diset jadi primary, reset primary yang lain
        if (formIsPrimary) {
          return { ...c, isPrimary: false };
        }
        return c;
      });
    } else {
      // Mode Tambah Baru
      const newContact: WhatsAppAdminContact = {
        id: `admin-${Date.now()}`,
        name: formName.trim(),
        role: formRole.trim() || "Admin Showroom",
        phone: cleanPhone,
        isPrimary: formIsPrimary,
        isActive: formIsActive,
      };

      if (formIsPrimary) {
        updated = [...contacts.map((c) => ({ ...c, isPrimary: false })), newContact];
      } else {
        updated = [...contacts, newContact];
      }
    }

    // Pastikan minimal ada 1 primary jika ada yang aktif
    const hasActivePrimary = updated.some((c) => c.isPrimary && c.isActive);
    if (!hasActivePrimary && updated.some((c) => c.isActive)) {
      const firstActive = updated.find((c) => c.isActive);
      if (firstActive) firstActive.isPrimary = true;
    }

    setContacts(updated);
    setModalOpen(false);
    showNotification("Kontak berhasil diperbarui. Klik tombol 'Simpan Perubahan ke Database' untuk menerapkan secara permanen.", "success");
  };

  const handleToggleActive = (id: string) => {
    const updated = contacts.map((c) => {
      if (c.id === id) {
        return { ...c, isActive: !c.isActive };
      }
      return c;
    });
    setContacts(updated);
  };

  const handleSetPrimary = (id: string) => {
    const updated = contacts.map((c) => ({
      ...c,
      isPrimary: c.id === id,
    }));
    setContacts(updated);
    showNotification("Kontak utama diperbarui. Jangan lupa klik 'Simpan Perubahan ke Database'.", "success");
  };

  const handleDelete = (id: string) => {
    if (contacts.length <= 1) {
      showNotification("Minimal harus ada 1 nomor kontak admin.", "error");
      return;
    }
    const target = contacts.find((c) => c.id === id);
    if (window.confirm(`Yakin ingin menghapus kontak ${target?.name}?`)) {
      const remaining = contacts.filter((c) => c.id !== id);
      if (target?.isPrimary && remaining.length > 0) {
        remaining[0].isPrimary = true;
      }
      setContacts(remaining);
      showNotification(`Kontak ${target?.name} dihapus dari daftar lokal. Klik 'Simpan Perubahan' untuk menerapkan.`, "success");
    }
  };

  const handleSaveToDatabase = async () => {
    setIsSaving(true);
    try {
      const res = await saveWhatsAppContactsAction(contacts);
      setIsSaving(false);
      if (res.success) {
        showNotification("Daftar kontak WhatsApp Admin berhasil disimpan dan aktif di website!", "success");
      } else {
        showNotification(res.error || "Gagal menyimpan daftar kontak.", "error");
      }
    } catch (err: any) {
      setIsSaving(false);
      showNotification(err.message || "Terjadi kesalahan saat menyimpan.", "error");
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm("Kembalikan daftar kontak ke standar bawaan sistem?")) {
      setContacts(DEFAULT_WHATSAPP_ADMINS);
      showNotification("Daftar dikembalikan ke default. Klik 'Simpan Perubahan' untuk menerapkan ke server.", "success");
    }
  };

  const activeCount = contacts.filter((c) => c.isActive).length;

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
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
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs underline cursor-pointer">
            Tutup
          </button>
        </div>
      )}

      {/* Header Info Card */}
      <div className="bg-white p-6 rounded-2xl border border-[#D9D4CB] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1C1917]">
                Manajemen Kontak WhatsApp Admin Publik
              </h2>
              <p className="text-xs text-[#6B6560]">
                Nomor-nomor ini akan muncul pada tombol <strong>Hubungi Admin</strong> di pojok kanan atas website publik.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#6B6560] hover:text-[#1C1917] bg-[#F5F2EB] hover:bg-[#EAE5DC] rounded-xl transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Bawaan</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#D97706] hover:bg-[#B45309] rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kontak Admin</span>
          </button>
        </div>
      </div>

      {/* Behavior Info Box */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
        <MessageSquare className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold">Perilaku Tombol di Website Publik:</p>
          <p>
            • Jika hanya <strong>1 kontak aktif</strong>: Pengunjung mengklik tombol langsung diarahkan ke chat WhatsApp nomor tersebut.
          </p>
          <p>
            • Jika ada <strong>2 atau lebih kontak aktif</strong> (saat ini {activeCount} aktif): Tombol &quot;Hubungi Admin&quot; otomatis menampilkan <strong>menu dropdown pilihan staf</strong> (misal Rio untuk negosiasi unit, Admin Garasi untuk cek fisik).
          </p>
        </div>
      </div>

      {/* Contacts List */}
      <div className="bg-white rounded-2xl border border-[#D9D4CB] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#D9D4CB] flex items-center justify-between">
          <div className="text-sm font-bold text-[#1C1917]">
            Daftar Kontak ({contacts.length})
          </div>
          <span className="text-xs text-[#6B6560]">
            {activeCount} Aktif di Website Publik
          </span>
        </div>

        <div className="divide-y divide-[#D9D4CB]">
          {contacts.map((contact, idx) => {
            const waTestLink = generateDirectWhatsAppLink(
              contact.phone,
              `Halo ${contact.name}, ini uji coba kontak admin dari dashboard.`
            );

            return (
              <div
                key={contact.id}
                className={cn(
                  "p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors",
                  !contact.isActive && "bg-stone-50/70 opacity-75"
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 mt-0.5",
                      contact.isActive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-stone-200 text-stone-500"
                    )}
                  >
                    {idx + 1}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-[#1C1917]">
                        {contact.name}
                      </span>
                      {contact.isPrimary && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-600" />
                          Kontak Utama
                        </span>
                      )}
                      <span
                        className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                          contact.isActive
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-stone-200 text-stone-600"
                        )}
                      >
                        {contact.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>

                    <p className="text-xs text-[#6B6560]">{contact.role}</p>

                    <div className="flex items-center gap-2 pt-1 text-xs">
                      <span className="font-mono font-semibold text-[#1C1917]">
                        {contact.phone}
                      </span>
                      <a
                        href={waTestLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 hover:underline font-medium"
                      >
                        <span>Uji Chat</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
                  {!contact.isPrimary && contact.isActive && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(contact.id)}
                      className="px-2.5 py-1.5 text-xs font-semibold text-[#6B6560] hover:text-[#1C1917] bg-[#F5F2EB] hover:bg-[#EAE5DC] rounded-lg transition-colors cursor-pointer"
                      title="Jadikan kontak default"
                    >
                      Jadikan Utama
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleToggleActive(contact.id)}
                    className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer",
                      contact.isActive
                        ? "text-stone-600 bg-stone-100 hover:bg-stone-200"
                        : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300"
                    )}
                    title={contact.isActive ? "Nonaktifkan sementara" : "Aktifkan kontak"}
                  >
                    <Power className="w-3 h-3" />
                    <span>{contact.isActive ? "Nonaktifkan" : "Aktifkan"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(contact)}
                    className="p-1.5 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
                    title="Edit kontak"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(contact.id)}
                    className="p-1.5 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                    title="Hapus kontak"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-[#FAF7F2] border-t border-[#D9D4CB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-[#6B6560]">
            Pastikan mengklik tombol di sebelah kanan agar perubahan langsung live di website publik.
          </p>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveToDatabase}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 shadow-sm transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Menyimpan..." : "Simpan Perubahan ke Database"}</span>
          </button>
        </div>
      </div>

      {/* Modal Tambah / Edit Kontak */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#D9D4CB] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#D9D4CB] flex items-center justify-between bg-[#FAF7F2]">
              <h3 className="text-base font-bold text-[#1C1917]">
                {editingContact ? "Edit Kontak Admin" : "Tambah Kontak Admin Baru"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveContactModal} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#1C1917] mb-1">
                  Nama Petugas / Label Kontak <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Rio / Admin Garasi / Showroom"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#D9D4CB] focus:outline-none focus:ring-2 focus:ring-[#D97706]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C1917] mb-1">
                  Peran / Deskripsi Singkat <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  placeholder="Contoh: Konsultasi & Negosiasi Unit"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#D9D4CB] focus:outline-none focus:ring-2 focus:ring-[#D97706]"
                  required
                />
                <p className="text-[11px] text-[#6B6560] mt-1">
                  Akan muncul sebagai keterangan kecil di dropdown kontak untuk calon pembeli.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C1917] mb-1">
                  Nomor WhatsApp / HP <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="Contoh: 081234567890 atau 6281234567890"
                  className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-[#D9D4CB] focus:outline-none focus:ring-2 focus:ring-[#D97706]"
                  required
                />
                <p className="text-[11px] text-[#6B6560] mt-1">
                  Otomatis dikonversi ke format internasional (62xxx).
                </p>
              </div>

              <div className="pt-2 border-t border-[#D9D4CB] space-y-2.5">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsPrimary}
                    onChange={(e) => setFormIsPrimary(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-xs font-semibold text-[#1C1917]">
                    Jadikan sebagai Kontak Utama (Default)
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-semibold text-[#1C1917]">
                    Status Aktif (Tampilkan di website publik)
                  </span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-[#D9D4CB]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#D97706] hover:bg-[#B45309] rounded-xl shadow-xs"
                >
                  {editingContact ? "Simpan Perubahan" : "Tambahkan ke Daftar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
