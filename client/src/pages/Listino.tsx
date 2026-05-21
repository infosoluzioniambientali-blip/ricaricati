import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Zap, ArrowLeft, ShoppingCart, CheckCircle, Info, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LISTINO, CATEGORIE_ORDINATE, ICONE_CATEGORIE, type ServizioListino } from "../../../shared/listino";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

const FASCIA_LABELS: Record<string, string> = {
  prezzoStandard: "Standard",
  prezzoForniture: "Forniture FV",
  prezzoPremium: "Premium",
};

const FASCIA_COLORS: Record<string, string> = {
  prezzoStandard: "text-white",
  prezzoForniture: "text-[#4ade80]",
  prezzoPremium: "text-[#f5c518]",
};

function formatPrezzo(val: number | string): string {
  if (typeof val === "number") return `€${val.toLocaleString("it-IT")}`;
  return val;
}

// Categorie disponibili nel listino (ordinate e filtrate)
const CATEGORIE_DISPONIBILI = CATEGORIE_ORDINATE.filter(
  (cat) => LISTINO.some((s) => s.categoria === cat)
);

export default function Listino() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  // Carica dati installatore per verificare se ha un listino personalizzato
  const { data: installatore } = trpc.installatori.mio.useQuery(undefined, { enabled: isAuthenticated });
  // Redirect a /listino-riservato se l'installatore è approvato (ha listino personalizzato)
  useEffect(() => {
    if (isAuthenticated && installatore && installatore.stato === "approvato") {
      navigate("/listino-riservato");
    }
  }, [isAuthenticated, installatore]);
  const [categoriaAttiva, setCategoriaAttiva] = useState<string>(CATEGORIE_DISPONIBILI[0]);
  const [fasciaSelezionata, setFasciaSelezionata] = useState<"prezzoStandard" | "prezzoForniture" | "prezzoPremium">("prezzoStandard");
  const [carrello, setCarrello] = useState<{ servizio: ServizioListino; fascia: string }[]>([]);
  const [showCarrello, setShowCarrello] = useState(false);

  const creaOrdineSingolo = trpc.ordini.creaOrdineSingolo.useMutation({
    onSuccess: () => {
      toast.success("Richiesta inviata! Ti contatteremo per confermare e procedere al pagamento.");
      setCarrello([]);
      setShowCarrello(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const serviziCategoria = LISTINO.filter((s) => s.categoria === categoriaAttiva);

  const aggiungiAlCarrello = (servizio: ServizioListino) => {
    if (!isAuthenticated) {
      toast.error("Devi essere registrato per acquistare pratiche singole.", {
        action: {
          label: "Accedi / Registrati",
          onClick: () => { window.location.href = getLoginUrl("/listino"); },
        },
        duration: 6000,
      });
      return;
    }
    const esiste = carrello.find((c) => c.servizio.id === servizio.id);
    if (esiste) {
      toast.info("Servizio già nel carrello");
      return;
    }
    setCarrello((prev) => [...prev, { servizio, fascia: fasciaSelezionata }]);
    toast.success("Aggiunto al carrello");
  };

  const rimuoviDalCarrello = (id: string) => {
    setCarrello((prev) => prev.filter((c) => c.servizio.id !== id));
  };

  const totaleCarrello = carrello.reduce((acc, { servizio, fascia }) => {
    const prezzo = servizio[fascia as keyof ServizioListino];
    if (typeof prezzo === "number") return acc + prezzo;
    return acc;
  }, 0);

  const inviaRichiesta = () => {
    if (!isAuthenticated) {
      toast.error("Accedi per inviare una richiesta");
      return;
    }
    if (carrello.length === 0) return;
    const descrizione = carrello.map(({ servizio, fascia }) =>
      `${servizio.nome} [${FASCIA_LABELS[fascia]}]: ${formatPrezzo(servizio[fascia as keyof ServizioListino] as any)}`
    ).join("\n");
    creaOrdineSingolo.mutate({ descrizione, fascia: fasciaSelezionata, importoTotale: totaleCarrello });
  };

  return (
    <div className="min-h-screen bg-[#1a4a2e] text-white">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-[#1a4a2e]/95 backdrop-blur border-b border-white/10">
        <div className="container flex items-center gap-4 h-16">
          <Link href="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm hidden sm:block">Home</span>
          </Link>
          <div className="flex items-center gap-2 ml-auto">
            <Zap className="w-5 h-5 text-[#4ade80]" />
            <span className="font-black text-white hidden sm:block" style={{ fontFamily: "Montserrat, sans-serif" }}>
              LISTINO <span className="text-[#f5c518]">PRATICHE</span>
            </span>
          </div>
          {!isAuthenticated && (
            <a href={getLoginUrl("/listino")}
              className="flex items-center gap-2 bg-[#f5c518] text-[#1a4a2e] font-bold px-3 py-2 rounded-xl text-sm hover:bg-[#f5c518]/90 transition-colors">
              <Lock className="w-3 h-3" />
              <span className="hidden sm:block">Accedi per acquistare</span>
              <span className="sm:hidden">Accedi</span>
            </a>
          )}
          {isAuthenticated && carrello.length > 0 && (
            <button onClick={() => setShowCarrello(!showCarrello)}
              className="relative flex items-center gap-2 bg-[#f5c518] text-[#1a4a2e] font-bold px-3 py-2 rounded-xl text-sm hover:bg-[#f5c518]/90 transition-colors">
              <ShoppingCart className="w-4 h-4" />
              <span>{carrello.length}</span>
            </button>
          )}
        </div>
      </nav>

      <div className="container py-8">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>
            Listino <span className="text-[#f5c518]">Pratiche Singole</span>
          </h1>
          <p className="text-white/60 max-w-2xl">
            Acquista singole pratiche senza pack. Scegli la fascia di prezzo più adatta alla tua attività e aggiungi i servizi al carrello.
          </p>
          {/* Banner login se non autenticato */}
          {!isAuthenticated && (
            <div className="mt-4 flex items-center gap-3 bg-[#f5c518]/10 border border-[#f5c518]/30 rounded-2xl px-5 py-4">
              <Lock className="w-5 h-5 text-[#f5c518] shrink-0" />
              <div className="flex-1">
                <p className="text-[#f5c518] font-bold text-sm">Accesso richiesto per acquistare</p>
                <p className="text-white/60 text-xs mt-0.5">Registrati o accedi per aggiungere servizi al carrello e inviare richieste.</p>
              </div>
              <a href={getLoginUrl("/listino")}
                className="bg-[#f5c518] text-[#1a4a2e] font-black px-4 py-2 rounded-xl text-sm hover:bg-[#f5c518]/90 transition-colors shrink-0">
                Accedi / Registrati
              </a>
            </div>
          )}
        </div>

        {/* SELEZIONE FASCIA */}
        <div className="bg-[#0e3320] rounded-2xl p-5 border border-white/10 mb-8">
          <p className="text-white/60 text-sm mb-3 font-semibold">Seleziona la tua fascia di prezzo:</p>
          <div className="grid grid-cols-3 gap-3">
            {(["prezzoStandard", "prezzoForniture", "prezzoPremium"] as const).map((fascia) => (
              <button key={fascia} onClick={() => setFasciaSelezionata(fascia)}
                className={`rounded-xl border p-3 text-sm font-bold transition-all ${fasciaSelezionata === fascia ? "border-[#f5c518] bg-[#f5c518]/10 text-[#f5c518]" : "border-white/15 text-white/50 hover:border-white/30 hover:text-white"}`}>
                {FASCIA_LABELS[fascia]}
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-start gap-2 text-white/40 text-xs">
            <Info className="w-3 h-3 mt-0.5 shrink-0" />
            <span>
              <strong className="text-white/60">Standard:</strong> prezzi base ·
              <strong className="text-[#4ade80]"> Forniture FV:</strong> per installatori con forniture fotovoltaiche ·
              <strong className="text-[#f5c518]"> Premium:</strong> per installatori con pack attivo
            </span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* SIDEBAR CATEGORIE */}
          <div className="lg:w-56 shrink-0">
            <div className="bg-[#0e3320] rounded-2xl border border-white/10 overflow-hidden">
              {CATEGORIE_DISPONIBILI.map((cat) => (
                <button key={cat} onClick={() => setCategoriaAttiva(cat)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-left transition-colors border-b border-white/5 last:border-0 ${categoriaAttiva === cat ? "bg-[#f5c518]/10 text-[#f5c518] border-l-2 border-l-[#f5c518]" : "text-white/60 hover:text-white hover:bg-white/5"}`}>
                  <span>{ICONE_CATEGORIE[cat] ?? "📄"}</span>
                  <span>{cat}</span>
                </button>
              ))}
            </div>
          </div>

          {/* LISTA SERVIZI */}
          <div className="flex-1">
            <h2 className="text-xl font-black text-[#f5c518] mb-4 flex items-center gap-2">
              <span>{ICONE_CATEGORIE[categoriaAttiva] ?? "📄"}</span>
              {categoriaAttiva}
            </h2>
            <div className="space-y-3">
              {serviziCategoria.map((servizio) => {
                const prezzoAttivo = servizio[fasciaSelezionata];
                const nelCarrello = carrello.some((c) => c.servizio.id === servizio.id);
                return (
                  <div key={servizio.id} className={`bg-[#0e3320] rounded-2xl border transition-all ${nelCarrello ? "border-[#4ade80]/40" : "border-white/10 hover:border-white/20"}`}>
                    <div className="p-5">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {nelCarrello && <CheckCircle className="w-4 h-4 text-[#4ade80] shrink-0" />}
                            <h3 className="text-white font-bold">{servizio.nome}</h3>
                          </div>
                          <p className="text-white/50 text-sm">{servizio.descrizione}</p>
                          {servizio.notePrezzo && (
                            <p className="text-white/30 text-xs mt-1 italic">{servizio.notePrezzo}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          {/* Prezzi tutte e 3 le fasce */}
                          <div className="hidden sm:flex gap-4 text-right">
                            {(["prezzoStandard", "prezzoForniture", "prezzoPremium"] as const).map((fascia) => (
                              <div key={fascia} className={`text-xs ${fascia === fasciaSelezionata ? FASCIA_COLORS[fascia] + " font-black text-base" : "text-white/30"}`}>
                                <div className="text-[10px] mb-0.5">{FASCIA_LABELS[fascia]}</div>
                                {formatPrezzo(servizio[fascia] as any)}
                              </div>
                            ))}
                          </div>
                          {/* Prezzo attivo mobile */}
                          <div className={`sm:hidden text-lg font-black ${FASCIA_COLORS[fasciaSelezionata]}`}>
                            {formatPrezzo(prezzoAttivo as any)}
                          </div>
                          <Button size="sm" onClick={() => aggiungiAlCarrello(servizio)} disabled={nelCarrello}
                            className={`font-bold text-xs ${nelCarrello ? "bg-[#4ade80]/20 text-[#4ade80] border border-[#4ade80]/30" : !isAuthenticated ? "bg-white/10 text-white/60 hover:bg-[#f5c518]/20 hover:text-[#f5c518]" : "bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90"}`}>
                            {nelCarrello
                              ? <><CheckCircle className="w-3 h-3 mr-1" /> Aggiunto</>
                              : !isAuthenticated
                                ? <><Lock className="w-3 h-3 mr-1" /> Accedi</>
                                : <><ShoppingCart className="w-3 h-3 mr-1" /> Aggiungi</>
                            }
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CARRELLO */}
        {showCarrello && carrello.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowCarrello(false)}>
            <div className="bg-[#0e3320] rounded-3xl border border-white/10 w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-black text-[#f5c518]">Il tuo Carrello</h3>
                <button onClick={() => setShowCarrello(false)} className="text-white/40 hover:text-white text-xl">✕</button>
              </div>
              <div className="space-y-2 mb-5">
                {carrello.map(({ servizio, fascia }) => (
                  <div key={servizio.id} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-white text-sm font-semibold">{servizio.nome}</p>
                      <p className="text-white/40 text-xs">{FASCIA_LABELS[fascia]}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-bold ${FASCIA_COLORS[fascia]}`}>{formatPrezzo(servizio[fascia as keyof ServizioListino] as any)}</span>
                      <button onClick={() => rimuoviDalCarrello(servizio.id)} className="text-red-400 hover:text-red-300 text-sm">✕</button>
                    </div>
                  </div>
                ))}
              </div>
              {totaleCarrello > 0 && (
                <div className="flex items-center justify-between py-3 border-t border-white/10 mb-5">
                  <span className="text-white/70 font-semibold">Totale stimato</span>
                  <span className="text-[#f5c518] font-black text-xl">€{totaleCarrello.toLocaleString("it-IT")}</span>
                </div>
              )}
              <p className="text-white/40 text-xs mb-4">
                Inviando la richiesta, un nostro consulente ti contatterà per confermare i dettagli e procedere al pagamento tramite PayPal o Bonifico bancario.
              </p>
              <Button onClick={inviaRichiesta} disabled={creaOrdineSingolo.isPending}
                className="w-full bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-black py-5">
                {creaOrdineSingolo.isPending ? "Invio in corso..." : "Invia Richiesta"}
              </Button>
            </div>
          </div>
        )}

        {/* NOTA LEGALE */}
        <div className="mt-10 bg-[#0e3320] rounded-2xl p-5 border border-white/10">
          <p className="text-white/40 text-xs leading-relaxed">
            <strong className="text-white/60">Note sui prezzi:</strong> I prezzi indicati sono al netto di IVA salvo diversa indicazione. Per i servizi con dicitura "Prezzi esenti IVA (Reverse charge Art. 17, c. 6 lett. a), DPR 633/72)" l'IVA è in reverse charge. I prezzi "Su richiesta" o "Chiedere valutazione" vengono definiti caso per caso in base alla complessità della pratica. Il listino è aggiornato al 13/03/2026 e può essere soggetto a variazioni.
          </p>
        </div>
      </div>
    </div>
  );
}
