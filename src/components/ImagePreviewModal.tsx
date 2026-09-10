"use client";

import React, { useState } from "react";
import { X, ZoomIn, FileText } from "lucide-react";

interface ImagePreviewModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  title: string;
  onClose: () => void;
}

export default function ImagePreviewModal({
  isOpen,
  imageUrl,
  title,
  onClose,
}: ImagePreviewModalProps) {
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);

  if (!isOpen || !imageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div
        className="relative max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
              <ZoomIn className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h3>
              {naturalSize ? (
                <p className="text-xs text-emerald-400 font-mono font-medium">
                  Resolution: {naturalSize.width} × {naturalSize.height} px
                </p>
              ) : (
                <p className="text-xs text-slate-400">Full Resolution Preview</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
            title="Close Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Image Container */}
        <div className="p-6 flex-1 flex items-center justify-center overflow-auto bg-slate-950/50">
          {imageUrl.startsWith("data:application/pdf") ? (
            <div className="flex flex-col items-center space-y-3 text-slate-400 py-12">
              <FileText className="w-16 h-16 text-blue-400" />
              <p className="text-sm font-semibold">PDF Document Attached</p>
              <a
                href={imageUrl}
                download="document.pdf"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all"
              >
                Download PDF Document
              </a>
            </div>
          ) : (
            <img
              src={imageUrl}
              alt={title}
              onLoad={(e) => {
                const img = e.currentTarget;
                setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
              }}
              className="max-h-[70vh] max-w-full object-contain rounded-lg border border-slate-800 shadow-2xl"
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Click anywhere outside or press Close to dismiss</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
