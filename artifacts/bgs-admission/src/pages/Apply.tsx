import { useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "../lib/supabase";
import { VILLAGES, COURSES, COLLEGE_NAME, COLLEGE_LOCATION, ADMISSION_YEAR } from "../lib/constants";

interface FormData {
  student_name: string;
  parent_name: string;
  phone: string;
  alt_phone: string;
  village: string;
  current_school: string;
  course: string;
  marks_percent: string;
  message: string;
}

const INITIAL: FormData = {
  student_name: "",
  parent_name: "",
  phone: "",
  alt_phone: "",
  village: "",
  current_school: "",
  course: "",
  marks_percent: "",
  message: "",
};

export default function Apply() {
  const [, setLocation] = useLocation();
  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function validate(): boolean {
    const e: Partial<FormData> = {};
    if (!form.student_name.trim()) e.student_name = "Student name is required";
    if (!form.parent_name.trim()) e.parent_name = "Parent name is required";
    if (!/^\d{10}$/.test(form.phone)) e.phone = "Enter a valid 10-digit phone number";
    if (form.alt_phone && !/^\d{10}$/.test(form.alt_phone))
      e.alt_phone = "Enter a valid 10-digit number";
    if (!form.village) e.village = "Please select a village";
    if (!form.current_school.trim()) e.current_school = "School name is required";
    if (!form.course) e.course = "Please select a course";
    if (
      form.marks_percent &&
      (isNaN(Number(form.marks_percent)) ||
        Number(form.marks_percent) < 0 ||
        Number(form.marks_percent) > 100)
    ) {
      e.marks_percent = "Enter a valid percentage (0–100)";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      // Generate app_id on the client (trigger will override if configured)
      // The trigger in Supabase will auto-generate the proper sequential ID
      const { data, error } = await supabase
        .from("applications")
        .insert({
          student_name: form.student_name.trim(),
          parent_name: form.parent_name.trim(),
          phone: form.phone.trim(),
          alt_phone: form.alt_phone.trim() || null,
          village: form.village,
          current_school: form.current_school.trim(),
          course: form.course,
          marks_percent: form.marks_percent ? Number(form.marks_percent) : null,
          message: form.message.trim() || null,
          status: "new",
        })
        .select("app_id")
        .single();

      if (error) throw error;

      // Redirect to success page with the generated ID
      setLocation(`/apply/success?id=${data.app_id}&name=${encodeURIComponent(form.student_name)}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Submission failed. Please try again.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  function update(field: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-[#1e40af] text-white px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <a href="/" className="text-blue-200 text-sm mb-2 block">← Back to Home</a>
          <h1 className="text-2xl font-bold">{COLLEGE_NAME}</h1>
          <p className="text-blue-200 text-sm">{COLLEGE_LOCATION}</p>
          <p className="text-blue-100 font-medium mt-2">Admission Application {ADMISSION_YEAR}</p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 mt-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Student Application Form</h2>

          {submitError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Student Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.student_name}
                onChange={(e) => update("student_name", e.target.value)}
                placeholder="Enter student's full name"
                className={`w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.student_name ? "border-red-400" : "border-gray-300"
                }`}
              />
              {errors.student_name && (
                <p className="text-red-500 text-xs mt-1">{errors.student_name}</p>
              )}
            </div>

            {/* Parent Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent / Guardian Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.parent_name}
                onChange={(e) => update("parent_name", e.target.value)}
                placeholder="Enter parent or guardian's name"
                className={`w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.parent_name ? "border-red-400" : "border-gray-300"
                }`}
              />
              {errors.parent_name && (
                <p className="text-red-500 text-xs mt-1">{errors.parent_name}</p>
              )}
            </div>

            {/* Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="10-digit mobile number"
                  className={`w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.phone ? "border-red-400" : "border-gray-300"
                  }`}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alternate Phone <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="tel"
                  value={form.alt_phone}
                  onChange={(e) =>
                    update("alt_phone", e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  placeholder="Alternate number"
                  className={`w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.alt_phone ? "border-red-400" : "border-gray-300"
                  }`}
                />
                {errors.alt_phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.alt_phone}</p>
                )}
              </div>
            </div>

            {/* Village */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Village / Town <span className="text-red-500">*</span>
              </label>
              <select
                value={form.village}
                onChange={(e) => update("village", e.target.value)}
                className={`w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
                  errors.village ? "border-red-400" : "border-gray-300"
                }`}
              >
                <option value="">Select your village / town</option>
                {VILLAGES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              {errors.village && <p className="text-red-500 text-xs mt-1">{errors.village}</p>}
            </div>

            {/* Current School */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current School <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.current_school}
                onChange={(e) => update("current_school", e.target.value)}
                placeholder="Name of school currently attending"
                className={`w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.current_school ? "border-red-400" : "border-gray-300"
                }`}
              />
              {errors.current_school && (
                <p className="text-red-500 text-xs mt-1">{errors.current_school}</p>
              )}
            </div>

            {/* Course */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Interested In <span className="text-red-500">*</span>
              </label>
              <select
                value={form.course}
                onChange={(e) => update("course", e.target.value)}
                className={`w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
                  errors.course ? "border-red-400" : "border-gray-300"
                }`}
              >
                <option value="">Select a course</option>
                {COURSES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              {errors.course && <p className="text-red-500 text-xs mt-1">{errors.course}</p>}
            </div>

            {/* Marks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Previous Class Marks % <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="number"
                value={form.marks_percent}
                onChange={(e) => update("marks_percent", e.target.value)}
                placeholder="e.g. 85"
                min="0"
                max="100"
                step="0.01"
                className={`w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.marks_percent ? "border-red-400" : "border-gray-300"
                }`}
              />
              {errors.marks_percent && (
                <p className="text-red-500 text-xs mt-1">{errors.marks_percent}</p>
              )}
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message / Any Questions <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                value={form.message}
                onChange={(e) => update("message", e.target.value)}
                placeholder="Any questions or additional information..."
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#1e40af] hover:bg-blue-800 disabled:bg-blue-300 text-white font-bold text-lg py-4 px-6 rounded-xl transition-colors mt-2"
            >
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-4">
            Your information is kept confidential and used only for admission purposes.
          </p>
        </div>
      </div>
    </div>
  );
}
