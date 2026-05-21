import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Cookie, X, Check } from "lucide-react";

const COOKIE_KEY = "cookie_consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) {
      // Mostra il banner dopo 500ms
      const t = setTimeout(() => setVisible(true), 500);
      return () => clearTimeout(t);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setVisible(false);
  };

  const reject = () => {
    localStorage.setItem(COOKIE_KEY, "rejected");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 sm:p-6">
      <div className="max-w-4xl mx-auto bg-[#0d2818] border border-[#f5c518]/30 rounded-2xl shadow-2xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-[#f5c518]/10 rounded-xl flex items-center justify-center">
            <Cookie className="w-5 h-5 text-[#f5c518]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm mb-1">Questo sito utilizza i cookie</p>
            <p className="text-gray-400 text-xs leading-relaxed">
              Utilizziamo cookie tecnici necessari al funzionamento del sito e, con il tuo consenso, cookie analitici per migliorare l'esperienza.
              Leggi la nostra{" "}
              <Link href="/cookie-policy" className="text-[#f5c518] hover:underline">Cookie Policy</Link>{" "}
              e la{" "}
              <Link href="/privacy-policy" className="text-[#f5c518] hover:underline">Privacy Policy</Link>.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
            <button
              onClick={reject}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/20 text-white/70 hover:text-white hover:border-white/40 text-sm font-medium transition-all flex-1 sm:flex-none justify-center"
            >
              <X className="w-4 h-4" />
              Solo necessari
            </button>
            <button
              onClick={accept}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#f5c518] text-[#1a4a2e] font-bold text-sm hover:bg-[#f5c518]/90 transition-all flex-1 sm:flex-none justify-center"
            >
              <Check className="w-4 h-4" />
              Accetta tutti
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
