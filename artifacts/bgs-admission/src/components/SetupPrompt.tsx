export default function SetupPrompt() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-amber-200 w-full max-w-lg p-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">⚙️</span>
          <h1 className="text-xl font-bold text-amber-800">Supabase Setup Required</h1>
        </div>
        <p className="text-gray-600 mb-4 text-sm">
          This app needs a Supabase database. Follow these steps:
        </p>
        <ol className="space-y-3 text-sm text-gray-700 list-decimal list-inside">
          <li>Go to <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-medium">supabase.com</a> and create a free account</li>
          <li>Create a new project and wait for it to be ready</li>
          <li>Go to <strong>SQL Editor → New Query</strong>, paste the contents of <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">supabase/schema.sql</code> and click Run</li>
          <li>Go to <strong>Settings → API</strong> and copy your Project URL and anon public key</li>
          <li>Add these to your environment:
            <pre className="bg-gray-900 text-green-400 text-xs p-3 rounded-lg mt-2 overflow-x-auto">
{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key`}
            </pre>
          </li>
          <li>Restart the app — you're ready!</li>
        </ol>
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
          See <strong>README.md</strong> in this project for detailed setup instructions.
        </div>
      </div>
    </div>
  );
}
