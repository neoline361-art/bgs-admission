import { Link } from "wouter";
import { COLLEGE_NAME, COLLEGE_LOCATION, COLLEGE_CODE } from "../lib/constants";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#1e40af] flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
        {/* Logo / College Header */}
        <div className="mb-6">
          <div className="w-20 h-20 bg-[#1e40af] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-3xl font-bold">BGS</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{COLLEGE_NAME}</h1>
          <p className="text-sm text-gray-500 mt-1">{COLLEGE_LOCATION}</p>
          <p className="text-xs text-gray-400 mt-1">College Code: {COLLEGE_CODE}</p>
        </div>

        <div className="border-t border-gray-100 my-6" />

        <h2 className="text-xl font-semibold text-gray-800 mb-2">Admission 2026</h2>
        <p className="text-gray-500 text-sm mb-8">
          Apply for admission or log in to the staff portal
        </p>

        <div className="space-y-4">
          <Link
            href="/apply"
            className="block w-full bg-[#1e40af] hover:bg-blue-800 text-white font-semibold text-lg py-4 px-6 rounded-xl transition-colors"
          >
            📝 Apply for Admission
          </Link>

          <Link
            href="/staff/login"
            className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-lg py-4 px-6 rounded-xl transition-colors"
          >
            🔐 Staff Login
          </Link>
        </div>

        <p className="text-xs text-gray-400 mt-8">
          Scan QR code or share this link to applicants
        </p>
      </div>

      <p className="text-blue-200 text-xs mt-6">
        BGS Admission Connect · Free & Open Source
      </p>
    </div>
  );
}
