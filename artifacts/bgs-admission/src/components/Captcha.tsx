import { useEffect, useState, useCallback } from "react";

interface CaptchaProps {
  onVerify: (valid: boolean) => void;
}

function generateCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export default function Captcha({ onVerify }: CaptchaProps) {
  const [code, setCode] = useState(generateCode);
  const [input, setInput] = useState("");

  const refresh = useCallback(() => {
    setCode(generateCode());
    setInput("");
    onVerify(false);
  }, [onVerify]);

  useEffect(() => {
    onVerify(input === code);
  }, [input, code, onVerify]);

  // Generate random distortion styles for each digit
  const digitStyles = code.split("").map((_, i) => ({
    transform: `rotate(${(Math.random() - 0.5) * 14}deg) translateY(${(Math.random() - 0.5) * 4}px)`,
    fontSize: `${20 + Math.random() * 6}px`,
    color: `hsl(${200 + i * 40}, 50%, 30%)`,
    fontFamily: i % 2 === 0 ? "serif" : "monospace",
    fontWeight: i % 3 === 0 ? "900" : "700",
  }));

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        CAPTCHA <span className="text-red-500">*</span>
      </label>

      {/* CAPTCHA display */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center gap-1 bg-gray-100 border-2 border-gray-300 rounded-lg px-5 py-3 select-none"
          style={{
            background: "linear-gradient(135deg, #e8eef5 0%, #d5e0eb 100%)",
            minWidth: "120px",
          }}
        >
          {code.split("").map((digit, i) => (
            <span
              key={i}
              className="inline-block"
              style={digitStyles[i]}
            >
              {digit}
            </span>
          ))}
        </div>

        <button
          type="button"
          onClick={refresh}
          className="text-sm text-blue-600 hover:text-blue-800 underline whitespace-nowrap"
        >
          🔄 Refresh
        </button>
      </div>

      <p className="text-xs text-gray-500">Type the 4 digits you see above</p>

      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
        placeholder="Enter the 4 digits"
        maxLength={4}
        className={`w-full border rounded-lg px-4 py-3 text-base tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          input.length === 4
            ? input === code
              ? "border-green-400 bg-green-50"
              : "border-red-400 bg-red-50"
            : "border-gray-300"
        }`}
      />

      {input.length === 4 && input !== code && (
        <p className="text-red-500 text-xs">Incorrect. Click Refresh for a new code.</p>
      )}
    </div>
  );
}
