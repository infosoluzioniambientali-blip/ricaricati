import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { Zap, CheckCircle, TrendingUp, Shield, Clock, Gift, Users, ChevronRight, Calculator, Star, LogIn, Wrench, Trophy, Tag, ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PremiumNavbar } from "@/components/PremiumNavbar";

// Pack statici di fallback (usati solo se il DB non risponde)
const PACKS_FALLBACK = [
  { id: "pack1", slug: "pack1", nome: "Pack 1", prezzo: "\u20ac 2.000", badge: null as string | null, praticheRes: 16, prezzoRes: 125, praticheBus: 5, prezzoBus: 400, ricBollette: 10, ricPratiche: 100, highlight: false, colore: "green" },
  { id: "pack2", slug: "pack2", nome: "Pack 2", prezzo: "\u20ac 3.150", badge: "PI\u00d9 POPOLARE" as string | null, praticheRes: 30, prezzoRes: 105, praticheBus: 9, prezzoBus: 350, ricBollette: 15, ricPratiche: 150, highlight: true, colore: "yellow" },
  { id: "pack3", slug: "pack3", nome: "Pack 3", prezzo: "\u20ac 5.100", badge: "MASSIMO RISPARMIO" as string | null, praticheRes: 60, prezzoRes: 85, praticheBus: 20, prezzoBus: 250, ricBollette: 20, ricPratiche: 200, highlight: false, colore: "green" },
];

const VANTAGGI = [
  { icon: Star, titolo: "Hai sempre la promo migliore", desc: "Se in futuro proponiamo condizioni peggiori, mantieni questa. Se le miglioriamo, puoi passare a quella nuova." },
  { icon: Zap, titolo: "Schema unifilare incluso", desc: "Nessun costo aggiuntivo per gli schemi elettrici. Tutto compreso nel prezzo della pratica." },
  { icon: Clock, titolo: "Zero scadenze", desc: "Le pratiche non scadono mai. Usi il pacchetto con i tuoi tempi, senza fretta o pressioni." },
  { icon: Shield, titolo: "Interessi zero", desc: "Paghi in comodità, senza prestiti né finanziamenti. Un investimento chiaro e trasparente." },
  { icon: Gift, titolo: "Pratiche omaggio", desc: "Ricarichi il credito del tuo pacchetto portando le bollette dei clienti e con il passaparola." },
  { icon: Users, titolo: "Utilizzo universale", desc: "Pratiche business e residenziali insieme nello stesso pacchetto, senza distinzioni o limiti." },
];

const INCLUSO = [
  "Schemi elettrici unifilari — Documentazione tecnica completa redatta da professionisti",
  "Pratiche E-Distribuzione — Gestione integrale della connessione alla rete di distribuzione locale",
  "Pratiche GSE — Gestione per l'ottenimento degli incentivi e il riconoscimento degli impianti",
  "Pratiche Terna — Per tutti gli impianti che richiedono la registrazione alla rete di trasmissione",
];

type PackConfig = { id: string; slug: string; nome: string; prezzo: string; badge: string | null; praticheRes: number; prezzoRes: number; praticheBus: number; prezzoBus: number; ricBollette: number; ricPratiche: number; highlight: boolean; colore: string };

