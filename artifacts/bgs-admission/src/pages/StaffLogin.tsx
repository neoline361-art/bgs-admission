import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { supabase, verifyPin } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import Captcha from "../components/Captcha";
import { COLLEGE_NAME } from "../lib/constants";
import type { StaffRole } from "../lib/types";

export default function StaffLogin() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [captchaValid, setCaptchaValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCaptcha = useCallback((valid: boolean) => {
    setCaptchaValid(valid);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!username.trim()) { setError("Username is required"); return; }
    if (pin.length !== 4) { setError("PIN must be 4 digits"); return; }
    if (!captchaValid) { setError("Please enter the correct CAPTCHA"); return; }

    setLoading(true);
    try {
      const { data: staff, error: dbError } = await supabase
        .from("staff")
        .select("id, username, name, pin_hash, role, phone, is_active")
        .eq("username", username.trim().toLowerCase())
        .single();

      if (dbError || !staff) {
        setError("Invalid username or PIN");
        return;
      }

      if (!staff.is_active) {
        setError("Your account is deactivated. Contact admin.");
        return;
      }

      const valid = await verifyPin(pin, staff.pin_hash);
      if (!valid) {
        setError("Invalid username or PIN");
        return;
      }

      login({ id: staff.id, username: staff.username, name: staff.name, role: staff.role as StaffRole, phone: staff.phone });

      const routes: Record<StaffRole, string> = {
        teacher: "/teacher",
        office: "/office",
        admin: "/admin",
      };
      setLocation(routes[staff.role as StaffRole] || "/");
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-sm p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#1e40af] rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-2xl font-bold">BGS</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Staff Login</h1>
          <p className="text-sm text-gray-500 mt-1">{COLLEGE_NAME}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoComplete="username"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PIN</label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="4-digit PIN"
              inputMode="numeric"
              maxLength={4}
              autoComplete="current-password"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <Captcha onVerify={handleCaptcha} />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1e40af] hover:bg-blue-800 disabled:bg-blue-300 text-white font-semibold py-3 px-6 rounded-xl transition-colors mt-2"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <a href="/" className="block text-center text-sm text-gray-400 mt-4 hover:text-gray-600">
          ← Back to Home
        </a>
      </div>
    </div>
  );
}
