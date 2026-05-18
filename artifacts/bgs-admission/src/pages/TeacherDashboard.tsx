import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import StatusBadge from "../components/StatusBadge";
import NotesModal from "../components/NotesModal";
import { openWhatsApp, getMessageForStatus } from "../lib/messages";
import { printTable } from "../lib/export";
import { STATUS_LABELS } from "../lib/constants";
import type { Application, ApplicationStatus } from "../lib/types";

const STATUSES: ApplicationStatus[] = ["new", "contacted", "meeting_fixed", "confirmed", "archived"];

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ApplicationStatus | "all">("all");
  const [notesApp, setNotesApp] = useState<Application | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setLocation("/staff/login"); return; }
    if (user.role !== "teacher") { setLocation(`/${user.role}`); return; }
  }, [user, setLocation]);

  const fetchApplications = useCallback(async () => {
    if (!user) return;
    const query = supabase
      .from("applications")
      .select("*, assigned_teacher:staff!assigned_teacher_id(id,name,username,role,phone,is_active,pin_hash,created_at)")
      .eq("assigned_teacher_id", user.id)
      .order("created_at", { ascending: false });

    const { data, error } = await query;
    if (!error && data) setApplications(data as Application[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchApplications();
    // Real-time subscription
    const channel = supabase
      .channel("teacher-applications")
      .on("postgres_changes", { event: "*", schema: "public", table: "applications" }, fetchApplications)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchApplications]);

  async function updateStatus(app: Application, status: ApplicationStatus) {
    setUpdatingId(app.id);
    await supabase.from("applications").update({ status, updated_at: new Date().toISOString() }).eq("id", app.id);
    if (app.status !== status) {
      await supabase.from("status_logs").insert({ application_id: app.id, from_status: app.status, to_status: status, changed_by: user?.id });
    }
    await fetchApplications();
    setUpdatingId(null);
  }

  function handleLogout() { logout(); setLocation("/staff/login"); }

  const filtered = filter === "all" ? applications : applications.filter((a) => a.status === filter);

  const stats = STATUSES.reduce((acc, s) => ({ ...acc, [s]: applications.filter((a) => a.status === s).length }), {} as Record<string, number>);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1e40af] text-white px-4 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Teacher Dashboard</h1>
            <p className="text-blue-200 text-sm">Welcome, {user.name}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => printTable(filtered)} className="bg-blue-700 hover:bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg">🖨️ Print</button>
            <button onClick={handleLogout} className="bg-blue-800 hover:bg-blue-700 text-white text-sm px-3 py-1.5 rounded-lg">🔓 Logout</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
          {[
            { label: "Total", value: applications.length, color: "bg-gray-100 text-gray-700" },
            { label: "New", value: stats.new || 0, color: "bg-gray-100 text-gray-600" },
            { label: "Contacted", value: stats.contacted || 0, color: "bg-blue-100 text-blue-700" },
            { label: "Meeting", value: stats.meeting_fixed || 0, color: "bg-amber-100 text-amber-700" },
            { label: "Confirmed", value: stats.confirmed || 0, color: "bg-green-100 text-green-700" },
            { label: "Archived", value: stats.archived || 0, color: "bg-red-100 text-red-700" },
          ].map((s) => (
            <div key={s.label} className={`${s.color} rounded-xl p-3 text-center`}>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2 flex-wrap mb-4">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === "all" ? "bg-[#1e40af] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >All</button>
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === s ? "bg-[#1e40af] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading applications...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-200">
            <p className="text-lg">No applications assigned to you yet</p>
            <p className="text-sm mt-1">Applications will appear here once the office assigns them to you</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {["ID", "Date", "Student", "Parent", "Phone", "Village", "Course", "Status", "Actions"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">{app.app_id}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(app.created_at).toLocaleDateString("en-IN")}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{app.student_name}</td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{app.parent_name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <a href={`tel:${app.phone}`} className="text-blue-600 hover:underline">{app.phone}</a>
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{app.village}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded">{app.course}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <select
                          value={app.status}
                          disabled={updatingId === app.id}
                          onChange={(e) => updateStatus(app, e.target.value as ApplicationStatus)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex gap-1 flex-wrap">
                          <a href={`tel:${app.phone}`} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded" title="Call">📞</a>
                          <button onClick={() => openWhatsApp(app.phone, getMessageForStatus(app))} className="text-xs bg-green-100 hover:bg-green-200 px-2 py-1 rounded" title="WhatsApp">💬</button>
                          <button onClick={() => setNotesApp(app)} className="text-xs bg-yellow-100 hover:bg-yellow-200 px-2 py-1 rounded" title="Notes">📝</button>
                          <button onClick={() => updateStatus(app, "confirmed")} disabled={app.status === "confirmed"} className="text-xs bg-green-600 disabled:bg-gray-200 hover:bg-green-700 text-white px-2 py-1 rounded" title="Confirm">✓</button>
                          <button onClick={() => updateStatus(app, "archived")} disabled={app.status === "archived"} className="text-xs bg-red-500 disabled:bg-gray-200 hover:bg-red-600 text-white px-2 py-1 rounded" title="Archive">✕</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {notesApp && <NotesModal application={notesApp} onClose={() => setNotesApp(null)} onSaved={fetchApplications} />}
    </div>
  );
}
