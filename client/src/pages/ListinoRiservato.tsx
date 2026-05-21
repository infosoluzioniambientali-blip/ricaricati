import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Zap, ArrowLeft, ShoppingCart, CheckCircle, Info, Lock, Star, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LISTINO, CATEGORIE, type ServizioListino } from "../../../shared/listino";
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

const CAT_ICONS: Record<string, string> = {
  "Progettazione": "📐",
  "Iter Connessione": "🔌",
  "GSE": "☀️",
  "Agenzia delle Dogane": "🏛️",
  "Conto Termico 3.0": "🌡️",
  "ARERA": "📋",
  "Terna": "⚡",
  "Distribuzione": "🔄",
};

// ─── SCARICA PREVENTIVO ───────────────────────────────────────────────────────
function ScaricaPreventivoButton({ ordineId }: { ordineId: number }) {
  const [isLoading, setIsLoading] = useState(false);
  const generaPreventivoSingola = trpc.ordini.generaPreventivoSingola.useQuery(
    { ordineId },
    { enabled: false }
  );

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const result = await generaPreventivoSingola.refetch();
      if (result.data?.url) {
        const link = document.createElement("a");
        link.href = result.data.url;
        link.download = `preventivo-${ordineId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Preventivo scaricato con successo!");
      }
    } catch (error) {
      toast.error("Errore nel download del preventivo");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      onClick={handleDownload}
      disabled={isLoading || generaPreventivoSingola.isPending}
      className="w-full text-green-400 border-green-400/30 hover:bg-green-400/10 text-xs"
      variant="outline"
    >
      <FileDown className="w-3 h-3 mr-1" />
      {isLoading || generaPreventivoSingola.isPending ? "Generazione..." : "Scarica Preventivo"}
    </Button>
  );
}

function formatPrezzo(val: number | string | null | undefined): string {
  if (val === null || val === undefined) return "—";
  if (typeof val === "number") return `€${val.toLocaleString("it-IT")}`;
  return val;
}

export default function ListinoRiservato() {
  const { isAuthenticated, loading } = useAuth();
  const [categoriaAttiva, setCategoriaAttiva] = useState<string>(CATEGORIE[0]);
  const [fasciaSelezionata, setFasciaSelezionata] = useState<"prezzoStandard" | "prezzoForniture" | "prezzoPremium">("prezzoStandard");
  const [carrello, setCarrello] = useState<{ servizio: ServizioListino; fascia: string; prezzoPersonalizzato?: number }[]>([]);
  const [showCarrello, setShowCarrello] = useState(false);

  // Verifica se l'utente è un installatore approvato
  const { data: installatore, isLoading: loadingInstallatore } = trpc.installatori.mio.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Carica il listino personalizzato dell'installatore (se esiste)
  const { data: listinoPersonalizzato, isLoading: loadingListino } = trpc.installatori.mioListino.useQuery(undefined, {
    enabled: isAuthenticated && !!installatore && installatore.stato === "approvato",
  });

  // Mappa prezzi personalizzati: { [servizioId]: { prezzo: number, note?: string } }
  const prezziPersonalizzati = useMemo(() => {
    if (!listinoPersonalizzato?.prezzi) return {} as Record<string, { prezzo: number; note?: string }>;
    try {
      return JSON.parse(listinoPersonalizzato.prezzi) as Record<string, { prezzo: number; note?: string }>;
    } catch {
      return {} as Record<string, { prezzo: number; note?: string }>;
    }
  }, [listinoPersonalizzato]);

  const haListinoPersonalizzato = Object.keys(prezziPersonalizzati).length > 0;

  const utils = trpc.useUtils();

  const creaOrdineSingolo = trpc.ordini.creaOrdineSingolo.useMutation({
    onSuccess: () => {
      toast.success("Richiesta inviata! Ti contatteremo per confermare e procedere al pagamento.");
      setCarrello([]);
      setShowCarrello(false);
      // Invalida il listino personalizzato per forzare il ricaricamento
      utils.installatori.mioListino.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  // Ottieni il prezzo effettivo di un servizio (personalizzato se disponibile, altrimenti standard)
  const getPrezzoEffettivo = (servizio: ServizioListino, fascia: string): number | string => {
    if (haListinoPersonalizzato && prezziPersonalizzati[servizio.id]) {
      return prezziPersonalizzati[servizio.id].prezzo;
    }
    return servizio[fascia as keyof ServizioListino] as number | string;
  };

  const serviziCategoria = LISTINO.filter((s) => s.categoria === categoriaAttiva);

  const aggiungiAlCarrello = (servizio: ServizioListino) => {
    const esiste = carrello.find((c) => c.servizio.id === servizio.id);
    if (esiste) {
      toast.info("Servizio già nel carrello");
      return;
    }
    const prezzoCustom = haListinoPersonalizzato && prezziPersonalizzati[servizio.id]
      ? prezziPersonalizzati[servizio.id].prezzo
      : undefined;
    setCarrello((prev) => [...prev, { servizio, fascia: fasciaSelezionata, prezzoPersonalizzato: prezzoCustom }]);
    toast.success("Aggiunto al carrello");
  };

  const rimuoviDalCarrello = (id: string) => {
    setCarrello((prev) => prev.filter((c) => c.servizio.id !== id));
  };

  // Estrae il valore numerico da un prezzo (numero o stringa come "€350 + 3% erogato")
  const estraiNumero = (val: number | string | null | undefined): number => {
    if (typeof val === "number") return val;
    if (typeof val === "string") {
      // Prende il primo numero nella stringa (es. "€350 + 3%" → 350)
      const match = val.replace(/\./g, "").match(/(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    }
    return 0;
  };

  const totaleCarrello = carrello.reduce((acc, { servizio, fascia, prezzoPersonalizzato }) => {
    if (prezzoPersonalizzato !== undefined) return acc + prezzoPersonalizzato;
    const prezzo = servizio[fascia as keyof ServizioListino];
    return acc + estraiNumero(prezzo as any);
  }, 0);

  const inviaRichiesta = () => {
    if (carrello.length === 0) return;
    const descrizione = carrello.map(({ servizio, fascia, prezzoPersonalizzato }) => {
      const prezzo = prezzoPersonalizzato !== undefined
        ? `€${prezzoPersonalizzato.toLocaleString("it-IT")} (personalizzato)`
        : formatPrezzo(servizio[fascia as keyof ServizioListino] as any);
      return `${servizio.nome} [${FASCIA_LABELS[fascia]}]: ${prezzo}`;
    }).join("\n");
    creaOrdineSingolo.mutate({ descrizione, fascia: fasciaSelezionata, importoTotale: totaleCarrello });
  };

  // Stato di caricamento
  if (loading || loadingInstallatore || loadingListino) {
    return (
      <div className="min-h-screen bg-[#1a4a2e] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#f5c518] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Non autenticato → schermata di accesso
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#1a4a2e] flex items-center justify-center p-6">
        <div className="bg-[#0e3320] rounded-3xl border border-white/10 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#f5c518]/10 border border-[#f5c518]/20 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-[#f5c518]" />
          </div>
          <h1 className="text-2xl font-black text-white mb-3" style={{ fontFamily: "Montserrat, sans-serif" }}>
            Area <span className="text-[#f5c518]">Riservata</span>
          </h1>
          <p className="text-white/60 mb-6 text-sm leading-relaxed">
            Il listino riservato è accessibile esclusivamente agli installatori registrati e approvati.
            Accedi con il tuo account per visualizzare i prezzi riservati.
          </p>
          <a href={getLoginUrl()} className="block w-full bg-[#f5c518] text-[#1a4a2e] font-black py-3 rounded-xl hover:bg-[#f5c518]/90 transition-colors text-center">
            Accedi al Portale
          </a>
          <Link href="/" className="block mt-4 text-white/40 hover:text-white text-sm transition-colors">
            ← Torna alla Home
          </Link>
        </div>
      </div>
    );
  }

  // Autenticato ma non installatore approvato
  if (!installatore || installatore.stato !== "approvato") {
    return (
      <div className="min-h-screen bg-[#1a4a2e] flex items-center justify-center p-6">
        <div className="bg-[#0e3320] rounded-3xl border border-white/10 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#f5c518]/10 border border-[#f5c518]/20 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-[#f5c518]" />
          </div>
          <h1 className="text-2xl font-black text-white mb-3" style={{ fontFamily: "Montserrat, sans-serif" }}>
            Accesso <span className="text-[#f5c518]">Non Autorizzato</span>
          </h1>
          <p className="text-white/60 mb-6 text-sm leading-relaxed">
            {!installatore
              ? "Non risulti registrato come installatore. Completa la registrazione per accedere al listino riservato."
              : installatore.stato === "in_attesa"
              ? "La tua registrazione è in attesa di approvazione. Riceverai una notifica non appena sarà approvata."
              : "La tua registrazione non è stata approvata. Contattaci per maggiori informazioni."}
          </p>
          {!installatore && (
            <Link href="/portale/registrazione">
              <Button className="w-full bg-[#f5c518] text-[#1a4a2e] font-black py-3 rounded-xl hover:bg-[#f5c518]/90">
                Registrati come Installatore
              </Button>
            </Link>
          )}
          <Link href="/" className="block mt-4 text-white/40 hover:text-white text-sm transition-colors">
            ← Torna alla Home
          </Link>
        </div>
      </div>
    );
  }

  // Installatore approvato → mostra il listino riservato
  return (
    <div className="min-h-screen bg-[#1a4a2e] text-white">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-[#1a4a2e]/95 backdrop-blur border-b border-white/10">
        <div className="container flex items-center gap-4 h-16">
          <Link href="/portale/dashboard" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm hidden sm:block">Centro di Controllo</span>
          </Link>
          <div className="flex items-center gap-2 ml-auto">
            <Lock className="w-4 h-4 text-[#f5c518]" />
            <Zap className="w-5 h-5 text-[#4ade80]" />
            <span className="font-black text-white hidden sm:block" style={{ fontFamily: "Montserrat, sans-serif" }}>
              LISTINO <span className="text-[#f5c518]">RISERVATO</span>
            </span>
          </div>
          {carrello.length > 0 && (
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
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 bg-[#f5c518]/10 border border-[#f5c518]/20 rounded-full px-4 py-1.5 text-[#f5c518] text-xs font-bold mb-4">
            <Lock className="w-3 h-3" />
            Area Riservata Installatori
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>
            Listino <span className="text-[#f5c518]">Riservato</span>
          </h1>
          <p className="text-white/60 max-w-2xl">
            Prezzi esclusivi riservati agli installatori approvati. Aggiungi i servizi al carrello e invia la richiesta.
          </p>
        </div>

        {/* BANNER LISTINO PERSONALIZZATO */}
        {haListinoPersonalizzato && (
          <div className="bg-[#f5c518]/10 border border-[#f5c518]/30 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <Star className="w-5 h-5 text-[#f5c518] shrink-0 mt-0.5" />
            <div>
              <p className="text-[#f5c518] font-bold text-sm">Listino Personalizzato Attivo</p>
              <p className="text-white/60 text-xs mt-0.5">
                {listinoPersonalizzato?.nomeListino ?? "Listino Personalizzato"} — I prezzi mostrati sono stati personalizzati dall'amministratore per il tuo account.
              </p>
            </div>
          </div>
        )}

        {/* SELEZIONE FASCIA (solo se non c'è listino personalizzato) */}
        {!haListinoPersonalizzato && (
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
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* SIDEBAR CATEGORIE */}
          <div className="lg:w-56 shrink-0">
            <div className="bg-[#0e3320] rounded-2xl border border-white/10 overflow-hidden">
              {CATEGORIE.map((cat) => (
                <button key={cat} onClick={() => setCategoriaAttiva(cat)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-left transition-colors border-b border-white/5 last:border-0 ${categoriaAttiva === cat ? "bg-[#f5c518]/10 text-[#f5c518] border-l-2 border-l-[#f5c518]" : "text-white/60 hover:text-white hover:bg-white/5"}`}>
                  <span>{CAT_ICONS[cat] ?? "📄"}</span>
                  <span>{cat}</span>
                </button>
              ))}
            </div>
          </div>

          {/* LISTA SERVIZI */}
          <div className="flex-1">
            <h2 className="text-xl font-black text-[#f5c518] mb-4 flex items-center gap-2">
              <span>{CAT_ICONS[categoriaAttiva] ?? "📄"}</span>
              {categoriaAttiva}
            </h2>
            <div className="space-y-3">
              {serviziCategoria.map((servizio) => {
                const prezzoCustom = haListinoPersonalizzato && prezziPersonalizzati[servizio.id];
                const prezzoAttivo = prezzoCustom ? prezzoCustom.prezzo : servizio[fasciaSelezionata];
                const noteCustom = prezzoCustom ? prezzoCustom.note : undefined;
                const nelCarrello = carrello.some((c) => c.servizio.id === servizio.id);
                return (
                  <div key={servizio.id} className={`bg-[#0e3320] rounded-2xl border transition-all ${nelCarrello ? "border-[#4ade80]/40" : prezzoCustom ? "border-[#f5c518]/20 hover:border-[#f5c518]/40" : "border-white/10 hover:border-white/20"}`}>
                    <div className="p-5">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {nelCarrello && <CheckCircle className="w-4 h-4 text-[#4ade80] shrink-0" />}
                            {prezzoCustom && !nelCarrello && <Star className="w-3.5 h-3.5 text-[#f5c518] shrink-0" />}
                            <h3 className="text-white font-bold">{servizio.nome}</h3>
                          </div>
                          <p className="text-white/50 text-sm">{servizio.descrizione}</p>
                          {noteCustom && (
                            <p className="text-[#f5c518]/70 text-xs mt-1 italic">{noteCustom}</p>
                          )}
                          {!noteCustom && servizio.notePrezzo && (
                            <p className="text-white/30 text-xs mt-1 italic">{servizio.notePrezzo}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          {/* Prezzi */}
                          {prezzoCustom ? (
                            <div className="text-right">
                              <div className="text-[10px] text-[#f5c518]/60 mb-0.5">Prezzo personalizzato</div>
                              <div className="text-[#f5c518] font-black text-lg">{formatPrezzo(prezzoCustom.prezzo)}</div>
                            </div>
                          ) : (
                            <div className="hidden sm:flex gap-4 text-right">
                              {(["prezzoStandard", "prezzoForniture", "prezzoPremium"] as const).map((fascia) => (
                                <div key={fascia} className={`text-xs ${fascia === fasciaSelezionata ? FASCIA_COLORS[fascia] + " font-black text-base" : "text-white/30"}`}>
                                  <div className="text-[10px] mb-0.5">{FASCIA_LABELS[fascia]}</div>
                                  {formatPrezzo(servizio[fascia] as any)}
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Prezzo attivo mobile (solo se non personalizzato) */}
                          {!prezzoCustom && (
                            <div className={`sm:hidden text-lg font-black ${FASCIA_COLORS[fasciaSelezionata]}`}>
                              {formatPrezzo(prezzoAttivo as any)}
                            </div>
                          )}
                          <Button size="sm" onClick={() => aggiungiAlCarrello(servizio)} disabled={nelCarrello}
                            className={`font-bold text-xs ${nelCarrello ? "bg-[#4ade80]/20 text-[#4ade80] border border-[#4ade80]/30" : "bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90"}`}>
                            {nelCarrello ? <><CheckCircle className="w-3 h-3 mr-1" /> Aggiunto</> : <><ShoppingCart className="w-3 h-3 mr-1" /> Aggiungi</>}
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

        {/* NOTE LEGALI */}
        <div className="mt-10 p-5 bg-[#0e3320] rounded-2xl border border-white/10">
          <p className="text-white/40 text-xs leading-relaxed">
            <strong className="text-white/60">Note sui prezzi:</strong> I prezzi indicati sono al netto di IVA salvo diversa indicazione. Per i servizi con dicitura "Prezzi esenti IVA (Reverse charge Art. 17, c. 6 lett. a), DPR 633/72)" l'IVA è in reverse charge. I prezzi "Su richiesta" o "Chiedere valutazione" vengono definiti caso per caso in base alla complessità della pratica. Il listino è aggiornato al 13/03/2026 e può essere soggetto a variazioni.
          </p>
        </div>
      </div>

      {/* CARRELLO MODALE */}
      {showCarrello && carrello.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowCarrello(false)}>
          <div className="bg-[#0e3320] rounded-3xl border border-white/10 w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-black text-[#f5c518]">Il tuo Carrello</h3>
              <button onClick={() => setShowCarrello(false)} className="text-white/40 hover:text-white text-xl">✕</button>
            </div>
            <div className="space-y-2 mb-5">
              {carrello.map(({ servizio, fascia, prezzoPersonalizzato }) => (
                <div key={servizio.id} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-white text-sm font-semibold">{servizio.nome}</p>
                    <p className="text-white/40 text-xs">{prezzoPersonalizzato !== undefined ? "Prezzo personalizzato" : FASCIA_LABELS[fascia]}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-bold ${prezzoPersonalizzato !== undefined ? "text-[#f5c518]" : FASCIA_COLORS[fascia]}`}>
                      {prezzoPersonalizzato !== undefined ? formatPrezzo(prezzoPersonalizzato) : formatPrezzo(servizio[fascia as keyof ServizioListino] as any)}
                    </span>
                    <button onClick={() => rimuoviDalCarrello(servizio.id)} className="text-red-400 hover:text-red-300 text-sm">✕</button>
                  </div>
                </div>
              ))}
            </div>
            {totaleCarrello > 0 && (
              <div className="flex items-center justify-between py-3 border-t border-white/10 mb-5">
                <span className="text-white/60 font-semibold">Totale stimato</span>
                <span className="text-[#f5c518] font-black text-xl">{formatPrezzo(totaleCarrello)}</span>
              </div>
            )}
            <p className="text-white/30 text-xs mb-4">
              I prezzi sono indicativi. Riceverai una conferma definitiva dall'amministratore prima del pagamento.
            </p>
            <Button onClick={inviaRichiesta} disabled={creaOrdineSingolo.isPending}
              className="w-full bg-[#f5c518] text-[#1a4a2e] font-black py-3 rounded-xl hover:bg-[#f5c518]/90">
              {creaOrdineSingolo.isPending ? "Invio in corso..." : "Invia Richiesta"}
            </Button>
            {creaOrdineSingolo.data && (
              <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-green-400 text-xs font-semibold mb-2">Richiesta inviata con successo!</p>
                <ScaricaPreventivoButton ordineId={creaOrdineSingolo.data.id} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* FAB CARRELLO */}
      {carrello.length > 0 && !showCarrello && (
        <button onClick={() => setShowCarrello(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-[#f5c518] text-[#1a4a2e] font-black px-5 py-3 rounded-2xl shadow-xl hover:bg-[#f5c518]/90 transition-all">
          <ShoppingCart className="w-5 h-5" />
          <span>{carrello.length} nel carrello</span>
          {totaleCarrello > 0 && <span className="text-[#1a4a2e]/70">· {formatPrezzo(totaleCarrello)}</span>}
        </button>
      )}
    </div>
  );
}
