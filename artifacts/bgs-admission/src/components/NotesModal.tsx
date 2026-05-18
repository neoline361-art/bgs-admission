import { useState } from "react";
import { supabase } from "../lib/supabase";
import type { Application } from "../lib/types";

interface Props {
  application: Application;
  onClose: () => void;
  onSaved: () => void;
}

export default function NotesModal({ application, onClose, onSaved }: Props) {
  const [notes, setNotes] = useState(application.notes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const { error: err } = await supabase
      .from("applications")
      .update({ notes, updated_at: new Date().toISOString() })
      .eq("id", application.id);
    if (err) { setError(err.message); setSaving(false); return; }
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold">Notes</h2>
            <p className="text-sm text-gray-500">{application.student_name} · {application.app_id}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes about this application..."
          rows={6}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-[#1e40af] hover:bg-blue-800 disabled:bg-blue-300 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            {saving ? "Saving..." : "Save Notes"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
