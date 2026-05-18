import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

interface Props {
  onClose: () => void;
}

export default function QRModal({ onClose }: Props) {
  const url = window.location.origin + (import.meta.env.BASE_URL || "/");
  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Share Application Link</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="flex justify-center mb-4">
          <div className="p-3 border-2 border-gray-200 rounded-xl">
            <QRCodeSVG value={url} size={200} level="H" />
          </div>
        </div>

        <p className="text-sm text-gray-500 mb-2">Students can scan this QR code to apply</p>

        <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 break-all mb-4">
          {url}
        </div>

        <div className="flex gap-2">
          <button
            onClick={copyLink}
            className="flex-1 bg-[#1e40af] hover:bg-blue-800 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            {copied ? "✓ Copied!" : "Copy Link"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