function Calcolatore({ packs }: { packs: PackConfig[] }) {
  const [pratiche, setPratiche] = useState(10);
  const [praticheBus, setPraticheBus] = useState(3);
  const [bolletteMese, setBolletteMese] = useState(5);
  const [passaparolaMese, setPassaparolaMese] = useState(1);
  const [tabCalc, setTabCalc] = useState<"res" | "bus" | "ricariche">("res");

  const prezzoStandardRes = 350;
  const prezzoStandardBus = 1200;

  const risparmioRes = (pack: PackConfig) => {
    const m = pratiche * prezzoStandardRes - pratiche * pack.prezzoRes;
    return { mensile: m, annuale: m * 12 };
  };
  const risparmioB = (pack: PackConfig) => {
    const m = praticheBus * prezzoStandardBus - praticheBus * pack.prezzoBus;
    return { mensile: m, annuale: m * 12 };
  };

  return (
    <section className="py-20 bg-[#0e3320]">
      <div className="container">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-[#f5c518]/10 border border-[#f5c518]/30 rounded-full px-4 py-2 mb-4">
            <Calculator className="w-4 h-4 text-[#f5c518]" />
            <span className="text-[#f5c518] text-sm font-semibold uppercase tracking-wider">Calcolatore del Risparmio</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4" style={{ fontFamily: "Montserrat, sans-serif" }}>
            Quanto risparmi con un Pack?
          </h2>
        </div>
        {/* Tab selector */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-[#1a4a2e] rounded-2xl p-1 gap-1 flex-wrap justify-center">
            {[
              { key: "res" as const, label: "🏠 Pratiche Residenziali" },
              { key: "bus" as const, label: "🏭 Pratiche Business" },
              { key: "ricariche" as const, label: "⚡ Simulatore Ricariche" },
            ].map(t => (
              <button key={t.key} onClick={() => setTabCalc(t.key)}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  tabCalc === t.key ? "bg-[#f5c518] text-[#1a4a2e]" : "text-white/60 hover:text-white"
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* TAB RESIDENZIALI */}
        {tabCalc === "res" && (
          <>
            <p className="text-white/60 max-w-xl mx-auto text-center mb-8">Inserisci il numero di pratiche residenziali che gestisci ogni mese e scopri quanto risparmi rispetto al prezzo di listino (€350 a pratica).</p>
            <div className="max-w-xl mx-auto mb-12">
              <label className="block text-white/80 font-semibold mb-3 text-center">
                Pratiche residenziali al mese: <span className="text-[#f5c518] text-2xl font-black">{pratiche}</span>
              </label>
              <input type="range" min={1} max={60} value={pratiche} onChange={(e) => setPratiche(Number(e.target.value))}
                className="w-full h-3 rounded-full appearance-none cursor-pointer" style={{ accentColor: "#f5c518" }} />
              <div className="flex justify-between text-white/40 text-sm mt-1"><span>1</span><span>60</span></div>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {packs.map((pack) => {
                const r = risparmioRes(pack);
                return (
                  <div key={pack.id} className={`rounded-2xl p-6 border ${pack.highlight ? "border-[#f5c518] bg-[#f5c518]/5" : "border-white/10 bg-white/5"}`}>
                    <div className="text-center mb-4">
                      <div className="text-white font-bold text-lg">{pack.nome}</div>
                      <div className="text-[#f5c518] font-black text-2xl">{pack.prezzo}</div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-white/60 text-sm">Risparmio mensile</span>
                        <span className={`font-bold ${r.mensile > 0 ? "text-[#4ade80]" : "text-white/40"}`}>{r.mensile > 0 ? `+ €${r.mensile.toLocaleString("it-IT")}` : "—"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/60 text-sm">Risparmio annuale</span>
                        <span className={`font-black text-lg ${r.annuale > 0 ? "text-[#4ade80]" : "text-white/40"}`}>{r.annuale > 0 ? `+ €${r.annuale.toLocaleString("it-IT")}` : "—"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/60 text-sm">Prezzo per pratica</span>
                        <span className="text-white font-semibold">€{pack.prezzoRes}</span>
                      </div>
                    </div>
                    <Link href={`/acquista?pack=${pack.slug}`}>
                      <Button className={`w-full mt-4 font-bold ${pack.highlight ? "bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90" : "bg-white/10 text-white hover:bg-white/20"}`}>Scegli {pack.nome}</Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* TAB BUSINESS */}
        {tabCalc === "bus" && (
          <>
            <p className="text-white/60 max-w-xl mx-auto text-center mb-8">Inserisci il numero di pratiche business che gestisci ogni mese e scopri quanto risparmi rispetto al prezzo di listino (€1.200 a pratica).</p>
            <div className="max-w-xl mx-auto mb-12">
              <label className="block text-white/80 font-semibold mb-3 text-center">
                Pratiche business al mese: <span className="text-[#f5c518] text-2xl font-black">{praticheBus}</span>
              </label>
              <input type="range" min={1} max={20} value={praticheBus} onChange={(e) => setPraticheBus(Number(e.target.value))}
                className="w-full h-3 rounded-full appearance-none cursor-pointer" style={{ accentColor: "#f5c518" }} />
              <div className="flex justify-between text-white/40 text-sm mt-1"><span>1</span><span>20</span></div>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {packs.map((pack) => {
                const r = risparmioB(pack);
                return (
                  <div key={pack.id} className={`rounded-2xl p-6 border ${pack.highlight ? "border-[#f5c518] bg-[#f5c518]/5" : "border-white/10 bg-white/5"}`}>
                    <div className="text-center mb-4">
                      <div className="text-white font-bold text-lg">{pack.nome}</div>
                      <div className="text-[#f5c518] font-black text-2xl">{pack.prezzo}</div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-white/60 text-sm">Risparmio mensile</span>
                        <span className={`font-bold ${r.mensile > 0 ? "text-[#4ade80]" : "text-white/40"}`}>{r.mensile > 0 ? `+ €${r.mensile.toLocaleString("it-IT")}` : "—"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/60 text-sm">Risparmio annuale</span>
                        <span className={`font-black text-lg ${r.annuale > 0 ? "text-[#4ade80]" : "text-white/40"}`}>{r.annuale > 0 ? `+ €${r.annuale.toLocaleString("it-IT")}` : "—"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/60 text-sm">Prezzo per pratica</span>
                        <span className="text-white font-semibold">€{pack.prezzoBus}</span>
                      </div>
                    </div>
                    <Link href={`/acquista?pack=${pack.slug}`}>
                      <Button className={`w-full mt-4 font-bold ${pack.highlight ? "bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90" : "bg-white/10 text-white hover:bg-white/20"}`}>Scegli {pack.nome}</Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* TAB SIMULATORE RICARICHE */}
        {tabCalc === "ricariche" && (
          <>
            <p className="text-white/60 max-w-2xl mx-auto text-center mb-10">Inserisci quante bollette porti al mese e quanti installatori presenti: scopri quanto credito accumuli nel tuo pacchetto ogni anno.</p>
            <div className="max-w-2xl mx-auto mb-10 grid md:grid-cols-2 gap-8">
              <div>
                <label className="block text-white/80 font-semibold mb-3 text-center">
                  ⚡ Bollette al mese: <span className="text-[#4ade80] text-2xl font-black">{bolletteMese}</span>
                </label>
                <input type="range" min={0} max={30} value={bolletteMese} onChange={(e) => setBolletteMese(Number(e.target.value))}
                  className="w-full h-3 rounded-full appearance-none cursor-pointer" style={{ accentColor: "#4ade80" }} />
                <div className="flex justify-between text-white/40 text-sm mt-1"><span>0</span><span>30</span></div>
              </div>
              <div>
                <label className="block text-white/80 font-semibold mb-3 text-center">
                  🤝 Installatori presentati/mese: <span className="text-[#f5c518] text-2xl font-black">{passaparolaMese}</span>
                </label>
                <input type="range" min={0} max={10} value={passaparolaMese} onChange={(e) => setPassaparolaMese(Number(e.target.value))}
                  className="w-full h-3 rounded-full appearance-none cursor-pointer" style={{ accentColor: "#f5c518" }} />
                <div className="flex justify-between text-white/40 text-sm mt-1"><span>0</span><span>10</span></div>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {packs.map((pack) => {
                const ricaricaBolletteMese = bolletteMese * pack.ricBollette;
                const ricaricaPassaparolaMese = passaparolaMese * pack.ricPratiche;
                const totaleMese = ricaricaBolletteMese + ricaricaPassaparolaMese;
                const totaleAnno = totaleMese * 12;
                return (
                  <div key={pack.id} className={`rounded-2xl p-6 border ${pack.highlight ? "border-[#f5c518] bg-[#f5c518]/5" : "border-white/10 bg-white/5"}`}>
                    <div className="text-center mb-4">
                      <div className="text-white font-bold text-lg">{pack.nome}</div>
                      <div className="text-[#f5c518] font-black text-2xl">{pack.prezzo}</div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-white/60 text-sm">€ per bolletta</span>
                        <span className="text-[#4ade80] font-bold">{pack.ricBollette} €/cad</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/60 text-sm">€ per installatore</span>
                        <span className="text-[#f5c518] font-bold">{pack.ricPratiche} €/cad</span>
                      </div>
                      <div className="border-t border-white/10 pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-white/60 text-sm">Credito mensile</span>
                          <span className={`font-bold ${totaleMese > 0 ? "text-[#4ade80]" : "text-white/40"}`}>{totaleMese > 0 ? `+ €${totaleMese.toLocaleString("it-IT")}` : "—"}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-white/60 text-sm">Credito annuale</span>
                          <span className={`font-black text-lg ${totaleAnno > 0 ? "text-[#4ade80]" : "text-white/40"}`}>{totaleAnno > 0 ? `+ €${totaleAnno.toLocaleString("it-IT")}` : "—"}</span>
                        </div>
                      </div>
                    </div>
                    <Link href={`/acquista?pack=${pack.slug}`}>
                      <Button className={`w-full mt-4 font-bold ${pack.highlight ? "bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90" : "bg-white/10 text-white hover:bg-white/20"}`}>Scegli {pack.nome}</Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
export default function Home() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const [, setLocation] = useLocation();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      toast.success("Accesso effettuato!");
      utils.auth.me.invalidate();
      setShowLoginModal(false);
      setTimeout(() => setLocation("/portale"), 800);
    },
    onError: (e: any) => toast.error(e.message || "Email o password non corretti"),
  });
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.includes("@")) { toast.error("Email non valida"); return; }
    if (!loginPassword) { toast.error("Inserisci la password"); return; }
    loginMutation.mutate({ email: loginEmail, password: loginPassword });
  };
  const { data: installatore, isLoading: loadingInst } = trpc.installatori.mio.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchOnWindowFocus: true,
  });
  // Carica i pack dal DB, con fallback ai dati statici
  const { data: packConfigRaw = [] } = trpc.packConfig.lista.useQuery();
  const { data: ricaricheConfigRaw = [] } = trpc.ricaricheConfig.lista.useQuery();
  // Carica le promo pubbliche (visibilita='home' o 'tutti')
  const { data: promoHome = [] } = trpc.promo.getPromoHome.useQuery();
  // Converte i pack dal DB nel formato usato dalla UI
  const PACKS: PackConfig[] = packConfigRaw.length > 0
    ? packConfigRaw.map((p: any, i: number) => ({
        id: p.slug,
        slug: p.slug,
        nome: p.nome,
        prezzo: `\u20ac ${Number(p.prezzo).toLocaleString("it-IT")}`,
        badge: p.badge ?? null,
        praticheRes: p.praticheRes,
        prezzoRes: p.prezzoRes,
        praticheBus: p.praticheBus,
        prezzoBus: p.prezzoBus,
        ricBollette: PACKS_FALLBACK[i]?.ricBollette ?? 10,
        ricPratiche: PACKS_FALLBACK[i]?.ricPratiche ?? 100,
        highlight: p.colore === "yellow" || i === 1,
        colore: p.colore ?? "green",
      }))
    : PACKS_FALLBACK;
  // Nasconde i pack se: l'utente è autenticato E (la query è ancora in caricamento OPPURE è solo_singole)
  // Questo evita il flash dei pack durante il loading per gli installatori Solo Singole
  const isSoloSingole = isAuthenticated && (loadingInst || installatore?.tipoInterfaccia === "solo_singole");

  return (
    <div className="min-h-screen bg-[#1a4a2e] text-white">
      <PremiumNavbar
        isSoloSingole={isSoloSingole}
        isAuthenticated={isAuthenticated}
        onLoginClick={() => setShowLoginModal(true)}
        onShowMobileMenu={setShowMobileMenu}
        showMobileMenu={showMobileMenu}
        packs={PACKS_FALLBACK}
      />

      {/* HERO */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a4a2e] via-[#0e3320] to-[#1a4a2e]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#f5c518]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#4ade80]/5 rounded-full blur-3xl" />
        <div className="container relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-[#f5c518]/10 border border-[#f5c518]/30 rounded-full px-4 py-2 mb-6">
              <Zap className="w-4 h-4 text-[#f5c518]" />
              <span className="text-[#f5c518] text-sm font-semibold uppercase tracking-wider">Acquista Pratiche All'Ingrosso</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6" style={{ fontFamily: "Montserrat, sans-serif" }}>
              RICARICATI<br />
              <span className="text-[#f5c518]">DI CONNESSIONI</span>
            </h1>
            <p className="text-xl text-white/80 mb-4 max-w-2xl">
              Pratiche fotovoltaiche <strong className="text-[#f5c518]">all'ingrosso</strong> — fino all'<strong className="text-white">80% in meno</strong> rispetto al mercato | Residenziale &amp; Business
            </p>
            {isSoloSingole ? (
              <p className="text-white/60 mb-10 max-w-2xl">
                Con <strong className="text-[#f5c518]">Ricaricati di Connessioni</strong> acquisti le pratiche singole al tuo prezzo riservato. Consulta il tuo listino personalizzato e inserisci le pratiche direttamente dal portale.
              </p>
            ) : (
              <p className="text-white/60 mb-10 max-w-2xl">
                <strong className="text-[#f5c518]">Ricaricati di Connessioni</strong> è il <strong className="text-white">grossista delle pratiche fotovoltaiche</strong>: acquisti direttamente da noi all'ingrosso e risparmi su ogni connessione. Il mercato fa pagare €200–250 a pratica residenziale e fino a €1.500 per il business — da noi parti da <strong className="text-white">€85</strong>. Le pratiche <strong className="text-white">non scadono mai.</strong>
              </p>
            )}
            <div className="flex flex-wrap gap-4">
              {isSoloSingole ? (
                <Link href="/portale">
                  <Button size="lg" className="bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-black text-base px-8">
                    Il Mio Listino <ChevronRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              ) : (
                <a href="#pack">
                  <Button size="lg" className="bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-black text-base px-8">
                    Scopri i Pack <ChevronRight className="ml-2 w-5 h-5" />
                  </Button>
                </a>
              )}
              <Link href="/portale">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-bold text-base px-8">
                  Portale Installatori
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* I PACK — nascosto per installatori solo_singole */}
      {!isSoloSingole && <section id="pack" className="py-20 bg-[#0e3320]">
        <div className="container">
          {/* PACK BENVENUTO — Banner rettangolare in alto */}
          <div className="mb-16 max-w-4xl mx-auto">
            <div className="relative rounded-2xl border-2 border-[#f5c518] overflow-hidden bg-gradient-to-r from-[#f5c518]/10 to-[#1a4a2e]">
              <div className="grid md:grid-cols-2 gap-8 p-8 md:p-10 items-center">
                <div>
                  <div className="inline-block bg-[#f5c518] text-[#1a4a2e] font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider mb-4">Per i nuovi installatori</div>
                  <h3 className="text-4xl md:text-5xl font-black text-[#f5c518] mb-3" style={{ fontFamily: "Montserrat, sans-serif" }}>Pack Benvenuto</h3>
                  <p className="text-white/70 text-sm mb-6">Il tuo primo pacchetto con condizioni speciali. Pratiche BT 1-100 kW.</p>
                  <Button onClick={() => {
                    const phone = "+393201234567";
                    const message = "Ciao! Sono interessato al Pack Benvenuto. Mi piacerebbe ricevere più informazioni.";
                    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
                  }} className="bg-green-500 text-white hover:bg-green-600 font-black text-base px-8 py-6 flex items-center gap-2">
                    💬 Info su WhatsApp
                  </Button>
                </div>
                <div className="space-y-3 bg-[#1a4a2e] rounded-xl p-6 border border-white/10">
                  <div className="flex justify-between items-center">
                    <span className="text-white/70 text-sm">Pratiche Residenziali</span>
                    <span className="font-bold text-[#f5c518]">5 × €100/cad</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70 text-sm">Pratiche Business</span>
                    <span className="font-bold text-[#f5c518]">o 2 × €250/cad</span>
                  </div>
                  <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                    <span className="text-white/70 text-sm">Schema unifilare</span>
                    <span className="font-bold text-[#4ade80]">Incluso</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70 text-sm">Scadenza</span>
                    <span className="font-bold text-[#4ade80]">Mai</span>
                  </div>
                   <div className="flex justify-between items-center">
                     <span className="text-white/70 text-sm">Credito residuo</span>
                     <span className="font-bold text-[#4ade80]">Omaggiato*</span>
                   </div>
                   <div className="text-white/40 text-xs py-2 text-right">*Se per l'ultima pratica non ci sarà credito a sufficienza, dopo aver acquistato un misto di pratiche residenziali e/o business, quest'ultimo verrà integrato e omaggiato da Soluzioni Ambientali.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4" style={{ fontFamily: "Montserrat, sans-serif" }}>
              I <span className="text-[#f5c518]">PACCHETTI</span> DISPONIBILI
            </h2>
            <p className="text-white/60 max-w-xl mx-auto">Scegli il partner più adatto a una gestione dei tuoi impianti. Zero interessi sull'acquisto rateizzato.</p>
          </div>

          {/* SEZIONE INGROSSO — tabella comparativa mercato vs Ricaricati */}
          <div className="mb-14 bg-[#1a4a2e] border border-[#f5c518]/30 rounded-2xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-[#f5c518] text-[#1a4a2e] font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider">Siamo il tuo grossista</div>
              <h3 className="text-white font-black text-lg">Quanto risparmi acquistando da noi all'ingrosso?</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-3 text-white/60 font-semibold">Tipo pratica</th>
                    <th className="text-center p-3 text-red-400 font-bold">Mercato standard</th>
                    <th className="text-center p-3 text-[#4ade80] font-bold">Da noi — Prezzo Ingrosso</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/5">
                    <td className="p-3 text-white/80 font-semibold">Residenziale</td>
                    <td className="p-3 text-center"><span className="line-through text-red-400">€200–250</span></td>
                    <td className="p-3 text-center">
                      <span className="text-[#4ade80] font-black text-lg">€85</span>
                      <span className="ml-2 bg-[#4ade80]/20 text-[#4ade80] text-xs font-bold px-2 py-0.5 rounded-full">-66%</span>
                    </td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-3 text-white/80 font-semibold">Business / Commerciale</td>
                    <td className="p-3 text-center"><span className="line-through text-red-400">€800–1.500+</span></td>
                    <td className="p-3 text-center">
                      <span className="text-[#4ade80] font-black text-lg">€250</span>
                      <span className="ml-2 bg-[#4ade80]/20 text-[#4ade80] text-xs font-bold px-2 py-0.5 rounded-full">-83%</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 text-white/80 font-semibold">Scadenza pratiche</td>
                    <td className="p-3 text-center text-red-400 font-bold">Sì</td>
                    <td className="p-3 text-center text-[#4ade80] font-black text-lg">Mai ✓</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-white/40 text-xs mt-4">* Prezzi di mercato indicativi per pratiche di connessione fotovoltaico in Italia. Risparmio calcolato sul valore medio di mercato.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">

            {PACKS.filter((p) => p.id !== "benvenuto").map((pack) => (
              <div key={pack.id} className={`relative rounded-2xl border overflow-hidden ${pack.highlight ? "border-[#f5c518] pack-popular" : "border-white/15 bg-[#1a4a2e]"}`}>
                <div className="text-center py-1.5 text-xs font-black tracking-widest uppercase bg-[#0e3320] text-[#4ade80] border-b border-[#4ade80]/20">
                  🏭 PREZZO GROSSISTA
                </div>
                {pack.badge && (
                  <div className={`text-center py-2 text-xs font-black tracking-widest uppercase ${pack.highlight ? "bg-[#f5c518] text-[#1a4a2e]" : "bg-[#4ade80] text-[#1a4a2e]"}`}>
                    {pack.badge}
                  </div>
                )}
                <div className={`p-8 ${pack.highlight ? "bg-[#f5c518]/5" : ""}`}>
                  <h3 className="text-3xl font-black text-center mb-2 text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>{pack.nome}</h3>
                  <div className="text-center text-[#f5c518] font-black text-4xl mb-2">{pack.prezzo}</div>
                  <p className="text-center text-white/50 text-xs mb-6">Pratiche BT 1-100 kW</p>
                  <div className="space-y-3">
                    {[
                      { label: "Pratiche Residenziali", val: `${pack.praticheRes} × €${pack.prezzoRes}/cad`, desc: "o" },
                      { label: "Pratiche Business", val: `${pack.praticheBus} × €${pack.prezzoBus}/cad`, desc: "o Miste" },
                      { label: "Ricarica con Bollette", val: `€${pack.ricBollette}/cad` },
                      { label: "Ricarica con Pratiche", val: `€${pack.ricPratiche}/cad` },
                      { label: "Schema unifilare", val: "Incluso", green: true },
                      { label: "Scadenza", val: "Mai", green: true },
                      { label: "Credito residuo", val: "Omaggiato", green: true, desc: "Se < prezzo pratica" },
                    ].map((row) => (
                      <div key={row.label}>
                        <div className="flex justify-between items-center py-2 border-b border-white/10">
                          <span className="text-white/70 text-sm">{row.label}</span>
                          <span className={`font-bold text-sm ${row.green ? "text-[#4ade80]" : "text-[#f5c518]"}`}>{row.val}</span>
                        </div>
                        {row.label === "Credito residuo" ? (
                          <div className="text-white/40 text-xs py-1 text-right">*Se per l'ultima pratica non ci sarà credito a sufficienza, dopo aver acquistato un misto di pratiche residenziali e/o business, quest'ultimo verrà integrato e omaggiato da Soluzioni Ambientali.</div>
                        ) : row.desc ? (
                          <div className="text-white/40 text-xs py-1 text-right">{row.desc}</div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                  <Link href={`/acquista?pack=${pack.id}`}>
                    <Button className={`w-full mt-8 font-black text-base py-6 ${pack.highlight ? "bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90" : "bg-white/10 text-white hover:bg-[#f5c518] hover:text-[#1a4a2e]"}`}>
                      Acquista {pack.nome}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* OFFERTE SPECIALI / PROMO PUBBLICHE */}
          {promoHome.length > 0 && (
            <div className="mb-14">
              <h3 className="text-2xl font-black text-[#f5c518] mb-6 text-center" style={{ fontFamily: "Montserrat, sans-serif" }}>🎯 OFFERTE SPECIALI</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {(promoHome as any[]).map((pr: any) => {
                  const coloreMap: Record<string, string> = { yellow: "border-[#f5c518]/50 bg-[#f5c518]/5", green: "border-[#4ade80]/50 bg-[#4ade80]/5", blue: "border-blue-400/50 bg-blue-400/5", pink: "border-pink-400/50 bg-pink-400/5" };
                  const textColoreMap: Record<string, string> = { yellow: "text-[#f5c518]", green: "text-[#4ade80]", blue: "text-blue-400", pink: "text-pink-400" };
                  const borderClass = coloreMap[pr.colore] || coloreMap.yellow;
                  const textClass = textColoreMap[pr.colore] || textColoreMap.yellow;
                  return (
                    <div key={pr.id} className={`rounded-2xl border p-6 bg-[#1a4a2e] ${borderClass}`}>
                      <h4 className="text-white font-black text-lg mb-2">{pr.titolo}</h4>
                      {pr.descrizione && <p className="text-white/60 text-sm mb-3">{pr.descrizione}</p>}
                      {pr.prezzo && (
                        <div className="flex items-baseline gap-2 mb-3">
                          <span className={`font-black text-3xl ${textClass}`}>€{Number(pr.prezzo).toLocaleString("it-IT")}</span>
                          {pr.prezzoOriginale && <span className="text-white/30 line-through text-lg">€{Number(pr.prezzoOriginale).toLocaleString("it-IT")}</span>}
                        </div>
                      )}
                      {pr.scadenza && <p className="text-orange-400 text-xs mb-3">⏰ Offerta valida fino al {new Date(pr.scadenza).toLocaleDateString("it-IT")}</p>}
                      {pr.cta && pr.ctaUrl && (
                        <a href={pr.ctaUrl} className={`inline-block mt-2 font-bold text-sm px-4 py-2 rounded-lg ${textClass} border ${borderClass} hover:opacity-80 transition-opacity`}>
                          {pr.cta} →
                        </a>
                      )}
                      <a href={`https://wa.me/393757187150?text=${encodeURIComponent(`Ciao, sono interessato all'offerta "${pr.titolo}" di Ricaricati di Connessioni.`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-3 font-bold text-sm px-4 py-2 rounded-lg bg-[#25D366] text-white hover:bg-[#25D366]/90 transition-colors">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        Info su WhatsApp
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TABELLA CONFRONTO */}
          <h3 className="text-2xl font-black text-[#f5c518] mb-6 text-center" style={{ fontFamily: "Montserrat, sans-serif" }}>CONFRONTO TRA I 3 PACK</h3>
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#1a4a2e]">
                  <th className="text-left p-4 text-[#f5c518] font-bold">Caratteristica</th>
                  <th className="text-center p-4 text-white font-bold">Pack 1</th>
                  <th className="text-center p-4 text-[#f5c518] font-bold border-x border-[#f5c518]/30">Pack 2</th>
                  <th className="text-center p-4 text-white font-bold">Pack 3</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Costo totale", v1: "€ 2.000", v2: "€ 3.150", v3: "€ 5.100", accent: true },
                  { label: "Pratiche Residenziali", v1: "16 × 125 €", v2: "30 × 105 €", v3: "60 × 85 €", accent: true },
                  { label: "Pratiche Business", v1: "5 × 400 €", v2: "9 × 350 €", v3: "20 × 250 €", accent: true },
                  { label: "Ricarica Bollette", v1: "10 €/cad", v2: "15 €/cad", v3: "20 €/cad", accent: false },
                  { label: "Ricarica Pratiche", v1: "100 €/cad", v2: "150 €/cad", v3: "200 €/cad", accent: false },
                  { label: "Schema Unifilare", v1: "Incluso", v2: "Incluso", v3: "Incluso", accent: false },
                  { label: "Scadenza", v1: "Mai", v2: "Mai", v3: "Mai", accent: false },
                ].map((row, i) => (
                  <tr key={row.label} className={i % 2 === 0 ? "bg-white/3" : "bg-transparent"}>
                    <td className={`p-4 font-semibold ${row.accent ? "text-[#f5c518]" : "text-white/80"}`}>{row.label}</td>
                    <td className="p-4 text-center text-white/80">{row.v1}</td>
                    <td className="p-4 text-center text-[#f5c518] font-bold border-x border-[#f5c518]/20">{row.v2}</td>
                    <td className="p-4 text-center text-white/80">{row.v3}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      }
      {/* LOCANDINA PACK GRAFICA */}
      {!isSoloSingole && (
        <section className="py-16 bg-[#0e3320]">
          <div className="container">
            <div className="max-w-md mx-auto">
              {/* Card locandina */}
              <div className="rounded-3xl border-4 border-[#4ade80] bg-[#0a2818] overflow-hidden shadow-2xl shadow-[#4ade80]/10">
                {/* Header */}
                <div className="bg-[#0e3320] px-6 pt-8 pb-4 text-center">
                  <div className="flex items-center justify-center gap-3 mb-1">
                    <span className="text-[#f5c518] text-3xl">⚡</span>
                    <div>
                      <div className="text-white font-black text-2xl leading-tight" style={{ fontFamily: "Montserrat, sans-serif" }}>RICARICATI DI</div>
                      <div className="text-[#f5c518] font-black text-3xl leading-tight" style={{ fontFamily: "Montserrat, sans-serif" }}>CONNESSIONI</div>
                    </div>
                    <span className="text-[#f5c518] text-3xl">⚡</span>
                  </div>
                  <p className="text-white/70 text-sm mt-1">La promo esclusiva per Installatori</p>
                </div>
                {/* Pack rows */}
                <div className="divide-y divide-white/10">
                  {[
                    { n: 1, prezzo: "€ 2.000", res: "16 Pratiche Residenziali (125€)", bus: "o 5 Pratiche Business (400€)", bg: "bg-[#1a4a2e]" },
                    { n: 2, prezzo: "€ 3.150", res: "30 Pratiche Residenziali (105€)", bus: "o 9 Pratiche Business (350€)", bg: "bg-[#f5c518]/10" },
                    { n: 3, prezzo: "€ 5.100", res: "60 Pratiche Residenziali (85€)", bus: "o 20 Pratiche Business (250€)", bg: "bg-[#1a4a2e]" },
                  ].map((p) => (
                    <div key={p.n} className={`flex items-center gap-3 px-5 py-4 ${p.bg}`}>
                      <div className="w-10 h-10 rounded-xl bg-[#4ade80] text-[#1a4a2e] font-black text-sm flex flex-col items-center justify-center shrink-0 leading-none">
                        <span className="text-[10px] font-bold">PACK</span>
                        <span className="text-lg font-black">{p.n}</span>
                      </div>
                      <div className="text-[#f5c518] font-black text-xl w-24 shrink-0">{p.prezzo}</div>
                      <div className="text-xs">
                        <div className="text-[#4ade80] font-semibold">{p.res}</div>
                        <div className="text-white/60">{p.bus}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* 6 benefici */}
                <div className="grid grid-cols-3 gap-0 border-t border-white/10">
                  {[
                    { icon: "⭐", label: "Promo migliore" },
                    { icon: "∞", label: "Zero scadenze" },
                    { icon: "%", label: "Interessi zero" },
                    { icon: "🎁", label: "Pratiche omaggio" },
                    { icon: "⚡", label: "Schema incluso" },
                    { icon: "🌐", label: "Uso universale" },
                  ].map((b) => (
                    <div key={b.label} className="flex flex-col items-center gap-1 py-4 border border-white/5">
                      <div className="w-10 h-10 rounded-full border-2 border-[#4ade80] flex items-center justify-center text-[#4ade80] font-black text-lg">{b.icon}</div>
                      <span className="text-white/80 text-xs text-center font-medium">{b.label}</span>
                    </div>
                  ))}
                </div>
                {/* CTA */}
                <div className="px-5 pb-5 pt-4 bg-[#0e3320]">
                  <a href="https://wa.me/393517789632?text=INFO" target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-[#f5c518] text-[#1a4a2e] font-black text-xl hover:bg-[#f5c518]/90 transition-colors">
                    <span className="text-2xl">💬</span> Scrivi INFO in chat
                  </a>
                  <p className="text-center text-white/50 text-xs mt-3">Impianti 1–100 kW | Residenziale &amp; Business</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
      {/* BLOCCO TECNICI/PROFESSIONISTI */}
      {!isSoloSingole && (
        <section className="py-12 bg-[#1a4a2e] border-t border-white/10">
          <div className="container">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-[#0e3320] rounded-2xl border border-[#4ade80]/20 p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#4ade80]/10 border border-[#4ade80]/20 flex items-center justify-center shrink-0">
                  <Wrench className="w-6 h-6 text-[#4ade80]" />
                </div>
                <div>
                  <p className="text-[#4ade80] text-xs font-bold uppercase tracking-wider mb-1">Per tecnici, geometri e professionisti</p>
                  <h3 className="text-white font-black text-xl mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>Acquista all'ingrosso e rivendi ai tuoi clienti</h3>
                  <p className="text-white/60 text-sm">Sei un tecnico o un professionista del settore energetico? Compra le pratiche da noi al prezzo grossista e fattura ai tuoi clienti il prezzo che preferisci — il margine è tuo.</p>
                </div>
              </div>
              <Link href="/partner" className="shrink-0">
                <Button className="bg-[#4ade80] text-[#1a4a2e] hover:bg-[#4ade80]/90 font-black text-sm px-6 whitespace-nowrap">
                  Scopri come funziona <ChevronRight className="ml-1 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CALCOLATORE — visibile sempre */}
      {/* CALCOLATORE */}
      <div id="calcolatore">
        <Calcolatore packs={PACKS} />
      </div>

      {/* VANTAGGI */}
      <section id="vantaggi" className="py-20 bg-[#1a4a2e]">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>
              PERCHÉ ATTIVARLO ORA?
            </h2>
            <p className="text-[#4ade80] font-semibold text-lg">6 Vantaggi Esclusivi — Hai sempre la promo migliore</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {VANTAGGI.map((v) => (
              <div key={v.titolo} className="bg-[#0e3320] rounded-2xl p-6 border border-white/10 hover:border-[#f5c518]/40 transition-colors">
                <v.icon className="w-8 h-8 text-[#f5c518] mb-4" />
                <h3 className="text-white font-bold text-lg mb-2">{v.titolo}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COSA È INCLUSO */}
      <section className="py-20 bg-[#0e3320]">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-black text-[#f5c518] mb-2 text-center" style={{ fontFamily: "Montserrat, sans-serif" }}>COSA È INCLUSO IN OGNI PRATICA</h2>
            <p className="text-white/60 text-center mb-10">Ogni pratica include tutto il necessario per la connessione dell'impianto fotovoltaico alla rete, senza costi nascosti:</p>
            <div className="space-y-4 mb-12">
              {INCLUSO.map((item) => (
                <div key={item} className="flex gap-3 items-start bg-[#1a4a2e] rounded-xl p-4 border border-white/10">
                  <CheckCircle className="w-5 h-5 text-[#4ade80] mt-0.5 shrink-0" />
                  <p className="text-white/80 text-sm">{item}</p>
                </div>
              ))}
            </div>
            <div className="bg-[#1a4a2e] rounded-2xl p-6 border border-[#f5c518]/30 text-center">
              <p className="text-[#f5c518] font-bold text-sm uppercase tracking-wider mb-1">Valido per impianti 1–100 kW</p>
              <p className="text-white/60 text-sm">Copertura totale per Residenziale e Business</p>
            </div>
          </div>
        </div>
      </section>

      {/* PREMI & BONUS — Sezione Reale */}
      {isAuthenticated && installatore && (
        <section className="py-20 bg-[#0e3320]">
          <div className="container">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-[#f5c518]/10 border border-[#f5c518]/30 rounded-full px-4 py-2 mb-4">
                <Gift className="w-4 h-4 text-[#f5c518]" />
                <span className="text-[#f5c518] text-sm font-semibold uppercase tracking-wider">Guadagna Credito</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-3" style={{ fontFamily: "Montserrat, sans-serif" }}>
                Premi &amp; Bonus
              </h2>
              <p className="text-white/60 text-lg">Accumula credito inviando bollette, segnalando installatori e riscattando codici promo</p>
            </div>

            {/* CONTATORE PROMO */}
            {(() => {
              const creditoTotale = parseFloat(installatore?.creditoTotale || "0");
              const soglia = parseFloat(installatore?.sogliaPackOmaggio || "2000");
              const percentuale = Math.min(100, (creditoTotale / soglia) * 100);
              const raggiunto = creditoTotale >= soglia;
              return (
                <div className={`rounded-2xl p-6 border mb-10 max-w-2xl mx-auto ${
                  raggiunto
                    ? "bg-green-500/10 border-green-500/40"
                    : "bg-[#1a4a2e] border-[#f5c518]/30"
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Trophy className={`w-5 h-5 ${raggiunto ? "text-green-400" : "text-[#f5c518]"}`} />
                      <span className={`font-bold text-lg ${raggiunto ? "text-green-400" : "text-white"}`}>
                        {raggiunto ? "🎉 Pack Omaggio Guadagnato!" : "Contatore Promo"}
                      </span>
                    </div>
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                      raggiunto ? "bg-green-500/20 text-green-400" : "bg-[#f5c518]/20 text-[#f5c518]"
                    }`}>
                      €{creditoTotale.toLocaleString("it-IT", { minimumFractionDigits: 0 })} / €{soglia.toLocaleString("it-IT", { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-3 mb-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all duration-700 ${
                        raggiunto ? "bg-green-400" : "bg-gradient-to-r from-[#f5c518] to-[#ffdd44]"
                      }`}
                      style={{ width: `${percentuale}%` }}
                    />
                  </div>
                  <p className="text-white/60 text-sm">
                    {raggiunto
                      ? "Hai raggiunto la soglia! L'ufficio ti contatterà per assegnare il tuo pacchetto omaggio."
                      : `Mancano €${Math.max(0, soglia - creditoTotale).toLocaleString("it-IT", { minimumFractionDigits: 0 })} per il tuo pacchetto omaggio.`
                    }
                  </p>
                </div>
              );
            })()}

            {/* TRE CATEGORIE PREMI */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Bollette */}
              <div className="bg-[#1a4a2e] rounded-2xl p-6 border border-[#4ade80]/30 hover:border-[#4ade80]/60 transition-colors">
                <div className="w-12 h-12 bg-[#4ade80]/10 rounded-xl flex items-center justify-center mb-4">
                  <Gift className="w-6 h-6 text-[#4ade80]" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">📋 Bollette</h3>
                <p className="text-white/60 text-sm mb-4">Porta una bolletta di un cliente e ottieni credito immediato nel tuo pacchetto.</p>
                <div className="bg-[#4ade80]/10 border border-[#4ade80]/20 rounded-lg p-3 mb-4">
                  <p className="text-[#4ade80] font-bold text-sm">€10–20 per bolletta</p>
                  <p className="text-white/50 text-xs">A seconda del pack</p>
                </div>
                <Link href="/portale">
                  <Button className="w-full bg-[#4ade80]/20 text-[#4ade80] hover:bg-[#4ade80]/30 border border-[#4ade80]/40 font-semibold text-sm">
                    Invia Bolletta →
                  </Button>
                </Link>
              </div>

              {/* Nominativi */}
              <div className="bg-[#1a4a2e] rounded-2xl p-6 border border-[#f5c518]/30 hover:border-[#f5c518]/60 transition-colors">
                <div className="w-12 h-12 bg-[#f5c518]/10 rounded-xl flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-[#f5c518]" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">👥 Nominativi</h3>
                <p className="text-white/60 text-sm mb-4">Segnala un installatore che acquista un pacchetto e ottieni una maxi ricarica.</p>
                <div className="bg-[#f5c518]/10 border border-[#f5c518]/20 rounded-lg p-3 mb-4">
                  <p className="text-[#f5c518] font-bold text-sm">€100–200 per nominativo</p>
                  <p className="text-white/50 text-xs">A seconda del pack</p>
                </div>
                <Link href="/portale">
                  <Button className="w-full bg-[#f5c518]/20 text-[#f5c518] hover:bg-[#f5c518]/30 border border-[#f5c518]/40 font-semibold text-sm">
                    Segnala Installatore →
                  </Button>
                </Link>
              </div>

              {/* Codici Promo */}
              <div className="bg-[#1a4a2e] rounded-2xl p-6 border border-[#a78bfa]/30 hover:border-[#a78bfa]/60 transition-colors">
                <div className="w-12 h-12 bg-[#a78bfa]/10 rounded-xl flex items-center justify-center mb-4">
                  <Tag className="w-6 h-6 text-[#a78bfa]" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">🎟️ Codici Promo</h3>
                <p className="text-white/60 text-sm mb-4">Riscatta i codici ricevuti dall'ufficio per credito sul tuo account.</p>
                <div className="bg-[#a78bfa]/10 border border-[#a78bfa]/20 rounded-lg p-3 mb-4">
                  <p className="text-[#a78bfa] font-bold text-sm">Credito variabile</p>
                  <p className="text-white/50 text-xs">Dipende dal codice</p>
                </div>
                <Link href="/portale">
                  <Button className="w-full bg-[#a78bfa]/20 text-[#a78bfa] hover:bg-[#a78bfa]/30 border border-[#a78bfa]/40 font-semibold text-sm">
                    Riscatta Codice →
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* PRATICHE OMAGGIO */}
      <section className="py-20 bg-[#1a4a2e]">
        <div className="container">
          <h2 className="text-3xl font-black text-[#f5c518] mb-10 text-center" style={{ fontFamily: "Montserrat, sans-serif" }}>COME FUNZIONANO LE PRATICHE OMAGGIO</h2>
          {/* Tabella ricariche per pack */}
          <div className="max-w-3xl mx-auto mb-10">
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-[#4ade80] rounded-2xl p-8">
                <h3 className="text-[#1a4a2e] font-black text-xl mb-2">⚡ Ricarica con Bollette</h3>
                <p className="text-[#1a4a2e]/80 text-sm mb-5">Porta una bolletta di un cliente e ottieni credito immediato nel tuo pacchetto.</p>
                <div className="space-y-3">
                  {[
                    { pack: "Pack 1", val: "10 €" },
                    { pack: "Pack 2", val: "15 €" },
                    { pack: "Pack 3", val: "20 €" },
                  ].map(r => (
                    <div key={r.pack} className="flex justify-between items-center bg-[#1a4a2e]/10 rounded-xl px-4 py-2">
                      <span className="text-[#1a4a2e] font-bold text-sm">{r.pack}</span>
                      <span className="text-[#1a4a2e] font-black text-xl">{r.val} / cad</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-[#f5c518] rounded-2xl p-8">
                <h3 className="text-[#1a4a2e] font-black text-xl mb-2">🤝 Ricarica con Pratiche</h3>
                <p className="text-[#1a4a2e]/80 text-sm mb-5">Presenta un altro installatore che acquista un pacchetto e ottieni una maxi ricarica.</p>
                <div className="space-y-3">
                  {[
                    { pack: "Pack 1", val: "100 €" },
                    { pack: "Pack 2", val: "150 €" },
                    { pack: "Pack 3", val: "200 €" },
                  ].map(r => (
                    <div key={r.pack} className="flex justify-between items-center bg-[#1a4a2e]/10 rounded-xl px-4 py-2">
                      <span className="text-[#1a4a2e] font-bold text-sm">{r.pack}</span>
                      <span className="text-[#1a4a2e] font-black text-xl">{r.val} / cad</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-center text-[#f5c518] font-bold text-lg">Più sei attivo, più il tuo credito cresce automaticamente.</p>
          </div>
        </div>
      </section>

      {/* CTA FINALE */}
      <section className="py-20 bg-[#f5c518]">
        <div className="container text-center">
          <div className="inline-flex items-center gap-2 bg-[#1a4a2e]/10 rounded-full px-4 py-2 mb-6">
            <TrendingUp className="w-4 h-4 text-[#1a4a2e]" />
            <span className="text-[#1a4a2e] text-sm font-bold uppercase tracking-wider">Disponibilità Limitata — Agisci Ora</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-[#1a4a2e] mb-4" style={{ fontFamily: "Montserrat, sans-serif" }}>
            Blocca il tuo listino scontato.
          </h2>
          <p className="text-[#1a4a2e]/70 mb-10 text-lg">Impianti 1–100 kW | Interessi zero | Nessuna scadenza | Schema unifilare incluso</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/acquista">
              <Button size="lg" className="bg-[#1a4a2e] text-white hover:bg-[#0e3320] font-black text-lg px-10 py-6">
                Acquista Ora <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/portale">
              <Button size="lg" variant="outline" className="border-[#1a4a2e] text-[#1a4a2e] hover:bg-[#1a4a2e] hover:text-white font-bold text-lg px-10 py-6">
                Portale Installatori
              </Button>
            </Link>
          </div>
          <p className="text-[#1a4a2e]/60 text-sm mt-8">Ricaricati di Connessioni — Il grossista delle pratiche fotovoltaiche | Riservato agli Installatori</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0e3320] border-t border-white/10">
        <div className="container py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-[#4ade80]" />
              <div>
              <span className="font-black text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>RICARICATI DI CONNESSIONI</span>
              <p className="text-[#4ade80] text-xs font-semibold">Il grossista delle pratiche fotovoltaiche — acquista all'ingrosso</p>
            </div>
            </div>
            <p className="text-white/40 text-xs leading-relaxed">
              Soluzioni Ambientali di Gennaro Martusciello<br />
              Via Terni, 10 – 74121 Taranto (TA)<br />
              P.IVA: 03107700738
            </p>
            <p className="text-white/30 text-xs mt-2">
              Tel: 099 4000569 — Cell: +39 328 6143468<br />
              <a href="mailto:info@soluzioniambientali.info" className="hover:text-[#f5c518] transition-colors">info@soluzioniambientali.info</a>
            </p>
          </div>
          <div>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">Navigazione</p>
            <div className="flex flex-col gap-2 text-sm text-white/50">
              <Link href="/portale" className="hover:text-[#f5c518] transition-colors">Portale Installatori</Link>
              <Link href="/acquista" className="hover:text-[#f5c518] transition-colors">Acquista</Link>
              <Link href="/listino" className="hover:text-[#f5c518] transition-colors">Listino Pratiche</Link>
              <Link href="/admin" className="hover:text-[#f5c518] transition-colors">Area Admin</Link>
              <Link href="/partner" className="hover:text-[#f5c518] transition-colors">Partner</Link>
            </div>
          </div>
          <div>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">Informazioni Legali</p>
            <div className="flex flex-col gap-2 text-sm text-white/50">
              <Link href="/privacy-policy" className="hover:text-[#f5c518] transition-colors">Privacy Policy</Link>
              <Link href="/cookie-policy" className="hover:text-[#f5c518] transition-colors">Cookie Policy</Link>
              <Link href="/termini-condizioni" className="hover:text-[#f5c518] transition-colors">Termini e Condizioni</Link>
              <Link href="/note-legali" className="hover:text-[#f5c518] transition-colors">Note Legali</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 py-4">
          <div className="container flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/30">
            <p>© 2026 Soluzioni Ambientali di Gennaro Martusciello — Tutti i diritti riservati</p>
            <p>I prezzi indicati si intendono IVA esclusa salvo diversa indicazione</p>
          </div>
        </div>
      </footer>

      {/* Modal Login Installatore */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="bg-[#1a4a2e] border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-black">Login Installatore</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <p className="text-white/70 text-sm">
              Accedi al tuo portale per gestire i tuoi pacchetti, pratiche e ordini.
            </p>
            <a href={getLoginUrl("/portale")}>
              <Button className="w-full bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-black text-base py-6">
                <LogIn className="mr-2 w-5 h-5" />
                Accedi con Google
              </Button>
            </a>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#1a4a2e] text-white/50">oppure</span>
              </div>
            </div>
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <Label className="text-white/80 text-sm font-semibold mb-2 block">Email</Label>
                <Input placeholder="tua@email.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="bg-[#0e3320] border-white/20 text-white placeholder-white/30" />
              </div>
              <div>
                <Label className="text-white/80 text-sm font-semibold mb-2 block">Password</Label>
                <Input type="password" placeholder="••••••••" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="bg-[#0e3320] border-white/20 text-white placeholder-white/30" />
              </div>
              <Button type="submit" disabled={loginMutation.isPending} className="w-full bg-white/10 text-white hover:bg-white/20 font-bold text-base py-6">
                {loginMutation.isPending ? "Accesso in corso..." : "Accedi"}
              </Button>
            </form>
            <p className="text-white/50 text-xs text-center">
              <Link href="/recupera-password" className="text-white/70 hover:text-white hover:underline">Password dimenticata?</Link>
            </p>
            <p className="text-white/50 text-xs text-center">
              Non hai un account? <Link href="/register" className="text-[#f5c518] hover:underline font-semibold">Registrati qui</Link>
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pulsante WhatsApp flottante */}
      <a
        href="https://wa.me/393757187150?text=Ciao%2C%20vorrei%20informazioni%20sui%20Pack%20di%20Ricaricati%20di%20Connessioni."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#25D366]/90 text-white rounded-full p-4 shadow-2xl shadow-[#25D366]/30 transition-all hover:scale-110"
        title="Contattaci su WhatsApp"
      >
        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </a>
    </div>
  );
}
