import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Search, MapPin, TrendingUp, Users, Phone, Mail, Globe, Building2, ChevronLeft, Filter, X } from "lucide-react";

const REGIONI = [
  "Abruzzo","Basilicata","Calabria","Campania","Emilia-Romagna","Friuli-Venezia Giulia",
  "Lazio","Liguria","Lombardia","Marche","Molise","Piemonte","Puglia","Sardegna","Sicilia",
  "Toscana","Trentino-Alto Adige","Umbria","Valle d'Aosta","Veneto"
];

const SETTORI = [
  "Impianti Fotovoltaici","Elettricista","Termoidraulico","Edile","Ingegneria Energetica",
  "Efficienza Energetica","Impianti Elettrici","Energie Rinnovabili","Altro"
];

const FASCE_FATTURATO = [
  { value: "sotto_100k", label: "Sotto €100.000", color: "text-white/60" },
  { value: "100k_500k", label: "€100.000 – €500.000", color: "text-[#4ade80]" },
  { value: "500k_1m",   label: "€500.000 – €1.000.000", color: "text-[#4ade80]" },
  { value: "1m_5m",     label: "€1.000.000 – €5.000.000", color: "text-[#f5c518]" },
  { value: "sopra_5m",  label: "Oltre €5.000.000", color: "text-[#f5c518]" },
];

const STATI_CONTATTO = [
  { value: "da_contattare",    label: "Da contattare",    bg: "bg-blue-500/20 text-blue-300" },
  { value: "contattato",       label: "Contattato",       bg: "bg-yellow-500/20 text-yellow-300" },
  { value: "interessato",      label: "C'è interesse",      bg: "bg-green-500/20 text-green-300" },
  { value: "cliente",          label: "Cliente",          bg: "bg-[#4ade80]/20 text-[#4ade80]" },
  { value: "non_interessato",  label: "Non c'è interesse",  bg: "bg-red-500/20 text-red-300" },
];

