import React, { useEffect } from "react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Zap, CheckCircle, CreditCard, Building2, ArrowLeft, Package, List, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

const PACKS = [
  {
    id: "pack1" as const,
    nome: "Pack 1",
    prezzo: "€ 2.000",
    importo: 2000,
    residenziali: "16 × 125 €/cad",
    business: "5 × 400 €/cad",
    ricBollette: "10 €/cad",
    ricPratiche: "100 €/cad",
    highlight: false,
  },
  {
    id: "pack2" as const,
    nome: "Pack 2",
    prezzo: "€ 3.150",
    importo: 3150,
    residenziali: "30 × 105 €/cad",
    business: "9 × 350 €/cad",
    ricBollette: "15 €/cad",
    ricPratiche: "150 €/cad",
    highlight: true,
    badge: "PIÙ POPOLARE",
  },
  {
    id: "pack3" as const,
    nome: "Pack 3",
    prezzo: "€ 5.100",
    importo: 5100,
    residenziali: "60 × 85 €/cad",
    business: "20 × 250 €/cad",
    ricBollette: "20 €/cad",
    ricPratiche: "200 €/cad",
    highlight: false,
    badge: "MASSIMO RISPARMIO",
  },
];

const IBAN = "IT19 I030 6234 2100 0000 2824 470";
const INTESTATARIO = "Soluzioni Ambientali di Gennaro Martusciello";
const PAYPAL_EMAIL = "info@soluzioniambientali.info";
// TODO: sostituire con il link paypal.me reale (es. "https://paypal.me/tuonome")
const PAYPAL_ME_BASE = "https://paypal.me/soluzioniambientali";

