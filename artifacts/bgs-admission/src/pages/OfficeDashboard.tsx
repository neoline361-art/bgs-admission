import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import StatusBadge from "../components/StatusBadge";
import NotesModal from "../components/NotesModal";
import MeetingModal from "../components/MeetingModal";
import EditApplicationModal from "../components/EditApplicationModal";
import QRModal from "../components/QRModal";
import { openWhatsApp, getMessageForStatus } from "../lib/messages";
import { exportToCSV, exportToExcel, exportToODS, printTable } from "../lib/export";
import { STATUS_LABELS } from "../lib/constants";
import type { Application, ApplicationStatus, Staff } from "../lib/types";

const STATUSES: ApplicationStatus[] = ["new", "contacted", "meeting_fixed", "confirmed", "archived"];

export default function OfficeDashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [applications, setApplications] = useState<Application[]>([]);
  const [teachers, setTeachers] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<ApplicationStatus | "all">("all");
  const [filterVillage, setFilterVillage] = useState("all");
  const [filterCourse, setFilterCourse] = useState("all");
  const [filterTeacher, setFilterTeacher] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [notesApp, setNotesApp] = useState<Application | null>(null);
  const [meetingApp, setMeetingApp] = useState<Application | null>(null);
  const [editApp, setEditApp] = useState<Application | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setLocation("/staff/login"); return; }
    if (user.role !== "office" && user.role !== "admin") { setLocation(`/${user.role}`); return; }
  }, [user, setLocation]);

  const fetchAll = useCallback(async () => {
    const [appsRes, teachersRes] = await Promise.all([
      supabase.from("applications").select("*, assigned_teacher:staff!assigned_teacher_id(id,name,username,role,phone,is_active,pin_hash,created_at)").order("created_at", { ascending: false }),
      supabase.from("staff").select("*").eq("role", "teacher").eq("is_active", true),
    ]);
    if (!appsRes.error && appsRes.data) setApplications(appsRes.data as Application[]);
    if (!teachersRes.error && teachersRes.data) setTeachers(teachersRes.data as Staff[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const channel = supabase.channel("office-apps").on("postgres_changes", { event: "*", schema: "public", table: "applications" }, fetchAll).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAll]);

  async function updateStatus(app: Application, status: ApplicationStatus) {
    setUpdatingId(app.id);
    await supabase.from("applications").update({ status, updated_at: new Date().toISOString() }).eq("id", app.id);
    if (app.status !== status) await supabase.from("status_logs").insert({ application_id: app.id, from_status: app.status, to_status: status, changed_by: user?.id });
    await fetchAll(); setUpdatingId(null);
  }

  async function assignTeacher(app: Application, teacherId: string) {
    await supabase.from("applications").update({ assigned_teacher_id: teacherId || null, updated_at: new Date().toISOString() }).eq("id", app.id);
    await fetchAll();
  }

  const villages = [...new Set(applications.map((a) => a.village))].sort();
  const courses = [...new Set(applications.map((a) => a.course))].sort();

  const filtered = applications.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.student_name.toLowerCase().includes(q) || a.parent_name.toLowerCase().includes(q) || a.phone.includes(q) || a.app_id.toLowerCase().includes(q) || a.village.toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    const matchVillage = filterVillage === "all" || a.village === filterVillage;
    const matchCourse = filterCourse === "all" || a.course === filterCourse;
    const matchTeacher = filterTeacher === "all" || a.assigned_teacher_id === filterTeacher || (filterTeacher === "none" && !a.assigned_teacher_id);
    return matchSearch && matchStatus && matchVillage && matchCourse && matchTeacher;
  });

  const selectedApps = filtered.filter((a) => selected.has(a.id));
  const stats = STATUSES.reduce((acc, s) => ({ ...acc, [s]: applications.filter((a) => a.status === s).length }), {} as Record<string, number>);

  function toggleSelect(id: string) { setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }); }
  function toggleAll() { setSelected(filtered.length === selected.size && [...selected].every((id) => filtered.some((a) => a.id === id)) ? new Set() : new Set(filtered.map((a) => a.id))); }
  function handleLogout() { logout(); setLocation("/staff/login"); }

  const allSelected = filtered.length > 0 && filtered.every((a) => selected.has(a.id));

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1e40af] text-white px-4 py-4">
        <div className="max-w-full mx-auto flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Office Dashboard</h1>
            <p className="text-blue-200 text-sm">Welcome, {user.name} · All Applications</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setShowQR(true)} className="bg-blue-700 hover:bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg">📱 Share QR</button>
            <button onClick={() => exportToCSV(applications)} className="bg-blue-700 hover:bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg">📊 Export All</button>
            <button onClick={handleLogout} className="bg-blue-800 hover:bg-blue-700 text-white text-sm px-3 py-1.5 rounded-lg">🔓 Logout</button>
          </div>
        </div>
      </div>

      <div className="max-w-full px-4 py-6">
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
            <div key={s.label} className={`${s.color} rounded-xl p-3 text-center cursor-pointer`} onClick={() => setFilterStatus(s.label === "Total" ? "all" : s.label.toLowerCase().replace(" ", "_") as ApplicationStatus)}>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex flex-wrap gap-3">
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, phone, ID, village..." className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px] flex-1" />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as ApplicationStatus | "all")} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All Status</option>
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <select value={filterVillage} onChange={(e) => setFilterVillage(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All Villages</option>
            {villages.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
          <select value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All Courses</option>
            {courses.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterTeacher} onChange={(e) => setFilterTeacher(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All Teachers</option>
            <option value="none">Unassigned</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        {/* Bulk Actions */}
        {selected.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-blue-800">{selected.size} selected</span>
            <button onClick={() => { selectedApps.forEach((a) => openWhatsApp(a.phone, getMessageForStatus(a))); }} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700">💬 WhatsApp All</button>
            <button onClick={() => exportToCSV(selectedApps, "bgs-selected")} className="text-xs bg-[#1e40af] text-white px-3 py-1.5 rounded-lg hover:bg-blue-800">📊 Export CSV</button>
            <button onClick={() => exportToExcel(selectedApps, "bgs-selected")} className="text-xs bg-[#1e40af] text-white px-3 py-1.5 rounded-lg hover:bg-blue-800">📊 Export Excel</button>
            <button onClick={() => exportToODS(selectedApps, "bgs-selected")} className="text-xs bg-[#1e40af] text-white px-3 py-1.5 rounded-lg hover:bg-blue-800">📊 Export ODS</button>
            <button onClick={() => printTable(selectedApps)} className="text-xs bg-gray-600 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700">🖨️ Print</button>
            <button onClick={() => setSelected(new Set())} className="text-xs text-gray-500 hover:text-gray-700 ml-auto">Clear</button>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading applications...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-200">No applications found</div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-3 py-3"><input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded" /></th>
                    {["ID", "Date", "Student", "Parent", "Phone", "Alt Phone", "Village", "School", "Course", "Marks%", "Status", "Meeting", "Teacher", "Notes", "Actions"].map((h) => (
                      <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((app) => (
                    <tr key={app.id} className={`hover:bg-gray-50 ${selected.has(app.id) ? "bg-blue-50" : ""}`}>
                      <td className="px-3 py-3"><input type="checkbox" checked={selected.has(app.id)} onChange={() => toggleSelect(app.id)} className="rounded" /></td>
                      <td className="px-3 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">{app.app_id}</td>
                      <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{new Date(app.created_at).toLocaleDateString("en-IN")}</td>
                      <td className="px-3 py-3 font-medium text-gray-900 whitespace-nowrap">{app.student_name}</td>
                      <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{app.parent_name}</td>
                      <td className="px-3 py-3 whitespace-nowrap"><a href={`tel:${app.phone}`} className="text-blue-600 hover:underline">{app.phone}</a></td>
                      <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{app.alt_phone || "—"}</td>
                      <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{app.village}</td>
                      <td className="px-3 py-3 text-gray-600 whitespace-nowrap max-w-[120px] truncate" title={app.current_school}>{app.current_school}</td>
                      <td className="px-3 py-3 whitespace-nowrap"><span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded">{app.course}</span></td>
                      <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{app.marks_percent ?? "—"}</td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <select value={app.status} disabled={updatingId === app.id} onChange={(e) => updateStatus(app, e.target.value as ApplicationStatus)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none">
                          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-3 text-gray-600 whitespace-nowrap text-xs">
                        {app.meeting_date ? `${app.meeting_date} ${app.meeting_time || ""}` : "—"}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <select value={app.assigned_teacher_id || ""} onChange={(e) => assignTeacher(app, e.target.value)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none max-w-[110px]">
                          <option value="">Unassigned</option>
                          {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-3 max-w-[120px] truncate text-gray-500 text-xs" title={app.notes || ""}>{app.notes || "—"}</td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex gap-1">
                          <button onClick={() => setEditApp(app)} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded" title="Edit">✏️</button>
                          <a href={`tel:${app.phone}`} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded" title="Call">📞</a>
                          <button onClick={() => openWhatsApp(app.phone, getMessageForStatus(app))} className="text-xs bg-green-100 hover:bg-green-200 px-2 py-1 rounded" title="WhatsApp">💬</button>
                          <button onClick={() => setMeetingApp(app)} className="text-xs bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded" title="Fix Meeting">📅</button>
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
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
              Showing {filtered.length} of {applications.length} applications
              <span className="ml-4 gap-2 inline-flex">
                <button onClick={() => exportToCSV(filtered)} className="text-xs text-blue-600 hover:underline">CSV</button>·
                <button onClick={() => exportToExcel(filtered)} className="text-xs text-blue-600 hover:underline">Excel</button>·
                <button onClick={() => exportToODS(filtered)} className="text-xs text-blue-600 hover:underline">ODS</button>·
                <button onClick={() => printTable(filtered)} className="text-xs text-blue-600 hover:underline">Print</button>
              </span>
            </div>
          </div>
        )}
      </div>

      {notesApp && <NotesModal application={notesApp} onClose={() => setNotesApp(null)} onSaved={fetchAll} />}
      {meetingApp && <MeetingModal application={meetingApp} onClose={() => setMeetingApp(null)} onSaved={fetchAll} />}
      {editApp && <EditApplicationModal application={editApp} onClose={() => setEditApp(null)} onSaved={fetchAll} />}
      {showQR && <QRModal onClose={() => setShowQR(false)} />}
    </div>
  );
}