function fasciaLabel(v?: string | null) {
  return FASCE_FATTURATO.find(f => f.value === v)?.label ?? "—";
}
function fasciaColor(v?: string | null) {
  return FASCE_FATTURATO.find(f => f.value === v)?.color ?? "text-white/50";
}
function statoContattoBadge(v?: string | null) {
  const s = STATI_CONTATTO.find(s => s.value === v);
  return s ? <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${s.bg}`}>{s.label}</span> : null;
}

export default function CercaInstallatori() {
  const [q, setQ] = useState("");
  const [regione, setRegione] = useState("");
  const [settore, setSettore] = useState("");
  const [fasciaFatturato, setFasciaFatturato] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { data: installatori = [], isLoading } = trpc.prospectInstallatori.lista.useQuery({
    regione: regione || undefined,
    settore: settore || undefined,
    fasciaFatturato: fasciaFatturato || undefined,
    q: q || undefined,
  });

  const hasFilters = regione || settore || fasciaFatturato || q;
  const resetFilters = () => { setQ(""); setRegione(""); setSettore(""); setFasciaFatturato(""); };

  // Statistiche rapide
  const stats = useMemo(() => {
    const totale = installatori.length;
    const perRegione: Record<string, number> = {};
    installatori.forEach((i: any) => { if (i.regione) perRegione[i.regione] = (perRegione[i.regione] ?? 0) + 1; });
    const topRegione = Object.entries(perRegione).sort((a, b) => b[1] - a[1])[0];
    const clienti = installatori.filter((i: any) => i.statoContatto === "cliente").length;
    const interessati = installatori.filter((i: any) => i.statoContatto === "interessato").length;
    return { totale, topRegione, clienti, interessati };
  }, [installatori]);

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
            <h1 className="text-xl font-black text-white">Cerca Installatori Fotovoltaico</h1>
            <p className="text-white/50 text-xs">Database nazionale di installatori e aziende del settore</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#0e3320] rounded-2xl p-4 border border-white/10 text-center">
            <p className="text-3xl font-black text-[#4ade80]">{stats.totale}</p>
            <p className="text-white/50 text-xs mt-1">Installatori nel DB</p>
          </div>
          <div className="bg-[#0e3320] rounded-2xl p-4 border border-white/10 text-center">
            <p className="text-3xl font-black text-[#f5c518]">{stats.clienti}</p>
            <p className="text-white/50 text-xs mt-1">Già clienti</p>
          </div>
          <div className="bg-[#0e3320] rounded-2xl p-4 border border-white/10 text-center">
            <p className="text-3xl font-black text-blue-400">{stats.interessati}</p>
            <p className="text-white/50 text-xs mt-1">Interessati</p>
          </div>
          <div className="bg-[#0e3320] rounded-2xl p-4 border border-white/10 text-center">
            <p className="text-lg font-black text-white truncate">{stats.topRegione ? stats.topRegione[0] : "—"}</p>
            <p className="text-white/50 text-xs mt-1">Regione top {stats.topRegione ? `(${stats.topRegione[1]})` : ""}</p>
          </div>
        </div>

        {/* Barra di ricerca */}
        <div className="bg-[#0e3320] rounded-2xl border border-white/10 p-5 mb-6">
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                className="w-full bg-[#0a2015] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#4ade80]/50 text-sm"
                placeholder="Cerca per ragione sociale..."
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
                <label className="text-white/50 text-xs mb-1 block">Settore</label>
                <select
                  className="w-full bg-[#0a2015] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#4ade80]/50"
                  value={settore}
                  onChange={e => setSettore(e.target.value)}
                >
                  <option value="">Tutti i settori</option>
                  {SETTORI.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1 block">Fascia di fatturato</label>
                <select
                  className="w-full bg-[#0a2015] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#4ade80]/50"
                  value={fasciaFatturato}
                  onChange={e => setFasciaFatturato(e.target.value)}
                >
                  <option value="">Tutte le fasce</option>
                  {FASCE_FATTURATO.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Lista installatori */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#0e3320] rounded-2xl border border-white/10 p-5 animate-pulse">
                <div className="h-5 bg-white/10 rounded mb-3 w-3/4" />
                <div className="h-3 bg-white/5 rounded mb-2 w-1/2" />
                <div className="h-3 bg-white/5 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : installatori.length === 0 ? (
          <div className="text-center py-20">
            <Building2 className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/50 text-lg font-semibold">Nessun installatore trovato</p>
            <p className="text-white/30 text-sm mt-2">
              {hasFilters ? "Prova a modificare i filtri di ricerca" : "Il database è ancora vuoto. Gli installatori vengono aggiunti dall'amministratore."}
            </p>
          </div>
        ) : (
          <>
            <p className="text-white/40 text-sm mb-4">{installatori.length} installatori trovati</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {installatori.map((inst: any) => (
                <div key={inst.id} className="bg-[#0e3320] rounded-2xl border border-white/10 p-5 hover:border-[#4ade80]/30 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-black text-base leading-tight truncate">{inst.ragioneSociale}</h3>
                      {inst.settore && <p className="text-[#4ade80] text-xs font-semibold mt-0.5">{inst.settore}</p>}
                    </div>
                    {statoContattoBadge(inst.statoContatto)}
                  </div>

                  <div className="space-y-1.5 text-sm">
                    {(inst.regione || inst.comune) && (
                      <div className="flex items-center gap-2 text-white/60">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{[inst.comune, inst.provincia, inst.regione].filter(Boolean).join(", ")}</span>
                      </div>
                    )}
                    {inst.fasciaFatturato && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-3.5 h-3.5 flex-shrink-0 text-white/40" />
                        <span className={`text-xs font-semibold ${fasciaColor(inst.fasciaFatturato)}`}>{fasciaLabel(inst.fasciaFatturato)}</span>
                      </div>
                    )}
                    {inst.dipendenti && (
                      <div className="flex items-center gap-2 text-white/50">
                        <Users className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="text-xs">{inst.dipendenti} dipendenti</span>
                      </div>
                    )}
                  </div>

                  {/* Contatti */}
                  <div className="mt-3 pt-3 border-t border-white/10 flex gap-3">
                    {inst.telefono && (
                      <a href={`tel:${inst.telefono}`} className="flex items-center gap-1 text-xs text-white/50 hover:text-[#4ade80] transition-colors">
                        <Phone className="w-3 h-3" /> {inst.telefono}
                      </a>
                    )}
                    {inst.email && (
                      <a href={`mailto:${inst.email}`} className="flex items-center gap-1 text-xs text-white/50 hover:text-[#4ade80] transition-colors truncate">
                        <Mail className="w-3 h-3" /> {inst.email}
                      </a>
                    )}
                    {inst.sito && (
                      <a href={inst.sito} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-white/50 hover:text-[#4ade80] transition-colors">
                        <Globe className="w-3 h-3" /> Sito
                      </a>
                    )}
                  </div>

                  {inst.note && (
                    <p className="mt-2 text-xs text-white/30 italic line-clamp-2">{inst.note}</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
