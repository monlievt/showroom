"use client";

import React, { useEffect } from "react";
import { ExternalLink, X } from "lucide-react";

export interface ProofPreviewItem {
  url: string;
  title: string;
  subtitle?: string;
}

function isPdfUrl(url: string): boolean {
  return url.toLowerCase().split("?")[0].endsWith(".pdf");
}

export function ProofPreviewModal({
  preview,
  onClose,
}: {
  preview: ProofPreviewItem | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!preview) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [preview, onClose]);

  if (!preview) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="w-full max-w-3xl bg-white rounded-2xl border border-[var(--line)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-[var(--line)] flex items-center justify-between gap-3 bg-[var(--bg)]/60 shrink-0">
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-[var(--ink)] truncate">
              {preview.title}
            </h4>
            {preview.subtitle && (
              <p className="text-xs text-[var(--muted)] truncate mt-0.5">
                {preview.subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={preview.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--line)] bg-white hover:bg-[var(--bg)] text-xs font-semibold text-[var(--ink)] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Tab Baru</span>
            </a>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              aria-label="Tutup lampiran"
              className="p-1.5 rounded-lg border border-[var(--line)] bg-white hover:bg-[var(--bg)] text-[var(--ink)] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-neutral-950/95 flex items-center justify-center p-4 min-h-[300px]">
          {isPdfUrl(preview.url) ? (
            <iframe
              src={preview.url}
              title={preview.title}
              className="w-full h-[70vh] rounded-lg bg-white"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview.url}
              alt={preview.title}
              className="max-h-[75vh] max-w-full object-contain rounded-lg"
            />
          )}
        </div>
      </div>
    </div>
  );
}
