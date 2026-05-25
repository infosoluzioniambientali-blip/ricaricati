import { useState } from "react";
import { Link } from "wouter";
import { Zap, LogIn, LogOut, ChevronDown, Sparkles, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PremiumNavbarProps {
  isSoloSingole: boolean;
  isAuthenticated: boolean;
  onLoginClick: () => void;
  onLogout?: () => void;
  onShowMobileMenu: (show: boolean) => void;
  showMobileMenu: boolean;
  packs: Array<{ id: string; nome: string; prezzo: string; praticheRes: number }>;
}

export function PremiumNavbar({
  isSoloSingole,
  isAuthenticated,
  onLoginClick,
  onLogout,
  onShowMobileMenu,
  showMobileMenu,
  packs,
}: PremiumNavbarProps) {
  const [showPackDropdown, setShowPackDropdown] = useState(false);

  const navLinks = [
    { href: "/chi-siamo", label: "Chi Siamo", isExternal: true },
    { href: "#vantaggi", label: "Vantaggi" },
    { href: "#calcolatore", label: "Calcolatore" },
    { href: "/listino", label: "Listino Pratiche Singole", isExternal: true },
    { href: "/premi", label: "Premi (Pratiche Omaggio)", isExternal: true },
    { href: "/partner", label: "Partner", isExternal: true },
  ];

  return (
    <>
      {/* NAVBAR PREMIUM */}
      <nav className="sticky top-0 z-50 bg-gradient-to-b from-[#1a4a2e]/95 to-[#0e3320]/90 backdrop-blur-xl border-b border-white/5 shadow-2xl">
        <div className="container px-4 py-3">
          {/* Prima riga: Logo + Menu Desktop Links */}
          <div className="flex items-center justify-between mb-2">
            {/* Logo con animazione */}
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="relative">
                <Zap className="w-7 h-7 text-[#4ade80] group-hover:scale-110 transition-transform duration-300" />
                <Sparkles className="w-3 h-3 text-[#f5c518] absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span
                className="font-black text-lg text-white group-hover:text-[#f5c518] transition-colors duration-300"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                RICARICATI <span className="text-[#f5c518]">DI CONNESSIONI</span>
              </span>
            </div>

            {/* Menù mobile hamburger */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={() => onShowMobileMenu(!showMobileMenu)}
                className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 hover:scale-110"
              >
                {showMobileMenu ? (
                  <X className="w-6 h-6 text-white" />
                ) : (
                  <Menu className="w-6 h-6 text-white" />
                )}
              </button>
            </div>

            {/* Menu Desktop - Prima riga: Link di navigazione */}
            <div className="hidden md:flex items-center gap-1 flex-wrap justify-end">
              {/* Pack dropdown */}
              {!isSoloSingole && (
                <div
                  className="relative group"
                  onMouseEnter={() => setShowPackDropdown(true)}
                  onMouseLeave={() => setShowPackDropdown(false)}
                >
                  <button className="px-3 py-1 text-white/80 hover:text-[#f5c518] transition-colors duration-200 font-medium text-xs flex items-center gap-1 group-hover:bg-white/5 rounded-lg">
                    I Pack
                    <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
                  </button>

                  {/* Mega dropdown */}
                  {showPackDropdown && (
                    <div className="absolute left-0 mt-0 w-96 bg-[#0e3320]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300 pt-2">
                      <div className="p-4 space-y-3">
                        {packs.map((pack, idx) => (
                          <button
                            key={idx}
                            onClick={() => { const el = document.getElementById("pack"); if(el) el.scrollIntoView({behavior:"smooth"}); setShowPackDropdown(false); }}
                            className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-all duration-200 border border-white/5 hover:border-[#f5c518]/30 group/item cursor-pointer"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white group-hover/item:text-[#f5c518] transition-colors">
                                {pack.nome}
                              </span>
                              <span className="text-[#f5c518] font-black">{pack.prezzo}</span>
                            </div>
                            <p className="text-white/60 text-xs mt-1">
                              {pack.praticheRes} pratiche residenziali
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Link normali con hover effect */}
              {navLinks.map((item) =>
                item.isExternal ? (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="px-3 py-1 text-white/80 hover:text-[#f5c518] transition-colors duration-200 font-medium text-xs relative group"
                  >
                    {item.label}
                    <span className="absolute bottom-0 left-3 w-0 h-0.5 bg-gradient-to-r from-[#f5c518] to-[#4ade80] group-hover:w-[calc(100%-1.5rem)] transition-all duration-300" />
                  </Link>
                ) : (
                  <a
                    key={item.href}
                    href={item.href}
                    className="px-3 py-1 text-white/80 hover:text-[#f5c518] transition-colors duration-200 font-medium text-xs relative group"
                  >
                    {item.label}
                    <span className="absolute bottom-0 left-3 w-0 h-0.5 bg-gradient-to-r from-[#f5c518] to-[#4ade80] group-hover:w-[calc(100%-1.5rem)] transition-all duration-300" />
                  </a>
                )
              )}
            </div>
          </div>

          {/* Seconda riga: CTA principali (solo desktop) */}
          <div className="hidden md:flex items-center gap-3 justify-end">
            {/* Pack Benvenuto Button */}
            <Link href="/pack-benvenuto">
              <button className="bg-gradient-to-r from-[#f5c518] to-[#fbbf24] text-[#1a4a2e] hover:shadow-lg hover:shadow-[#f5c518]/50 px-4 py-2 rounded-lg font-bold text-sm transition-all duration-300 hover:scale-105 active:scale-95">
                Pack Benvenuto
              </button>
            </Link>

            {/* Auth section */}
            {!isAuthenticated ? (
              <Button
                onClick={onLoginClick}
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 font-bold text-sm gap-2 px-4 py-2 transition-all duration-200 hover:border-[#f5c518]/50"
              >
                <LogIn className="w-4 h-4" />
                Login
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/portale">
                  <Button variant="outline" className="border-[#f5c518] text-[#f5c518] hover:bg-[#f5c518] hover:text-[#1a4a2e] font-bold text-sm px-4 py-2 transition-all duration-200">
                    Portale
                  </Button>
                </Link>
                {onLogout && (
                  <Button onClick={onLogout} variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-400 font-bold text-sm px-3 py-2 transition-all duration-200">
                    <LogOut className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {showMobileMenu && (
        <div className="md:hidden bg-gradient-to-b from-[#1a4a2e]/95 to-[#0e3320]/90 border-b border-white/10 py-4 px-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          {!isSoloSingole && (
            <button
              onClick={() => { const el = document.getElementById("pack"); if(el) el.scrollIntoView({behavior:"smooth"}); setShowPackDropdown(false); onShowMobileMenu(false); }}
              className="block px-4 py-2 text-white/80 hover:text-[#f5c518] transition-colors text-sm font-medium"
            >
              I Pack
            </button>
          )}
          {navLinks.map((item) =>
            item.isExternal ? (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onShowMobileMenu(false)}
                className="block px-4 py-2 text-white/80 hover:text-[#f5c518] transition-colors text-sm font-medium"
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.href}
                href={item.href}
                onClick={() => onShowMobileMenu(false)}
                className="block px-4 py-2 text-white/80 hover:text-[#f5c518] transition-colors text-sm font-medium"
              >
                {item.label}
              </a>
            )
          )}
          <Link href="/pack-benvenuto" onClick={() => onShowMobileMenu(false)}>
            <button className="w-full bg-gradient-to-r from-[#f5c518] to-[#fbbf24] text-[#1a4a2e] px-4 py-2 rounded-lg font-bold text-sm transition-all duration-300">
              Pack Benvenuto
            </button>
          </Link>
          {!isAuthenticated ? (
            <Button
              onClick={() => {
                onLoginClick();
                onShowMobileMenu(false);
              }}
              variant="outline"
              className="w-full border-white/30 text-white hover:bg-white/10 font-bold text-sm gap-2 transition-all duration-200"
            >
              <LogIn className="w-4 h-4" />
              Login
            </Button>
          ) : (
            <Link href="/portale" onClick={() => onShowMobileMenu(false)}>
              <Button variant="outline" className="w-full border-[#f5c518] text-[#f5c518] hover:bg-[#f5c518] hover:text-[#1a4a2e] font-bold text-sm transition-all duration-200">
                Portale
              </Button>
            </Link>
          )}
        </div>
      )}
    </>
  );
}
