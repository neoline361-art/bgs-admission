import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { supabase, hashPin } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import QRModal from "../components/QRModal";
import { exportToCSV, exportToExcel, exportToODS, printTable } from "../lib/export";
import type { Application, Staff, ApplicationStatus } from "../lib/types";
import { COURSES } from "../lib/constants";

const STATUSES: ApplicationStatus[] = ["new", "contacted", "meeting_fixed", "confirmed", "archived"];

interface NewStaffForm {
  name: string; username: string; pin: string; role: string; phone: string;
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [applications, setApplications] = useState<Application[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "staff" | "settings">("overview");
  const [showQR, setShowQR] = useState(false);
  const [newStaff, setNewStaff] = useState<NewStaffForm>({ name: "", username: "", pin: "", role: "teacher", phone: "" });
  const [addingStaff, setAddingStaff] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [staffSuccess, setStaffSuccess] = useState<string | null>(null);
  const [editingPin, setEditingPin] = useState<{ staffId: string; newPin: string } | null>(null);

  useEffect(() => {
    if (!user) { setLocation("/staff/login"); return; }
    if (user.role !== "admin") { setLocation(`/${user.role}`); return; }
  }, [user, setLocation]);

  const fetchAll = useCallback(async () => {
    const [appsRes, staffRes] = await Promise.all([
      supabase.from("applications").select("*").order("created_at", { ascending: false }),
      supabase.from("staff").select("*").order("name"),
    ]);
    if (!appsRes.error && appsRes.data) setApplications(appsRes.data);
    if (!staffRes.error && staffRes.data) setStaffList(staffRes.data as Staff[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const stats = {
    total: applications.length,
    confirmed: applications.filter((a) => a.status === "confirmed").length,
    pending: applications.filter((a) => ["new", "contacted", "meeting_fixed"].includes(a.status)).length,
    meetingsToday: applications.filter((a) => a.meeting_date === new Date().toISOString().slice(0, 10)).length,
    archived: applications.filter((a) => a.status === "archived").length,
  };

  // Village summary
  const villageSummary = Object.entries(
    applications.reduce((acc, a) => {
      if (!acc[a.village]) acc[a.village] = { total: 0, confirmed: 0 };
      acc[a.village].total++;
      if (a.status === "confirmed") acc[a.village].confirmed++;
      return acc;
    }, {} as Record<string, { total: number; confirmed: number }>)
  ).sort((a, b) => b[1].total - a[1].total);

  // Course summary
  const courseSummary = COURSES.map((c) => {
    const apps = applications.filter((a) => a.course === c.value);
    return { course: c.value, total: apps.length, confirmed: apps.filter((a) => a.status === "confirmed").length };
  }).filter((c) => c.total > 0).sort((a, b) => b.total - a.total);

  // Teacher performance
  const teachers = staffList.filter((s) => s.role === "teacher");
  const teacherPerf = teachers.map((t) => {
    const assigned = applications.filter((a) => a.assigned_teacher_id === t.id);
    return {
      name: t.name,
      assigned: assigned.length,
      contacted: assigned.filter((a) => a.status === "contacted").length,
      meeting: assigned.filter((a) => a.status === "meeting_fixed").length,
      confirmed: assigned.filter((a) => a.status === "confirmed").length,
      archived: assigned.filter((a) => a.status === "archived").length,
    };
  });

  async function addStaff() {
    setStaffError(null); setStaffSuccess(null);
    if (!newStaff.name || !newStaff.username || !newStaff.pin || !newStaff.role) { setStaffError("All fields except phone are required"); return; }
    if (!/^\d{4}$/.test(newStaff.pin)) { setStaffError("PIN must be exactly 4 digits"); return; }
    if (!/^[a-z0-9_]+$/.test(newStaff.username)) { setStaffError("Username: lowercase letters, numbers, underscore only"); return; }
    setAddingStaff(true);
    const pin_hash = await hashPin(newStaff.pin);
    const { error } = await supabase.from("staff").insert({ name: newStaff.name.trim(), username: newStaff.username.trim().toLowerCase(), pin_hash, role: newStaff.role, phone: newStaff.phone.trim() || null, is_active: true });
    if (error) { setStaffError(error.message.includes("duplicate") ? "Username already exists" : error.message); }
    else { setStaffSuccess(`Staff member "${newStaff.name}" added successfully!`); setNewStaff({ name: "", username: "", pin: "", role: "teacher", phone: "" }); fetchAll(); }
    setAddingStaff(false);
  }

  async function toggleActive(staff: Staff) {
    await supabase.from("staff").update({ is_active: !staff.is_active }).eq("id", staff.id);
    fetchAll();
  }

  async function savePin() {
    if (!editingPin) return;
    if (!/^\d{4}$/.test(editingPin.newPin)) { setStaffError("PIN must be exactly 4 digits"); return; }
    const pin_hash = await hashPin(editingPin.newPin);
    await supabase.from("staff").update({ pin_hash }).eq("id", editingPin.staffId);
    setEditingPin(null); setStaffSuccess("PIN updated successfully"); fetchAll();
  }

  function handleLogout() { logout(); setLocation("/staff/login"); }

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1e40af] text-white px-4 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
            <p className="text-blue-200 text-sm">Welcome, {user.name} · {today}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setShowQR(true)} className="bg-blue-700 hover:bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg">📱 QR Code</button>
            <button onClick={() => exportToCSV(applications)} className="bg-blue-700 hover:bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg">📊 Full CSV</button>
            <button onClick={() => exportToExcel(applications)} className="bg-blue-700 hover:bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg">📊 Excel</button>
            <button onClick={() => exportToODS(applications)} className="bg-blue-700 hover:bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg">📊 ODS</button>
            <button onClick={() => printTable(applications)} className="bg-blue-700 hover:bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg">🖨️ Print</button>
            <button onClick={handleLogout} className="bg-blue-800 hover:bg-blue-700 text-white text-sm px-3 py-1.5 rounded-lg">🔓 Logout</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-4">
        <div className="max-w-7xl mx-auto flex gap-6">
          {(["overview", "staff", "settings"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors capitalize ${activeTab === tab ? "border-[#1e40af] text-[#1e40af]" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
              {tab === "overview" ? "📊 Overview" : tab === "staff" ? "👥 Staff Management" : "⚙️ Settings"}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading data...</div>
        ) : activeTab === "overview" ? (
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {[
                { label: "Total Applications", value: stats.total, color: "border-blue-200 bg-blue-50", text: "text-blue-700" },
                { label: "Confirmed", value: stats.confirmed, color: "border-green-200 bg-green-50", text: "text-green-700" },
                { label: "Pending", value: stats.pending, color: "border-amber-200 bg-amber-50", text: "text-amber-700" },
                { label: "Meetings Today", value: stats.meetingsToday, color: "border-purple-200 bg-purple-50", text: "text-purple-700" },
                { label: "Archived", value: stats.archived, color: "border-red-200 bg-red-50", text: "text-red-700" },
              ].map((s) => (
                <div key={s.label} className={`${s.color} border-2 rounded-xl p-4 text-center`}>
                  <div className={`text-3xl font-bold ${s.text}`}>{s.value}</div>
                  <div className="text-sm text-gray-600 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Meetings Today */}
            {stats.meetingsToday > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h2 className="font-semibold text-amber-800 mb-3">📅 Meetings Today ({stats.meetingsToday})</h2>
                <div className="space-y-2">
                  {applications.filter((a) => a.meeting_date === new Date().toISOString().slice(0, 10)).map((a) => (
                    <div key={a.id} className="flex justify-between items-center bg-white rounded-lg px-3 py-2 text-sm">
                      <span className="font-medium">{a.student_name}</span>
                      <span className="text-gray-500">{a.meeting_time}</span>
                      <a href={`tel:${a.phone}`} className="text-blue-600 hover:underline">{a.phone}</a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Village Summary */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                  <h2 className="font-semibold text-gray-800">Village Summary</h2>
                  <span className="text-xs text-gray-400">{villageSummary.length} villages</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Village</th>
                      <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Total</th>
                      <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Confirmed</th>
                      <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">%</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {villageSummary.map(([village, data]) => (
                        <tr key={village} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-medium text-gray-800">{village}</td>
                          <td className="px-4 py-2 text-right text-gray-600">{data.total}</td>
                          <td className="px-4 py-2 text-right text-green-600">{data.confirmed}</td>
                          <td className="px-4 py-2 text-right text-gray-500">{data.total > 0 ? Math.round((data.confirmed / data.total) * 100) : 0}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Course Summary */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-800">Course Demand</h2>
                </div>
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Course</th>
                    <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Total</th>
                    <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Confirmed</th>
                    <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">%</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {courseSummary.map((c) => (
                      <tr key={c.course} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium text-gray-800">{c.course}</td>
                        <td className="px-4 py-2 text-right text-gray-600">{c.total}</td>
                        <td className="px-4 py-2 text-right text-green-600">{c.confirmed}</td>
                        <td className="px-4 py-2 text-right text-gray-500">{c.total > 0 ? Math.round((c.confirmed / c.total) * 100) : 0}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Teacher Performance */}
            {teacherPerf.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-800">Teacher Performance</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-gray-50 border-b border-gray-100">
                      {["Teacher", "Assigned", "Contacted", "Meeting", "Confirmed", "Archived"].map((h) => (
                        <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-gray-500">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {teacherPerf.map((t) => (
                        <tr key={t.name} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-medium text-gray-800">{t.name}</td>
                          <td className="px-4 py-2 text-gray-600">{t.assigned}</td>
                          <td className="px-4 py-2 text-blue-600">{t.contacted}</td>
                          <td className="px-4 py-2 text-amber-600">{t.meeting}</td>
                          <td className="px-4 py-2 text-green-600">{t.confirmed}</td>
                          <td className="px-4 py-2 text-red-600">{t.archived}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === "staff" ? (
          <div className="space-y-6">
            {/* Add Staff */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Add Staff Member</h2>
              {staffError && <p className="text-red-600 text-sm mb-3 bg-red-50 border border-red-200 rounded-lg p-2">{staffError}</p>}
              {staffSuccess && <p className="text-green-600 text-sm mb-3 bg-green-50 border border-green-200 rounded-lg p-2">{staffSuccess}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: "Full Name *", field: "name", placeholder: "Staff full name", type: "text" },
                  { label: "Username *", field: "username", placeholder: "lowercase_username", type: "text" },
                  { label: "4-digit PIN *", field: "pin", placeholder: "••••", type: "password" },
                  { label: "Phone", field: "phone", placeholder: "10-digit mobile", type: "tel" },
                ].map(({ label, field, placeholder, type }) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                    <input type={type} value={newStaff[field as keyof NewStaffForm]}
                      onChange={(e) => { const v = field === "pin" ? e.target.value.replace(/\D/g, "").slice(0, 4) : e.target.value; setNewStaff((f) => ({ ...f, [field]: v })); }}
                      placeholder={placeholder} maxLength={field === "pin" ? 4 : undefined}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                  <select value={newStaff.role} onChange={(e) => setNewStaff((f) => ({ ...f, role: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="teacher">Teacher</option>
                    <option value="office">Office</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <button onClick={addStaff} disabled={addingStaff}
                className="mt-4 bg-[#1e40af] hover:bg-blue-800 disabled:bg-blue-300 text-white font-medium px-6 py-2.5 rounded-lg transition-colors">
                {addingStaff ? "Adding..." : "Add Staff Member"}
              </button>
            </div>

            {/* Staff List */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">Staff Members ({staffList.length})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50 border-b border-gray-100">
                    {["Name", "Username", "Role", "Phone", "Status", "Actions"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {staffList.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                        <td className="px-4 py-3 font-mono text-gray-600">{s.username}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.role === "admin" ? "bg-purple-100 text-purple-700" : s.role === "office" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>
                            {s.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{s.phone || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {s.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            {editingPin?.staffId === s.id ? (
                              <div className="flex gap-1">
                                <input type="password" value={editingPin.newPin} onChange={(e) => setEditingPin({ staffId: s.id, newPin: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                                  placeholder="New PIN" maxLength={4} className="border border-gray-300 rounded px-2 py-1 text-xs w-20" />
                                <button onClick={savePin} className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">Save</button>
                                <button onClick={() => setEditingPin(null)} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300">Cancel</button>
                              </div>
                            ) : (
                              <button onClick={() => { setEditingPin({ staffId: s.id, newPin: "" }); setStaffError(null); setStaffSuccess(null); }}
                                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded">Edit PIN</button>
                            )}
                            <button onClick={() => toggleActive(s)}
                              className={`text-xs px-2 py-1 rounded ${s.is_active ? "bg-red-100 hover:bg-red-200 text-red-700" : "bg-green-100 hover:bg-green-200 text-green-700"}`}>
                              {s.is_active ? "Deactivate" : "Activate"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">College Information</h2>
              <div className="space-y-3 text-sm text-gray-700">
                <p><strong>Name:</strong> BGS PU College</p>
                <p><strong>Location:</strong> Hanumanthpura, Shidlaghatta, Karnataka 562105</p>
                <p><strong>College Code:</strong> MC0118</p>
                <p><strong>Admission Year:</strong> 2026</p>
              </div>
              <p className="text-xs text-gray-400 mt-4">To update college info, edit <code>src/lib/constants.ts</code></p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Message Templates</h2>
              <div className="space-y-3 text-sm text-gray-600">
                {[
                  { status: "New Application", msg: "BGS College: We received {Student}'s application (ID: {ID}). We will contact you within 2 days. -BGS Hanumanthpura" },
                  { status: "Contacted", msg: "BGS College: Hello {Parent}, regarding {Student}'s admission. When can you visit campus? -BGS Hanumanthpura" },
                  { status: "Meeting Fixed", msg: "BGS College: Meeting for {Student} on {Date} at {Time}. BGS PU College, Hanumanthpura. Bring: Marks Card, TC, Aadhaar, 4 Photos. -BGS Hanumanthpura" },
                  { status: "Confirmed", msg: "🎉 BGS College: {Student} CONFIRMED for {Course}! Welcome! -BGS Hanumanthpura" },
                  { status: "Archived", msg: "BGS College: Application {ID} closed. Thank you. Best wishes. -BGS Hanumanthpura" },
                ].map((t) => (
                  <div key={t.status} className="bg-gray-50 rounded-lg p-3">
                    <p className="font-medium text-gray-700 mb-1">{t.status}</p>
                    <p className="text-gray-500 italic">{t.msg}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-4">To edit templates, modify <code>src/lib/constants.ts → MESSAGE_TEMPLATES</code></p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Database Backup</h2>
              <div className="flex gap-3 flex-wrap">
                <button onClick={() => exportToCSV(applications, "bgs-full-backup")} className="bg-[#1e40af] hover:bg-blue-800 text-white font-medium px-4 py-2 rounded-lg text-sm">📊 Full CSV Backup</button>
                <button onClick={() => exportToExcel(applications, "bgs-full-backup")} className="bg-[#1e40af] hover:bg-blue-800 text-white font-medium px-4 py-2 rounded-lg text-sm">📊 Full Excel Backup</button>
                <button onClick={() => exportToODS(applications, "bgs-full-backup")} className="bg-[#1e40af] hover:bg-blue-800 text-white font-medium px-4 py-2 rounded-lg text-sm">📊 Full ODS Backup</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showQR && <QRModal onClose={() => setShowQR(false)} />}
    </div>
  );
}