export default function Acquista() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.split("?")[1] ?? "");
  const packParam = params.get("pack");
  const [modalitaScelta, setModalitaScelta] = useState<"scegli" | "pack">(packParam ? "pack" : "scegli");

  const [selectedPack, setSelectedPack] = useState<"pack1" | "pack2" | "pack3">(
    (packParam as "pack1" | "pack2" | "pack3") || "pack2"
  );
  const [tipoPratica, setTipoPratica] = useState<"residenziale" | "business" | "flessibile">("residenziale");
  const [metodo, setMetodo] = useState<"paypal" | "bonifico">("bonifico");
  const [form, setForm] = useState({ nome: "", email: "", telefono: "", ragioneSociale: "", note: "" });
  const [submitted, setSubmitted] = useState(false);
  const [flessibileConfig, setFlessibileConfig] = useState({ residenziali: 0, business: 0 });
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const pack = PACKS.find((p) => p.id === selectedPack)!;
  const { user, isAuthenticated, loading } = useAuth();
  const { data: installatoreData } = trpc.installatori.mio.useQuery(undefined, { enabled: isAuthenticated });

  const creaOrdine = trpc.ordini.crea.useMutation({
    onSuccess: (data: any) => {
      setPdfUrl(data.pdfUrl);
      setSubmitted(true);
      toast.success("Ordine inviato con successo!");
    },
    onError: (e) => toast.error(e.message),
  });

  // Pre-compila il form con i dati dell'installatore loggato
  const prevInstallatoreId = React.useRef<number | null>(null);
  if (installatoreData && prevInstallatoreId.current !== installatoreData.id) {
    prevInstallatoreId.current = installatoreData.id;
    setForm(f => ({
      ...f,
      nome: f.nome || installatoreData.ragioneSociale || user?.name || "",
      email: f.email || user?.email || "",
      telefono: f.telefono || installatoreData.telefono || "",
      ragioneSociale: f.ragioneSociale || installatoreData.ragioneSociale || "",
    }));
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome || !form.email) { toast.error("Inserisci nome e email"); return; }
    creaOrdine.mutate({
      packId: selectedPack,
      metodoPagamento: metodo,
      nomeAcquirente: form.nome,
      emailAcquirente: form.email,
      telefonoAcquirente: form.telefono || undefined,
      ragioneSocialeAcquirente: form.ragioneSociale || undefined,
      note: form.note || undefined,
    });
  };

  // Redirect immediato per installatori Solo Singole — non devono vedere nulla di /acquista
  const isSoloSingole = isAuthenticated && installatoreData?.tipoInterfaccia === "solo_singole";
  const [, navigate] = useLocation();
  useEffect(() => {
    if (isSoloSingole) {
      navigate("/portale/dashboard");
    }
  }, [isSoloSingole]);
  if (isSoloSingole) return null;

  // Schermata login obbligatorio (solo per acquisto pack, non per listino singole)
  if (!loading && !isAuthenticated && modalitaScelta === "pack") {
    return (
      <div className="min-h-screen bg-[#1a4a2e] flex items-center justify-center p-6">
        <div className="bg-[#0e3320] rounded-3xl border border-white/10 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#f5c518]/10 border border-[#f5c518]/20 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-[#f5c518]" />
          </div>
          <h1 className="text-2xl font-black text-white mb-3" style={{ fontFamily: "Montserrat, sans-serif" }}>
            Accesso <span className="text-[#f5c518]">Richiesto</span>
          </h1>
          <p className="text-white/60 mb-2 text-sm leading-relaxed">
            Per acquistare un pacchetto devi essere registrato come installatore. Questo ci permette di monitorare le tue pratiche e gestire il tuo saldo.
          </p>
          <p className="text-white/40 text-xs mb-6">Hai già un account? Accedi. Sei nuovo? Registrati gratuitamente.</p>
          <div className="flex flex-col gap-3">
            <a href={getLoginUrl()} className="block w-full bg-[#f5c518] text-[#1a4a2e] font-black py-3 rounded-xl hover:bg-[#f5c518]/90 transition-colors text-center">
              Accedi al Portale
            </a>
            <Link href="/portale/registrazione">
              <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 font-bold">
                Registrati come Installatore
              </Button>
            </Link>
            <button onClick={() => setModalitaScelta("scegli")} className="text-white/40 hover:text-white text-sm transition-colors mt-1">
              ← Torna alla scelta
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Schermata di scelta iniziale
  if (modalitaScelta === "scegli") {
    return (
      <div className="min-h-screen bg-[#1a4a2e] flex flex-col">
        <nav className="sticky top-0 z-50 bg-[#1a4a2e]/95 backdrop-blur border-b border-white/10">
          <div className="container flex items-center gap-4 h-16">
            <Link href="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Torna alla Home</span>
            </Link>
            <div className="flex items-center gap-2 ml-auto">
              <Zap className="w-5 h-5 text-[#4ade80]" />
              <span className="font-black text-white hidden sm:block" style={{ fontFamily: "Montserrat, sans-serif" }}>
                RICARICATI <span className="text-[#f5c518]">DI CONNESSIONI</span>
              </span>
            </div>
          </div>
        </nav>
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="max-w-2xl w-full text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-3" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Come vuoi <span className="text-[#f5c518]">acquistare?</span>
            </h1>
            <p className="text-white/60">Scegli tra un pacchetto conveniente o singole pratiche su misura.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
            {/* OPZIONE PACK — nascosta per Solo Singole */}
            {!isSoloSingole && <button onClick={() => setModalitaScelta("pack")}
              className="group bg-[#0e3320] hover:bg-[#0e3320]/80 border-2 border-[#f5c518]/30 hover:border-[#f5c518] rounded-3xl p-8 text-left transition-all duration-200 hover:scale-[1.02]">
              <div className="w-14 h-14 bg-[#f5c518]/10 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-[#f5c518]/20 transition-colors">
                <Package className="w-7 h-7 text-[#f5c518]" />
              </div>
              <h2 className="text-xl font-black text-white mb-2">Acquista un Pack</h2>
              <p className="text-white/50 text-sm mb-4">Blocca il prezzo su più pratiche e risparmia. Ideale se lavori con volumi regolari.</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <CheckCircle className="w-4 h-4 text-[#4ade80] shrink-0" />
                  Pack 1 — €2.000 (16 pratiche residenziali)
                </div>
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <CheckCircle className="w-4 h-4 text-[#4ade80] shrink-0" />
                  Pack 2 — €3.150 (30 pratiche residenziali)
                </div>
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <CheckCircle className="w-4 h-4 text-[#4ade80] shrink-0" />
                  Pack 3 — €5.100 (60 pratiche residenziali)
                </div>
              </div>
              <div className="mt-5 flex items-center gap-2 text-[#f5c518] font-bold text-sm">
                Scegli il pack <span className="text-lg">→</span>
              </div>
            </button>}
            {/* OPZIONE PRATICHE SINGOLE */}
            <Link href={isAuthenticated && installatoreData?.stato === "approvato" ? "/listino-riservato" : "/listino"}>
              <div className="group bg-[#0e3320] hover:bg-[#0e3320]/80 border-2 border-[#4ade80]/30 hover:border-[#4ade80] rounded-3xl p-8 text-left transition-all duration-200 hover:scale-[1.02] cursor-pointer h-full">
                <div className="w-14 h-14 bg-[#4ade80]/10 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-[#4ade80]/20 transition-colors">
                  <List className="w-7 h-7 text-[#4ade80]" />
                </div>
                <h2 className="text-xl font-black text-white mb-2">Pratiche Singole</h2>
                <p className="text-white/50 text-sm mb-4">Scegli solo le pratiche che ti servono dal listino completo. Flessibile e senza impegno.</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="w-4 h-4 text-[#4ade80] shrink-0" />
                    Progettazione, GSE, ARERA, Dogane
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="w-4 h-4 text-[#4ade80] shrink-0" />
                    Iter Connessione, Terna, Distribuzione
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="w-4 h-4 text-[#4ade80] shrink-0" />
                    Conto Termico 3.0 e molto altro
                  </div>
                </div>
                <div className="mt-5 flex items-center gap-2 text-[#4ade80] font-bold text-sm">
                  Vedi il listino <span className="text-lg">→</span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#1a4a2e] flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-[#0e3320] rounded-3xl p-10 border border-[#4ade80]/30 text-center">
          <CheckCircle className="w-16 h-16 text-[#4ade80] mx-auto mb-6" />
          <h2 className="text-3xl font-black text-white mb-4" style={{ fontFamily: "Montserrat, sans-serif" }}>Ordine Ricevuto!</h2>
          <p className="text-white/70 mb-6">Grazie <strong className="text-white">{form.nome}</strong>! Il tuo ordine per <strong className="text-[#f5c518]">{pack.nome} ({pack.prezzo})</strong> è stato registrato.</p>
          {metodo === "bonifico" ? (
            <div className="bg-[#1a4a2e] rounded-2xl p-6 text-left border border-white/10 mb-6">
              <p className="text-[#f5c518] font-bold mb-3 text-sm uppercase tracking-wider">Dati per il Bonifico</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-white/60">Intestatario</span><span className="text-white font-semibold">{INTESTATARIO}</span></div>
                <div className="flex justify-between"><span className="text-white/60">IBAN</span><span className="text-white font-semibold font-mono">{IBAN}</span></div>
                <div className="flex justify-between"><span className="text-white/60">Importo</span><span className="text-[#f5c518] font-black">{pack.prezzo}</span></div>
                <div className="flex justify-between"><span className="text-white/60">Causale</span><span className="text-white font-semibold">{pack.nome} - Ricaricati di Connessioni</span></div>
              </div>
            </div>
          ) : (
            <div className="bg-[#1a4a2e] rounded-2xl p-6 text-left border border-white/10 mb-6">
              <p className="text-[#f5c518] font-bold mb-3 text-sm uppercase tracking-wider">Pagamento PayPal</p>
              <p className="text-white/70 text-sm mb-3">Clicca il bottone per completare il pagamento di <strong className="text-[#f5c518]">{pack.prezzo}</strong> direttamente su PayPal.</p>
              <a
                href={`${PAYPAL_ME_BASE}/${pack.importo}EUR`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#0070ba] hover:bg-[#005ea6] text-white font-bold px-5 py-3 rounded-xl transition-colors w-full justify-center"
              >
                <CreditCard className="w-5 h-5" />
                Paga {pack.prezzo} con PayPal
              </a>
              <p className="text-white/50 text-xs mt-2 text-center">Causale: {pack.nome} - Ricaricati di Connessioni</p>
            </div>
          )}
          {pdfUrl && (
            <div className="bg-[#1a4a2e] rounded-2xl p-4 border border-[#4ade80]/30 mb-6">
              <p className="text-[#4ade80] text-xs font-bold uppercase tracking-wide mb-3">Documenti</p>
              <div className="space-y-2">
                <a
                  href={pdfUrl}
                  download
                  className="inline-flex items-center gap-2 bg-[#4ade80] hover:bg-[#4ade80]/90 text-[#1a4a2e] font-bold px-4 py-2 rounded-lg transition-colors w-full justify-center text-sm"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 16.5a1 1 0 11-2 0 1 1 0 012 0zM15 16.5a1 1 0 11-2 0 1 1 0 012 0z" />
                    <path d="M3 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H3zm14.553 7.106A1 1 0 0015.5 12H4v2h11.553l2.553 2.553V9.106z" />
                  </svg>
                  Scarica Guida Pack (PDF)
                </a>
              </div>
            </div>
          )}
          <p className="text-white/50 text-sm mb-6">Riceverai conferma all'indirizzo <strong className="text-white">{form.email}</strong> una volta verificato il pagamento.</p>
          <Link href="/">
            <Button className="bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-bold">Torna alla Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a4a2e] text-white pb-24">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-[#1a4a2e]/95 backdrop-blur border-b border-white/10">
        <div className="container flex items-center gap-4 h-16">
          <Link href="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Torna alla Home</span>
          </Link>
          <div className="flex items-center gap-2 ml-auto">
            <Zap className="w-5 h-5 text-[#4ade80]" />
            <span className="font-black text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>RICARICATI <span className="text-[#f5c518]">DI CONNESSIONI</span></span>
          </div>
        </div>
      </nav>

      <div className="container py-12">
        <div className="text-center mb-12">
          <Package className="w-10 h-10 text-[#f5c518] mx-auto mb-4" />
          <h1 className="text-4xl font-black text-white mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>Acquista il tuo Pack</h1>
          <p className="text-white/60">Scegli il pacchetto e completa l'ordine in pochi secondi</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* SELEZIONE PACK */}
          <div>
            <h2 className="text-xl font-bold text-[#f5c518] mb-6">1. Scegli il Pack</h2>
            <div className="space-y-4 mb-8">
              {PACKS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPack(p.id)}
                  className={`w-full rounded-2xl border p-5 text-left transition-all ${selectedPack === p.id ? "border-[#f5c518] bg-[#f5c518]/10" : "border-white/15 bg-[#0e3320] hover:border-white/30"}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPack === p.id ? "border-[#f5c518] bg-[#f5c518]" : "border-white/40"}`}>
                        {selectedPack === p.id && <div className="w-2 h-2 rounded-full bg-[#1a4a2e]" />}
                      </div>
                      <span className="font-black text-white text-lg">{p.nome}</span>
                      {p.badge && <span className="text-xs bg-[#f5c518] text-[#1a4a2e] font-bold px-2 py-0.5 rounded-full">{p.badge}</span>}
                    </div>
                    <span className="text-[#f5c518] font-black text-xl">{p.prezzo}</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-white/60">
                    <div>Pratiche: <strong className="text-white">{p.residenziali}</strong> <span className="text-[#f5c518] font-bold mx-1">o</span> <strong className="text-white">{p.business}</strong></div>
                    <div className="grid grid-cols-2 gap-2">
                      <span>Ric. Bollette: <strong className="text-[#4ade80]">{p.ricBollette}</strong></span>
                      <span>Ric. Pratiche: <strong className="text-[#4ade80]">{p.ricPratiche}</strong></span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <h2 className="text-xl font-bold text-[#f5c518] mb-4">2. Tipo di Pratica</h2>
            <div className="grid grid-cols-3 gap-3 mb-8">
              {["residenziale", "business", "flessibile"].map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => {
                    setTipoPratica(tipo as any);
                    if (tipo !== "flessibile") setFlessibileConfig({ residenziali: 0, business: 0 });
                  }}
                  className={`rounded-xl border p-3 text-center transition-all text-sm font-bold ${
                    tipoPratica === tipo
                      ? "border-[#f5c518] bg-[#f5c518]/10 text-[#f5c518]"
                      : "border-white/15 bg-[#0e3320] text-white/70 hover:border-white/30"
                  }`}
                >
                  {tipo === "residenziale" ? "🏠 Residenziali" : tipo === "business" ? "🏢 Business" : "⚡ Flessibile"}
                </button>
              ))}
            </div>
            {tipoPratica === "flessibile" && (
              <div className="mb-8 bg-[#0e3320] rounded-2xl p-4 border border-[#f5c518]/30">
                <p className="text-white/70 text-sm mb-4">Specifica il numero di pratiche residenziali e business da combinare:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/60 text-xs font-bold mb-2 block">🏠 Residenziali (max {pack.residenziali.split(" ")[0]})</label>
                    <input
                      type="number"
                      min="0"
                      max={parseInt(pack.residenziali.split(" ")[0])}
                      value={flessibileConfig.residenziali}
                      onChange={(e) => {
                        const val = Math.min(parseInt(e.target.value) || 0, parseInt(pack.residenziali.split(" ")[0]));
                        setFlessibileConfig({ ...flessibileConfig, residenziali: Math.max(0, val) });
                      }}
                      className="w-full bg-[#1a4a2e] border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-white/60 text-xs font-bold mb-2 block">🏢 Business (max {pack.business.split(" ")[0]})</label>
                    <input
                      type="number"
                      min="0"
                      max={parseInt(pack.business.split(" ")[0])}
                      value={flessibileConfig.business}
                      onChange={(e) => {
                        const val = Math.min(parseInt(e.target.value) || 0, parseInt(pack.business.split(" ")[0]));
                        setFlessibileConfig({ ...flessibileConfig, business: Math.max(0, val) });
                      }}
                      className="w-full bg-[#1a4a2e] border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                    />
                  </div>
                </div>
                {flessibileConfig.residenziali === 0 && flessibileConfig.business === 0 && (
                  <p className="text-amber-400 text-xs mt-3 flex items-center gap-1">⚠️ Seleziona almeno una pratica</p>
                )}
              </div>
            )}

            <h2 className="text-xl font-bold text-[#f5c518] mb-4">3. Metodo di Pagamento</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setMetodo("bonifico")}
                className={`rounded-2xl border p-5 flex flex-col items-center gap-3 transition-all ${metodo === "bonifico" ? "border-[#f5c518] bg-[#f5c518]/10" : "border-white/15 bg-[#0e3320] hover:border-white/30"}`}
              >
                <Building2 className={`w-8 h-8 ${metodo === "bonifico" ? "text-[#f5c518]" : "text-white/50"}`} />
                <span className={`font-bold text-sm ${metodo === "bonifico" ? "text-[#f5c518]" : "text-white/70"}`}>Bonifico Bancario</span>
              </button>
              <button
                onClick={() => setMetodo("paypal")}
                className={`rounded-2xl border p-5 flex flex-col items-center gap-3 transition-all ${metodo === "paypal" ? "border-[#f5c518] bg-[#f5c518]/10" : "border-white/15 bg-[#0e3320] hover:border-white/30"}`}
              >
                <CreditCard className={`w-8 h-8 ${metodo === "paypal" ? "text-[#f5c518]" : "text-white/50"}`} />
                <span className={`font-bold text-sm ${metodo === "paypal" ? "text-[#f5c518]" : "text-white/70"}`}>PayPal</span>
              </button>
            </div>

            {metodo === "bonifico" && (
              <div className="mt-4 bg-[#0e3320] rounded-2xl p-4 border border-white/10 text-sm">
                <p className="text-[#f5c518] font-bold mb-2">Dati Bancari</p>
                <p className="text-white/70">Intestatario: <strong className="text-white">{INTESTATARIO}</strong></p>
                <p className="text-white/70">IBAN: <strong className="text-white font-mono">{IBAN}</strong></p>
              </div>
            )}
            {metodo === "paypal" && (
              <div className="mt-4 bg-[#0e3320] rounded-2xl p-4 border border-white/10 text-sm">
                <p className="text-[#f5c518] font-bold mb-2">PayPal</p>
                <p className="text-white/60 mb-3">Clicca il bottone per aprire PayPal con l'importo già inserito. Usa come causale: <strong className="text-white">{pack.nome} - Ricaricati di Connessioni</strong></p>
                <a
                  href={`${PAYPAL_ME_BASE}/${pack.importo}EUR`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#0070ba] hover:bg-[#005ea6] text-white font-bold px-5 py-3 rounded-xl transition-colors w-full justify-center"
                >
                  <CreditCard className="w-5 h-5" />
                  Paga {pack.prezzo} con PayPal
                </a>
                <p className="text-white/40 text-xs mt-2 text-center">Verrai reindirizzato al sito PayPal in modo sicuro</p>
              </div>
            )}
          </div>

          {/* FORM DATI */}
          <div>
            <h2 className="text-xl font-bold text-[#f5c518] mb-6">4. I tuoi dati</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Se loggato: mostra dati in sola lettura invece dei campi */}
              {isAuthenticated && installatoreData ? (
                <div className="bg-[#0e3320] rounded-2xl border border-[#4ade80]/30 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-[#4ade80]" />
                    <p className="text-[#4ade80] text-xs font-bold uppercase tracking-wide">Dati del tuo profilo</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                      <span className="text-white/50 text-sm">Azienda</span>
                      <span className="text-white font-semibold text-sm">{installatoreData.ragioneSociale}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                      <span className="text-white/50 text-sm">Email</span>
                      <span className="text-white font-semibold text-sm">{user?.email ?? "—"}</span>
                    </div>
                    {installatoreData.telefono && (
                      <div className="flex justify-between items-center py-1.5">
                        <span className="text-white/50 text-sm">Telefono</span>
                        <span className="text-white font-semibold text-sm">{installatoreData.telefono}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <Label className="text-white/80 mb-1 block">Nome e Cognome *</Label>
                    <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })}
                      placeholder="Mario Rossi" className="bg-[#0e3320] border-white/20 text-white placeholder:text-white/30" required />
                  </div>
                  <div>
                    <Label className="text-white/80 mb-1 block">Email *</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="mario@esempio.it" className="bg-[#0e3320] border-white/20 text-white placeholder:text-white/30" required />
                  </div>
                  <div>
                    <Label className="text-white/80 mb-1 block">Telefono</Label>
                    <Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                      placeholder="+39 333 1234567" className="bg-[#0e3320] border-white/20 text-white placeholder:text-white/30" />
                  </div>
                  <div>
                    <Label className="text-white/80 mb-1 block">Ragione Sociale / Azienda</Label>
                    <Input value={form.ragioneSociale} onChange={(e) => setForm({ ...form, ragioneSociale: e.target.value })}
                      placeholder="Rossi Impianti S.r.l." className="bg-[#0e3320] border-white/20 text-white placeholder:text-white/30" />
                  </div>
                </>
              )}
              <div>
                <Label className="text-white/80 mb-1 block">Note aggiuntive</Label>
                <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="Eventuali note o richieste..." rows={3}
                  className="w-full rounded-md bg-[#0e3320] border border-white/20 text-white placeholder:text-white/30 p-3 text-sm resize-none focus:outline-none focus:border-[#f5c518]" />
              </div>

              {/* RIEPILOGO */}
              <div className="bg-[#0e3320] rounded-2xl p-5 border border-[#f5c518]/30">
                <p className="text-[#f5c518] font-bold text-sm uppercase tracking-wider mb-3">Riepilogo Ordine</p>
                <div className="flex justify-between mb-2">
                  <span className="text-white/70">Pack selezionato</span>
                  <span className="text-white font-bold">{pack.nome}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-white/70">Metodo pagamento</span>
                  <span className="text-white font-bold">{metodo === "paypal" ? "PayPal" : "Bonifico"}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-white/10">
                  <span className="text-white font-bold">Totale</span>
                  <span className="text-[#f5c518] font-black text-xl">{pack.prezzo}</span>
                </div>
              </div>

              <Button type="submit" disabled={creaOrdine.isPending}
                className="w-full bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-black text-base py-6">
                {creaOrdine.isPending ? "Invio in corso..." : `Conferma Ordine — ${pack.prezzo}`}
              </Button>
              <p className="text-white/40 text-xs text-center">Riceverai istruzioni di pagamento via email dopo la conferma.</p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
