import { useSearch } from "wouter";
import { Link } from "wouter";
import { COLLEGE_NAME, COLLEGE_LOCATION } from "../lib/constants";

export default function ApplySuccess() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const id = params.get("id") || "BGS-2026-XXXX";
  const name = params.get("name") || "Student";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-md p-8 text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">✅</span>
        </div>

        <h1 className="text-2xl font-bold text-green-700 mb-2">Application Submitted!</h1>
        <p className="text-gray-600 mb-6">Thank you, {decodeURIComponent(name)}!</p>

        {/* Application ID */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-blue-600 mb-1">Your Application ID</p>
          <p className="text-3xl font-bold text-[#1e40af] tracking-wide">{id}</p>
          <p className="text-xs text-blue-500 mt-2">Save this ID for future reference</p>
        </div>

        {/* Next Steps */}
        <div className="text-left bg-gray-50 rounded-xl p-4 mb-6 space-y-2">
          <p className="text-sm font-medium text-gray-700">What happens next?</p>
          <p className="text-sm text-gray-600">✓ Our staff will review your application</p>
          <p className="text-sm text-gray-600">✓ We will contact you within 2 working days</p>
          <p className="text-sm text-gray-600">✓ A meeting will be scheduled at the college</p>
          <p className="text-sm text-gray-600">✓ Bring Marks Card, TC, Aadhaar and 4 Photos</p>
        </div>

        {/* College Info */}
        <div className="border-t border-gray-100 pt-4 mb-6">
          <p className="text-sm font-medium text-gray-700">{COLLEGE_NAME}</p>
          <p className="text-xs text-gray-500">{COLLEGE_LOCATION}</p>
        </div>

        <Link
          href="/"
          className="block w-full bg-[#1e40af] hover:bg-blue-800 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          Back to Home
        </Link>

        <Link
          href="/apply"
          className="block mt-3 text-sm text-blue-600 hover:underline"
        >
          Submit another application
        </Link>
      </div>
    </div>
  );
}
