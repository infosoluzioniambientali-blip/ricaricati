import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Search, MapPin, Home, Zap, ChevronLeft, Filter, X, Loader2 } from "lucide-react";

const REGIONI = [
  "Abruzzo","Basilicata","Calabria","Campania","Emilia-Romagna","Friuli-Venezia Giulia",
  "Lazio","Liguria","Lombardia","Marche","Molise","Piemonte","Puglia","Sardegna","Sicilia",
  "Toscana","Trentino-Alto Adige","Umbria","Valle d'Aosta","Veneto"
];

const STATI = [
  { value: "disponibile", label: "Disponibile", color: "text-green-400" },
  { value: "in_trattativa", label: "In trattativa", color: "text-yellow-400" },
  { value: "venduto", label: "Venduto", color: "text-red-400" },
  { value: "affittato", label: "Affittato", color: "text-blue-400" },
];

export default function OppportunitaFotovoltaico() {
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState("");
  const [regione, setRegione] = useState("");
  const [stato, setStato] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { data: immobili = [], isLoading } = trpc.immobiliFotovoltaico.lista.useQuery({
    tipo: (tipo as "capannone" | "terreno") || undefined,
    regione: regione || undefined,
  });

  const hasFilters = tipo || regione || stato || q;
  const resetFilters = () => { setQ(""); setTipo(""); setRegione(""); setStato(""); };

  // Statistiche rapide
  const stats = useMemo(() => {
    const totale = immobili.length;
    const capannoni = immobili.filter((i: any) => i.tipo === "capannone").length;
    const terreni = immobili.filter((i: any) => i.tipo === "terreno").length;
    const disponibili = immobili.filter((i: any) => i.disponibilita === "disponibile").length;
    return { totale, capannoni, terreni, disponibili };
  }, [immobili]);

  const filteredImmobili = useMemo(() => {
    return immobili.filter((i: any) => {
      if (q && !i.indirizzo?.toLowerCase().includes(q.toLowerCase()) && !i.comune?.toLowerCase().includes(q.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [immobili, q]);

  return (
    <div className="min-h-screen bg-[#0a2015] text-white">
      {/* Header */}
      <div className="bg-[#0e2a1a] border-b border-white/10 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <button className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm">
              <ChevronLeft className="w-4 h-4" />
              Home
            </button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-black text-white">Opportunità Fotovoltaico</h1>
            <p className="text-white/50 text-xs">Terreni e capannoni disponibili per impianti solari</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#0e3320] rounded-2xl p-4 border border-white/10 text-center">
            <p className="text-3xl font-black text-[#4ade80]">{stats.totale}</p>
            <p className="text-white/50 text-xs mt-1">Immobili nel DB</p>
          </div>
          <div className="bg-[#0e3320] rounded-2xl p-4 border border-white/10 text-center">
            <p className="text-3xl font-black text-blue-400">{stats.capannoni}</p>
            <p className="text-white/50 text-xs mt-1">Capannoni</p>
          </div>
          <div className="bg-[#0e3320] rounded-2xl p-4 border border-white/10 text-center">
            <p className="text-3xl font-black text-yellow-400">{stats.terreni}</p>
            <p className="text-white/50 text-xs mt-1">Terreni</p>
          </div>
          <div className="bg-[#0e3320] rounded-2xl p-4 border border-white/10 text-center">
            <p className="text-3xl font-black text-[#4ade80]">{stats.disponibili}</p>
            <p className="text-white/50 text-xs mt-1">Disponibili</p>
          </div>
        </div>

        {/* Barra di ricerca */}
        <div className="bg-[#0e3320] rounded-2xl border border-white/10 p-5 mb-6">
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                className="w-full bg-[#0a2015] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#4ade80]/50 text-sm"
                placeholder="Cerca per indirizzo o comune..."
                value={q}
                onChange={e => setQ(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-colors ${showFilters ? "bg-[#4ade80]/20 border-[#4ade80]/50 text-[#4ade80]" : "border-white/20 text-white/60 hover:text-white hover:border-white/40"}`}
            >
              <Filter className="w-4 h-4" />
              Filtri {hasFilters ? <span className="bg-[#f5c518] text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-black">!</span> : null}
            </button>
            {hasFilters && (
              <button onClick={resetFilters} className="flex items-center gap-1 px-3 py-3 rounded-xl border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 transition-colors">
                <X className="w-4 h-4" /> Reset
              </button>
            )}
          </div>

          {/* Filtri espandibili */}
          {showFilters && (
            <div className="mt-4 grid sm:grid-cols-3 gap-4 pt-4 border-t border-white/10">
              <div>
                <label className="text-white/50 text-xs mb-1 block">Tipo</label>
                <select
                  className="w-full bg-[#0a2015] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#4ade80]/50"
                  value={tipo}
                  onChange={e => setTipo(e.target.value)}
                >
                  <option value="">Tutti i tipi</option>
                  <option value="capannone">Capannone</option>
                  <option value="terreno">Terreno</option>
                </select>
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1 block">Regione</label>
                <select
                  className="w-full bg-[#0a2015] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#4ade80]/50"
                  value={regione}
                  onChange={e => setRegione(e.target.value)}
                >
                  <option value="">Tutte le regioni</option>
                  {REGIONI.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1 block">Stato</label>
                <select
                  className="w-full bg-[#0a2015] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#4ade80]/50"
                  value={stato}
                  onChange={e => setStato(e.target.value)}
                >
                  <option value="">Tutti gli stati</option>
                  {STATI.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Lista immobili */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#4ade80]" />
          </div>
        ) : filteredImmobili.length === 0 ? (
          <div className="text-center py-20">
            <Home className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/50 text-lg font-semibold">Nessun immobile trovato</p>
            <p className="text-white/30 text-sm mt-2">
              {hasFilters ? "Prova a modificare i filtri di ricerca" : "Il database è ancora vuoto. Gli immobili vengono aggiunti dall'amministratore."}
            </p>
          </div>
        ) : (
          <>
            <p className="text-white/40 text-sm mb-4">{filteredImmobili.length} immobili trovati</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredImmobili.map((imm: any) => {
                const statoInfo = STATI.find(s => s.value === imm.disponibilita);
                return (
                  <div key={imm.id} className="bg-[#0e3320] rounded-2xl border border-white/10 p-5 hover:border-[#4ade80]/30 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Zap className={`w-4 h-4 flex-shrink-0 ${imm.tipo === "capannone" ? "text-blue-400" : "text-yellow-400"}`} />
                          <span className="text-white/60 text-xs font-semibold uppercase">{imm.tipo}</span>
                        </div>
                        {imm.indirizzo && <h3 className="text-white font-black text-base leading-tight truncate">{imm.indirizzo}</h3>}
                      </div>
                      {statoInfo && <span className={`text-xs px-2 py-1 rounded-full font-semibold bg-white/5 ${statoInfo.color}`}>{statoInfo.label}</span>}
                    </div>

                    <div className="space-y-1.5 text-sm">
                      {(imm.comune || imm.provincia || imm.regione) && (
                        <div className="flex items-center gap-2 text-white/60">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{[imm.comune, imm.provincia, imm.regione].filter(Boolean).join(", ")}</span>
                        </div>
                      )}

                      {/* Dimensioni */}
                      <div className="flex gap-2 text-xs text-white/50">
                        {imm.tipo === "capannone" && imm.superficieMq && (
                          <span>📐 {imm.superficieMq.toLocaleString()} m²</span>
                        )}
                        {imm.tipo === "terreno" && imm.superficieEttari && (
                          <span>📐 {imm.superficieEttari} ettari</span>
                        )}
                      </div>

                      {/* Caratteristiche */}
                      <div className="flex gap-1 flex-wrap pt-1">
                        {imm.attivitaEnergivora && <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded">Energivora</span>}
                        {imm.vicinanzaAutostrada && <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">Vicino autostrada</span>}
                        {imm.vicinanzaAreaIndustriale && <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">Area industriale</span>}
                      </div>
                    </div>

                    {/* Prezzo */}
                    {imm.prezzoEuro && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <p className="text-white/50 text-xs">Prezzo</p>
                        <p className="text-[#4ade80] font-black text-lg">€ {parseFloat(imm.prezzoEuro).toLocaleString("it-IT", { maximumFractionDigits: 0 })}</p>
                      </div>
                    )}

                    {/* Contatti */}
                    {(imm.telefonoContatto || imm.emailContatto || imm.nomeContatto) && (
                      <div className="mt-3 pt-3 border-t border-white/10 space-y-1">
                        {imm.nomeContatto && <p className="text-xs text-white/60">{imm.nomeContatto}</p>}
                        {imm.telefonoContatto && (
                          <a href={`tel:${imm.telefonoContatto}`} className="text-xs text-[#4ade80] hover:text-[#4ade80]/80 transition-colors block">
                            📞 {imm.telefonoContatto}
                          </a>
                        )}
                        {imm.emailContatto && (
                          <a href={`mailto:${imm.emailContatto}`} className="text-xs text-[#4ade80] hover:text-[#4ade80]/80 transition-colors block truncate">
                            ✉️ {imm.emailContatto}
                          </a>
                        )}
                      </div>
                    )}

                    {imm.note && (
                      <p className="mt-2 text-xs text-white/30 italic line-clamp-2">{imm.note}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
