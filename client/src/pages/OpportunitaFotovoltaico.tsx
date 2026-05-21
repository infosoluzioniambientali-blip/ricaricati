import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  Search, MapPin, Zap, ChevronLeft, Filter, X,
  Building2, TreePine, Factory, Truck, Sun, Phone, Mail, ChevronDown, ChevronUp
} from "lucide-react";

const REGIONI = [
  "Abruzzo","Basilicata","Calabria","Campania","Emilia-Romagna","Friuli-Venezia Giulia",
  "Lazio","Liguria","Lombardia","Marche","Molise","Piemonte","Puglia","Sardegna","Sicilia",
  "Toscana","Trentino-Alto Adige","Umbria","Valle d'Aosta","Veneto"
];

const DISPONIBILITA_BADGE: Record<string, string> = {
  vendita:     "bg-blue-500/20 text-blue-300",
  affitto:     "bg-purple-500/20 text-purple-300",
  disponibile: "bg-[#4ade80]/20 text-[#4ade80]",
  trattativa:  "bg-yellow-500/20 text-yellow-300",
};
const DISPONIBILITA_LABEL: Record<string, string> = {
  vendita: "In vendita", affitto: "In affitto", disponibile: "Disponibile", trattativa: "In trattativa",
};

function formatSuperficie(item: any) {
  if (item.tipo === "capannone" && item.superficieMq) return `${Number(item.superficieMq).toLocaleString("it-IT")} m²`;
  if (item.tipo === "terreno" && item.superficieEttari) return `${Number(item.superficieEttari).toLocaleString("it-IT")} ha`;
  return "—";
}

