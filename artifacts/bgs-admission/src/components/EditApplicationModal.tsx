import { useState } from "react";
import { supabase } from "../lib/supabase";
import { VILLAGES, COURSES } from "../lib/constants";
import type { Application } from "../lib/types";

interface Props {
  application: Application;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditApplicationModal({ application, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    student_name: application.student_name,
    parent_name: application.parent_name,
    phone: application.phone,
    alt_phone: application.alt_phone || "",
    village: application.village,
    current_school: application.current_school,
    course: application.course,
    marks_percent: application.marks_percent?.toString() || "",
    message: application.message || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave() {
    if (!form.student_name.trim() || !form.parent_name.trim() || !form.phone.trim()) {
      setError("Name and phone are required"); return;
    }
    if (!/^\d{10}$/.test(form.phone)) { setError("Invalid phone number"); return; }
    setSaving(true); setError(null);

    const { error: err } = await supabase
      .from("applications")
      .update({
        student_name: form.student_name.trim(),
        parent_name: form.parent_name.trim(),
        phone: form.phone.trim(),
        alt_phone: form.alt_phone.trim() || null,
        village: form.village,
        current_school: form.current_school.trim(),
        course: form.course,
        marks_percent: form.marks_percent ? Number(form.marks_percent) : null,
        message: form.message.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", application.id);

    if (err) { setError(err.message); setSaving(false); return; }
    onSaved(); onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 my-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Edit Application · {application.app_id}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <div className="space-y-4">
          {[
            { label: "Student Name *", field: "student_name", placeholder: "Full name" },
            { label: "Parent Name *", field: "parent_name", placeholder: "Parent/guardian name" },
            { label: "Current School *", field: "current_school", placeholder: "School name" },
          ].map(({ label, field, placeholder }) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type="text"
                value={form[field as keyof typeof form]}
                onChange={(e) => update(field, e.target.value)}
                placeholder={placeholder}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alt Phone</label>
              <input
                type="tel"
                value={form.alt_phone}
                onChange={(e) => update("alt_phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Village</label>
              <select
                value={form.village}
                onChange={(e) => update("village", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {VILLAGES.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
              <select
                value={form.course}
                onChange={(e) => update("course", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {COURSES.map((c) => <option key={c.value} value={c.value}>{c.value}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Marks %</label>
            <input
              type="number" min="0" max="100"
              value={form.marks_percent}
              onChange={(e) => update("marks_percent", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={form.message}
              onChange={(e) => update("message", e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 bg-[#1e40af] hover:bg-blue-800 disabled:bg-blue-300 text-white font-medium py-2.5 rounded-lg transition-colors">
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
