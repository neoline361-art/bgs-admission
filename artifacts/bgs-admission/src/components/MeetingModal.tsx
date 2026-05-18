import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import type { Application } from "../lib/types";

interface Props {
  application: Application;
  onClose: () => void;
  onSaved: () => void;
}

export default function MeetingModal({ application, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const [date, setDate] = useState(application.meeting_date || "");
  const [time, setTime] = useState(application.meeting_time || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!date || !time) { setError("Please select both date and time"); return; }
    setSaving(true);
    setError(null);

    const { error: err } = await supabase
      .from("applications")
      .update({
        meeting_date: date,
        meeting_time: time,
        status: "meeting_fixed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", application.id);

    if (err) { setError(err.message); setSaving(false); return; }

    // Log status change
    if (application.status !== "meeting_fixed") {
      await supabase.from("status_logs").insert({
        application_id: application.id,
        from_status: application.status,
        to_status: "meeting_fixed",
        changed_by: user?.id,
        note: `Meeting fixed: ${date} at ${time}`,
      });
    }

    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold">Fix Meeting</h2>
            <p className="text-sm text-gray-500">{application.student_name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            {saving ? "Saving..." : "Fix Meeting"}
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