function CardImmobile({ item }: { item: any }) {
  const [expanded, setExpanded] = useState(false);
  const isCapannone = item.tipo === "capannone";

  return (
    <div className="bg-[#0e3320] rounded-2xl border border-white/10 overflow-hidden hover:border-[#4ade80]/30 transition-colors">
      {/* Header card */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isCapannone ? "bg-blue-500/20" : "bg-[#4ade80]/10"}`}>
              {isCapannone ? <Building2 className="w-4 h-4 text-blue-400" /> : <TreePine className="w-4 h-4 text-[#4ade80]" />}
            </div>
            <div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isCapannone ? "bg-blue-500/20 text-blue-300" : "bg-[#4ade80]/20 text-[#4ade80]"}`}>
                {isCapannone ? "Capannone" : "Terreno"}
              </span>
            </div>
          </div>
          {item.disponibilita && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${DISPONIBILITA_BADGE[item.disponibilita] ?? "bg-white/10 text-white/50"}`}>
              {DISPONIBILITA_LABEL[item.disponibilita] ?? item.disponibilita}
            </span>
          )}
        </div>

        <h3 className="text-white font-black text-base leading-tight mb-2">{item.titolo}</h3>

        {(item.regione || item.comune) && (
          <div className="flex items-center gap-1.5 text-white/60 text-sm mb-3">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{[item.comune, item.provincia, item.regione].filter(Boolean).join(", ")}</span>
          </div>
        )}

        {/* Metriche principali */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-[#0a2015] rounded-xl p-3 border border-white/5">
            <p className="text-white/40 text-xs mb-0.5">Superficie</p>
            <p className="text-white font-bold text-sm">{formatSuperficie(item)}</p>
          </div>
          {item.potenzaStimataKwp && (
            <div className="bg-[#0a2015] rounded-xl p-3 border border-[#f5c518]/20">
              <p className="text-white/40 text-xs mb-0.5">Potenza stimata</p>
              <p className="text-[#f5c518] font-bold text-sm">{Number(item.potenzaStimataKwp).toLocaleString("it-IT")} kWp</p>
            </div>
          )}
        </div>

        {/* Badge caratteristiche */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {isCapannone && item.attivitaEnergivora && (
            <span className="flex items-center gap-1 text-xs bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full">
              <Factory className="w-3 h-3" /> Attività energivora{item.tipoAttivita ? `: ${item.tipoAttivita}` : ""}
            </span>
          )}
          {!isCapannone && item.vicinanzaAutostrada && (
            <span className="flex items-center gap-1 text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">
              <Truck className="w-3 h-3" /> Vicino autostrada{item.distanzaAutostradaKm ? ` (${item.distanzaAutostradaKm} km)` : ""}
            </span>
          )}
          {!isCapannone && item.vicinanzaAreaIndustriale && (
            <span className="flex items-center gap-1 text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
              <Factory className="w-3 h-3" /> Zona industriale{item.distanzaAreaIndustrialeKm ? ` (${item.distanzaAreaIndustrialeKm} km)` : ""}
            </span>
          )}
          {item.prezzoEuro && (
            <span className="flex items-center gap-1 text-xs bg-[#f5c518]/20 text-[#f5c518] px-2 py-0.5 rounded-full font-bold">
              €{Number(item.prezzoEuro).toLocaleString("it-IT")}
            </span>
          )}
        </div>

        {/* Espandi/comprimi */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? "Meno dettagli" : "Più dettagli"}
        </button>
      </div>

      {/* Dettagli espansi */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-white/10 pt-4 space-y-3">
          {item.indirizzo && (
            <p className="text-white/50 text-xs"><span className="text-white/30">Indirizzo:</span> {item.indirizzo}</p>
          )}
          {item.note && (
            <p className="text-white/60 text-xs italic">{item.note}</p>
          )}
          {/* Contatti */}
          {(item.nomeContatto || item.telefonoContatto || item.emailContatto) && (
            <div className="bg-[#0a2015] rounded-xl p-3 border border-white/5">
              <p className="text-white/40 text-xs font-semibold mb-2">Contatto</p>
              {item.nomeContatto && <p className="text-white text-sm font-semibold">{item.nomeContatto}</p>}
              <div className="flex gap-3 mt-1 flex-wrap">
                {item.telefonoContatto && (
                  <a href={`tel:${item.telefonoContatto}`} className="flex items-center gap-1 text-xs text-[#4ade80] hover:underline">
                    <Phone className="w-3 h-3" /> {item.telefonoContatto}
                  </a>
                )}
                {item.emailContatto && (
                  <a href={`mailto:${item.emailContatto}`} className="flex items-center gap-1 text-xs text-[#4ade80] hover:underline">
                    <Mail className="w-3 h-3" /> {item.emailContatto}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OpportunitaFotovoltaico() {
  const [tipo, setTipo] = useState<"" | "capannone" | "terreno">("");
  const [regione, setRegione] = useState("");
  const [attivitaEnergivora, setAttivitaEnergivora] = useState(false);
  const [vicinanzaAutostrada, setVicinanzaAutostrada] = useState(false);
  const [vicinanzaAreaIndustriale, setVicinanzaAreaIndustriale] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const { data: immobili = [], isLoading } = trpc.immobiliFotovoltaico.lista.useQuery({
    tipo: tipo || undefined,
    regione: regione || undefined,
    attivitaEnergivora: attivitaEnergivora || undefined,
    vicinanzaAutostrada: vicinanzaAutostrada || undefined,
    vicinanzaAreaIndustriale: vicinanzaAreaIndustriale || undefined,
  });

  const capannoni = immobili.filter((i: any) => i.tipo === "capannone");
  const terreni = immobili.filter((i: any) => i.tipo === "terreno");
  const hasFilters = tipo || regione || attivitaEnergivora || vicinanzaAutostrada || vicinanzaAreaIndustriale;

  const resetFilters = () => {
    setTipo(""); setRegione("");
    setAttivitaEnergivora(false); setVicinanzaAutostrada(false); setVicinanzaAreaIndustriale(false);
  };

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
            <p className="text-white/50 text-xs">Capannoni e terreni per impianti fotovoltaici in Italia</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Intro */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-900/40 to-[#0e3320] rounded-2xl border border-blue-500/20 p-5">
            <div className="flex items-center gap-3 mb-3">
              <Building2 className="w-8 h-8 text-blue-400" />
              <div>
                <h3 className="text-white font-black">Capannoni Industriali</h3>
                <p className="text-blue-300 text-xs">Da 2.000 m² in su</p>
              </div>
            </div>
            <p className="text-white/60 text-sm">Ideali per impianti da 200 kWp+. Priorità a strutture con attività energivore (fonderie, ceramiche, industrie) che massimizzano l'autoconsumo.</p>
          </div>
          <div className="bg-gradient-to-br from-green-900/40 to-[#0e3320] rounded-2xl border border-[#4ade80]/20 p-5">
            <div className="flex items-center gap-3 mb-3">
              <TreePine className="w-8 h-8 text-[#4ade80]" />
              <div>
                <h3 className="text-white font-black">Terreni Agricoli</h3>
                <p className="text-[#4ade80] text-xs">Vicino autostrade/aree industriali: 1,5+ ha · Aperti: 8+ ha</p>
              </div>
            </div>
            <p className="text-white/60 text-sm">Terreni strategici per impianti agrivoltaici e utility-scale. Priorità a posizioni vicine a cabine elettriche e infrastrutture esistenti.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-[#0e3320] rounded-2xl p-4 border border-white/10 text-center">
            <p className="text-3xl font-black text-white">{immobili.length}</p>
            <p className="text-white/50 text-xs mt-1">Opportunità totali</p>
          </div>
          <div className="bg-[#0e3320] rounded-2xl p-4 border border-blue-500/20 text-center">
            <p className="text-3xl font-black text-blue-400">{capannoni.length}</p>
            <p className="text-white/50 text-xs mt-1">Capannoni</p>
          </div>
          <div className="bg-[#0e3320] rounded-2xl p-4 border border-[#4ade80]/20 text-center">
            <p className="text-3xl font-black text-[#4ade80]">{terreni.length}</p>
            <p className="text-white/50 text-xs mt-1">Terreni</p>
          </div>
        </div>

        {/* Filtri */}
        <div className="bg-[#0e3320] rounded-2xl border border-white/10 p-5 mb-6">
          <div className="flex gap-3 flex-wrap items-center">
            {/* Toggle tipo */}
            <div className="flex gap-2">
              {(["", "capannone", "terreno"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTipo(t)}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${tipo === t ? "bg-[#4ade80] text-[#0a2015]" : "border border-white/20 text-white/60 hover:text-white"}`}
                >
                  {t === "" ? "Tutti" : t === "capannone" ? "Capannoni" : "Terreni"}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-colors ${showFilters ? "bg-[#4ade80]/20 border-[#4ade80]/50 text-[#4ade80]" : "border-white/20 text-white/60 hover:text-white"}`}
            >
              <Filter className="w-4 h-4" />
              Filtri avanzati
            </button>
            {hasFilters && (
              <button onClick={resetFilters} className="flex items-center gap-1 px-3 py-2 rounded-xl border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 transition-colors">
                <X className="w-4 h-4" /> Reset
              </button>
            )}
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-white/10 grid sm:grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <label className="text-white/50 text-xs block">Caratteristiche speciali</label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={attivitaEnergivora} onChange={e => setAttivitaEnergivora(e.target.checked)} className="accent-[#4ade80]" />
                  <span className="text-white/70 text-sm flex items-center gap-1"><Factory className="w-3.5 h-3.5 text-orange-400" /> Attività energivora (capannoni)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={vicinanzaAutostrada} onChange={e => setVicinanzaAutostrada(e.target.checked)} className="accent-[#4ade80]" />
                  <span className="text-white/70 text-sm flex items-center gap-1"><Truck className="w-3.5 h-3.5 text-blue-400" /> Vicino autostrada (terreni)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={vicinanzaAreaIndustriale} onChange={e => setVicinanzaAreaIndustriale(e.target.checked)} className="accent-[#4ade80]" />
                  <span className="text-white/70 text-sm flex items-center gap-1"><Factory className="w-3.5 h-3.5 text-purple-400" /> Vicino area industriale (terreni)</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Lista */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#0e3320] rounded-2xl border border-white/10 p-5 animate-pulse h-48">
                <div className="h-5 bg-white/10 rounded mb-3 w-3/4" />
                <div className="h-3 bg-white/5 rounded mb-2 w-1/2" />
                <div className="h-3 bg-white/5 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : immobili.length === 0 ? (
          <div className="text-center py-20">
            <Sun className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/50 text-lg font-semibold">Nessuna opportunità disponibile</p>
            <p className="text-white/30 text-sm mt-2">
              {hasFilters ? "Prova a modificare i filtri" : "Le opportunità vengono aggiunte dall'amministratore. Torna presto!"}
            </p>
          </div>
        ) : (
          <>
            {/* Capannoni */}
            {(tipo === "" || tipo === "capannone") && capannoni.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <Building2 className="w-5 h-5 text-blue-400" />
                  <h2 className="text-lg font-black text-white">Capannoni Industriali</h2>
                  <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">{capannoni.length}</span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {capannoni.map((item: any) => <CardImmobile key={item.id} item={item} />)}
                </div>
              </div>
            )}

            {/* Terreni */}
            {(tipo === "" || tipo === "terreno") && terreni.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <TreePine className="w-5 h-5 text-[#4ade80]" />
                  <h2 className="text-lg font-black text-white">Terreni per Fotovoltaico</h2>
                  <span className="text-xs bg-[#4ade80]/20 text-[#4ade80] px-2 py-0.5 rounded-full">{terreni.length}</span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {terreni.map((item: any) => <CardImmobile key={item.id} item={item} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
