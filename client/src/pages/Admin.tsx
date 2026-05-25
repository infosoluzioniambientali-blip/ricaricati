import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { Zap, ArrowLeft, BarChart3, Users, ShoppingCart, FileText,
  CheckCircle, XCircle, Clock, LogIn, Filter, Download, Plus,
  Pencil, Trash2, ChevronDown, ChevronRight, DatabaseBackup, KeyRound, UploadCloud, Package,
  Trophy, Medal, ChevronUp, Building2, TreePine, MapPin, TrendingUp, Globe, Phone, Mail, Factory, Truck, Sun, FileDown,
  UserPlus, Target, Zap as ZapIcon, Gift, Tag, Send, RefreshCw, AlertCircle, MessageCircle, Search, RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { ITER_DEFINIZIONI, TIPI_ITER_OPTIONS, type TipoIter, type DocumentoRichiesto } from "@shared/iter";
import { LISTINO } from "../../../shared/listino";
import ProspectInstallatoriTab from "@/components/ProspectInstallatoriTab";


type TabType = "statistiche" | "installatori" | "ordini" | "pratiche" | "pack" | "corsa" | "backup" | "documenti" | "crm" | "pec" | "ordini_probabili" | "corsa_100k" | "credito" | "premi" | "bollette";

// ─── COMPONENTE ORDINI PROBABILI ─────────────────────────────────────────────
// ─── COMPONENTE DROPDOWN PRODOTTO ─────────────────────────────────────────────
function ProdottoDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { data: pacchetti = { standard: [], personalizzati: [], promo: [] }, isLoading, error } = trpc.prospectInstallatori.getPackettiPerOrdiniProbabili.useQuery({ installatoreId: undefined });
  
  React.useEffect(() => {
    if (error) {
      console.error("[ProdottoDropdown] Errore caricamento pacchetti:", error);
    }
  }, [error]);
  
  // Fallback: se la query fallisce, mostra comunque i pacchetti standard
  const displayPacketti = (pacchetti && (pacchetti.standard?.length > 0 || pacchetti.personalizzati?.length > 0 || pacchetti.promo?.length > 0))
    ? pacchetti
    : { standard: [{ id: "pack1", nome: "Pack 1", prezzo: "2000" }, { id: "pack2", nome: "Pack 2", prezzo: "3150" }, { id: "pack3", nome: "Pack 3", prezzo: "5100" }], personalizzati: [], promo: [] };
  
  if (error && !displayPacketti.standard.length) {
    return (
      <select disabled className="w-full bg-[#1a4a2e] border border-red-500/50 text-white rounded-lg px-3 py-2 text-sm">
        <option>Errore caricamento</option>
      </select>
    );
  }
  
  return (
    <select value={value} onChange={e => onChange(e.target.value)} disabled={isLoading} className="w-full bg-[#1a4a2e] border border-white/20 text-white rounded-lg px-3 py-2 text-sm disabled:opacity-50">
      <option value="">{isLoading ? "Caricamento..." : "Seleziona pacchetto..."}</option>
      {displayPacketti?.standard && displayPacketti.standard.length > 0 && (
        <optgroup label="── Pack Standard ──">
          {displayPacketti.standard.map((p: any) => <option key={p.id} value={p.nome}>{p.nome} - €{p.prezzo}</option>)}
        </optgroup>
      )}
      {displayPacketti?.personalizzati && displayPacketti.personalizzati.length > 0 && (
        <optgroup label="── Pack Personalizzati ──">
          {displayPacketti.personalizzati.map((p: any) => <option key={p.id} value={p.nome}>{p.nome} - €{p.prezzo}</option>)}
        </optgroup>
      )}
      {displayPacketti?.promo && displayPacketti.promo.length > 0 && (
        <optgroup label="── Pacchetti Promo ──">
          {displayPacketti.promo.map((p: any) => <option key={p.id} value={p.nome}>🏷 {p.nome}{p.prezzo ? ` — €${Number(p.prezzo).toLocaleString("it-IT")}` : ""}</option>)}
        </optgroup>
      )}
    </select>
  );
}

function OrdiniProbabiliTab() {
  const utils = trpc.useUtils();
  const { data: ordini = [], isLoading } = trpc.prospectInstallatori.getOrdiniProbabili.useQuery({ prospectId: undefined });
  const { data: prospects = [] } = trpc.prospectInstallatori.lista.useQuery(undefined);
  const [showForm, setShowForm] = React.useState(false);
  const [editId, setEditId] = React.useState<number | null>(null);
  const [form, setForm] = React.useState({ prospectId: 0, prodotto: "", importoStimato: "", probabilita: 50, stato: "bozza" as string, scadenza: "", note: "" });

  const crea = trpc.prospectInstallatori.creaOrdineProbabile.useMutation({ 
    onSuccess: () => { 
      utils.prospectInstallatori.getOrdiniProbabili.invalidate(); 
      setShowForm(false); 
      setForm({ prospectId: 0, prodotto: "", importoStimato: "", probabilita: 50, stato: "bozza", scadenza: "", note: "" }); 
    },
    onError: (error) => {
      console.error("Errore salvataggio ordine:", error.message);
    }
  });
  const modifica = trpc.prospectInstallatori.modificaOrdineProbabile.useMutation({ onSuccess: () => { utils.prospectInstallatori.getOrdiniProbabili.invalidate(); setEditId(null); } });
  const elimina = trpc.prospectInstallatori.eliminaOrdineProbabile.useMutation({ onSuccess: () => utils.prospectInstallatori.getOrdiniProbabili.invalidate() });

  const STATI_COLORI: Record<string, string> = { bozza: "bg-white/20 text-white/60", proposta: "bg-blue-500/20 text-blue-300", trattativa: "bg-yellow-500/20 text-yellow-300", accettato: "bg-green-500/20 text-green-300", rifiutato: "bg-red-500/20 text-red-300" };

  const totaleStimato = ordini.reduce((acc: number, o: any) => acc + (parseFloat(o.importoStimato || "0") * (o.probabilita || 50) / 100), 0);
  const totaleNominale = ordini.reduce((acc: number, o: any) => acc + parseFloat(o.importoStimato || "0"), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-[#f5c518]">Ordini Probabili</h2>
          <p className="text-white/40 text-sm mt-1">Preventivi e trattative in corso con i prospect installatori</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-[#f5c518] text-[#1a4a2e] font-bold px-4 py-2 rounded-lg text-sm hover:bg-[#f5c518]/90 transition-colors">
          <Plus className="w-4 h-4" /> Nuovo Ordine
        </button>
      </div>

      {/* Riepilogo */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#0e3320] border border-white/10 rounded-xl p-4">
          <div className="text-white/50 text-xs mb-1">Totale Ordini</div>
          <div className="text-xl sm:text-2xl font-black text-white truncate">{ordini.length}</div>
        </div>
        <div className="bg-[#0e3320] border border-white/10 rounded-xl p-4">
          <div className="text-white/50 text-xs mb-1">Valore Nominale</div>
          <div className="text-lg sm:text-2xl font-black text-[#f5c518] truncate">€{totaleNominale.toLocaleString("it-IT", { maximumFractionDigits: 0 })}</div>
        </div>
        <div className="bg-[#0e3320] border border-white/10 rounded-xl p-4">
          <div className="text-white/50 text-xs mb-1">Valore Ponderato</div>
          <div className="text-lg sm:text-2xl font-black text-green-400 truncate">€{totaleStimato.toLocaleString("it-IT", { maximumFractionDigits: 0 })}</div>
        </div>
      </div>

      {/* Form nuovo ordine */}
      {showForm && (
        <div className="bg-[#0e3320] border border-[#f5c518]/30 rounded-xl p-5 space-y-4">
          <h3 className="text-[#f5c518] font-bold">Nuovo Ordine Probabile</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/60 text-xs mb-1 block">Prospect *</label>
              <select value={form.prospectId} onChange={e => setForm(f => ({ ...f, prospectId: Number(e.target.value) }))} className="w-full bg-[#1a4a2e] border border-white/20 text-white rounded-lg px-3 py-2 text-sm">
                <option value={0}>Seleziona prospect...</option>
                {(prospects as any[]).map((p: any) => <option key={p.id} value={p.id}>{p.ragioneSociale}</option>)}
              </select>
            </div>
            <div>
              <label className="text-white/60 text-xs mb-1 block">Prodotto *</label>
              <ProdottoDropdown value={form.prodotto} onChange={(v) => setForm(f => ({ ...f, prodotto: v }))} />
            </div>
            <div>
              <label className="text-white/60 text-xs mb-1 block">Importo Stimato (€)</label>
              <input type="number" value={form.importoStimato} onChange={e => setForm(f => ({ ...f, importoStimato: e.target.value }))} placeholder="0" className="w-full bg-[#1a4a2e] border border-white/20 text-white rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-white/60 text-xs mb-1 block">Probabilità %</label>
              <input type="number" min={0} max={100} value={form.probabilita} onChange={e => setForm(f => ({ ...f, probabilita: Number(e.target.value) }))} className="w-full bg-[#1a4a2e] border border-white/20 text-white rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-white/60 text-xs mb-1 block">Stato</label>
              <select value={form.stato} onChange={e => setForm(f => ({ ...f, stato: e.target.value }))} className="w-full bg-[#1a4a2e] border border-white/20 text-white rounded-lg px-3 py-2 text-sm">
                {["bozza","proposta","trattativa","accettato","rifiutato"].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-white/60 text-xs mb-1 block">Scadenza</label>
              <input type="date" value={form.scadenza} onChange={e => setForm(f => ({ ...f, scadenza: e.target.value }))} className="w-full bg-[#1a4a2e] border border-white/20 text-white rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="col-span-2">
              <label className="text-white/60 text-xs mb-1 block">Note</label>
              <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} rows={2} className="w-full bg-[#1a4a2e] border border-white/20 text-white rounded-lg px-3 py-2 text-sm placeholder:text-white/30" placeholder="Note aggiuntive..." />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-white/60 hover:text-white">Annulla</button>
            <button type="button" disabled={crea.isPending} onClick={(e) => { e.preventDefault(); if (form.prospectId <= 0 || !form.prodotto) { toast.error("Prospect e Prodotto sono obbligatori"); return; } crea.mutate({ prospectId: form.prospectId, prodotto: form.prodotto, importoStimato: form.importoStimato ? parseFloat(form.importoStimato) : undefined, probabilita: form.probabilita, stato: form.stato as any, scadenza: form.scadenza || undefined, note: form.note || undefined }); }} className="bg-[#f5c518] text-[#1a4a2e] font-bold px-4 py-2 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed">{crea.isPending ? "Salvo..." : "Salva"}</button>
          </div>
        </div>
      )}

      {/* Lista ordini */}
      {isLoading ? <div className="text-white/40 text-center py-8">Caricamento...</div> : ordini.length === 0 ? (
        <div className="text-center py-12 text-white/40">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nessun ordine probabile. Aggiungine uno per iniziare.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(ordini as any[]).map((o: any) => {
            const prospect = (prospects as any[]).find((p: any) => p.id === o.prospectId);
            const isEdit = editId === o.id;
            return (
              <div key={o.id} className="bg-[#0e3320] border border-white/10 rounded-xl p-4">
                {isEdit ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-white/60 text-xs mb-1 block">Prodotto</label><input defaultValue={o.prodotto} id={`ep-${o.id}`} className="w-full bg-[#1a4a2e] border border-white/20 text-white rounded-lg px-3 py-2 text-sm" /></div>
                      <div><label className="text-white/60 text-xs mb-1 block">Importo €</label><input type="number" defaultValue={parseFloat(o.importoStimato || "0")} id={`ei-${o.id}`} className="w-full bg-[#1a4a2e] border border-white/20 text-white rounded-lg px-3 py-2 text-sm" /></div>
                      <div><label className="text-white/60 text-xs mb-1 block">Probabilità %</label><input type="number" min={0} max={100} defaultValue={o.probabilita} id={`epr-${o.id}`} className="w-full bg-[#1a4a2e] border border-white/20 text-white rounded-lg px-3 py-2 text-sm" /></div>
                      <div><label className="text-white/60 text-xs mb-1 block">Stato</label><select defaultValue={o.stato} id={`es-${o.id}`} className="w-full bg-[#1a4a2e] border border-white/20 text-white rounded-lg px-3 py-2 text-sm">{["bozza","proposta","trattativa","accettato","rifiutato"].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}</select></div>
                      <div className="col-span-2"><label className="text-white/60 text-xs mb-1 block">Note</label><textarea defaultValue={o.note || ""} id={`en-${o.id}`} rows={2} className="w-full bg-[#1a4a2e] border border-white/20 text-white rounded-lg px-3 py-2 text-sm" /></div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditId(null)} className="px-3 py-1 text-sm text-white/60 hover:text-white">Annulla</button>
                      <button onClick={() => { modifica.mutate({ id: o.id, prodotto: (document.getElementById(`ep-${o.id}`) as HTMLInputElement)?.value, importoStimato: parseFloat((document.getElementById(`ei-${o.id}`) as HTMLInputElement)?.value || "0"), probabilita: parseInt((document.getElementById(`epr-${o.id}`) as HTMLInputElement)?.value || "50"), stato: (document.getElementById(`es-${o.id}`) as HTMLSelectElement)?.value as any, note: (document.getElementById(`en-${o.id}`) as HTMLTextAreaElement)?.value }); }} className="bg-[#f5c518] text-[#1a4a2e] font-bold px-3 py-1 rounded-lg text-sm">Salva</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Nome prospect ben visibile */}
                      <div className="text-[#f5c518] font-black text-base mb-1">{prospect?.ragioneSociale || `Prospect #${o.prospectId}`}</div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATI_COLORI[o.stato] || "bg-white/10 text-white/60"}`}>{o.stato}</span>
                        {prospect?.telefono && <span className="text-white/40 text-xs flex items-center gap-1"><Phone className="w-3 h-3" />{prospect.telefono}</span>}
                      </div>
                      <div className="font-bold text-white">{o.prodotto}</div>
                      <div className="flex items-center gap-4 mt-1 text-sm">
                        <span className="text-[#f5c518]">€{parseFloat(o.importoStimato || "0").toLocaleString("it-IT")}</span>
                        <span className="text-white/50">Prob. {o.probabilita}%</span>
                        <span className="text-green-400">Pond. €{(parseFloat(o.importoStimato || "0") * (o.probabilita || 50) / 100).toLocaleString("it-IT", { maximumFractionDigits: 0 })}</span>
                        {o.scadenza && <span className="text-white/40 text-xs">Scade {new Date(o.scadenza).toLocaleDateString("it-IT")}</span>}
                      </div>
                      {o.note && <p className="text-white/40 text-xs mt-1 truncate">{o.note}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => setEditId(o.id)} className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { if (confirm("Eliminare questo ordine?")) elimina.mutate({ id: o.id }); }} className="p-1.5 text-red-400 hover:bg-red-400/10 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── CRM PROSPECT INSTALLATORI — KANBAN + SCORING + WHATSAPP ────────────────
function ProspectListaTab() {
  const utils = trpc.useUtils();
  const { data: prospects = [], isLoading } = trpc.prospectInstallatori.lista.useQuery(undefined);
  const [vista, setVista] = React.useState<"lista"|"kanban">("lista");
  const [showForm, setShowForm] = React.useState(false);
  const [editId, setEditId] = React.useState<number | null>(null);
  const [search, setSearch] = React.useState("");
  const [filtroStato, setFiltroStato] = React.useState("tutti");
  const [filtroRegione, setFiltroRegione] = React.useState("tutti");
  const [form, setForm] = React.useState({ ragioneSociale: "", telefono: "", email: "", comune: "", provincia: "", regione: "", settore: "fotovoltaico", statoContatto: "da_contattare" as string, note: "", fonte: "manuale", sito: "" });

  const crea = trpc.prospectInstallatori.crea.useMutation({ onSuccess: () => { utils.prospectInstallatori.lista.invalidate(); setShowForm(false); setForm({ ragioneSociale: "", telefono: "", email: "", comune: "", provincia: "", regione: "", settore: "fotovoltaico", statoContatto: "da_contattare", note: "", fonte: "manuale", sito: "" }); toast.success("Prospect aggiunto!"); } });
  const aggiorna = trpc.prospectInstallatori.aggiorna.useMutation({ onSuccess: () => { utils.prospectInstallatori.lista.invalidate(); setEditId(null); toast.success("Salvato"); } });
  const elimina = trpc.prospectInstallatori.elimina.useMutation({ onSuccess: () => { utils.prospectInstallatori.lista.invalidate(); toast.success("Eliminato"); } });
  const importaBulk = trpc.prospectInstallatori.importaBulk.useMutation({ onError: (e: any) => toast.error(e.message) });

  const STATI: Record<string, { label: string; colore: string; bg: string }> = {
    da_contattare:  { label: "Da contattare",  colore: "text-blue-400",   bg: "bg-blue-400/10 border-blue-400/20" },
    contattato:     { label: "Contattato",      colore: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20" },
    trattativa:     { label: "In trattativa",   colore: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/20" },
    interessato:    { label: "Interessato",     colore: "text-purple-400", bg: "bg-purple-400/10 border-purple-400/20" },
    accordo:        { label: "Accordo",         colore: "text-[#4ade80]",  bg: "bg-[#4ade80]/10 border-[#4ade80]/20" },
    cliente_attivo: { label: "Cliente attivo",  colore: "text-[#4ade80]",  bg: "bg-[#4ade80]/15 border-[#4ade80]/30" },
    non_interessato:{ label: "Non interessato", colore: "text-red-400",    bg: "bg-red-400/10 border-red-400/20" },
  };

  const KANBAN_COLS = ["da_contattare","contattato","trattativa","interessato","accordo","cliente_attivo"];

  // Scoring automatico prospect (0-100)
  const calcolaScore = (p: any): number => {
    let s = 0;
    if (p.telefono) s += 20;
    if (p.email) s += 20;
    if (p.sito) s += 10;
    if (p.settore === "fotovoltaico") s += 15;
    if (p.comune) s += 5;
    if (p.note && p.note.length > 20) s += 10;
    if (["trattativa","interessato","accordo"].includes(p.statoContatto)) s += 20;
    return Math.min(s, 100);
  };

  const scoreColore = (s: number) => s >= 70 ? "text-[#4ade80]" : s >= 40 ? "text-[#f5c518]" : "text-white/40";

  // Messaggio WhatsApp precompilato
  const apriWhatsApp = (p: any) => {
    const tel = (p.telefono || "").replace(/\D/g, "");
    if (!tel) { toast.error("Nessun numero di telefono per questo prospect"); return; }
    const msg = encodeURIComponent(
      `Buongiorno ${p.ragioneSociale},\n\nSono Gennaro di Ricaricati di Connessioni.\n\nAbbiamo pacchetti per installatori fotovoltaici che potrebbero interessarvi: pratiche GSE, connessione e iter burocratici gestiti per voi.\n\nPosso inviarvi maggiori informazioni?\n\nGrazie, buona giornata! 🌞`
    );
    window.open(`https://wa.me/39${tel}?text=${msg}`, "_blank");
  };

  // Filtra prospects
  const prospectsFiltrati = (prospects as any[]).filter(p => {
    const matchSearch = !search || [p.ragioneSociale, p.email, p.telefono, p.comune].some(v => v?.toLowerCase().includes(search.toLowerCase()));
    const matchStato = filtroStato === "tutti" || p.statoContatto === filtroStato;
    const matchRegione = filtroRegione === "tutti" || p.regione === filtroRegione;
    return matchSearch && matchStato && matchRegione;
  });

  const regioni = [...new Set((prospects as any[]).map((p: any) => p.regione).filter(Boolean))].sort();

  // Metriche
  const totPerStato = (prospects as any[]).reduce((acc: any, p: any) => { acc[p.statoContatto || "da_contattare"] = (acc[p.statoContatto] || 0) + 1; return acc; }, {});

  // Card singolo prospect
  const ProspectCard = ({ p, compact = false }: { p: any; compact?: boolean }) => {
    const score = calcolaScore(p);
    const stato = STATI[p.statoContatto] || STATI.da_contattare;
    return (
      <div className={`bg-[#0e3320] border rounded-xl p-4 ${compact ? "text-xs" : ""}`} style={{ borderColor: "rgba(255,255,255,0.1)" }}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white font-bold text-sm truncate">{p.ragioneSociale}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${stato.bg} ${stato.colore}`}>{stato.label}</span>
              {p.settore && <span className="text-white/30 text-xs">{p.settore}</span>}
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {p.telefono && <span className="text-white/50 text-xs flex items-center gap-1"><Phone className="w-3 h-3" />{p.telefono}</span>}
              {p.email && <span className="text-white/50 text-xs flex items-center gap-1"><Mail className="w-3 h-3" />{p.email}</span>}
              {p.comune && <span className="text-white/40 text-xs flex items-center gap-1"><MapPin className="w-3 h-3" />{p.comune} {p.provincia && `(${p.provincia})`}</span>}
            </div>
            {p.note && <p className="text-white/30 text-xs mt-1 truncate">{p.note}</p>}
          </div>
          {/* Score */}
          <div className="text-right shrink-0">
            <div className={`text-lg font-black ${scoreColore(score)}`}>{score}</div>
            <div className="text-white/20 text-xs">score</div>
          </div>
        </div>
        {/* Azioni rapide */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5 flex-wrap">
          {/* WhatsApp */}
          {p.telefono && (
            <button onClick={() => apriWhatsApp(p)}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-green-500/15 text-green-400 border border-green-500/25 hover:bg-green-500/25 transition-colors">
              <i className="ti ti-brand-whatsapp" style={{fontSize:"14px"}} aria-hidden="true" /> WhatsApp
            </button>
          )}
          {/* Email */}
          {p.email && (
            <button onClick={() => window.open(`mailto:${p.email}?subject=Ricaricati di Connessioni — Pacchetti Installatori&body=Buongiorno ${p.ragioneSociale},%0A%0ASono Gennaro di Ricaricati di Connessioni.%0A%0AAbbiamo pacchetti per installatori fotovoltaici che potrebbero interessarvi.%0A%0ALe invio maggiori informazioni?%0A%0AGrazie`, "_blank")}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/25 hover:bg-blue-500/25 transition-colors">
              <Mail className="w-3.5 h-3.5" /> Email
            </button>
          )}
          {/* Google search */}
          <button onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(p.ragioneSociale + " fotovoltaico " + (p.comune || ""))}`, "_blank")}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white/5 text-white/40 border border-white/10 hover:bg-white/10 transition-colors">
            <Search className="w-3.5 h-3.5" /> Cerca
          </button>
          {/* Avanza stato */}
          <div className="ml-auto flex gap-1">
            <select
              value={p.statoContatto || "da_contattare"}
              onChange={e => aggiorna.mutate({ id: p.id, statoContatto: e.target.value as any })}
              className="text-xs bg-[#1a4a2e] border border-white/15 text-white rounded-lg px-2 py-1 appearance-none cursor-pointer">
              {Object.entries(STATI).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
            </select>
            <button onClick={() => setEditId(p.id)} className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
            <button onClick={() => { if (confirm("Eliminare?")) elimina.mutate({ id: p.id }); }} className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>
        {/* Form modifica inline */}
        {editId === p.id && (
          <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input defaultValue={p.ragioneSociale} id={`ers-${p.id}`} placeholder="Ragione Sociale" className="bg-[#1a4a2e] border border-white/20 text-white rounded-lg px-3 py-1.5 text-xs w-full" />
              <input defaultValue={p.telefono || ""} id={`etel-${p.id}`} placeholder="Telefono" className="bg-[#1a4a2e] border border-white/20 text-white rounded-lg px-3 py-1.5 text-xs w-full" />
              <input defaultValue={p.email || ""} id={`eem-${p.id}`} placeholder="Email" className="bg-[#1a4a2e] border border-white/20 text-white rounded-lg px-3 py-1.5 text-xs w-full" />
              <input defaultValue={p.sito || ""} id={`esito-${p.id}`} placeholder="Sito web" className="bg-[#1a4a2e] border border-white/20 text-white rounded-lg px-3 py-1.5 text-xs w-full" />
              <input defaultValue={p.comune || ""} id={`ecom-${p.id}`} placeholder="Comune" className="bg-[#1a4a2e] border border-white/20 text-white rounded-lg px-3 py-1.5 text-xs w-full" />
              <input defaultValue={p.provincia || ""} id={`eprov-${p.id}`} placeholder="Provincia" className="bg-[#1a4a2e] border border-white/20 text-white rounded-lg px-3 py-1.5 text-xs w-full" />
            </div>
            <textarea defaultValue={p.note || ""} id={`en-${p.id}`} rows={2} placeholder="Note" className="bg-[#1a4a2e] border border-white/20 text-white rounded-lg px-3 py-1.5 text-xs w-full resize-none" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditId(null)} className="text-xs text-white/40 px-3 py-1.5 hover:text-white">Annulla</button>
              <button onClick={() => aggiorna.mutate({
                id: p.id,
                ragioneSociale: (document.getElementById(`ers-${p.id}`) as HTMLInputElement)?.value,
                telefono: (document.getElementById(`etel-${p.id}`) as HTMLInputElement)?.value || undefined,
                email: (document.getElementById(`eem-${p.id}`) as HTMLInputElement)?.value || undefined,
                sito: (document.getElementById(`esito-${p.id}`) as HTMLInputElement)?.value || undefined,
                comune: (document.getElementById(`ecom-${p.id}`) as HTMLInputElement)?.value || undefined,
                provincia: (document.getElementById(`eprov-${p.id}`) as HTMLInputElement)?.value || undefined,
                note: (document.getElementById(`en-${p.id}`) as HTMLTextAreaElement)?.value || undefined,
              })} className="text-xs bg-[#f5c518] text-[#1a4a2e] font-bold px-3 py-1.5 rounded-lg">Salva</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* ── HEADER METRICHE ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Totale contatti", val: (prospects as any[]).length, color: "text-white" },
          { label: "Con accordo", val: (totPerStato["accordo"] || 0) + (totPerStato["cliente_attivo"] || 0), color: "text-[#4ade80]" },
          { label: "In trattativa", val: (totPerStato["trattativa"] || 0) + (totPerStato["interessato"] || 0), color: "text-[#f5c518]" },
          { label: "Da contattare", val: totPerStato["da_contattare"] || 0, color: "text-blue-400" },
        ].map(m => (
          <div key={m.label} className="bg-[#0e3320] border border-white/10 rounded-xl p-4">
            <div className="text-white/40 text-xs mb-1">{m.label}</div>
            <div className={`text-2xl font-black ${m.color}`}>{m.val}</div>
          </div>
        ))}
      </div>

      {/* ── BARRA AZIONI ── */}
      <div className="flex flex-wrap gap-2 items-center">
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-[#4ade80] text-[#0e3320] font-bold px-3 py-2 rounded-lg text-sm hover:bg-[#4ade80]/90">
          <Plus className="w-4 h-4" /> Nuovo contatto
        </button>
        <button onClick={() => window.open("https://www.google.com/maps/search/installatori+fotovoltaico", "_blank")}
          className="flex items-center gap-1.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold px-3 py-2 rounded-lg text-sm hover:bg-blue-500/30">
          <Search className="w-4 h-4" /> Cerca su Google Maps
        </button>
        {/* Import Excel / CSV / Zoho */}
        <label className="flex items-center gap-1.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 font-semibold px-3 py-2 rounded-lg text-sm hover:bg-purple-500/30 cursor-pointer" title="Importa da Excel, CSV o esportazione Zoho Bigin">
          <Upload className="w-4 h-4" /> Import Excel / CSV
          <input type="file" accept=".xlsx,.xls,.csv,.tsv" className="hidden" onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            e.target.value = "";
            try {
              const reader = new FileReader();
              reader.onload = async (ev) => {
                const text = ev.target?.result as string;
                // Parse CSV/TSV semplice (per file esportati da Zoho, Excel salvato come CSV, ecc.)
                const lines = text.split(/\r?\n/).filter(l => l.trim());
                if (lines.length < 2) { toast.error("File vuoto o non riconosciuto"); return; }
                
                // Intestazioni: tolleranti a varianti di nomi colonne (Zoho Bigin, Excel generico, ecc.)
                const headers = lines[0].split(/[,;	]/).map(h => h.trim().toLowerCase().replace(/['"]/g, ""));
                const COL = (names: string[]) => names.map(n => headers.indexOf(n)).find(i => i >= 0) ?? -1;
                
                const iRS    = COL(["ragione sociale","account name","company","azienda","nome azienda","ragionesociale"]);
                const iTel   = COL(["telefono","phone","tel","mobile","cellulare","phone number"]);
                const iEmail = COL(["email","e-mail","mail","email address"]);
                const iCom   = COL(["comune","city","città","citta","town"]);
                const iProv  = COL(["provincia","province","prov"]);
                const iReg   = COL(["regione","region"]);
                const iNote  = COL(["note","notes","descrizione","description"]);
                const iStato = COL(["stato","status","stato contatto","contact status"]);
                const iSett  = COL(["settore","sector","industry","categoria"]);
                const iRef   = COL(["referente","contact name","nome referente","nome","first name","last name"]);
                const iSito  = COL(["sito","website","sito web","url"]);

                if (iRS < 0) { toast.error("Colonna 'Ragione Sociale' non trovata. Controlla il file o usa il template."); return; }

                const STATI_MAP: Record<string, string> = {
                  "new": "da_contattare", "nuovo": "da_contattare", "new lead": "da_contattare",
                  "contacted": "contattato", "contattato": "contattato",
                  "qualified": "interessato", "interessato": "interessato",
                  "negotiation": "trattativa", "trattativa": "trattativa", "in trattativa": "trattativa",
                  "won": "accordo", "accordo": "accordo", "chiuso vinto": "accordo",
                  "lost": "non_interessato", "non interessato": "non_interessato",
                  "cliente": "cliente_attivo", "customer": "cliente_attivo",
                };

                const records = lines.slice(1).map(line => {
                  const cols = line.split(/[,;	]/).map(c => c.trim().replace(/^["']|["']$/g, ""));
                  const rs = iRS >= 0 ? cols[iRS] : "";
                  if (!rs) return null;
                  const statoRaw = (iStato >= 0 ? cols[iStato] : "").toLowerCase();
                  const stato = STATI_MAP[statoRaw] || "da_contattare";
                  return {
                    ragioneSociale: rs,
                    telefono: iTel >= 0 ? cols[iTel] : undefined,
                    email: iEmail >= 0 ? cols[iEmail] : undefined,
                    comune: iCom >= 0 ? cols[iCom] : undefined,
                    provincia: iProv >= 0 ? cols[iProv] : undefined,
                    regione: iReg >= 0 ? cols[iReg] : undefined,
                    note: iNote >= 0 ? cols[iNote] : undefined,
                    settore: iSett >= 0 ? cols[iSett] : "fotovoltaico",
                    referente: iRef >= 0 ? cols[iRef] : undefined,
                    sito: iSito >= 0 ? cols[iSito] : undefined,
                    statoContatto: stato as any,
                    fonte: "excel" as const,
                  };
                }).filter(Boolean) as any[];

                if (records.length === 0) { toast.error("Nessun record valido trovato nel file"); return; }
                
                const conferma = confirm(`Trovati ${records.length} contatti da importare. Esempio: ${records[0]?.ragioneSociale}. Procedere?`);
                if (!conferma) return;
                
                toast(`Importazione di ${records.length} contatti in corso...`);
                // Invia al server a blocchi di 50
                let totImportati = 0, totSaltati = 0;
                for (let i = 0; i < records.length; i += 50) {
                  const chunk = records.slice(i, i + 50);
                  try {
                    const r = await importaBulk.mutateAsync({ records: chunk });
                    totImportati += r.importati;
                    totSaltati += r.saltati;
                  } catch (err: any) { toast.error(`Errore blocco ${i/50+1}: ${err.message}`); }
                }
                // Lista aggiornata automaticamente dalla mutation onSuccess
                if (totImportati > 0 || totSaltati > 0) {
                  toast.success(`✓ Import completato: ${totImportati} contatti${totSaltati > 0 ? `, ${totSaltati} saltati (duplicati)` : ""}`);
                }
              };
              reader.readAsText(file, "utf-8");
            } catch (err: any) { toast.error("Errore lettura file: " + err.message); }
          }} />
        </label>
        {/* Scarica template */}
        <button
          title="Scarica template Excel/CSV per import"
          onClick={() => {
            const template = "Ragione Sociale,Telefono,Email,Comune,Provincia,Regione,Settore,Sito,Note,Stato\nEsempio Srl,3331234567,info@esempio.it,Napoli,NA,Campania,fotovoltaico,www.esempio.it,Note esempio,da_contattare\n";
            const b = new Blob([template], { type: "text/csv;charset=utf-8;" });
            const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "template_import_crm.csv"; a.click();
            toast("Template scaricato! Aprilo con Excel, compila e reimportalo.");
          }}
          className="flex items-center gap-1.5 bg-white/5 text-white/40 border border-white/10 font-semibold px-3 py-2 rounded-lg text-sm hover:bg-white/10">
          <Download className="w-4 h-4" /> Template
        </button>
        {/* Export Excel */}
        <button onClick={() => {
          const rows = (prospects as any[]).map(p => `${p.ragioneSociale}\t${p.telefono||""}\t${p.email||""}\t${p.comune||""}\t${p.provincia||""}\t${p.statoContatto||""}\t${p.note||""}`);
          const txt = "Ragione Sociale\tTelefono\tEmail\tComune\tProvincia\tStato\tNote\n" + rows.join("\n");
          const b = new Blob([txt], { type: "text/plain" });
          const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "prospect_crm.tsv"; a.click();
          toast.success("Export scaricato");
        }}
          className="flex items-center gap-1.5 bg-[#f5c518]/20 text-[#f5c518] border border-[#f5c518]/30 font-semibold px-3 py-2 rounded-lg text-sm hover:bg-[#f5c518]/30">
          <Download className="w-4 h-4" /> Export Excel
        </button>
        {/* Toggle vista */}
        <div className="ml-auto flex gap-1 bg-black/30 rounded-lg p-1">
          <button onClick={() => setVista("lista")} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${vista === "lista" ? "bg-[#1a4a2e] text-white" : "text-white/40"}`}>Lista</button>
          <button onClick={() => setVista("kanban")} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${vista === "kanban" ? "bg-[#1a4a2e] text-white" : "text-white/40"}`}>Kanban</button>
        </div>
      </div>

      {/* ── FILTRI ── */}
      <div className="flex flex-wrap gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca per nome, email, telefono..."
          className="bg-[#0e3320] border border-white/15 text-white rounded-lg px-3 py-2 text-sm flex-1 min-w-40 focus:border-white/30 outline-none" />
        <select value={filtroStato} onChange={e => setFiltroStato(e.target.value)}
          className="bg-[#0e3320] border border-white/15 text-white rounded-lg px-3 py-2 text-sm appearance-none">
          <option value="tutti">Tutti gli stati</option>
          {Object.entries(STATI).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
        </select>
        {regioni.length > 0 && (
          <select value={filtroRegione} onChange={e => setFiltroRegione(e.target.value)}
            className="bg-[#0e3320] border border-white/15 text-white rounded-lg px-3 py-2 text-sm appearance-none">
            <option value="tutti">Tutte le regioni</option>
            {regioni.map((r: any) => <option key={r} value={r}>{r}</option>)}
          </select>
        )}
        <span className="text-white/30 text-xs self-center">{prospectsFiltrati.length}/{(prospects as any[]).length} contatti</span>
      </div>

      {/* ── FORM NUOVO ── */}
      {showForm && (
        <div className="bg-[#0e3320] border border-[#4ade80]/30 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[#4ade80] font-bold">Nuovo Prospect</h3>
            <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white text-lg">✕</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-white/50 text-xs mb-1 block">Ragione Sociale *</label>
              <input value={form.ragioneSociale} onChange={e => setForm(f => ({...f, ragioneSociale: e.target.value}))} placeholder="Es. Rossi Impianti Srl" className="bg-[#1a4a2e] border border-white/20 text-white rounded-lg px-3 py-2 text-sm w-full" />
            </div>
            <div>
              <label className="text-white/50 text-xs mb-1 block">Telefono</label>
              <input value={form.telefono} onChange={e => setForm(f => ({...f, telefono: e.target.value}))} placeholder="+39 333..." className="bg-[#1a4a2e] border border-white/20 text-white rounded-lg px-3 py-2 text-sm w-full" />
            </div>
            <div>
              <label className="text-white/50 text-xs mb-1 block">Email</label>
              <input value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="email@azienda.it" className="bg-[#1a4a2e] border border-white/20 text-white rounded-lg px-3 py-2 text-sm w-full" />
            </div>
            <div>
              <label className="text-white/50 text-xs mb-1 block">Sito web</label>
              <input value={form.sito} onChange={e => setForm(f => ({...f, sito: e.target.value}))} placeholder="www.esempio.it" className="bg-[#1a4a2e] border border-white/20 text-white rounded-lg px-3 py-2 text-sm w-full" />
            </div>
            <div>
              <label className="text-white/50 text-xs mb-1 block">Settore</label>
              <select value={form.settore} onChange={e => setForm(f => ({...f, settore: e.target.value}))} className="bg-[#1a4a2e] border border-white/20 text-white rounded-lg px-3 py-2 text-sm w-full appearance-none">
                <option value="fotovoltaico">Fotovoltaico</option>
                <option value="elettrico">Elettrico</option>
                <option value="termoidraulico">Termoidraulico</option>
                <option value="altro">Altro</option>
              </select>
            </div>
            <div>
              <label className="text-white/50 text-xs mb-1 block">Comune</label>
              <input value={form.comune} onChange={e => setForm(f => ({...f, comune: e.target.value}))} placeholder="Es. Napoli" className="bg-[#1a4a2e] border border-white/20 text-white rounded-lg px-3 py-2 text-sm w-full" />
            </div>
            <div>
              <label className="text-white/50 text-xs mb-1 block">Provincia</label>
              <input value={form.provincia} onChange={e => setForm(f => ({...f, provincia: e.target.value}))} placeholder="Es. NA" className="bg-[#1a4a2e] border border-white/20 text-white rounded-lg px-3 py-2 text-sm w-full" />
            </div>
            <div>
              <label className="text-white/50 text-xs mb-1 block">Fonte</label>
              <select value={form.fonte} onChange={e => setForm(f => ({...f, fonte: e.target.value}))} className="bg-[#1a4a2e] border border-white/20 text-white rounded-lg px-3 py-2 text-sm w-full appearance-none">
                <option value="manuale">Inserimento manuale</option>
                <option value="google_maps">Google Maps</option>
                <option value="excel">Import Excel</option>
                <option value="referral">Referral/Passaparola</option>
                <option value="fiera">Fiera/Evento</option>
                <option value="linkedin">LinkedIn</option>
              </select>
            </div>
            <div>
              <label className="text-white/50 text-xs mb-1 block">Stato</label>
              <select value={form.statoContatto} onChange={e => setForm(f => ({...f, statoContatto: e.target.value}))} className="bg-[#1a4a2e] border border-white/20 text-white rounded-lg px-3 py-2 text-sm w-full appearance-none">
                {Object.entries(STATI).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-white/50 text-xs mb-1 block">Note</label>
              <textarea value={form.note} onChange={e => setForm(f => ({...f, note: e.target.value}))} rows={2} placeholder="Note, interesse mostrato, prossimo follow-up..." className="bg-[#1a4a2e] border border-white/20 text-white rounded-lg px-3 py-2 text-sm w-full resize-none" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="text-sm text-white/40 px-4 py-2 hover:text-white">Annulla</button>
            <button onClick={() => { if (!form.ragioneSociale.trim()) { toast.error("Inserisci la ragione sociale"); return; } crea.mutate({ ...form, statoContatto: form.statoContatto as any }); }}
              disabled={crea.isPending}
              className="bg-[#4ade80] text-[#0e3320] font-bold px-4 py-2 rounded-lg text-sm">
              {crea.isPending ? "Salvo..." : "Aggiungi Prospect"}
            </button>
          </div>
        </div>
      )}

      {/* ── BOX AUTOMAZIONE ── */}
      <div className="bg-blue-900/15 border border-blue-400/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-400/15 flex items-center justify-center shrink-0 mt-0.5">
            <i className="ti ti-robot" style={{fontSize:"18px",color:"#60a5fa"}} aria-hidden="true" />
          </div>
          <div className="flex-1">
            <p className="text-blue-300 font-bold text-sm mb-1">Come trovare installatori in automatico</p>
            <div className="grid sm:grid-cols-3 gap-3 mt-3">
              <div className="bg-black/20 rounded-lg p-3">
                <p className="text-[#f5c518] text-xs font-bold mb-1">1. Trova</p>
                <p className="text-white/40 text-xs leading-relaxed">Cerca su Google Maps "installatori fotovoltaico [città]" → copia nome e telefono → Import Excel o aggiungi manualmente</p>
                <button onClick={() => window.open("https://www.google.com/maps/search/installatori+fotovoltaico+italia", "_blank")}
                  className="mt-2 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  <Search className="w-3 h-3" /> Apri Google Maps →
                </button>
              </div>
              <div className="bg-black/20 rounded-lg p-3">
                <p className="text-[#4ade80] text-xs font-bold mb-1">2. Contatta</p>
                <p className="text-white/40 text-xs leading-relaxed">Il CRM calcola lo score, priorizza i migliori → clicca WhatsApp o Email per mandare il messaggio precompilato</p>
                <p className="mt-2 text-xs text-[#4ade80]">Messaggio già pronto con il tuo testo →</p>
              </div>
              <div className="bg-black/20 rounded-lg p-3">
                <p className="text-purple-400 text-xs font-bold mb-1">3. Traccia</p>
                <p className="text-white/40 text-xs leading-relaxed">Aggiorna lo stato nel Kanban → il sistema ti mostra chi seguire e chi ha già risposto</p>
                <p className="mt-2 text-xs text-purple-400">Pipeline visiva per non perdere nessuno →</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── VISTA LISTA ── */}
      {vista === "lista" && (
        isLoading ? <div className="text-white/40 text-center py-8">Caricamento...</div> :
        prospectsFiltrati.length === 0 ? (
          <div className="text-center py-12 text-white/40">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nessun prospect trovato.</p>
            <button onClick={() => setShowForm(true)} className="mt-3 text-[#4ade80] text-sm hover:underline">+ Aggiungi il primo</button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Priorità: ordina per score decrescente */}
            {[...prospectsFiltrati].sort((a: any, b: any) => calcolaScore(b) - calcolaScore(a)).map((p: any) => (
              <ProspectCard key={p.id} p={p} />
            ))}
          </div>
        )
      )}

      {/* ── VISTA KANBAN ── */}
      {vista === "kanban" && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {KANBAN_COLS.map(stato => {
              const stato_info = STATI[stato];
              const colonna = (prospects as any[]).filter(p => (p.statoContatto || "da_contattare") === stato);
              return (
                <div key={stato} className="w-64 shrink-0">
                  <div className={`flex items-center justify-between px-3 py-2 rounded-t-xl border-t border-x ${stato_info.bg}`}>
                    <span className={`text-xs font-bold ${stato_info.colore}`}>{stato_info.label}</span>
                    <span className={`text-xs font-black ${stato_info.colore}`}>{colonna.length}</span>
                  </div>
                  <div className="bg-black/20 rounded-b-xl border-b border-x border-white/10 p-2 space-y-2 min-h-32">
                    {colonna.map((p: any) => (
                      <div key={p.id} className="bg-[#0e3320] border border-white/10 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <span className="text-white text-xs font-semibold leading-snug flex-1">{p.ragioneSociale}</span>
                          <span className={`text-xs font-black ${scoreColore(calcolaScore(p))} shrink-0`}>{calcolaScore(p)}</span>
                        </div>
                        {p.comune && <p className="text-white/35 text-xs flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{p.comune}</p>}
                        <div className="flex gap-1.5 mt-2">
                          {p.telefono && <button onClick={() => apriWhatsApp(p)} className="p-1.5 rounded bg-green-500/15 text-green-400 hover:bg-green-500/25">
                            <i className="ti ti-brand-whatsapp" style={{fontSize:"12px"}} aria-hidden="true" /></button>}
                          {p.email && <button onClick={() => window.open(`mailto:${p.email}`, "_blank")} className="p-1.5 rounded bg-blue-500/15 text-blue-400 hover:bg-blue-500/25"><Mail className="w-3 h-3" /></button>}
                          <select value={p.statoContatto || "da_contattare"}
                            onChange={e => aggiorna.mutate({ id: p.id, statoContatto: e.target.value as any })}
                            className="text-xs bg-black/30 border border-white/10 text-white/60 rounded px-1 py-1 ml-auto appearance-none cursor-pointer">
                            {KANBAN_COLS.map(s => <option key={s} value={s}>{STATI[s].label}</option>)}
                          </select>
                        </div>
                      </div>
                    ))}
                    {colonna.length === 0 && <p className="text-white/20 text-xs text-center py-4">Nessuno</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── COMPONENTE CORSA 100K ────────────────────────────────────────────────────
function Corsa100KTab() {
  // Sincronizzato con gli Ordini Probabili
  const { data: ordini = [], isLoading } = trpc.prospectInstallatori.getOrdiniProbabili.useQuery({ prospectId: undefined });
  const { data: prospects = [] } = trpc.prospectInstallatori.lista.useQuery(undefined);

  const TARGET = 100000;

  const ordiniAttivi = (ordini as any[]).filter((o: any) => o.stato !== "rifiutato");
  const totaleNominale = ordiniAttivi.reduce((acc: number, o: any) => acc + (Number(o.importoStimato) || 0), 0);
  const totalePonderato = ordiniAttivi.reduce((acc: number, o: any) => {
    const prob = Number(o.probabilita) || 50;
    return acc + ((Number(o.importoStimato) || 0) * prob / 100);
  }, 0);
  const percNominale = Math.min((totaleNominale / TARGET) * 100, 100);
  const percPonderato = Math.min((totalePonderato / TARGET) * 100, 100);

  const STATI: Record<string, { label: string; cls: string }> = {
    bozza:      { label: "Bozza",      cls: "bg-white/10 text-white/50" },
    proposta:   { label: "Proposta",   cls: "bg-blue-500/20 text-blue-300" },
    trattativa: { label: "Trattativa", cls: "bg-orange-500/20 text-orange-300" },
    accettato:  { label: "Accettato",  cls: "bg-[#4ade80]/20 text-[#4ade80]" },
    rifiutato:  { label: "Rifiutato",  cls: "bg-red-500/20 text-red-400" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-[#f5c518] flex items-center gap-3">
            <Trophy className="w-6 h-6" /> Corsa ai €100K — Ordini Probabili
          </h2>
          <p className="text-white/40 text-sm mt-1">Basata sugli ordini probabili in trattativa</p>
        </div>
      </div>

      {/* Metriche */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#0e3320] border border-white/10 rounded-xl p-4">
          <div className="text-white/50 text-xs mb-1">Ordini in pipeline</div>
          <div className="text-2xl font-black text-white">{ordiniAttivi.length}</div>
        </div>
        <div className="bg-[#0e3320] border border-white/10 rounded-xl p-4">
          <div className="text-white/50 text-xs mb-1">Valore Nominale</div>
          <div className="text-2xl font-black text-[#f5c518]">€{totaleNominale.toLocaleString("it-IT", { maximumFractionDigits: 0 })}</div>
        </div>
        <div className="bg-[#0e3320] border border-white/10 rounded-xl p-4">
          <div className="text-white/50 text-xs mb-1">Valore Ponderato</div>
          <div className="text-2xl font-black text-[#4ade80]">€{totalePonderato.toLocaleString("it-IT", { maximumFractionDigits: 0 })}</div>
        </div>
      </div>

      {/* Unica barra — identica alla Corsa reale */}
      <div className="bg-[#0e3320] rounded-2xl p-6 border border-[#f5c518]/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white/60 text-sm uppercase tracking-wider font-semibold">ORDINI PROBABILI</p>
            <p className="text-[#f5c518] font-black text-3xl">€{totaleNominale.toLocaleString("it-IT", { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="text-right">
            <p className="text-white/60 text-sm uppercase tracking-wider font-semibold">ORDINI PONDERATI</p>
            <p className="text-[#4ade80] font-black text-xl">€{totalePonderato.toLocaleString("it-IT", { maximumFractionDigits: 0 })}</p>
          </div>
        </div>
        <div className="relative h-6 bg-[#1a4a2e] rounded-full overflow-hidden border border-white/10">
          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${percNominale}%`, background: "linear-gradient(90deg, #1a4a2e 0%, #4ade80 50%, #f5c518 100%)" }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-black text-xs drop-shadow">{percNominale.toFixed(1)}%</span>
          </div>
        </div>
        <div className="flex justify-between mt-2 text-xs">
          <span className="text-white/40">€0</span>
          <span className="text-[#4ade80] font-semibold">Mancano €{Math.max(0, TARGET - totaleNominale).toLocaleString("it-IT", { maximumFractionDigits: 0 })}</span>
          <span className="text-white/40">€{TARGET.toLocaleString("it-IT")}</span>
        </div>
      </div>

      {/* Lista ordini */}
      {isLoading ? (
        <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-[#f5c518] border-t-transparent rounded-full animate-spin" /></div>
      ) : ordiniAttivi.length === 0 ? (
        <div className="text-center py-12 bg-[#0e3320] rounded-2xl border border-white/10">
          <Trophy className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/40">Nessun ordine probabile. Aggiungine uno nella tab Ordini Probabili.</p>
        </div>
      ) : (
        <div>
          <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#f5c518]" /> Dettaglio Ordini in Pipeline
          </h3>
          <div className="space-y-2">
            {[...ordiniAttivi]
              .sort((a: any, b: any) => (Number(b.importoStimato) || 0) - (Number(a.importoStimato) || 0))
              .map((o: any) => {
                const prospect = (prospects as any[]).find((p: any) => p.id === o.prospectId);
                const prob = Number(o.probabilita) || 50;
                const ponderato = ((Number(o.importoStimato) || 0) * prob / 100);
                const stato = STATI[o.stato] || STATI.bozza;
                return (
                  <div key={o.id} className="bg-[#0e3320] rounded-xl border border-white/10 px-5 py-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-white font-semibold text-sm">{prospect?.ragioneSociale || `Prospect #${o.prospectId}`}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${stato.cls}`}>{stato.label}</span>
                        {o.prodotto && <span className="text-white/30 text-xs">{o.prodotto}</span>}
                      </div>
                      {o.note && <p className="text-white/30 text-xs truncate">{o.note}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[#f5c518] font-black text-base">€{(Number(o.importoStimato) || 0).toLocaleString("it-IT")}</p>
                      <p className="text-white/40 text-xs">{prob}% → <span className="text-[#4ade80]">€{ponderato.toLocaleString("it-IT", { maximumFractionDigits: 0 })}</span></p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}


// ─── COMPONENTE CLIENTI INATTIVI ─────────────────────────────────────────────
function ClientiInattiviSection() {
  const { data: inattivi, isLoading } = trpc.admin.clientiInattivi.useQuery(undefined);
  const inviaAlertMut = trpc.admin.inviaAlertClientiInattivi.useMutation({
    onSuccess: (res) => {
      if (res.inviato) toast.success(`Alert inviato per ${res.count} clienti inattivi`);
      else toast.info("Nessun cliente inattivo trovato");
    },
    onError: () => toast.error("Errore invio alert"),
  });
  if (isLoading) return null;
  if (!inattivi?.length) return null;
  return (
    <div className="mt-6 bg-[#0e3320] rounded-2xl p-6 border border-orange-500/30">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-orange-400 font-bold text-lg flex items-center gap-2">
            <Clock className="w-5 h-5" /> Clienti Inattivi ({inattivi.length})
          </h3>
          <p className="text-white/40 text-sm mt-0.5">Clienti con pack attivo che non creano pratiche da 30+ giorni</p>
        </div>
        <Button size="sm" onClick={() => inviaAlertMut.mutate(undefined)}
          disabled={inviaAlertMut.isPending}
          className="bg-orange-500 hover:bg-orange-600 text-white">
          {inviaAlertMut.isPending ? "Invio..." : "Invia Alert"}
        </Button>
      </div>
      <div className="space-y-2">
        {inattivi.map((item: any) => (
          <div key={item.installatore.id} className="flex items-center justify-between p-3 bg-orange-900/10 rounded-xl border border-orange-500/20">
            <div>
              <p className="text-white font-medium text-sm">{item.installatore.ragioneSociale}</p>
              <p className="text-white/40 text-xs">{item.installatore.email}</p>
            </div>
            <div className="text-right">
              <p className="text-orange-400 font-bold text-sm">{item.giorniInattivo} giorni</p>
              <p className="text-white/30 text-xs">{item.ultimaPratica ? `Ultima: ${new Date(item.ultimaPratica).toLocaleDateString("it-IT")}` : "Nessuna pratica"}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── COMPONENTE TAB DOCUMENTI ADMIN ───────────────────────────────────────────
// ─── VISUALIZZA PACK INSTALLATORE INLINE ─────────────────────────────────────
function VisualizzaPackInst({ installatoriDropdown }: { installatoriDropdown: any[] }) {
  const [instId, setInstId] = React.useState<number | null>(null);
  const { data: packAcquistati = [], isLoading: loadA } = trpc.admin.packAcquistati.useQuery(
    { installatoreId: instId! }, { enabled: instId !== null, staleTime: 0 }
  );
  const { data: packAssegnati = [], isLoading: loadB } = trpc.admin.packAssegnati.useQuery(
    { installatoreId: instId! }, { enabled: instId !== null, staleTime: 0 }
  );
  const isLoading = loadA || loadB;
  const tutti = [...(packAcquistati as any[]), ...(packAssegnati as any[])];
  const PACK_NAMES: Record<string, string> = { pack1: "Pack 1", pack2: "Pack 2", pack3: "Pack 3" };

  return (
    <div className="bg-blue-500/10 border border-blue-400/30 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-blue-400" />
        <h3 className="text-xl font-black text-blue-300">Visualizza Pack di Installatore</h3>
      </div>
      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-white/60 text-xs mb-1 block">Seleziona Installatore</label>
          <select
            className="w-full bg-[#1a4a2e] border border-white/20 text-white rounded-lg px-3 py-2 text-sm"
            value={instId ?? ""}
            onChange={e => setInstId(e.target.value ? Number(e.target.value) : null)}>
            <option value="">Seleziona installatore...</option>
            {installatoriDropdown.map((row: any) => { const inst = row.installatore ?? row; return <option key={inst.id} value={String(inst.id)}>{inst.ragioneSociale || inst.nome}</option>; })}
          </select>
        </div>
        {instId && (
          <div className="flex items-end">
            <p className="text-white/40 text-xs pb-2">{tutti.length} pacchetti trovati</p>
          </div>
        )}
      </div>

      {instId && isLoading && <p className="text-white/40 text-sm">Caricamento...</p>}

      {instId && !isLoading && tutti.length === 0 && (
        <p className="text-white/40 text-sm italic">Nessun pacchetto per questo installatore.</p>
      )}

      {instId && !isLoading && tutti.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
          {tutti.map((o: any) => {
            const isAssegnato = o.tipoOrdine === "assegnazione_admin";
            const nome = o.nomePacchetto || PACK_NAMES[o.packId] || o.packId;
            const resI = o.pratiche_incluse_residenziali ?? 0;
            const busI = o.pratiche_incluse_business ?? 0;
            const resU = o.pratiche_usate_residenziali ?? 0;
            const busU = o.pratiche_usate_business ?? 0;
            const perc = (resI + busI) > 0 ? Math.round(((resU + busU) / (resI + busI)) * 100) : 0;
            return (
              <div key={o.id} className={`rounded-xl border p-4 space-y-2 ${isAssegnato ? "border-purple-400/25 bg-purple-900/10" : "border-[#f5c518]/20 bg-[#f5c518]/5"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={`font-bold text-sm ${isAssegnato ? "text-purple-300" : "text-white"}`}>{nome}</p>
                    <p className="text-white/30 text-xs mt-0.5">#{o.id} · {new Date(o.createdAt).toLocaleDateString("it-IT")}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${isAssegnato ? "bg-purple-400/15 text-purple-300" : "bg-[#4ade80]/10 text-[#4ade80]"}`}>
                    {isAssegnato ? "Assegnato" : "Acquistato"}
                  </span>
                </div>
                <p className="text-[#f5c518] font-black text-base">€{Number(o.importo).toLocaleString("it-IT")}</p>
                {(resI > 0 || busI > 0) && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {resI > 0 && <div><span className="text-[#4ade80]">Res:</span><span className="text-white/60 ml-1">{resU}/{resI}</span></div>}
                    {busI > 0 && <div><span className="text-[#f5c518]">Bus:</span><span className="text-white/60 ml-1">{busU}/{busI}</span></div>}
                  </div>
                )}
                <div className="w-full bg-white/10 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full transition-all ${isAssegnato ? "bg-purple-400" : "bg-[#f5c518]"}`} style={{ width: `${perc}%` }} />
                </div>
                <p className="text-white/25 text-xs text-right">{perc}% utilizzato</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── EDITOR STEP ITER ────────────────────────────────────────────────────────
function StepIterEditor({ tipoIter }: { tipoIter: string }) {
  const utils = trpc.useUtils();
  const { data: personalizzazioni = [] } = trpc.configStepIter.lista.useQuery({ tipoIter }, { enabled: !!tipoIter });
  const salva = trpc.configStepIter.salva.useMutation({
    onSuccess: () => { utils.configStepIter.lista.invalidate({ tipoIter }); utils.configStepIter.tuttiGliStep.invalidate(); toast.success("Step aggiornato"); },
    onError: (e) => toast.error(e.message),
  });
  const ripristina = trpc.configStepIter.ripristina.useMutation({
    onSuccess: () => { utils.configStepIter.lista.invalidate({ tipoIter }); utils.configStepIter.tuttiGliStep.invalidate(); toast.success("Step ripristinato"); },
    onError: (e) => toast.error(e.message),
  });
  const [editingStep, setEditingStep] = React.useState<string | null>(null);
  const [editLabel, setEditLabel] = React.useState("");
  const [editDesc, setEditDesc] = React.useState("");

  const iterDef = ITER_DEFINIZIONI[tipoIter as TipoIter];
  if (!iterDef) return null;

  return (
    <div className="space-y-2">
      {iterDef.steps.map((step, idx) => {
        const custom = personalizzazioni.find((p: any) => p.stepId === step.id);
        const isEditing = editingStep === step.id;
        const hasCustom = !!custom?.labelCustom || !!custom?.descrizioneCustom;
        return (
          <div key={step.id} className={`rounded-lg border p-3 ${hasCustom ? "border-blue-400/30 bg-blue-900/10" : "border-white/8 bg-white/2"}`}>
            {!isEditing ? (
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white/40 text-xs font-mono">{idx + 1}.</span>
                    <span className={`text-sm font-semibold ${hasCustom ? "text-blue-300" : "text-white/80"}`}>
                      {custom?.labelCustom || step.label}
                    </span>
                    {hasCustom && <span className="text-xs px-1.5 py-0.5 rounded bg-blue-400/15 text-blue-300 font-semibold">Personalizzato</span>}
                  </div>
                  {(custom?.descrizioneCustom || step.descrizione) && (
                    <p className="text-white/35 text-xs mt-1 truncate">{custom?.descrizioneCustom || step.descrizione}</p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => { setEditingStep(step.id); setEditLabel(custom?.labelCustom || step.label); setEditDesc(custom?.descrizioneCustom || step.descrizione); }}
                    className="p-1.5 rounded-lg bg-blue-400/10 text-blue-400 hover:bg-blue-400/20 transition-colors" title="Modifica">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  {hasCustom && (
                    <button
                      onClick={() => ripristina.mutate({ tipoIter, stepId: step.id })}
                      className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 transition-colors" title="Ripristina originale">
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div>
                  <label className="text-white/50 text-xs mb-1 block">Nome step</label>
                  <input className="w-full bg-[#0e3320] border border-white/20 text-white rounded-lg px-3 py-1.5 text-sm focus:border-blue-400/50 focus:outline-none" value={editLabel} onChange={e => setEditLabel(e.target.value)} placeholder={step.label} />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1 block">Descrizione</label>
                  <textarea className="w-full bg-[#0e3320] border border-white/20 text-white rounded-lg px-3 py-1.5 text-sm resize-none focus:border-blue-400/50 focus:outline-none" rows={2} value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder={step.descrizione} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { salva.mutate({ tipoIter, stepId: step.id, labelCustom: editLabel, descrizioneCustom: editDesc }); setEditingStep(null); }} disabled={salva.isPending} className="bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-blue-500/30 transition-colors">Salva</button>
                  <button onClick={() => setEditingStep(null)} className="text-white/40 text-xs px-3 py-1.5 hover:text-white transition-colors">Annulla</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TabDocumentiAdmin() {
  const [iterSelezionato, setIterSelezionato] = useState<string>("superbonus_110");
  const [editingDoc, setEditingDoc] = useState<string | null>(null);
  const [ordineLocale, setOrdineLocale] = useState<Record<string, number>>({});
  const [showNewDocForm, setShowNewDocForm] = useState(false);
  const [newDocForm, setNewDocForm] = useState({ nomeDocumenti: "", ordine: "", importanza: "consigliato", responsabileInserimento: "installatore", note: "" });
  const utils = trpc.useUtils();

  const { data: configDocs = [], isLoading } = trpc.admin.getConfigDocumenti.useQuery(
    { tipoIter: iterSelezionato },
    { enabled: !!iterSelezionato }
  );

  const upsertConfig = trpc.admin.upsertConfigDocumento.useMutation({
    onSuccess: () => { 
      toast.success("Configurazione salvata!"); 
      utils.admin.getConfigDocumenti.invalidate({ tipoIter: iterSelezionato }); 
      setEditingDoc(null); 
    },
    onError: (e) => toast.error(e.message),
  });

  const createConfig = trpc.admin.createConfigDocumento.useMutation({
    onSuccess: () => {
      toast.success("Documento creato!");
      utils.admin.getConfigDocumenti.invalidate({ tipoIter: iterSelezionato });
      setShowNewDocForm(false);
      setNewDocForm({ nomeDocumenti: "", ordine: "", importanza: "consigliato", responsabileInserimento: "installatore", note: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const iterDef = ITER_DEFINIZIONI[iterSelezionato as TipoIter];
  // Raccoglie tutti i documenti da tutti gli step dell'iter
  const documenti: DocumentoRichiesto[] = iterDef ? iterDef.steps.flatMap(step => {
    if (step.documentiConPriorita) return step.documentiConPriorita;
    return (step.documentiRichiesti || []).map(nome => ({ nome, priorita: "consigliato" as const }));
  }).filter((d, i, arr) => arr.findIndex(x => x.nome === d.nome) === i) : [];

  // Merge configurazione admin con documenti default
  const documentiConConfig = documenti.map((doc: DocumentoRichiesto) => {
    const cfg = configDocs.find((c: any) => c.nomeDocumenti === doc.nome);
    // Determina importanza: usa il nuovo campo importanza se presente, altrimenti ricava da obbligatorio/priorita
    const importanzaSalvata = cfg?.importanza as string | undefined;
    const importanza: "obbligatorio" | "consigliato" | "opzionale" =
      importanzaSalvata === "obbligatorio" ? "obbligatorio" :
      importanzaSalvata === "consigliato" ? "consigliato" :
      importanzaSalvata === "opzionale" ? "opzionale" :
      cfg?.obbligatorio ? "obbligatorio" :
      (doc.priorita === "obbligatorio" ? "obbligatorio" : doc.priorita === "consigliato" ? "consigliato" : "opzionale");
    return {
      ...doc,
      ordinePersonalizzato: cfg?.ordine ?? null,
      noteAdmin: cfg?.note ?? "",
      obbligatorio: importanza === "obbligatorio",
      importanza,
    };
  }).sort((a: any, b: any) => {
    const oa = a.ordinePersonalizzato ?? 999;
    const ob = b.ordinePersonalizzato ?? 999;
    return oa - ob;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#f5c518] font-black text-xl">Configurazione Documenti</h2>
          <p className="text-white/40 text-sm">Imposta ordine e priorità dei documenti per ogni iter</p>
        </div>
        <Button onClick={() => setShowNewDocForm(!showNewDocForm)} className="bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-bold text-xs">
          <Plus className="w-3 h-3 mr-1" />Nuovo Documento
        </Button>
      </div>

      {/* Selezione iter */}
      <div className="bg-[#0e3320] rounded-xl border border-white/10 p-4">
        <label className="text-white/60 text-xs mb-2 block">Seleziona Iter</label>
        <select
          className="bg-[#1a4a2e] border border-white/20 text-white rounded-lg px-3 py-2 text-sm w-full max-w-sm"
          value={iterSelezionato}
          onChange={e => setIterSelezionato(e.target.value)}
        >
          {TIPI_ITER_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* PERSONALIZZAZIONE STEP */}
      <div className="bg-[#0e3320] rounded-xl border border-blue-400/20 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-blue-300 font-bold text-sm">Personalizza Nomi Step</h3>
            <p className="text-white/30 text-xs mt-0.5">Modifica label e descrizione degli step per questo iter</p>
          </div>
        </div>
        <StepIterEditor tipoIter={iterSelezionato} />
      </div>

      {/* Form creazione nuovo documento */}
      {showNewDocForm && (
        <div className="bg-[#0e3320] rounded-xl border border-[#f5c518]/30 p-4 space-y-3">
          <h3 className="text-[#f5c518] font-bold text-sm">Crea Nuovo Documento</h3>
          <div>
            <label className="text-white/60 text-xs mb-1 block">Nome del documento</label>
            <input
              type="text"
              className="w-full bg-[#1a4a2e] border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
              placeholder="Es. Carta d'identita"
              value={newDocForm.nomeDocumenti}
              onChange={e => setNewDocForm({...newDocForm, nomeDocumenti: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-white/60 text-xs mb-1 block">Ordine</label>
              <input
                type="number"
                className="w-full bg-[#1a4a2e] border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                placeholder="Es. 1"
                value={newDocForm.ordine}
                onChange={e => setNewDocForm({...newDocForm, ordine: e.target.value})}
              />
            </div>
            <div>
              <label className="text-white/60 text-xs mb-1 block">Importanza</label>
              <select
                className="w-full bg-[#1a4a2e] border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                value={newDocForm.importanza}
                onChange={e => setNewDocForm({...newDocForm, importanza: e.target.value})}
              >
                <option value="obbligatorio">🔴 Obbligatorio</option>
                <option value="consigliato">🟡 Consigliato</option>
                <option value="opzionale">⚪ Opzionale</option>
              </select>
            </div>
            <div>
              <label className="text-white/60 text-xs mb-1 block">Chi inserisce</label>
              <select
                className="w-full bg-[#1a4a2e] border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                value={newDocForm.responsabileInserimento}
                onChange={e => setNewDocForm({...newDocForm, responsabileInserimento: e.target.value})}
              >
                <option value="sistema">Sistema/Admin</option>
                <option value="installatore">Installatore</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-white/60 text-xs mb-1 block">Note (opzionale)</label>
            <input
              className="w-full bg-[#1a4a2e] border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
              placeholder="Es. Fronte e retro"
              value={newDocForm.note}
              onChange={e => setNewDocForm({...newDocForm, note: e.target.value})}
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                if (!newDocForm.nomeDocumenti.trim()) {
                  toast.error("Inserisci il nome del documento");
                  return;
                }
                createConfig.mutate({
                  tipoIter: iterSelezionato,
                  nomeDocumenti: newDocForm.nomeDocumenti,
                  ordine: newDocForm.ordine ? parseInt(newDocForm.ordine) : null,
                  importanza: newDocForm.importanza as any,
                  responsabileInserimento: newDocForm.responsabileInserimento as any,
                  note: newDocForm.note || null,
                });
              }}
              disabled={createConfig.isPending}
              className="bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-bold text-xs"
            >
              {createConfig.isPending ? "Creando..." : "Crea"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowNewDocForm(false)} className="text-white/50 text-xs">Annulla</Button>
          </div>
        </div>
      )}

      {/* Lista documenti con configurazione */}
      {!isLoading && documentiConConfig.filter((d: any) => d.responsabileInserimento !== "sistema").length > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-[#4ade80] font-bold text-sm">Documenti Installatore</h3>
          <span className="text-white/30 text-xs">(caricati dall'installatore)</span>
        </div>
      )}
      {isLoading ? (
        <div className="text-white/40 text-sm">Caricamento...</div>
      ) : (
        <div className="space-y-2">
          {documentiConConfig.filter((d: any) => d.responsabileInserimento !== "sistema").map((doc, idx) => (
            <div key={doc.nome} className="bg-[#0e3320] rounded-xl border border-white/10 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white/40 text-xs font-mono w-6">{doc.ordinePersonalizzato ?? "-"}</span>
                    <span className="text-white font-semibold text-sm">{doc.nome}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded border font-semibold ${
                      doc.importanza === "obbligatorio" ? "text-red-400 border-red-400/30 bg-red-400/10" :
                      doc.importanza === "consigliato" ? "text-[#f5c518] border-[#f5c518]/30 bg-[#f5c518]/10" :
                      "text-white/40 border-white/20 bg-white/5"
                    }`}>{doc.importanza}</span>
                  </div>
                  {doc.noteAdmin && <p className="text-white/40 text-xs ml-8">{doc.noteAdmin}</p>}
                </div>
                <Button
                  size="sm" variant="ghost"
                  onClick={() => setEditingDoc(editingDoc === doc.nome ? null : doc.nome)}
                  className="text-[#f5c518]/70 hover:text-[#f5c518] text-xs shrink-0"
                >
                  <Pencil className="w-3 h-3 mr-1" />Modifica
                </Button>
              </div>

              {/* Form modifica inline */}
              {editingDoc === doc.nome && (
                <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Nome dei documenti</label>
                    <input
                      type="text"
                      className="w-full bg-[#1a4a2e] border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                      placeholder="Es. Carta d'identità, Busta paga..."
                      defaultValue={doc.nome}
                      id={`nomeDocumenti-${doc.nome}`}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-white/60 text-xs mb-1 block">Ordine (numero)</label>
                      <input
                        type="number"
                        className="w-full bg-[#1a4a2e] border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                        placeholder="Es. 1, 2, 3..."
                        defaultValue={doc.ordinePersonalizzato ?? ""}
                        id={`ordine-${doc.nome}`}
                      />
                    </div>
                    <div>
                      <label className="text-white/60 text-xs mb-1 block">Importanza</label>
                      <select
                        className="w-full bg-[#1a4a2e] border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                        defaultValue={doc.importanza}
                        id={`importanza-${doc.nome}`}
                      >
                        <option value="obbligatorio">🔴 Obbligatorio</option>
                        <option value="consigliato">🟡 Consigliato</option>
                        <option value="opzionale">⚪ Opzionale</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-white/60 text-xs mb-1 block">Chi inserisce</label>
                      <select
                        className="w-full bg-[#1a4a2e] border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                        defaultValue={configDocs.find((c: any) => c.nomeDocumenti === doc.nome)?.responsabileInserimento || "installatore"}
                        id={`responsabileInserimento-${doc.nome}`}
                      >
                        <option value="sistema">Sistema/Admin</option>
                        <option value="installatore">Installatore</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Note per l'installatore</label>
                    <input
                      className="w-full bg-[#1a4a2e] border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                      placeholder="Es. Fronte e retro, valida entro 6 mesi..."
                      defaultValue={doc.noteAdmin}
                      id={`note-${doc.nome}`}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        const ordineEl = document.getElementById(`ordine-${doc.nome}`) as HTMLInputElement;
                        const nomeDocumentiEl = document.getElementById(`nomeDocumenti-${doc.nome}`) as HTMLInputElement;
                        const importanzaEl = document.getElementById(`importanza-${doc.nome}`) as HTMLSelectElement;
                        const noteEl = document.getElementById(`note-${doc.nome}`) as HTMLInputElement;
                        const responsabileInserimentoEl = document.getElementById(`responsabileInserimento-${doc.nome}`) as HTMLSelectElement;
                        const importanzaVal = (importanzaEl?.value || "opzionale") as "obbligatorio" | "consigliato" | "opzionale";
                        upsertConfig.mutate({
                          tipoIter: iterSelezionato,
                          nomeDocumenti: nomeDocumentiEl?.value || doc.nome,
                          nomeDocumentiOriginale: doc.nome,
                          ordine: ordineEl?.value ? parseInt(ordineEl.value) : null,
                          importanza: importanzaVal,
                          obbligatorio: importanzaVal === "obbligatorio",
                          note: noteEl?.value || null,
          responsabileInserimento: (responsabileInserimentoEl?.value || "installatore") as "sistema" | "installatore",
                        });
                      }}
                      disabled={upsertConfig.isPending}
                      className="bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-bold text-xs"
                    >
                      {upsertConfig.isPending ? "Salvo..." : "Salva"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingDoc(null)} className="text-white/50 text-xs">Annulla</Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Sezione Documenti del Sistema - ora modificabili */}
      {documentiConConfig.filter((d: any) => d.responsabileInserimento === "sistema" || !d.responsabileInserimento).length > 0 && (
        <div className="mt-6 pt-6 border-t border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-blue-300 font-bold text-sm">Documenti Sistema / Admin</h3>
            <span className="text-white/30 text-xs">(inseriti da voi)</span>
          </div>
          <div className="space-y-2">
            {documentiConConfig.filter((d: any) => d.responsabileInserimento === "sistema").map((doc: any) => (
              <div key={`sis-${doc.nome}`} className="bg-[#0e3320] rounded-xl border border-blue-400/15 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-blue-200 font-semibold text-sm">{doc.nome}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-blue-400/10 text-blue-300 border border-blue-400/20">Sistema/Admin</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded border font-semibold ${
                        doc.importanza === "obbligatorio" ? "text-red-400 border-red-400/30 bg-red-400/10" :
                        doc.importanza === "consigliato" ? "text-[#f5c518] border-[#f5c518]/30 bg-[#f5c518]/10" :
                        "text-white/40 border-white/20 bg-white/5"
                      }`}>{doc.importanza}</span>
                    </div>
                    {doc.noteAdmin && <p className="text-white/40 text-xs ml-0">{doc.noteAdmin}</p>}
                  </div>
                  <Button size="sm" variant="ghost"
                    onClick={() => setEditingDoc(editingDoc === `sis-${doc.nome}` ? null : `sis-${doc.nome}`)}
                    className="text-blue-300/70 hover:text-blue-300 text-xs shrink-0">
                    <Pencil className="w-3 h-3 mr-1" />Modifica
                  </Button>
                </div>
                {editingDoc === `sis-${doc.nome}` && (
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
                    <div>
                      <label className="text-white/60 text-xs mb-1 block">Nome documento</label>
                      <input type="text" className="w-full bg-[#1a4a2e] border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                        defaultValue={doc.nome} id={`sis-nome-${doc.nome}`} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-white/60 text-xs mb-1 block">Importanza</label>
                        <select className="w-full bg-[#1a4a2e] border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                          defaultValue={doc.importanza} id={`sis-importanza-${doc.nome}`}>
                          <option value="obbligatorio">🔴 Obbligatorio</option>
                          <option value="consigliato">🟡 Consigliato</option>
                          <option value="opzionale">⚪ Opzionale</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-white/60 text-xs mb-1 block">Note</label>
                        <input className="w-full bg-[#1a4a2e] border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                          defaultValue={doc.noteAdmin} id={`sis-note-${doc.nome}`} placeholder="Note opzionali" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm"
                        onClick={() => {
                          const nomeEl = document.getElementById(`sis-nome-${doc.nome}`) as HTMLInputElement;
                          const impEl = document.getElementById(`sis-importanza-${doc.nome}`) as HTMLSelectElement;
                          const noteEl = document.getElementById(`sis-note-${doc.nome}`) as HTMLInputElement;
                          const impVal = (impEl?.value || "opzionale") as "obbligatorio" | "consigliato" | "opzionale";
                          upsertConfig.mutate({
                            tipoIter: iterSelezionato,
                            nomeDocumenti: nomeEl?.value || doc.nome,
                            nomeDocumentiOriginale: doc.nome,
                            ordine: doc.ordinePersonalizzato,
                            importanza: impVal,
                            obbligatorio: impVal === "obbligatorio",
                            note: noteEl?.value || null,
                            responsabileInserimento: "sistema",
                          });
                          setEditingDoc(null);
                        }}
                        disabled={upsertConfig.isPending}
                        className="bg-blue-500/20 text-blue-300 border border-blue-400/30 hover:bg-blue-500/30 font-bold text-xs">
                        {upsertConfig.isPending ? "Salvo..." : "Salva"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingDoc(null)} className="text-white/50 text-xs">Annulla</Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const STATO_COLORS_PRATICA: Record<string, string> = {
  bozza: "text-white/50 bg-white/10",
  inviata: "text-blue-400 bg-blue-400/10",
  in_lavorazione: "text-[#f5c518] bg-[#f5c518]/10",
  completata: "text-[#4ade80] bg-[#4ade80]/10",
  rifiutata: "text-red-400 bg-red-400/10",
};

const NOMI_PACK: Record<string, string> = {
  pack1: "Pack 1 — €2.000",
  pack2: "Pack 2 — €3.150",
  pack3: "Pack 3 — €5.100",
};

// Pack 1: 16 res + 5 bus = 21 | Pack 2: 30 res + 9 bus = 39 | Pack 3: 60 res + 20 bus = 80
const PRATICHE_PER_PACK: Record<string, number> = { pack1: 21, pack2: 39, pack3: 80 };
const PRATICHE_RES_PER_PACK: Record<string, number> = { pack1: 16, pack2: 30, pack3: 60 };
const PRATICHE_BUS_PER_PACK: Record<string, number> = { pack1: 5, pack2: 9, pack3: 20 };

// ─── SOGLIA PACK OMAGGIO FORM ────────────────────────────────────────────────────────
function SogliaPackOmaggioForm({ installatori }: { installatori: any[] }) {
  const utils = trpc.useUtils();
  const [selectedId, setSelectedId] = React.useState(0);
  const [soglia, setSoglia] = React.useState("");
  const setSogliaM = trpc.admin.setSogliaPackOmaggio.useMutation({
    onSuccess: () => {
      utils.installatori.lista.invalidate();
      toast.success("Soglia pack omaggio aggiornata!");
      setSoglia("");
      setSelectedId(0);
    },
    onError: (e: any) => toast.error(e.message),
  });
  const inputCls = "bg-[#0a2a18] border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#f5c518]";
  const selectCls = "appearance-none bg-[#0a2a18] border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#f5c518]";
  return (
    <div className="bg-[#0e3320] border border-white/10 rounded-xl p-5 space-y-4 max-w-lg">
      <div>
        <label className="text-white/60 text-xs mb-2 block">Seleziona Installatore *</label>
        <select value={selectedId} onChange={e => setSelectedId(Number(e.target.value))} className={`${selectCls} w-full`}>
          <option value={0}>Scegli un installatore...</option>
          {(installatori as any[]).map((row: any) => {
            const inst = row.installatore ?? row;
            const nome = inst.ragioneSociale || inst.nome || `Installatore #${inst.id}`;
            const attuale = inst.sogliaPackOmaggio != null ? `€${parseFloat(inst.sogliaPackOmaggio).toLocaleString('it-IT')}` : '€2.000';
            return <option key={inst.id} value={inst.id}>{nome} (Soglia attuale: {attuale})</option>;
          })}
        </select>
      </div>
      <div>
        <label className="text-white/60 text-xs mb-2 block">Nuova Soglia (€) *</label>
        <input type="number" min="0" step="100" className={`${inputCls} w-full`} value={soglia} onChange={e => setSoglia(e.target.value)} placeholder="2000" />
      </div>
      <Button
        className="bg-[#f5c518] text-black font-black hover:bg-[#f5c518]/90 w-full"
        onClick={() => {
          if (!selectedId) { toast.error("Seleziona un installatore"); return; }
          if (!soglia || parseFloat(soglia) <= 0) { toast.error("Inserisci una soglia valida"); return; }
          setSogliaM.mutate({ installatoreId: selectedId, soglia: parseFloat(soglia) });
        }}
        disabled={setSogliaM.isPending}
      >
        {setSogliaM.isPending ? "Salvataggio..." : "💾 Salva Soglia"}
      </Button>
    </div>
  );
}

// ─── PREMI ADMIN TAB ───────────────────────────────────────────────────────────────────
// ─── DEBUG BOLLETTE ──────────────────────────────────────────────────────────
function BolletteDebugTab() {
  const { data: bollette = [] } = trpc.system.tutteLeBottette.useQuery();
  
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-black text-[#f5c518] mb-4">Debug: Tutte le Bollette</h2>
        <p className="text-white/60 text-sm mb-4">Totale: {bollette.length}</p>
      </div>
      <div className="space-y-2">
        {bollette.map((b: any) => (
          <div key={b.id} className="bg-[#0e3320] border border-white/10 rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div><span className="text-white/60">ID:</span> <span className="text-white font-mono">{b.id}</span></div>
              <div><span className="text-white/60">InstallatoreId:</span> <span className="text-white font-mono">{b.installatoreId}</span></div>
              <div><span className="text-white/60">Cliente:</span> <span className="text-white">{b.nomeCliente}</span></div>
              <div><span className="text-white/60">Stato:</span> <span className="text-white">{b.stato}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PremiAdminTab() {
  const utils = trpc.useUtils();
  const { user } = useAuth();
  const [subTab, setSubTab] = useState<"bollette" | "nominativi" | "codici">("bollette");

  // Bollette
  const { data: bollette = [], isLoading: loadBollette } = trpc.premi.adminBollette.useQuery();
  const [noteApprovaBolletta, setNoteApprovaBolletta] = useState<Record<number, string>>({});
  const [creditoBolletta, setCreditoBolletta] = useState<Record<number, string>>({});
  const approvaBolletta = trpc.premi.adminApprovaBolletta.useMutation({
    onSuccess: () => { utils.premi.adminBollette.invalidate(); toast.success("Bolletta approvata e credito assegnato!"); },
    onError: (e: any) => toast.error(e.message),
  });
  const rifiutaBolletta = trpc.premi.adminRifiutaBolletta.useMutation({
    onSuccess: () => { utils.premi.adminBollette.invalidate(); toast.success("Bolletta rifiutata."); },
    onError: (e: any) => toast.error(e.message),
  });

  // Determina se l'utente è admin
  const isAdmin = user?.role === "admin";

  // Pack per il modal Assegna Pacchetto (caricati sempre quando isAdmin)
  const { data: packConfigModal = [] } = trpc.packConfig.listaAdmin.useQuery(undefined, { enabled: isAdmin });
  
  // Nominativi
  const { data: nominativi = [], isLoading: loadNominativi } = trpc.premi.adminNominativi.useQuery();
  const [noteNominativo, setNoteNominativo] = useState<Record<number, string>>({});
  const [creditoNominativo, setCreditoNominativo] = useState<Record<number, string>>({});
  const aggiornaStatoNominativo = trpc.premi.adminAggiornaStatoNominativo.useMutation({
    onSuccess: () => { utils.premi.adminNominativi.invalidate(); toast.success("Stato nominativo aggiornato!"); },
    onError: (e: any) => toast.error(e.message),
  });

  // Codici referral
  const { data: codici = [], isLoading: loadCodici } = trpc.premi.adminCodici.useQuery();
  const [formCodice, setFormCodice] = useState({ codice: "", descrizione: "", valoreCreditoEur: "", usatoUnaVolta: true });
  const creaCodice = trpc.premi.adminCreaCodice.useMutation({
    onSuccess: (data: any) => { utils.premi.adminCodici.invalidate(); toast.success(`Codice ${data.codice} creato!`); setFormCodice({ codice: "", descrizione: "", valoreCreditoEur: "", usatoUnaVolta: true }); },
    onError: (e: any) => toast.error(e.message),
  });
  const disattivaCodice = trpc.premi.adminDisattivaCodice.useMutation({
    onSuccess: () => { utils.premi.adminCodici.invalidate(); toast.success("Codice disattivato."); },
    onError: (e: any) => toast.error(e.message),
  });

  const STATO_BADGE: Record<string, string> = {
    in_attesa: "bg-yellow-500/20 text-yellow-400",
    approvato: "bg-green-500/20 text-green-400",
    rifiutato: "bg-red-500/20 text-red-400",
    contattato: "bg-blue-500/20 text-blue-400",
    convertito: "bg-green-500/20 text-green-400",
    non_interessato: "bg-red-500/20 text-red-400",
  };
  const STATO_LABEL: Record<string, string> = {
    in_attesa: "In attesa",
    approvato: "Approvato",
    rifiutato: "Rifiutato",
    contattato: "Contattato",
    convertito: "Convertito",
    non_interessato: "Non c'è interesse",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-[#f5c518] mb-2 flex items-center gap-2"><Trophy className="w-6 h-6" /> Gestione Premi</h2>
        <p className="text-white/50 text-sm">Gestisci bollette, nominativi segnalati e codici promo degli installatori.</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["bollette", "nominativi", "codici"] as const).map((t) => (
          <button key={t} onClick={() => setSubTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
              subTab === t ? "bg-[#f5c518] text-[#1a4a2e]" : "bg-white/10 text-white/60 hover:text-white"
            }`}>
            {t === "bollette" && <><Gift className="w-4 h-4" /> Bollette ({(bollette as any[]).filter((b: any) => b.bolletta?.stato === "in_attesa").length} in attesa)</>}
            {t === "nominativi" && <><Users className="w-4 h-4" /> Nominativi ({(nominativi as any[]).filter((n: any) => n.nominativo?.stato === "in_attesa").length} in attesa)</>}
            {t === "codici" && <><Tag className="w-4 h-4" /> Codici Promo ({(codici as any[]).length})</>}
          </button>
        ))}
      </div>

      {/* BOLLETTE */}
      {subTab === "bollette" && (
        <div className="space-y-3">
          {loadBollette ? <p className="text-white/50">Caricamento...</p> : (bollette as any[]).length === 0 ? (
            <div className="bg-[#0e3320] border border-white/10 rounded-xl p-8 text-center"><p className="text-white/50">Nessuna bolletta ricevuta</p></div>
          ) : (
            (bollette as any[]).map((row: any) => {
              const b = row.bolletta;
              const inst = row.installatore;
              return (
                <div key={b.id} className="bg-[#0e3320] border border-white/10 rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-white font-bold">{b.nomeCliente}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${STATO_BADGE[b.stato] || "bg-white/10 text-white/50"}`}>{STATO_LABEL[b.stato] || b.stato}</span>
                      </div>
                      <p className="text-white/50 text-xs">Inviata da: <span className="text-white/70 font-semibold">{inst?.ragioneSociale ?? "Installatore sconosciuto"}</span> — {new Date(b.createdAt).toLocaleDateString("it-IT")}</p>
                      {b.telefonoCliente && <p className="text-white/40 text-xs mt-0.5">📞 {b.telefonoCliente}</p>}
                      {/* Avviso 2 mesi dal cambio — legge dalle note */}
                      {b.note && b.note.includes("Data cambio fornitore:") && (() => {
                        const match = b.note.match(/Data cambio fornitore: ([\d/]+)/);
                        if (!match) return null;
                        const [g, m, a] = match[1].split("/");
                        const dataCambio = new Date(`${a}-${m}-${g}`);
                        const mesiPassati = Math.floor((Date.now() - dataCambio.getTime()) / (1000 * 60 * 60 * 24 * 30));
                        return mesiPassati < 2 ? (
                          <p className="text-amber-400 text-xs mt-1 font-semibold">⏳ Cambio: {match[1]} — Mancano {2 - mesiPassati} {2 - mesiPassati === 1 ? "mese" : "mesi"} per accreditare</p>
                        ) : (
                          <p className="text-[#4ade80] text-xs mt-1 font-semibold">✓ Cambio: {match[1]} — {mesiPassati} mesi fa · Puoi accreditare il bonus</p>
                        );
                      })()}
                      {b.note && b.note.includes("Nuovo fornitore:") && (() => {
                        const match = b.note.match(/Nuovo fornitore: ([^|]+)/);
                        return match ? <p className="text-white/40 text-xs mt-0.5">🔄 {match[0].trim()}</p> : null;
                      })()}
                      {(b.fileUrl || (b as any).fileKey) && (
                        <button
                          onClick={async () => {
                            try {
                              const res = await utils.premi.getBollettaUrl.fetch({ bolletaId: b.id });
                              if (res?.url) {
                                const a = document.createElement("a");
                                a.href = res.url;
                                a.download = res.nomeFile || "bolletta.pdf";
                                a.target = "_blank";
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                              } else {
                                toast.error("URL allegato non disponibile");
                              }
                            } catch (err: any) {
                              // Fallback: apri URL diretto
                              if (b.fileUrl) window.open(b.fileUrl, "_blank");
                              else toast.error("Impossibile aprire l'allegato");
                            }
                          }}
                          className="text-[#f5c518] text-xs font-semibold hover:underline inline-flex items-center gap-1">
                          <FileDown className="w-3 h-3" /> Visualizza allegato
                        </button>
                      )}
                      {b.note && <p className="text-white/40 text-xs italic">{b.note}</p>}
                    </div>

                  </div>
                  {b.stato === "in_attesa" && (
                    <div className="bg-black/20 rounded-xl p-3 space-y-3 border border-white/5">
                      <p className="text-white/50 text-xs font-semibold uppercase tracking-wide">Gestisci bolletta</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-white/50 text-xs mb-1 block">Credito da assegnare (€)</label>
                          <input type="number" placeholder="Es. 50, 100, 150"
                            value={creditoBolletta[b.id] ?? ""}
                            onChange={e => setCreditoBolletta(prev => ({...prev, [b.id]: e.target.value}))}
                            className="w-full bg-[#1a4a2e] border border-white/20 rounded-lg px-3 py-2 text-white text-sm" />
                        </div>
                        <div>
                          <label className="text-white/50 text-xs mb-1 block">Note admin (opzionale)</label>
                          <input placeholder="Note per l'installatore..."
                            value={noteApprovaBolletta[b.id] ?? ""}
                            onChange={e => setNoteApprovaBolletta(prev => ({...prev, [b.id]: e.target.value}))}
                            className="w-full bg-[#1a4a2e] border border-white/20 rounded-lg px-3 py-2 text-white text-sm" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold"
                          onClick={() => {
                            if (!creditoBolletta[b.id] || parseFloat(creditoBolletta[b.id]) <= 0) { toast.error("Inserisci il credito da assegnare"); return; }
                            approvaBolletta.mutate({ id: b.id, creditoAssegnato: parseFloat(creditoBolletta[b.id] || "0"), noteAdmin: noteApprovaBolletta[b.id] });
                          }}>
                          ✓ Approva e Accredita €{creditoBolletta[b.id] ? parseFloat(creditoBolletta[b.id]).toLocaleString("it-IT") : "0"}
                        </Button>
                        <Button size="sm" variant="outline" className="border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs"
                          onClick={() => rifiutaBolletta.mutate({ id: b.id, noteAdmin: noteApprovaBolletta[b.id] })}>
                          ✗ Rifiuta
                        </Button>
                      </div>
                    </div>
                  )}
                  {b.stato === "approvato" && (
                    <div className="bg-[#4ade80]/8 rounded-lg px-3 py-2 border border-[#4ade80]/20">
                      <p className="text-[#4ade80] text-sm font-bold">✓ Approvata — €{parseFloat(b.creditoAssegnato || "0").toLocaleString("it-IT")} accreditati</p>
                      {b.noteAdmin && <p className="text-white/40 text-xs mt-0.5">Nota: {b.noteAdmin}</p>}
                    </div>
                  )}
                  {b.stato === "rifiutato" && (
                    <div className="bg-red-400/5 rounded-lg px-3 py-2 border border-red-400/15">
                      <p className="text-red-400 text-xs font-semibold">✗ Rifiutata</p>
                      {b.noteAdmin && <p className="text-white/40 text-xs mt-0.5">Nota: {b.noteAdmin}</p>}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* NOMINATIVI */}
      {subTab === "nominativi" && (
        <div className="space-y-3">
          {loadNominativi ? <p className="text-white/50">Caricamento...</p> : (nominativi as any[]).length === 0 ? (
            <div className="bg-[#0e3320] border border-white/10 rounded-xl p-8 text-center"><p className="text-white/50">Nessun nominativo segnalato</p></div>
          ) : (
            (nominativi as any[]).map((row: any) => {
              const n = row.nominativo;
              const inst = row.installatore;
              return (
                <div key={n.id} className={`bg-[#0e3320] rounded-xl p-4 space-y-3 border ${n.stato === "in_attesa" ? "border-[#f5c518]/30" : n.stato === "convertito" ? "border-[#4ade80]/20" : "border-white/10"}`}>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-white font-bold">{n.nomeInstallatore}{n.azienda ? ` — ${n.azienda}` : ""}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${STATO_BADGE[n.stato] || "bg-white/10 text-white/50"}`}>{STATO_LABEL[n.stato] || n.stato}</span>
                      </div>
                      <p className="text-white/50 text-xs">Segnalato da: <span className="text-white/70 font-semibold">{inst?.ragioneSociale ?? "?"}</span> — {new Date(n.createdAt).toLocaleDateString("it-IT")}</p>
                      <div className="flex flex-wrap gap-3 mt-1">
                        {n.telefono && <p className="text-white/40 text-xs">📞 {n.telefono}</p>}
                        {n.citta && <p className="text-white/40 text-xs">📍 {n.citta}</p>}
                        {n.pacchettoDiInteresse && <p className="text-[#f5c518] text-xs font-semibold">📦 {n.pacchettoDiInteresse}</p>}
                      </div>
                      {n.note && <p className="text-white/35 text-xs italic mt-1">{n.note}</p>}
                    </div>
                  </div>

                  {/* Azioni — solo se in attesa o contattato */}
                  {(n.stato === "in_attesa" || n.stato === "contattato") && (
                    <div className="bg-black/20 rounded-xl p-3 space-y-3 border border-white/5">
                      <p className="text-white/50 text-xs font-semibold uppercase tracking-wide">Gestisci nominativo</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-white/50 text-xs mb-1 block">Credito da assegnare (€)</label>
                          <input
                            type="number"
                            placeholder="Es. 50, 100, 150"
                            value={creditoNominativo[n.id] ?? ""}
                            onChange={e => setCreditoNominativo(prev => ({...prev, [n.id]: e.target.value}))}
                            className="w-full bg-[#1a4a2e] border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-white/50 text-xs mb-1 block">Note admin (opzionale)</label>
                          <input
                            placeholder="Note per l'installatore..."
                            value={noteNominativo[n.id] ?? ""}
                            onChange={e => setNoteNominativo(prev => ({...prev, [n.id]: e.target.value}))}
                            className="w-full bg-[#1a4a2e] border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {n.stato === "in_attesa" && (
                          <Button size="sm"
                            className="bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 text-xs"
                            onClick={() => aggiornaStatoNominativo.mutate({ id: n.id, stato: "contattato", noteAdmin: noteNominativo[n.id] })}>
                            📞 Segna come Contattato
                          </Button>
                        )}
                        <Button size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold"
                          onClick={() => {
                            if (!creditoNominativo[n.id] || parseFloat(creditoNominativo[n.id]) <= 0) {
                              toast.error("Inserisci il credito da assegnare prima di approvare");
                              return;
                            }
                            aggiornaStatoNominativo.mutate({ id: n.id, stato: "convertito", creditoAssegnato: parseFloat(creditoNominativo[n.id] || "0"), noteAdmin: noteNominativo[n.id] });
                          }}>
                          ✓ Approva e Accredita €{creditoNominativo[n.id] ? parseFloat(creditoNominativo[n.id]).toLocaleString("it-IT") : "0"}
                        </Button>
                        <Button size="sm"
                          variant="outline"
                          className="border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs"
                          onClick={() => aggiornaStatoNominativo.mutate({ id: n.id, stato: "non_interessato", noteAdmin: noteNominativo[n.id] })}>
                          ✗ Non interessato
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Esito finale */}
                  {n.stato === "convertito" && (
                    <div className="bg-[#4ade80]/8 rounded-lg px-3 py-2 border border-[#4ade80]/20">
                      <p className="text-[#4ade80] text-sm font-bold">✓ Convertito — €{parseFloat(n.creditoAssegnato || "0").toLocaleString("it-IT")} accreditati</p>
                      {n.noteAdmin && <p className="text-white/40 text-xs mt-0.5">Nota: {n.noteAdmin}</p>}
                    </div>
                  )}
                  {n.stato === "non_interessato" && (
                    <div className="bg-red-400/5 rounded-lg px-3 py-2 border border-red-400/15">
                      <p className="text-red-400 text-xs font-semibold">✗ Non interessato</p>
                      {n.noteAdmin && <p className="text-white/40 text-xs mt-0.5">Nota: {n.noteAdmin}</p>}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* CODICI REFERRAL */}
      {subTab === "codici" && (
        <div className="space-y-4">
          {/* Form crea codice */}
          <div className="bg-[#0e3320] border border-[#f5c518]/20 rounded-xl p-5">
            <h3 className="text-white font-bold mb-3">Crea Nuovo Codice Promo</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-white/70 text-xs mb-1 block">Codice (opzionale)</label>
                <input value={formCodice.codice} onChange={e => setFormCodice(f => ({...f, codice: e.target.value.toUpperCase()}))} placeholder="Auto-generato" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-mono uppercase" />
              </div>
              <div>
                <label className="text-white/70 text-xs mb-1 block">Valore Credito (€) *</label>
                <input type="number" value={formCodice.valoreCreditoEur} onChange={e => setFormCodice(f => ({...f, valoreCreditoEur: e.target.value}))} placeholder="50" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
              </div>
            </div>
            <div className="mb-3">
              <label className="text-white/70 text-xs mb-1 block">Descrizione</label>
              <input value={formCodice.descrizione} onChange={e => setFormCodice(f => ({...f, descrizione: e.target.value}))} placeholder="Es. Bonus benvenuto" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
            <Button disabled={creaCodice.isPending || !formCodice.valoreCreditoEur} onClick={() => creaCodice.mutate({ codice: formCodice.codice || undefined, descrizione: formCodice.descrizione || undefined, valoreCreditoEur: parseFloat(formCodice.valoreCreditoEur), usatoUnaVolta: false })} className="bg-[#f5c518] text-[#1a4a2e] font-bold hover:bg-[#f5c518]/90 flex items-center gap-2">
              <Plus className="w-4 h-4" /> {creaCodice.isPending ? "Creazione..." : "Crea Codice"}
            </Button>
          </div>
          {/* Lista codici */}
          {loadCodici ? <p className="text-white/50">Caricamento...</p> : (codici as any[]).length === 0 ? (
            <div className="bg-[#0e3320] border border-white/10 rounded-xl p-8 text-center"><p className="text-white/50">Nessun codice creato</p></div>
          ) : (
            <div className="space-y-2">
              {(codici as any[]).map((c: any) => (
                <div key={c.id} className="bg-[#0e3320] border border-white/10 rounded-xl p-4 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#f5c518] text-sm">{c.codice}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${c.attivo ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{c.attivo ? "Attivo" : "Disattivato"}</span>
                      {c.installatoreIdRiscattato && <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Riscattato</span>}
                    </div>
                    <p className="text-white/50 text-xs mt-0.5">€{parseFloat(c.valoreCreditoEur || "0").toLocaleString("it-IT")} — {c.descrizione || "Nessuna descrizione"}</p>
                  </div>
                  {c.attivo && !c.installatoreIdRiscattato && (
                    <Button size="sm" variant="outline" className="text-xs border-red-500/40 text-red-400 hover:bg-red-500/10" onClick={() => disattivaCodice.mutate({ id: c.id })}>Disattiva</Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const { user, isAuthenticated, loading } = useAuth();
  const isAdmin = user?.role === "admin";
  const [tab, setTab] = useState<TabType>("statistiche");
  const [filtroPratica, setFiltroPratica] = useState<string>("tutti");
  const [targetStats, setTargetStats] = useState<number>(100000);
  const [expandedInstId, setExpandedInstId] = useState<number | null>(null);
  const [expandedDocPraticaId, setExpandedDocPraticaId] = useState<number | null>(null);
  const [sortOrdini, setSortOrdini] = useState<"data" | "importo">("data");
  const utils = trpc.useUtils();

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: stats } = trpc.admin.statistiche.useQuery(undefined, { enabled: isAdmin });
  const { data: installatori = [] } = trpc.installatori.lista.useQuery(undefined, { enabled: isAdmin && (tab === "installatori" || tab === "credito") });
  // Query installatori per dropdown nelle form ordini/pratiche/credito
  // Dichiarazioni di state per i filtri
  const [filtroInstallatoreOrdini, setFiltroInstallatoreOrdini] = useState<string>("");
  const [filtroInstallatorePratiche, setFiltroInstallatorePratiche] = useState<string>("");
  const [ricercaNomeOrdini, setRicercaNomeOrdini] = useState<string>("");
  const [filtroStatoOrdini, setFiltroStatoOrdini] = useState<string>("");
  const [ricercaNomePratiche, setRicercaNomePratiche] = useState<string>("");
  const [ricercaNomeInstallatori, setRicercaNomeInstallatori] = useState<string>("");
  
  // installatoriDropdown: serve per ordini, pratiche, credito, premi (modal promo con visibilità singolo) e pack
  const { data: installatoriDropdown = [] } = trpc.installatori.lista.useQuery(undefined, { enabled: isAdmin && (tab === "ordini" || tab === "pratiche" || tab === "credito" || tab === "premi" || tab === "pack" || tab === "installatori") });
  const { data: ordiniTutti = [] } = trpc.ordini.tutti.useQuery(undefined, { enabled: isAdmin && (tab === "ordini" || tab === "pratiche") });
  const { data: packConfigOrdini = [] } = trpc.packConfig.lista.useQuery(undefined, { enabled: isAdmin && tab === "ordini" });
  const { data: pratiche = [] } = trpc.pratiche.tutte.useQuery(undefined, { enabled: isAdmin && tab === "pratiche" });
  
  // Nella tab Ordini mostriamo solo i PACK (non le pratiche singole)
  // Nella tab Pratiche usiamo tutti gli ordini (pack) per il dropdown nel form "Crea Pratica"
  const ordini = (ordiniTutti as any[]).filter((o: any) => o.packId !== "singolo");
  const ordiniSingoli = (ordiniTutti as any[]).filter((o: any) => o.packId === "singolo");
  
  // Ordini filtrati per installatore, nome e stato
  const ordiniFiltered = ordini
    .filter((o: any) => !filtroInstallatoreOrdini || String(o.installatoreId) === filtroInstallatoreOrdini)
    .filter((o: any) => !ricercaNomeOrdini || o.nomeAcquirente?.toLowerCase().includes(ricercaNomeOrdini.toLowerCase()) || o.emailAcquirente?.toLowerCase().includes(ricercaNomeOrdini.toLowerCase()))
    .filter((o: any) => !filtroStatoOrdini || o.stato === filtroStatoOrdini);
  
  // Pratiche filtrate per installatore e nome
  const praticheFiltered = pratiche
    .filter((p: any) => !filtroInstallatorePratiche || String(p.installatoreId) === filtroInstallatorePratiche)
    .filter((p: any) => !ricercaNomePratiche || p.nomeTitolare?.toLowerCase().includes(ricercaNomePratiche.toLowerCase()) || p.cognomeTitolare?.toLowerCase().includes(ricercaNomePratiche.toLowerCase()));
  
  // Installatori filtrati per nome, P.IVA, Codice Fiscale
  const installatoriFiltered = installatori
    .filter((inst: any) => {
      if (!ricercaNomeInstallatori) return true;
      const searchTerm = ricercaNomeInstallatori.toLowerCase();
      const ragioneSociale = inst.ragioneSociale?.toLowerCase() || "";
      const nome = inst.nome?.toLowerCase() || "";
      const email = inst.email?.toLowerCase() || "";
      const partitaIva = inst.partitaIva?.toLowerCase() || "";
      const codiceFiscale = inst.codiceFiscale?.toLowerCase() || "";
      
      // Ricerca per substring: "Gaia" trova "Gaestapper"
      return ragioneSociale.includes(searchTerm) || 
             nome.includes(searchTerm) || 
             email.includes(searchTerm) ||
             partitaIva.includes(searchTerm) ||
             codiceFiscale.includes(searchTerm);
    })
  
  // Conteggio risultati ricerca
  const conteggioRicercaInstallatori = ricercaNomeInstallatori ? installatoriFiltered.length : installatori.length;

  // Diagnostica: installatori senza userId
  // DISABILITATO: procedura non registrata nel backend
  const diagnostica = { installatori: [], totale: 0 };
  const refetchDiagnostica = async () => {};
  // const { data: diagnostica = { installatori: [], totale: 0 }, refetch: refetchDiagnostica } = trpc.admin.diagnosticaInstallatoriSenzaUserId.useQuery(undefined, { enabled: isAdmin && tab === "installatori" });
  const associaUserId = trpc.admin.associaUserIdAInstallatore.useMutation({
    onSuccess: () => { toast.success("UserId associato! Ordini e pratiche dovrebbero riapparire."); refetchDiagnostica(); },
    onError: (e) => toast.error(e.message),
  });

  const { data: backupData, isLoading: backupLoading, refetch: refetchBackup } = trpc.admin.esportaBackup.useQuery(undefined, { enabled: false });
  const [backupFileContent, setBackupFileContent] = useState<string | null>(null);
  const [ripristinoMsg, setRipristinoMsg] = useState<string | null>(null);

  // Backup automatico
  const { data: backupConfig, refetch: refetchConfig } = trpc.admin.getBackupConfig.useQuery(undefined, { enabled: isAdmin && tab === "backup" });
  const { data: storicoBackup = [], refetch: refetchStorico } = trpc.admin.storicoBackup.useQuery(undefined, { enabled: isAdmin && tab === "backup" });
  const aggiornaConfig = trpc.admin.aggiornaBackupConfig.useMutation({
    onSuccess: () => { toast.success("Configurazione backup salvata!"); refetchConfig(); },
    onError: (e) => toast.error(e.message),
  });
  const salvaBackupStorage = trpc.admin.salvaBackupStorage.useMutation({
    onSuccess: (r) => { toast.success(`Backup salvato! (${(r.dimensioneBytes / 1024).toFixed(1)} KB)`); refetchStorico(); },
    onError: (e) => toast.error(e.message),
  });
  const [freqSelezionata, setFreqSelezionata] = useState<"giornaliero" | "settimanale" | "mensile">("settimanale");
  const [backupAttivo, setBackupAttivo] = useState(false);

  const ripristina = trpc.admin.ripristinaBackup.useMutation({
    onSuccess: (r) => { setRipristinoMsg(r.messaggio); toast.success(r.messaggio); },
    onError: (e) => toast.error(e.message),
  });

  const handleEsportaBackup = async () => {
    const result = await refetchBackup();
    if (result.data) {
      const json = JSON.stringify(result.data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ricaricati-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Backup scaricato con successo!");
    }
  };

  const handleRipristino = () => {
    if (!backupFileContent) { toast.error("Carica prima un file di backup"); return; }
    if (!confirm("Sei sicuro di voler ripristinare il database da questo backup? I dati esistenti verranno sovrascritti.")) return;
    ripristina.mutate({ backupJson: backupFileContent });
  };
  const { data: praticheInstallatore, isLoading: praticheInstLoading } = trpc.installatori.praticheInstallatore.useQuery(
    { installatoreId: expandedInstId! },
    { enabled: expandedInstId !== null && isAdmin }
  );
  const { data: packInstallatore = [], isLoading: packInstLoading } = trpc.admin.packAcquistati.useQuery(
    { installatoreId: expandedInstId! },
    { enabled: expandedInstId !== null && isAdmin }
  );
  const { data: packAssegnati = [] } = trpc.admin.packAssegnati.useQuery(
    { installatoreId: expandedInstId! },
    { enabled: expandedInstId !== null && isAdmin }
  );
  const { data: listaPack = [] } = trpc.admin.listaPack.useQuery(undefined, { enabled: isAdmin && tab === "pack" });
  // Pack/Ricariche configurabili
  const { data: packConfigList = [], refetch: refetchPackConfig } = trpc.packConfig.listaAdmin.useQuery(undefined, { enabled: isAdmin && tab === "pack" });
  const { data: ricaricheConfigList = [], refetch: refetchRicaricheConfig } = trpc.ricaricheConfig.listaAdmin.useQuery(undefined, { enabled: isAdmin && tab === "pack" });
  const { data: promoList = [], refetch: refetchPromo } = trpc.promo.listaAdmin.useQuery(undefined, { enabled: isAdmin });
  // Pack per il modal Assegna Pacchetto (caricati sempre quando isAdmin)
  const { data: packConfigModal = [] } = trpc.packConfig.listaAdmin.useQuery(undefined, { enabled: isAdmin });
  // Personalizzazioni step iter (per mostrare label custom nelle pratiche)
  const { data: stepIterCustom = [] } = trpc.configStepIter.tuttiGliStep.useQuery(undefined, { enabled: isAdmin, staleTime: 60000 });
  const getIterDefCustom = React.useCallback((tipoIter: string) => {
    const def = ITER_DEFINIZIONI[tipoIter as TipoIter];
    if (!def) return null;
    const customs = stepIterCustom.filter((s: any) => s.tipoIter === tipoIter);
    if (!customs.length) return def;
    return {
      ...def,
      steps: def.steps.map(step => {
        const c = customs.find((x: any) => x.stepId === step.id);
        return c ? { ...step, label: c.labelCustom || step.label, descrizione: c.descrizioneCustom || step.descrizione } : step;
      }),
    };
  }, [stepIterCustom]);
  // Promo per installatore specifico
  const { data: promoInstList = [], refetch: refetchPromoInst } = trpc.promo.listaAdmin.useQuery(undefined, { enabled: isAdmin && expandedInstId !== null });
  const { data: documentiPraticaAdmin = [] } = trpc.pratiche.documenti.useQuery(
    { praticaId: expandedIterPraticaId! },
    { enabled: expandedIterPraticaId !== null && isAdmin }
  );
  const { data: corsaData, isLoading: corsaLoading } = trpc.installatori.classifica.useQuery(undefined, { enabled: isAdmin && tab === "corsa", refetchInterval: tab === "corsa" ? 60000 : false });
  const { data: corsaTargetRaw, refetch: refetchCorsaTarget } = trpc.impostazioni.get.useQuery({ chiave: "corsa_target" }, { enabled: isAdmin && tab === "corsa" });
  const corsaTarget = corsaTargetRaw ? parseFloat(corsaTargetRaw) : 100000;
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState("");
  const setCorsaTarget = trpc.impostazioni.set.useMutation({
    onSuccess: () => { toast.success("Target aggiornato!"); refetchCorsaTarget(); setEditingTarget(false); },
    onError: (e) => toast.error(e.message),
  });

  // ── Mutations installatori ────────────────────────────────────────────────
  const aggiornaInstallatore = trpc.installatori.aggiornaStato.useMutation({
    onSuccess: () => { utils.installatori.lista.invalidate(); toast.success("Stato aggiornato"); },
    onError: (e) => toast.error(e.message),
  });
  const creaInstallatore = trpc.installatori.creaAdmin.useMutation({
    onSuccess: () => { utils.installatori.lista.invalidate(); toast.success("Installatore creato"); setShowCreaInst(false); resetFormInst(); },
    onError: (e) => toast.error(e.message),
  });
  const modificaInstallatore = trpc.installatori.modificaAdmin.useMutation({
    onSuccess: () => { utils.installatori.lista.invalidate(); toast.success("Installatore aggiornato"); setEditInstId(null); },
    onError: (e) => toast.error(e.message),
  });
  const eliminaInstallatore = trpc.installatori.eliminaAdmin.useMutation({
    onSuccess: () => { utils.installatori.lista.invalidate(); toast.success("Installatore eliminato"); },
    onError: (e) => toast.error(e.message),
  });
  const sendWhatsApp = trpc.admin.sendWhatsApp.useMutation({
    onSuccess: () => { toast.success("Messaggio WhatsApp inviato"); },
    onError: (e) => toast.error(e.message),
  });

  const [tipoInterfacciaInCorso, setTipoInterfacciaInCorso] = useState<number | null>(null);
  const aggiornaTipoInterfaccia = trpc.installatori.aggiornaTipoInterfaccia.useMutation({
    onSuccess: () => { utils.installatori.lista.invalidate(); toast.success("Tipo interfaccia aggiornato"); setTipoInterfacciaInCorso(null); },
    onError: (e) => { toast.error(e.message); setTipoInterfacciaInCorso(null); },
  });
  const upsertListino = trpc.installatori.upsertListino.useMutation({
    onSuccess: () => { toast.success("Listino personalizzato salvato!"); setShowListinoModal(false); utils.installatori.getListino.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const eliminaListino = trpc.installatori.eliminaListino.useMutation({
    onSuccess: () => { toast.success("Listino eliminato"); utils.installatori.getListino.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const generaCodiciPromo = trpc.installatori.generaCodiciPromo.useMutation({
    onSuccess: (r: any) => { toast.success(`Codici promo generati: ${r.aggiornati} installatori aggiornati`); utils.installatori.lista.invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });
  const { data: ordiniSingoliInst = [], isLoading: ordiniSingoliLoading } = trpc.installatori.ordiniSingoli.useQuery(
    { installatoreId: expandedInstId! },
    { enabled: expandedInstId !== null && isAdmin }
  );
  const { data: listinoInst, isLoading: listinoInstLoading } = trpc.installatori.getListino.useQuery(
    { installatoreId: expandedInstId! },
    { enabled: expandedInstId !== null && isAdmin }
  );
  const pannelloLoading = packInstLoading || ordiniSingoliLoading || listinoInstLoading || praticheInstLoading;
  const [showListinoModal, setShowListinoModal] = useState(false);
  const [listinoNome, setListinoNome] = useState("Listino Personalizzato");
  const [listinoPrezzi, setListinoPrezzi] = useState<Record<string, { prezzo: number; note?: string }>>({});
  const [showPecModal, setShowPecModal] = useState<number | null>(null);
  const [showPackModal, setShowPackModal] = useState<number | null>(null);
  const [pecEmail, setPecEmail] = useState("");
  const [packSelezionato, setPackSelezionato] = useState<string>("pack1");
  const [packCustomNome, setPackCustomNome] = useState("");
  const [packCustomImporto, setPackCustomImporto] = useState("");
  const [packCustomResN, setPackCustomResN] = useState("");
  const [packCustomResP, setPackCustomResP] = useState("");
  const [packCustomBusN, setPackCustomBusN] = useState("");
  const [packCustomBusP, setPackCustomBusP] = useState("");
  // Stato modal pack configurazione
  const [showPackConfigModal, setShowPackConfigModal] = useState(false);
  const [editPackConfig, setEditPackConfig] = useState<any | null>(null);
  const [packConfigForm, setPackConfigForm] = useState({ slug: "", nome: "", prezzo: "", praticheRes: "", prezzoRes: "", praticheBus: "", prezzoBus: "", descrizione: "", badge: "", colore: "green", attivo: true, ordine: "0" });
  const [packAssegnaInstallatori, setPackAssegnaInstallatori] = useState<Set<number>>(new Set());
  const [packAssegnaTutti, setPackAssegnaTutti] = useState(false);
  const [packAssegnaDopoSalva, setPackAssegnaDopoSalva] = useState(false);
  const [packAssegnaModalita, setPackAssegnaModalita] = useState<"singolo"|"multiplo"|"tutti">("singolo");
  // Stato modal ricariche configurazione
  const [showRicaricaConfigModal, setShowRicaricaConfigModal] = useState(false);
  const [editRicaricaConfig, setEditRicaricaConfig] = useState<any | null>(null);
  const [ricaricaConfigForm, setRicaricaConfigForm] = useState({ slug: "", nome: "", prezzo: "", descrizione: "", badge: "", icona: "zap", attivo: true, ordine: "0" });
  // Stato modal promo installatore
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [editPromo, setEditPromo] = useState<any | null>(null);
  const [promoForm, setPromoForm] = useState({ installatoreId: "0", titolo: "", descrizione: "", prezzo: "", prezzoOriginale: "", cta: "Scopri di più", ctaUrl: "", scadenza: "", attivo: true, colore: "yellow", ordine: "0", visibilita: "home" as "home" | "tutti" | "singolo" });
  // Stato ricarica credito
  const [creditoInstallatoreId, setCreditoInstallatoreId] = useState(0);
  const [creditoImporto, setCreditoImporto] = useState("");
  const [creditoMotivo, setCreditoMotivo] = useState("");
  const { data: pecList = [] } = trpc.installatori.getPec.useQuery(
    { installatoreId: showPecModal! },
    { enabled: showPecModal !== null && isAdmin }
  );
  const { data: allPecList = [] } = trpc.installatori.getAllPec.useQuery(undefined, { enabled: isAdmin && tab === "pec" });

  // Sincronizza i dati del listino quando si apre il modal o quando listinoInst cambia
  useEffect(() => {
    if (showListinoModal && listinoInst) {
      setListinoNome(listinoInst.nomeListino);
      setListinoPrezzi(listinoInst.prezzi);
    } else if (showListinoModal && !listinoInst) {
      // Se non c'è un listino esistente, resetta i campi
      setListinoNome("Listino Personalizzato");
      setListinoPrezzi({});
    }
  }, [showListinoModal, listinoInst]);

  // ── Mutations ordini ──────────────────────────────────────────────────────
  const aggiornaOrdine = trpc.ordini.aggiornaStato.useMutation({
    onSuccess: () => { utils.ordini.tutti.invalidate(); toast.success("Ordine aggiornato"); },
    onError: (e) => toast.error(e.message),
  });
  const creaOrdine = trpc.ordini.creaAdmin.useMutation({
    onSuccess: () => { 
      utils.ordini.tutti.invalidate(); 
      utils.admin.packAcquistati.invalidate(); 
      utils.installatori.lista.invalidate();
      toast.success("Ordine creato"); 
      setShowCreaOrdine(false); 
      resetFormOrdine(); 
    },
    onError: (e) => toast.error(e.message),
  });
  const modificaOrdine = trpc.ordini.modificaAdmin.useMutation({
    onSuccess: () => { utils.ordini.tutti.invalidate(); toast.success("Ordine aggiornato"); setEditOrdineId(null); },
    onError: (e) => toast.error(e.message),
  });
  const eliminaOrdine = trpc.ordini.eliminaAdmin.useMutation({
    onSuccess: () => { utils.ordini.tutti.invalidate(); toast.success("Ordine eliminato"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteOrdineProtected = trpc.ordini.deleteProtected.useMutation({
    onSuccess: () => { utils.ordini.tutti.invalidate(); toast.success("Ordine eliminato"); setDeleteModalOrdineId(null); setDeletePassword(""); },
    onError: (e) => toast.error(e.message),
  });
  const [deleteModalOrdineId, setDeleteModalOrdineId] = React.useState<number | null>(null);
  const [deletePassword, setDeletePassword] = React.useState("");
  const deletePraticaProtected = trpc.pratiche.deleteProtected.useMutation({
    onSuccess: () => { utils.pratiche.tutti.invalidate(); toast.success("Pratica eliminata"); setDeleteModalPraticaId(null); setDeletePassword(""); },
    onError: (e) => toast.error(e.message),
  });
  const [deleteModalPraticaId, setDeleteModalPraticaId] = React.useState<number | null>(null);
  
  const assegnaPackaggio = trpc.ordini.assegnaPackaggio.useMutation({
    onSuccess: () => { 
      utils.ordini.tutti.invalidate(); 
      utils.admin.packAcquistati.invalidate(); 
      utils.installatori.lista.invalidate();
      toast.success("Pacchetto assegnato all'installatore"); 
      setShowPackModal(null); 
    },
    onError: (e) => toast.error(e.message),
  });

  const associaUserIdAPratica = trpc.admin.associaUserIdAPratica.useMutation({
    onSuccess: () => { 
      utils.pratiche.tutte.invalidate();
      toast.success("UserId associato alla pratica"); 
    },
    onError: (e) => toast.error(e.message),
  });

  // ── Mutations pratiche ────────────────────────────────────────────────────
  const aggiornaPratica = trpc.pratiche.aggiornaStato.useMutation({
    onSuccess: () => { utils.pratiche.tutte.invalidate(); toast.success("Pratica aggiornata"); },
    onError: (e) => toast.error(e.message),
  });
  const creaPratica = trpc.pratiche.creaAdmin.useMutation({
    onSuccess: (data) => { 
      utils.pratiche.tutte.invalidate();
      const praticaLink = `#pratica-${data.id}`;
      toast.success(
        (t) => (
          <div className="flex items-center justify-between gap-3 w-full">
            <span>Pratica #{data.id} creata</span>
            <button onClick={() => { window.location.hash = praticaLink; toast.dismiss(t.id); }} className="text-xs font-semibold px-2 py-1 bg-white/20 hover:bg-white/30 rounded transition-colors">
              Visualizza →
            </button>
          </div>
        ),
        { duration: 5000 }
      );
      setShowCreaPratica(false);
      resetFormPratica();
    },
    onError: (e) => toast.error(e.message),
  });
  const modificaPratica = trpc.pratiche.modificaAdmin.useMutation({
    onSuccess: () => { utils.pratiche.tutte.invalidate(); toast.success("Pratica aggiornata"); setEditPraticaId(null); },
    onError: (e) => toast.error(e.message),
  });
  const eliminaPratica = trpc.pratiche.eliminaAdmin.useMutation({
    onSuccess: () => { utils.pratiche.tutte.invalidate(); toast.success("Pratica eliminata"); },
    onError: (e) => toast.error(e.message),
  });

  // ── Mutations documenti ────────────────────────────────────────────────────────────
  const eliminaDocumento = trpc.documenti.eliminaAdmin.useMutation({
    onSuccess: () => { utils.admin.documenti.invalidate(); toast.success("Documento eliminato"); },
    onError: (e) => toast.error(e.message),
  });
  const revisionaDocumento = trpc.documenti.revisionaDocumento.useMutation({
    onSuccess: () => { utils.admin.documenti.invalidate(); utils.pratiche.tutte.invalidate(); toast.success("Revisione salvata"); },
    onError: (e) => toast.error(e.message),
  });
  const [notaRevisioneMap, setNotaRevisioneMap] = useState<Record<number, string>>({});
  const [filtroRevisioneMap, setFiltroRevisioneMap] = useState<Record<number, string>>({});

  // ── Mutations PEC ────────────────────────────────────────────────────────────
  const creaPec = trpc.installatori.creaPec.useMutation({
    onSuccess: () => { toast.success("PEC creata"); setPecEmail(""); setShowPecModal(null); utils.installatori.getPec.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const eliminaPec = trpc.installatori.eliminaPec.useMutation({
    onSuccess: () => { toast.success("PEC eliminata"); utils.installatori.getPec.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  // ── Mutations pack configurazione
  const creaPackConfig = trpc.packConfig.crea.useMutation({
    onSuccess: () => { 
      refetchPackConfig(); 
      trpc.useUtils().prospectInstallatori.getPackettiPerOrdiniProbabili.invalidate();
      toast.success("Pack creato!"); 
      setShowPackConfigModal(false); 
    },
    onError: (e) => toast.error(e.message),
  });
  const modificaPackConfig = trpc.packConfig.modifica.useMutation({
    onSuccess: () => { 
      refetchPackConfig(); 
      trpc.useUtils().prospectInstallatori.getPackettiPerOrdiniProbabili.invalidate();
      toast.success("Pack aggiornato!"); 
      setShowPackConfigModal(false); 
      setEditPackConfig(null); 
    },
    onError: (e) => toast.error(e.message),
  });
  const eliminaPackConfig = trpc.packConfig.elimina.useMutation({
    onSuccess: () => { 
      refetchPackConfig(); 
      trpc.useUtils().prospectInstallatori.getPackettiPerOrdiniProbabili.invalidate();
      toast.success("Pack eliminato"); 
    },
    onError: (e) => toast.error(e.message),
  });

  // ── Mutations ricariche configurazione
  const creaRicaricaConfig = trpc.ricaricheConfig.crea.useMutation({
    onSuccess: () => { refetchRicaricheConfig(); toast.success("Ricarica creata!"); setShowRicaricaConfigModal(false); },
    onError: (e) => toast.error(e.message),
  });
  const modificaRicaricaConfig = trpc.ricaricheConfig.modifica.useMutation({
    onSuccess: () => { refetchRicaricheConfig(); toast.success("Ricarica aggiornata!"); setShowRicaricaConfigModal(false); setEditRicaricaConfig(null); },
    onError: (e) => toast.error(e.message),
  });
  const eliminaRicaricaConfig = trpc.ricaricheConfig.elimina.useMutation({
    onSuccess: () => { refetchRicaricheConfig(); toast.success("Ricarica eliminata"); },
    onError: (e) => toast.error(e.message),
  });

  // ── Mutations promo installatore
  const creaPromo = trpc.promo.crea.useMutation({
    onSuccess: () => { refetchPromo(); refetchPromoInst(); toast.success("Promo creata!"); setShowPromoModal(false); },
    onError: (e) => toast.error(e.message),
  });
  const modificaPromo = trpc.promo.modifica.useMutation({
    onSuccess: () => { refetchPromo(); refetchPromoInst(); toast.success("Promo aggiornata!"); setShowPromoModal(false); setEditPromo(null); },
    onError: (e) => toast.error(e.message),
  });
  const eliminaPromo = trpc.promo.elimina.useMutation({
    onSuccess: () => { refetchPromo(); refetchPromoInst(); toast.success("Promo eliminata"); },
    onError: (e) => toast.error(e.message),
  });
  const ricaricaCredito = trpc.admin.ricaricaCredito.useMutation({
    onSuccess: () => { utils.installatori.lista.invalidate(); toast.success("Credito ricaricato con successo!"); setCreditoInstallatoreId(0); setCreditoImporto(""); setCreditoMotivo(""); },
    onError: (e) => toast.error(e.message),
  });

  const correggiTotaleFatturato = trpc.installatori.correggiTotaleFatturato.useMutation({
    onSuccess: () => { utils.installatori.classifica.invalidate(); toast.success("Budget aggiornato!"); },
    onError: (e) => toast.error(e.message),
  });

  // ── Form states ───────────────────────────────────────────────────────────
  const [showCreaInst, setShowCreaInst] = useState(false);
  const [editInstId, setEditInstId] = useState<number | null>(null);
  const [formInst, setFormInst] = useState({ ragioneSociale: "", partitaIva: "", telefono: "", citta: "", provincia: "", email: "", sito: "", indirizzo: "", settore: "", regione: "", specializzazioni: "" });
  const [editFormInst, setEditFormInst] = useState({ ragioneSociale: "", partitaIva: "", codiceFiscale: "", telefono: "", citta: "", provincia: "", stato: "approvato" as "in_attesa" | "approvato" | "rifiutato", saldoPratiche: 0, consensoWhatsApp: false });
  const resetFormInst = () => setFormInst({ ragioneSociale: "", partitaIva: "", telefono: "", citta: "", provincia: "", email: "", sito: "", indirizzo: "", settore: "", regione: "", specializzazioni: "" });

  const [showCreaOrdine, setShowCreaOrdine] = useState(false);
  const [editOrdineId, setEditOrdineId] = useState<number | null>(null);
  const [expandedOrdineId, setExpandedOrdineId] = useState<number | null>(null);
  const [formOrdine, setFormOrdine] = useState({ installatoreId: "", packId: "pack1" as "pack1" | "pack2" | "pack3", metodoPagamento: "bonifico" as "paypal" | "bonifico", nomeAcquirente: "", emailAcquirente: "", telefonoAcquirente: "", ragioneSocialeAcquirente: "", note: "" });
  const [editFormOrdine, setEditFormOrdine] = useState({ stato: "in_attesa" as "in_attesa" | "pagato" | "annullato", note: "", pratiche_incluse: 0, pratiche_usate: 0 });
  const resetFormOrdine = () => setFormOrdine({ installatoreId: "", packId: "pack1", metodoPagamento: "bonifico", nomeAcquirente: "", emailAcquirente: "", telefonoAcquirente: "", ragioneSocialeAcquirente: "", note: "" });

  const [showRipristinaOrdini, setShowRipristinaOrdini] = useState(false);
  const [showRipristinaPratiche, setShowRipristinaPratiche] = useState(false);

  const [showCreaPratica, setShowCreaPratica] = useState(false);
  const [editPraticaId, setEditPraticaId] = useState<number | null>(null);
  const [expandedIterPraticaId, setExpandedIterPraticaId] = useState<number | null>(null);
  const [filtroIter, setFiltroIter] = useState<string>("tutti");
  const [formPratica, setFormPratica] = useState({ installatoreId: "", ordineid: "", tipologia: "residenziale" as "residenziale" | "business", tipoIter: "connessione_semplificato" as TipoIter, potenzaKw: "", indirizzoImpianto: "", comuneImpianto: "", provinciaImpianto: "", nomeTitolare: "", note: "", scalaPack: true });
  const [editFormPratica, setEditFormPratica] = useState({ tipologia: "residenziale" as "residenziale" | "business", tipoIter: "connessione_semplificato" as TipoIter, statoIter: "", potenzaKw: "", indirizzoImpianto: "", comuneImpianto: "", provinciaImpianto: "", nomeTitolare: "", note: "", noteAdmin: "", stato: "inviata" as any });
  const resetFormPratica = () => setFormPratica({ installatoreId: "", ordineid: "", tipologia: "residenziale", tipoIter: "connessione_semplificato", potenzaKw: "", indirizzoImpianto: "", comuneImpianto: "", provinciaImpianto: "", nomeTitolare: "", note: "", scalaPack: true });

  // ── Selezione multipla universale ──────────────────────────────────────────────────────────────────────────
  const [selInst, setSelInst] = useState<Set<number>>(new Set());
  const [selOrdini, setSelOrdini] = useState<Set<number>>(new Set());
  const [selPratiche, setSelPratiche] = useState<Set<number>>(new Set());
  const [selPec, setSelPec] = useState<Set<number>>(new Set());
  const toggleSelInst = (id: number) => setSelInst(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSelOrdine = (id: number) => setSelOrdini(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSelPratica = (id: number) => setSelPratiche(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // ── Guards ──────────────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#1a4a2e] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#f5c518] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isAuthenticated) return (
    <div className="min-h-screen bg-[#1a4a2e] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#0e3320] rounded-3xl p-10 border border-white/10 text-center">
        <h2 className="text-2xl font-black text-white mb-3">Accesso Richiesto</h2>
        <a href={getLoginUrl()}>
          <Button className="bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-black">
            <LogIn className="w-4 h-4 mr-2" /> Accedi
          </Button>
        </a>
      </div>
    </div>
  );

  if (!isAdmin) return (
    <div className="min-h-screen bg-[#1a4a2e] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#0e3320] rounded-3xl p-10 border border-red-500/30 text-center">
        <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-black text-white mb-3">Accesso Negato</h2>
        <p className="text-white/60 mb-6">Questa sezione è riservata agli amministratori.</p>
        <Link href="/"><Button className="bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-black">Torna alla Home</Button></Link>
      </div>
    </div>
  );

  const TABS = [
    { id: "statistiche" as TabType, label: "Statistiche", icon: BarChart3 },
    { id: "installatori" as TabType, label: "Installatori", icon: Users },
    { id: "ordini" as TabType, label: "Ordini", icon: ShoppingCart },
    { id: "pratiche" as TabType, label: "Pratiche", icon: FileText },
    { id: "pack" as TabType, label: "Pack", icon: Package },
    { id: "corsa" as TabType, label: "Corsa €100K", icon: Trophy },
    { id: "backup" as TabType, label: "Backup", icon: DatabaseBackup },
    { id: "documenti" as TabType, label: "Documenti", icon: FileText },
    { id: "crm" as TabType, label: "CRM Prospect", icon: Users },
  ];

  const TABS_SECONDARY = [
    { id: "ordini_probabili" as TabType, label: "Ordini Probabili", icon: TrendingUp },
    { id: "corsa_100k" as TabType, label: "Corsa €100K", icon: ZapIcon },
    { id: "credito" as TabType, label: "Ricarica Credito", icon: Zap },
    { id: "premi" as TabType, label: "Premi", icon: Trophy },
  ];

  const inputCls = "bg-[#0e3320] border border-white/20 text-white rounded-lg px-3 py-2 text-sm placeholder:text-white/30 focus:outline-none focus:border-[#f5c518]";
  const selectCls = "appearance-none bg-[#0e3320] border border-white/20 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f5c518]";

  return (
    <div className="min-h-screen bg-[#1a4a2e] text-white">
      <nav className="sticky top-0 z-50 bg-[#1a4a2e]/95 backdrop-blur border-b border-white/10">
        <div className="container flex items-center gap-4 h-16">
          <Link href="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Home</span>
          </Link>
          <div className="flex items-center gap-2 ml-auto">
            <Zap className="w-5 h-5 text-[#4ade80]" />
            <span className="font-black text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>
              ADMIN <span className="text-[#f5c518]">PANEL</span>
            </span>
          </div>
        </div>
      </nav>

      <div className="container py-8">
        {/* Tab principali */}
        <div className="flex flex-wrap gap-0 mb-0 border-b border-white/10 pb-0 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${tab === t.id ? "border-[#f5c518] text-[#f5c518]" : "border-transparent text-white/50 hover:text-white"}`}>
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>
        {/* Tab secondari — stessa struttura visiva */}
        <div className="flex flex-wrap gap-0 mb-8 border-b border-white/8 pb-0 overflow-x-auto bg-[#0e3320]/40">
          {TABS_SECONDARY.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${tab === t.id ? "border-[#f5c518] text-[#f5c518]" : "border-transparent text-white/40 hover:text-white/70"}`}>
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── STATISTICHE ── */}
        {tab === "statistiche" && (
          <div>
            <h2 className="text-2xl font-black text-[#f5c518] mb-6">Panoramica Generale</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Ordini Totali", val: stats?.totaleOrdini ?? 0, icon: ShoppingCart, color: "text-[#f5c518]" },
                { label: "Ordini in Attesa", val: stats?.ordiniInAttesa ?? 0, icon: Clock, color: "text-yellow-500" },
                { label: "Installatori", val: stats?.totaleInstallatori ?? 0, icon: Users, color: "text-[#4ade80]" },
                { label: "Pratiche", val: stats?.totalePratiche ?? 0, icon: FileText, color: "text-blue-400" },
                { label: "Fatturato Pack", val: `€${(stats?.fatturaPack ?? 0).toLocaleString("it-IT")}`, icon: Package, color: "text-[#f5c518]" },
                { label: "Fatturato Pratiche Singole", val: `€${(stats?.fatturatichesingole ?? 0).toLocaleString("it-IT")}`, icon: FileText, color: "text-blue-400" },
                { label: "Fatturato", val: `€${(stats?.fatturatoTotale ?? 0).toLocaleString("it-IT")}`, icon: BarChart3, color: "text-[#f5c518]" },
                { label: "Pacchetti Acquistati", val: stats?.totalePacchetti ?? 0, icon: Package, color: "text-[#f5c518]", details: stats?.pacchettiBytipo },
              ].map((s) => (
                <div key={s.label} className="bg-[#0e3320] rounded-2xl p-6 border border-white/10">
                  <s.icon className={`w-8 h-8 ${s.color} mb-3`} />
                  <p className={`font-black text-3xl ${s.color}`}>{s.val}</p>
                  <p className="text-white/60 text-sm mt-1">{s.label}</p>
                  {s.details && Object.entries(s.details).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10 space-y-2">

                      {Object.entries(s.details).map(([tipo, count]) => (
                        <p key={tipo} className="text-white/70 text-xs">
                          {count}× {tipo}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="bg-[#0e3320] rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <p className="text-white/60 text-sm">Loggato come: <strong className="text-white">{user?.name || user?.email}</strong> (Admin)</p>
                </div>
              </div>

            </div>
            <ClientiInattiviSection />
          </div>
        )}

        {/* ── INSTALLATORI ── */}
        {tab === "installatori" && (
          <div>
            {/* SEZIONE DIAGNOSTICA - Installatori senza userId */}
            {diagnostica.totale > 0 && (
              <div className="bg-red-500/10 border border-red-400/30 rounded-2xl p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <h3 className="text-xl font-black text-red-300">⚠️ Installatori senza UserId ({diagnostica.totale})</h3>
                </div>
                <p className="text-white/60 text-sm mb-4">Questi installatori non vedono i loro ordini e pratiche perché non hanno un userId associato. Seleziona un installatore e un userId per ripristinare l'accesso.</p>
                <div className="space-y-3">
                  {(diagnostica.installatori as any[]).map((inst: any) => (
                    <div key={inst.id} className="bg-black/30 rounded-lg p-3 border border-red-400/20 flex items-center justify-between">
                      <div>
                        <p className="text-white font-semibold">{inst.ragioneSociale}</p>
                        <p className="text-white/40 text-xs">ID Installatore: {inst.id} | Email: {inst.email || "N/A"}</p>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="UserId"
                          id={`userId_${inst.id}`}
                          className="w-24 bg-[#1a4a2e] border border-white/20 text-white rounded px-2 py-1 text-sm"
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            const userId = Number((document.getElementById(`userId_${inst.id}`) as HTMLInputElement)?.value);
                            if (!userId) { toast.error("Inserisci un UserId valido"); return; }
                            associaUserId.mutate({ installatoreId: inst.id, userId });
                          }}
                          disabled={associaUserId.isPending}
                          className="bg-red-500 text-white hover:bg-red-500/90 font-bold text-xs">
                          {associaUserId.isPending ? "Ripristino..." : "Ripristina"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-white/40 text-xs mt-4">💡 Tip: Chiedi all'installatore il suo UserId (visibile nel profilo) o controlla il database.</p>
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-[#f5c518]">Installatori</h2>
                <p className="text-white/40 text-sm mt-0.5">{conteggioRicercaInstallatori} installatori {ricercaNomeInstallatori ? "trovati" : "registrati"}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <input type="text" placeholder="Cerca per nome, P.IVA, C.F., email..." value={ricercaNomeInstallatori} onChange={e => setRicercaNomeInstallatori(e.target.value)} className="bg-[#0e3320] border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-medium placeholder-white/30 focus:border-[#f5c518]/50 focus:outline-none transition-colors" />
                  {ricercaNomeInstallatori && (
                    <button onClick={() => setRicercaNomeInstallatori("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors" title="Cancella ricerca">
                      ✕
                    </button>
                  )}
                </div>
                <Button size="sm" onClick={() => {
                  const csv = [['ID', 'Azienda', 'Email', 'Telefono', 'Città', 'Provincia'].join(','), ...installatoriFiltered.map(({ installatore: inst }) => [inst.id, inst.ragioneSociale || inst.nome || 'N/A', inst.email || 'N/A', inst.telefono || 'N/A', inst.citta || 'N/A', inst.provincia || 'N/A'].map(v => `"${v}"`).join(','))].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.download = `installatori_${new Date().toISOString().split('T')[0]}.csv`;
                  link.click();
                }}
                  className="bg-green-600 text-white hover:bg-green-600/90 font-bold text-xs">
                  <Download className="w-4 h-4 mr-1" /> Esporta CSV
                </Button>
                <Button size="sm" variant="outline" onClick={() => generaCodiciPromo.mutate()}
                  disabled={generaCodiciPromo.isPending}
                  className="border-[#f5c518]/40 text-[#f5c518] hover:bg-[#f5c518]/10 font-semibold">
                  <Tag className="w-4 h-4 mr-1" /> {generaCodiciPromo.isPending ? "Generazione..." : "Genera Codici Promo"}
                </Button>
                <Button size="sm" onClick={() => setShowCreaInst(!showCreaInst)}
                  className="bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-bold">
                  <Plus className="w-4 h-4 mr-1" /> Nuovo Installatore
                </Button>
              </div>
            </div>

            {/* Form crea installatore */}
            {showCreaInst && (
              <div className="bg-[#0e3320] rounded-2xl p-5 border border-[#f5c518]/30 mb-6 space-y-3">
                <h3 className="text-[#f5c518] font-bold text-sm">Nuovo Installatore</h3>
                <div className="grid grid-cols-2 gap-3">
                  <input className={`${inputCls} col-span-2`} placeholder="Ragione sociale *" value={formInst.ragioneSociale} onChange={e => setFormInst(f => ({ ...f, ragioneSociale: e.target.value }))} />
                  <input className={inputCls} placeholder="Email" value={formInst.email} onChange={e => setFormInst(f => ({ ...f, email: e.target.value }))} />
                  <input className={inputCls} placeholder="Sito web" value={formInst.sito} onChange={e => setFormInst(f => ({ ...f, sito: e.target.value }))} />
                  <input className={inputCls} placeholder="Partita IVA" value={formInst.partitaIva} onChange={e => setFormInst(f => ({ ...f, partitaIva: e.target.value }))} />
                  <input className={inputCls} placeholder="Telefono" value={formInst.telefono} onChange={e => setFormInst(f => ({ ...f, telefono: e.target.value }))} />
                  <input className={inputCls} placeholder="Città" value={formInst.citta} onChange={e => setFormInst(f => ({ ...f, citta: e.target.value }))} />
                  <input className={inputCls} placeholder="Provincia" value={formInst.provincia} onChange={e => setFormInst(f => ({ ...f, provincia: e.target.value }))} />
                  <input className={`${inputCls} col-span-2`} placeholder="Indirizzo" value={formInst.indirizzo} onChange={e => setFormInst(f => ({ ...f, indirizzo: e.target.value }))} />
                  <input className={inputCls} placeholder="Settore" value={formInst.settore} onChange={e => setFormInst(f => ({ ...f, settore: e.target.value }))} />
                  <input className={inputCls} placeholder="Regione" value={formInst.regione} onChange={e => setFormInst(f => ({ ...f, regione: e.target.value }))} />
                  <input className={`${inputCls} col-span-2`} placeholder="Specializzazioni (es. FV, Connessioni, GSE)" value={formInst.specializzazioni} onChange={e => setFormInst(f => ({ ...f, specializzazioni: e.target.value }))} />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => creaInstallatore.mutate({ ...formInst, stato: "approvato" } as any)} disabled={!formInst.ragioneSociale} className="bg-[#4ade80] text-[#1a4a2e] hover:bg-[#4ade80]/90 font-bold">Crea</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowCreaInst(false); resetFormInst(); }} className="text-white/50">Annulla</Button>
                </div>
              </div>
            )}

            {/* Toolbar selezione installatori */}
            {selInst.size > 0 && (
              <div className="flex items-center gap-3 mb-3 px-4 py-2.5 bg-[#f5c518]/10 border border-[#f5c518]/30 rounded-xl">
                <span className="text-[#f5c518] font-bold text-sm">{selInst.size} selezionati</span>
                <Button size="sm" variant="ghost" onClick={() => setSelInst(selInst.size === installatoriFiltered.length ? new Set() : new Set(installatoriFiltered.map(i => i.installatore.id)))} className="text-white/50 text-xs">{selInst.size === installatoriFiltered.length ? "Deseleziona tutti" : "Seleziona tutti"}</Button>
                <div className="ml-auto flex gap-2">
                  <Button size="sm" className="bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs" onClick={() => { if (confirm(`Eliminare ${selInst.size} installatori?`)) { Array.from(selInst).forEach(id => eliminaInstallatore.mutate({ id })); setSelInst(new Set()); } }}>Elimina selezionati</Button>
                </div>
              </div>
            )}

            {/* Tabella installatori */}
            <div className="bg-[#0e3320] rounded-2xl border border-white/10 overflow-x-auto">
              {/* Header tabella */}
              <div className="hidden md:grid grid-cols-[auto_2fr_1.5fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-white/10 text-white/40 text-xs font-semibold uppercase tracking-wide">
                <input type="checkbox" className="w-4 h-4 accent-[#f5c518] cursor-pointer" checked={installatoriFiltered.length > 0 && selInst.size === installatoriFiltered.length} onChange={e => setSelInst(e.target.checked ? new Set(installatoriFiltered.map(i => i.installatore.id)) : new Set())} />
                <span>Azienda</span>
                <span>Contatti</span>
                <span>Stato</span>
                <span>Interfaccia</span>
                <span>Azioni</span>
              </div>

              {installatoriFiltered.length === 0 ? (
                <div className="px-5 py-10 text-center text-white/30">Nessun installatore trovato.</div>
              ) : (
                <div className="divide-y divide-white/5">
                  {installatoriFiltered.map(({ installatore: inst, user: u }) => (
                    <div key={inst.id}>
                      {/* Riga principale */}
                      <div                        role="button"
                        tabIndex={0}
                        aria-expanded={expandedInstId === inst.id}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedInstId(expandedInstId === inst.id ? null : inst.id); } }}
                        className={`grid md:grid-cols-[auto_2fr_1.5fr_1fr_1fr_auto] gap-2 md:gap-4 px-3 md:px-5 py-3 md:py-4 items-center transition-all duration-150 cursor-pointer select-none outline-none text-sm md:text-base
                          focus-visible:ring-2 focus-visible:ring-[#f5c518]/60 focus-visible:ring-inset
                          ${expandedInstId === inst.id
                            ? 'bg-[#f5c518]/5 border-l-2 border-[#f5c518]'
                            : 'hover:bg-white/[0.04] hover:border-l-2 hover:border-white/10 border-l-2 border-transparent'}
                        `}
                        onClick={() => setExpandedInstId(expandedInstId === inst.id ? null : inst.id)}>
                        {/* Checkbox selezione */}
                        <input type="checkbox" className="w-4 h-4 accent-[#f5c518] cursor-pointer" checked={selInst.has(inst.id)} onChange={e => { e.stopPropagation(); toggleSelInst(inst.id); }} onClick={e => e.stopPropagation()} />
                        {/* Azienda */}
                        <div className="min-w-0">
                          <div className="text-white font-bold text-left flex items-center gap-2">
                            {expandedInstId === inst.id ? <ChevronDown className="w-3.5 h-3.5 text-[#f5c518] shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-white/40 shrink-0" />}
                            <span className="truncate group-hover:text-[#f5c518] transition-colors text-lg">{inst.ragioneSociale}</span>
                          </div>
                          <p className="text-white/50 text-sm mt-1 ml-5.5">P.IVA: <span className="text-white font-semibold">{inst.partitaIva || "—"}</span></p>
                          {inst.codiceFiscale && <p className="text-white/50 text-sm ml-5.5">C.F.: <span className="text-white font-semibold">{inst.codiceFiscale}</span></p>}
                        </div>
                        {/* Contatti */}
                        <div className="min-w-0">
                          <p className="text-white/70 text-sm truncate">{u?.email || "—"}</p>
                          <p className="text-white/40 text-xs">{inst.telefono || "—"} · {inst.citta || "—"}{inst.provincia ? ` (${inst.provincia})` : ""}</p>
                          {parseFloat(inst.creditoResiduo || "0") > 0 && <p className="text-green-400 text-xs font-semibold mt-1">💰 €{parseFloat(inst.creditoResiduo).toLocaleString("it-IT", { minimumFractionDigits: 2 })}</p>}
                          {(() => {
                            const ordiniInAttesa = ordini.filter((o: any) => o.installatoreId === inst.id && o.stato === "in_attesa").length;
                            const praticheIncomplete = pratiche.filter((p: any) => p.installatoreId === inst.id && p.stato !== "completata" && p.stato !== "rifiutata").length;
                            return (
                              <div className="flex gap-2 mt-2">
                                {ordiniInAttesa > 0 && (
                                  <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30">⏳ {ordiniInAttesa} in attesa</span>
                                )}
                                {praticheIncomplete > 0 && (
                                  <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">📋 {praticheIncomplete} incomplete</span>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                        {/* Stato */}
                        <div>
                          <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full font-semibold ${
                            inst.stato === "approvato" ? "text-[#4ade80] bg-[#4ade80]/10 border border-[#4ade80]/20" :
                            inst.stato === "rifiutato" ? "text-red-400 bg-red-400/10 border border-red-400/20" :
                            "text-[#f5c518] bg-[#f5c518]/10 border border-[#f5c518]/20"
                          }`}>
                            {inst.stato === "approvato" ? "✓ Approvato" : inst.stato === "rifiutato" ? "✗ Non abilitato" : "⏳ In attesa"}
                          </span>
                        </div>
                        {/* Tipo interfaccia */}
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                          <button
                            disabled={tipoInterfacciaInCorso === inst.id}
                            onClick={() => { setTipoInterfacciaInCorso(inst.id); aggiornaTipoInterfaccia.mutate({ id: inst.id, tipoInterfaccia: "pack_e_singole" }); }}
                            className={`text-xs px-2 py-1 rounded-lg font-semibold border transition-all flex items-center gap-1 ${
                              inst.tipoInterfaccia === "pack_e_singole"
                                ? "bg-[#f5c518]/20 text-[#f5c518] border-[#f5c518]/40"
                                : "bg-white/5 text-white/30 border-white/10 hover:border-white/30"
                            }`} title="Pack + Singole">
                            {tipoInterfacciaInCorso === inst.id && inst.tipoInterfaccia !== "pack_e_singole" && (
                              <span className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" />
                            )}
                            Pack
                          </button>
                          <button
                            disabled={tipoInterfacciaInCorso === inst.id}
                            onClick={() => { setTipoInterfacciaInCorso(inst.id); aggiornaTipoInterfaccia.mutate({ id: inst.id, tipoInterfaccia: "solo_singole" }); }}
                            className={`text-xs px-2 py-1 rounded-lg font-semibold border transition-all flex items-center gap-1 ${
                              inst.tipoInterfaccia === "solo_singole"
                                ? "bg-blue-400/20 text-blue-400 border-blue-400/40"
                                : "bg-white/5 text-white/30 border-white/10 hover:border-white/30"
                            }`} title="Solo Singole">
                            {tipoInterfacciaInCorso === inst.id && inst.tipoInterfaccia !== "solo_singole" && (
                              <span className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" />
                            )}
                            Singole
                          </button>
                        </div>
                        {/* Azioni */}
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          {/* Pulsanti rapidi: Ordini e Pratiche */}
                          <button onClick={() => { setFiltroInstallatoreOrdini(String(inst.id)); setTab("ordini"); }}
                            className="p-1.5 rounded-lg bg-[#f5c518]/10 text-[#f5c518] hover:bg-[#f5c518]/20 transition-colors" title="Visualizza ordini">
                            <ShoppingCart className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => { setFiltroInstallatorePratiche(String(inst.id)); setTab("pratiche"); }}
                            className="p-1.5 rounded-lg bg-purple-400/10 text-purple-400 hover:bg-purple-400/20 transition-colors" title="Visualizza pratiche">
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          {/* Pulsanti di gestione */}
                          {inst.stato !== "approvato" && (
                            <button onClick={() => aggiornaInstallatore.mutate({ id: inst.id, stato: "approvato" })}
                              className="p-1.5 rounded-lg bg-[#4ade80]/10 text-[#4ade80] hover:bg-[#4ade80]/20 transition-colors" title="Approva">
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {inst.stato !== "rifiutato" && (
                            <button onClick={() => aggiornaInstallatore.mutate({ id: inst.id, stato: "rifiutato" })}
                              className="p-1.5 rounded-lg bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors" title="Non abilitare">
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {inst.consensoWhatsApp && inst.telefono && (
                            <button onClick={() => { const msg = prompt("Messaggio WhatsApp:"); if (msg) { sendWhatsApp.mutate({ installatoreId: inst.id, messaggio: msg }); } }}
                              className="p-1.5 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors" title="Invia WhatsApp">
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button onClick={() => { setEditInstId(inst.id); setEditFormInst({ ragioneSociale: inst.ragioneSociale, partitaIva: inst.partitaIva ?? "", codiceFiscale: inst.codiceFiscale ?? "", telefono: inst.telefono ?? "", citta: inst.citta ?? "", provincia: inst.provincia ?? "", stato: inst.stato, saldoPratiche: inst.saldoPratiche, consensoWhatsApp: inst.consensoWhatsApp ?? false }); }}
                            className="p-1.5 rounded-lg bg-blue-400/10 text-blue-400 hover:bg-blue-400/20 transition-colors" title="Modifica">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => { if (confirm("Eliminare questo installatore?")) eliminaInstallatore.mutate({ id: inst.id }); }}
                            className="p-1.5 rounded-lg bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors" title="Elimina">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Form modifica inline */}
                      {editInstId === inst.id && (
                        <div className="px-5 pb-4 pt-2 bg-blue-900/10 border-t border-blue-400/20">
                          <p className="text-blue-400 text-xs font-bold mb-3">Modifica installatore</p>
                          <div className="grid grid-cols-3 gap-3">
                            <input className={`${inputCls} col-span-3`} placeholder="Ragione sociale" value={editFormInst.ragioneSociale} onChange={e => setEditFormInst(f => ({ ...f, ragioneSociale: e.target.value }))} />
                            <input className={inputCls} placeholder="P.IVA" value={editFormInst.partitaIva} onChange={e => setEditFormInst(f => ({ ...f, partitaIva: e.target.value }))} />
                            <input className={inputCls} placeholder="Codice Fiscale" value={editFormInst.codiceFiscale || ""} onChange={e => setEditFormInst(f => ({ ...f, codiceFiscale: e.target.value }))} />
                            <input className={inputCls} placeholder="Telefono" value={editFormInst.telefono} onChange={e => setEditFormInst(f => ({ ...f, telefono: e.target.value }))} />
                            <input className={inputCls} placeholder="Città" value={editFormInst.citta} onChange={e => setEditFormInst(f => ({ ...f, citta: e.target.value }))} />
                            <input className={inputCls} placeholder="Provincia" value={editFormInst.provincia} onChange={e => setEditFormInst(f => ({ ...f, provincia: e.target.value }))} />
                            <select className={selectCls} value={editFormInst.stato} onChange={e => setEditFormInst(f => ({ ...f, stato: e.target.value as any }))}>
                              <option value="in_attesa">In attesa</option>
                              <option value="approvato">Approvato</option>
                              <option value="rifiutato">Non abilitato</option>
                            </select>
                            <input type="number" className={inputCls} placeholder="Saldo pratiche" value={editFormInst.saldoPratiche} onChange={e => setEditFormInst(f => ({ ...f, saldoPratiche: Number(e.target.value) }))} />
                            <label className={`${inputCls} col-span-3 flex items-center gap-2 cursor-pointer text-white/70 hover:text-white transition-colors`}>
                              <input type="checkbox" checked={editFormInst.consensoWhatsApp ?? false} onChange={e => setEditFormInst(f => ({ ...f, consensoWhatsApp: e.target.checked }))} className="w-4 h-4 accent-[#f5c518] cursor-pointer" />
                              <span className="text-sm">📱 Consenso WhatsApp (GDPR)</span>
                            </label>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" onClick={() => modificaInstallatore.mutate({ id: inst.id, ...editFormInst })} className="bg-blue-600 hover:bg-blue-500 text-white font-bold">Salva</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditInstId(null)} className="text-white/50">Annulla</Button>
                          </div>
                        </div>
                      )}

                      {/* Pannello espanso: pack, singole, listino, pratiche */}
                      {expandedInstId === inst.id && (
                        <div className="animate-slide-down px-5 pb-5 pt-3 bg-black/20 border-t border-[#f5c518]/10">
                          {pannelloLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              {[0,1,2,3].map(i => (
                                <div key={i} className="skeleton-shimmer h-28 rounded-xl" />
                              ))}
                            </div>
                          ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                            {/* PACK ACQUISTATI */}
                            <div className="bg-[#1a4a2e]/60 rounded-xl p-4 border border-[#f5c518]/10">
                              <h4 className="text-[#f5c518] text-xs font-bold uppercase tracking-wide mb-3 flex items-center gap-2">
                                <ShoppingCart className="w-3.5 h-3.5" /> Pack Acquistati
                              </h4>
                              {(() => {
                                const packNames: Record<string, string> = { pack1: "Pack 1", pack2: "Pack 2", pack3: "Pack 3" };
                                if (packInstallatore.length === 0) {
                                  return <p className="text-white/30 text-xs">Nessun pack acquistato.</p>;
                                }
                                // Mostra OGNI ordine separatamente (non aggregare)
                                return (
                                  <div className="space-y-2">
                                    {packInstallatore.map((o: any) => {
                                      const resIncluse = (o as any).pratiche_incluse_residenziali ?? PRATICHE_RES_PER_PACK[o.packId] ?? 0;
                                      const busIncluse = (o as any).pratiche_incluse_business ?? PRATICHE_BUS_PER_PACK[o.packId] ?? 0;
                                      const resUsate = (o as any).pratiche_usate_residenziali ?? 0;
                                      const busUsate = (o as any).pratiche_usate_business ?? 0;
                                      const totIncluse = o.pratiche_incluse ?? PRATICHE_PER_PACK[o.packId] ?? 0;
                                      const totUsate = o.pratiche_usate ?? 0;
                                      const perc = totIncluse > 0 ? Math.round((totUsate / totIncluse) * 100) : 0;
                                      const isCustom = o.packId === "custom";
                                      const nome = isCustom
                                        ? (o.nomePacchetto || "Pack Personalizzato")
                                        : (packNames[o.packId] ?? o.packId);
                                      const dataOrdine = new Date(o.createdAt).toLocaleDateString("it-IT");
                                      return (
                                        <div key={o.id} className="bg-black/20 rounded-lg px-3 py-2">
                                          <div className="flex items-center justify-between mb-0.5">
                                            <span className="text-white text-sm font-semibold">{nome}</span>
                                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                                              o.stato === "pagato" ? "text-[#4ade80] bg-[#4ade80]/10" :
                                              o.stato === "annullato" ? "text-red-400 bg-red-400/10" :
                                              "text-[#f5c518] bg-[#f5c518]/10"
                                            }`}>{o.stato}</span>
                                          </div>
                                          <div className="flex items-center justify-between mb-1">
                                            <span className="text-white/30 text-xs">Ordine #{o.id} · {dataOrdine}</span>
                                          </div>
                                          {!isCustom && (
                                            <div className="grid grid-cols-2 gap-2 mb-1.5">
                                              <div className="text-xs">
                                                <span className="text-[#4ade80]">Residenziali:</span>
                                                <span className="text-white/70 ml-1">{resUsate}/{resIncluse}</span>
                                              </div>
                                              <div className="text-xs">
                                                <span className="text-[#f5c518]">Business:</span>
                                                <span className="text-white/70 ml-1">{busUsate}/{busIncluse}</span>
                                              </div>
                                            </div>
                                          )}
                                          {isCustom && (
                                            <div className="grid grid-cols-2 gap-2 mb-1.5">
                                              <div className="text-xs">
                                                <span className="text-[#4ade80]">Residenziali:</span>
                                                <span className="text-white/70 ml-1">{resUsate}/{resIncluse}</span>
                                              </div>
                                              <div className="text-xs">
                                                <span className="text-[#f5c518]">Business:</span>
                                                <span className="text-white/70 ml-1">{busUsate}/{busIncluse}</span>
                                              </div>
                                            </div>
                                          )}
                                          <div className="w-full bg-white/10 rounded-full h-1.5">
                                            <div className={`h-1.5 rounded-full transition-all ${isCustom ? "bg-purple-400" : "bg-[#f5c518]"}`} style={{ width: `${perc}%` }} />
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })()}
                            </div>

                            {/* PACCHETTI ASSEGNATI */}
                            <div className="bg-purple-900/30 rounded-xl p-4 border border-purple-400/20">
                              <h4 className="text-purple-300 text-xs font-bold uppercase tracking-wide mb-3 flex items-center gap-2">
                                <Gift className="w-3.5 h-3.5" /> Pacchetti Assegnati
                              </h4>
                              {(() => {
                                const packNames: Record<string, string> = { pack1: "Pack 1", pack2: "Pack 2", pack3: "Pack 3" };
                                if (packAssegnati.length === 0) {
                                  return <p className="text-white/30 text-xs">Nessun pacchetto assegnato.</p>;
                                }
                                return (
                                  <div className="space-y-2">
                                    {packAssegnati.map((o: any) => {
                                      const resIncluse = (o as any).pratiche_incluse_residenziali ?? 0;
                                      const busIncluse = (o as any).pratiche_incluse_business ?? 0;
                                      const resUsate = (o as any).pratiche_usate_residenziali ?? 0;
                                      const busUsate = (o as any).pratiche_usate_business ?? 0;
                                      const totIncluse = o.pratiche_incluse ?? 0;
                                      const totUsate = o.pratiche_usate ?? 0;
                                      const perc = totIncluse > 0 ? Math.round((totUsate / totIncluse) * 100) : 0;
                                      const nome = o.nomePacchetto || packNames[o.packId] || o.packId;
                                      const dataOrdine = new Date(o.createdAt).toLocaleDateString("it-IT");
                                      return (
                                        <div key={o.id} className="bg-black/20 rounded-lg px-3 py-2">
                                          <div className="flex items-center justify-between mb-0.5">
                                            <span className="text-white text-sm font-semibold">{nome}</span>
                                            <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold text-purple-300 bg-purple-400/20">Assegnato</span>
                                          </div>
                                          <div className="flex items-center justify-between mb-1">
                                            <span className="text-white/30 text-xs">Ordine #{o.id} · {dataOrdine}</span>
                                          </div>
                                          {(resIncluse > 0 || busIncluse > 0) && (
                                            <div className="grid grid-cols-2 gap-2 mb-1.5">
                                              {resIncluse > 0 && <div className="text-xs"><span className="text-[#4ade80]">Residenziali:</span><span className="text-white/70 ml-1">{resUsate}/{resIncluse}</span></div>}
                                              {busIncluse > 0 && <div className="text-xs"><span className="text-[#f5c518]">Business:</span><span className="text-white/70 ml-1">{busUsate}/{busIncluse}</span></div>}
                                            </div>
                                          )}
                                          <div className="w-full bg-white/10 rounded-full h-1.5">
                                            <div className="h-1.5 rounded-full transition-all bg-purple-400" style={{ width: `${perc}%` }} />
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })()}
                            </div>

                            {/* PRATICHE SINGOLE */}
                            <div className="bg-[#1a4a2e]/60 rounded-xl p-4 border border-blue-400/10">
                              <h4 className="text-blue-400 text-xs font-bold uppercase tracking-wide mb-3 flex items-center gap-2">
                                <ShoppingCart className="w-3.5 h-3.5" /> Pratiche Singole
                                <span className="ml-auto text-white/40 font-normal normal-case">{ordiniSingoliInst.reduce((s: number, o: any) => s + (o.quantita ?? 1), 0)} acquistate</span>
                              </h4>
                              {ordiniSingoliInst.length === 0 ? (
                                <p className="text-white/30 text-xs">Nessuna pratica singola acquistata.</p>
                              ) : (
                                <div className="space-y-1.5">
                                  {ordiniSingoliInst.map((o: any) => {
                                    // Parsing delle note per mostrare formato leggibile
                                    const noteRaw = o.note ?? "";
                                    let label = `Ordine #${o.id}`;
                                    if (noteRaw) {
                                      // Estrai fascia e tipo dal formato [PRATICHE SINGOLE - Fascia: X kWp [Standard/Business]: €Y]
                                      const matchFascia = noteRaw.match(/Fascia:\s*([^\[]+)/i);
                                      const matchTipo = noteRaw.match(/\[(Standard|Business)\]/i);
                                      if (matchFascia) {
                                        const fascia = matchFascia[1].trim().replace(/prezzoStandard|prezzoCustom/gi, "").trim();
                                        const tipo = matchTipo ? matchTipo[1] : "Standard";
                                        label = `${tipo} · ${fascia}`;
                                      } else {
                                        // Se non matcha il pattern, mostra le note pulite (senza parentesi quadre)
                                        label = noteRaw.replace(/^\[PRATICHE SINGOLE\s*-?\s*/i, "").replace(/\]$/g, "").trim() || `Ordine #${o.id}`;
                                      }
                                    }
                                    return (
                                      <div key={o.id} className="flex items-center justify-between bg-black/20 rounded-lg px-3 py-2">
                                        <span className="text-white text-sm truncate max-w-[180px]" title={noteRaw}>{label}</span>
                                        <div className="flex items-center gap-2">
                                          <span className="text-white/60 text-xs font-semibold">€{Number(o.importo).toLocaleString("it-IT")}</span>
                                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${o.stato === "pagato" ? "text-[#4ade80] bg-[#4ade80]/10" : o.stato === "annullato" ? "text-red-400 bg-red-400/10" : "text-[#f5c518] bg-[#f5c518]/10"}`}>{o.stato}</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            {/* LISTINO PERSONALIZZATO */}
                            <div className="bg-[#1a4a2e]/60 rounded-xl p-4 border border-[#4ade80]/10">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-[#4ade80] text-xs font-bold uppercase tracking-wide flex items-center gap-2">
                                  <KeyRound className="w-3.5 h-3.5" /> Listino Personalizzato
                                </h4>
                                <div className="flex gap-1.5">
                                  <button onClick={() => setShowListinoModal(true)}
                                    className="text-xs px-2.5 py-1 rounded-lg bg-[#4ade80]/15 text-[#4ade80] hover:bg-[#4ade80]/25 font-semibold transition-colors">
                                    {listinoInst ? "Modifica" : "Crea"}
                                  </button>
                                  {listinoInst && (
                                    <button onClick={() => eliminaListino.mutate({ installatoreId: inst.id })}
                                      className="text-xs px-2.5 py-1 rounded-lg bg-red-400/10 text-red-400 hover:bg-red-400/20 font-semibold transition-colors">
                                      Elimina
                                    </button>
                                  )}
                                </div>
                              </div>
                              {listinoInst ? (
                                <div className="bg-black/20 rounded-lg px-3 py-2.5">
                                  <p className="text-[#4ade80] font-semibold text-sm">{listinoInst.nomeListino}</p>
                                  <p className="text-white/40 text-xs mt-0.5">{Object.keys(listinoInst.prezzi).length} voci personalizzate</p>
                                </div>
                              ) : (
                                <p className="text-white/30 text-xs">Nessun listino. L'installatore vede i prezzi standard.</p>
                              )}
                            </div>

                            {/* PEC */}
                            <div className="bg-[#1a4a2e]/60 rounded-xl p-4 border border-orange-400/10">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-orange-400 text-xs font-bold uppercase tracking-wide flex items-center gap-2">
                                  <Mail className="w-3.5 h-3.5" /> PEC
                                </h4>
                                <button onClick={() => setShowPecModal(inst.id)}
                                  className="text-xs px-2.5 py-1 rounded-lg bg-orange-400/15 text-orange-400 hover:bg-orange-400/25 font-semibold transition-colors">
                                  Gestisci
                                </button>
                              </div>
                              <div className="space-y-1.5">
                                {(pecList || []).map((pec: any) => (
                                  <div key={pec.id} className="flex items-center justify-between bg-black/20 rounded-lg px-3 py-2">
                                    <div className="min-w-0">
                                      <p className="text-white text-sm truncate">{pec.email}</p>
                                      <p className="text-white/40 text-xs">{pec.verificato ? "✓ Verificata" : "⏳ Non verificata"}</p>
                                    </div>
                                    <button onClick={() => { if (confirm("Eliminare questa PEC?")) eliminaPec.mutate({ id: pec.id }); }}
                                      className="p-1 rounded-lg bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                                {(!pecList || pecList.length === 0) && (
                                  <p className="text-white/30 text-xs">Nessuna PEC configurata.</p>
                                )}
                              </div>
                            </div>

                            {/* PACCHETTI */}
                            <div className="bg-[#1a4a2e]/60 rounded-xl p-4 border border-purple-400/10">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-purple-400 text-xs font-bold uppercase tracking-wide flex items-center gap-2">
                                  <Package className="w-3.5 h-3.5" /> Assegna Pacchetti
                                </h4>
                                <button onClick={() => setShowPackModal(inst.id)}
                                  className="text-xs px-2.5 py-1 rounded-lg bg-purple-400/15 text-purple-400 hover:bg-purple-400/25 font-semibold transition-colors">
                                  Assegna
                                </button>
                              </div>
                              <p className="text-white/40 text-xs">Assegna nuovi pacchetti all'installatore (non modificabili dopo l'acquisto).</p>
                            </div>

                            {/* CODICE PROMO PERSONALE */}
                            <div className="bg-[#1a4a2e]/60 rounded-xl p-4 border border-[#f5c518]/20">
                              <h4 className="text-[#f5c518] text-xs font-bold uppercase tracking-wide mb-3 flex items-center gap-2">
                                <Tag className="w-3.5 h-3.5" /> Codice Promo Personale
                              </h4>
                              {inst.codicePromo ? (
                                <div className="bg-black/30 rounded-lg px-3 py-2.5 flex items-center justify-between gap-3">
                                  <span className="font-mono font-black text-[#f5c518] text-lg tracking-widest">{inst.codicePromo}</span>
                                  <button
                                    onClick={() => { navigator.clipboard.writeText(inst.codicePromo!); toast.success("Codice copiato!"); }}
                                    className="text-xs px-2.5 py-1 rounded-lg bg-[#f5c518]/15 text-[#f5c518] hover:bg-[#f5c518]/25 font-semibold transition-colors">
                                    Copia
                                  </button>
                                </div>
                              ) : (
                                <p className="text-white/30 text-xs">Nessun codice promo assegnato.</p>
                              )}
                            </div>

                            {/* PRATICHE */}
                            <div className="bg-[#1a4a2e]/60 rounded-xl p-4 border border-white/10">
                              <h4 className="text-white/60 text-xs font-bold uppercase tracking-wide mb-3 flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5" /> Pratiche di {inst.ragioneSociale}
                                <span className="ml-auto text-white/30 font-normal normal-case">{praticheInstallatore?.length ?? 0} totali</span>
                              </h4>
                              {!praticheInstallatore || praticheInstallatore.length === 0 ? (
                                <p className="text-white/30 text-xs">Nessuna pratica trovata.</p>
                              ) : (
                                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                  {praticheInstallatore.map(p => (
                                    <div key={p.id} className="flex items-center justify-between bg-black/20 rounded-lg px-3 py-2">
                                      <div className="min-w-0">
                                        <p className="text-white text-sm truncate">{p.nomeTitolare ?? `Pratica #${p.id}`}</p>
                                        <p className="text-white/40 text-xs">{p.comuneImpianto ?? "—"} · {p.tipoIter?.replace(/_/g, " ") ?? "—"}</p>
                                      </div>
                                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ml-2 ${STATO_COLORS_PRATICA[p.stato]}`}>{p.stato.replace("_", " ")}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        {/* ── ORDINI ── */}
        {/* ── ORDINI ── */}
        {tab === "ordini" && (
          <div>
            {/* FILTRO RAPIDO - Ordini senza userId */}
            {(ordini as any[]).filter((o: any) => !o.userId).length > 0 && (
              <div className="bg-orange-500/10 border border-orange-400/30 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-400" />
                    <span className="text-orange-300 font-semibold text-sm">⚠️ {(ordini as any[]).filter((o: any) => !o.userId).length} ordini senza userId</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setShowRipristinaOrdini(!showRipristinaOrdini)} className="text-orange-300 hover:bg-orange-500/20 text-xs">{showRipristinaOrdini ? "Nascondi" : "Visualizza"}</Button>
                    <Button size="sm" onClick={() => setShowRipristinaOrdini(true)} className="bg-orange-500 text-white hover:bg-orange-500/90 text-xs font-bold">Ripristina</Button>
                  </div>
                </div>
                {showRipristinaOrdini && (
                  <div className="space-y-2 mt-3 pt-3 border-t border-orange-400/20 max-h-64 overflow-y-auto">
                    {(ordini as any[]).filter((o: any) => !o.userId).map((o: any) => (
                      <div key={o.id} className="flex items-center gap-2 bg-black/20 p-2 rounded">
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-semibold truncate">Ordine #{o.id} - {o.emailAcquirente}</p>
                          <p className="text-white/40 text-xs">{o.packId} • {new Date(o.createdAt).toLocaleDateString('it-IT')}</p>
                        </div>
                        <input type="number" placeholder="UserId" id={`userId_ordine_${o.id}`} className="w-20 bg-[#1a4a2e] border border-white/20 text-white rounded px-2 py-1 text-xs" />
                        <Button size="sm" onClick={() => {
                          const userId = Number((document.getElementById(`userId_ordine_${o.id}`) as HTMLInputElement)?.value);
                          if (!userId) { toast.error("Inserisci UserId"); return; }
                          associaUserId.mutate({ installatoreId: o.installatoreId, userId });
                        }} disabled={associaUserId.isPending} className="bg-green-600 text-white hover:bg-green-600/90 text-xs px-2">{associaUserId.isPending ? "..." : "OK"}</Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}


            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-[#f5c518]">Ordini Pack</h2>
                <p className="text-white/40 text-sm mt-0.5">{ordiniFiltered.length} ordini pack{ordiniSingoli.length > 0 ? ` · ${ordiniSingoli.length} pratiche singole` : ""}</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {/* Ricerca nome */}
                <input type="text" placeholder="Cerca nome o email..." value={ricercaNomeOrdini} onChange={e => setRicercaNomeOrdini(e.target.value)} className="bg-[#0e3320] border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-medium" />
                {/* Filtro installatore */}
                <select value={filtroInstallatoreOrdini} onChange={e => setFiltroInstallatoreOrdini(e.target.value)} className="bg-[#0e3320] border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-medium">
                  <option value="">— Tutti gli installatori —</option>
                  {(installatoriDropdown as any[]).map((row: any) => { const inst = row.installatore ?? row; return <option key={inst.id} value={String(inst.id)}>{inst.ragioneSociale || inst.nome || `Installatore #${inst.id}`}</option>; })}
                </select>
                {/* Filtro stato */}
                <select value={filtroStatoOrdini} onChange={e => setFiltroStatoOrdini(e.target.value)} className="bg-[#0e3320] border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-medium">
                  <option value="">— Tutti gli stati —</option>
                  <option value="pagato">Pagato</option>
                  <option value="in_attesa">In Attesa</option>
                  <option value="annullato">Annullato</option>
                </select>
                {/* Ordinamento */}
                <div className="flex items-center gap-1 bg-[#0e3320] border border-white/10 rounded-lg p-1">
                  <button onClick={() => setSortOrdini("data")}
                    className={`text-xs px-3 py-1.5 rounded-md font-semibold transition-all ${
                      sortOrdini === "data" ? "bg-[#f5c518] text-[#1a4a2e]" : "text-white/50 hover:text-white"
                    }`}>Data</button>
                  <button onClick={() => setSortOrdini("importo")}
                    className={`text-xs px-3 py-1.5 rounded-md font-semibold transition-all ${
                      sortOrdini === "importo" ? "bg-[#f5c518] text-[#1a4a2e]" : "text-white/50 hover:text-white"
                    }`}>Importo</button>
                </div>
                <Button size="sm" onClick={() => {
                  const csv = [['ID', 'Data', 'Installatore', 'Nome Acquirente', 'Email', 'Pack', 'Importo', 'Stato'].join(','), ...ordiniFiltered.map(o => [o.id, new Date(o.createdAt).toLocaleDateString('it-IT'), (installatoriDropdown as any[]).find((inst: any) => inst.id === o.installatoreId)?.ragioneSociale || 'N/A', o.nomeAcquirente, o.emailAcquirente, o.packId, o.importo, o.stato].map(v => `"${v}"`).join(','))].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.download = `ordini_${new Date().toISOString().split('T')[0]}.csv`;
                  link.click();
                }}
                  className="bg-green-600 text-white hover:bg-green-600/90 font-bold text-xs">
                  <Download className="w-4 h-4 mr-1" /> Esporta CSV
                </Button>
                <Button size="sm" onClick={() => setShowCreaOrdine(!showCreaOrdine)}
                  className="bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-bold">
                  <Plus className="w-4 h-4 mr-1" /> Nuovo Ordine
                </Button>
              </div>
            </div>

            {/* Form crea ordine */}
            {showCreaOrdine && (
              <div className="bg-[#0e3320] rounded-2xl p-5 border border-[#f5c518]/30 mb-6 space-y-3">
                <h3 className="text-[#f5c518] font-bold text-sm">Nuovo Ordine</h3>
                <div className="grid grid-cols-2 gap-3">
                  <input className={`${inputCls} col-span-2`} placeholder="Nome acquirente *" value={formOrdine.nomeAcquirente} onChange={e => setFormOrdine(f => ({ ...f, nomeAcquirente: e.target.value }))} />
                  <input className={inputCls} placeholder="Email *" value={formOrdine.emailAcquirente} onChange={e => setFormOrdine(f => ({ ...f, emailAcquirente: e.target.value }))} />
                  <input className={inputCls} placeholder="Telefono" value={formOrdine.telefonoAcquirente} onChange={e => setFormOrdine(f => ({ ...f, telefonoAcquirente: e.target.value }))} />
                  <input className={inputCls} placeholder="Ragione sociale" value={formOrdine.ragioneSocialeAcquirente} onChange={e => setFormOrdine(f => ({ ...f, ragioneSocialeAcquirente: e.target.value }))} />
                  <select className={selectCls} value={formOrdine.installatoreId} onChange={e => setFormOrdine(f => ({ ...f, installatoreId: e.target.value }))}>
                    <option value="">— Installatore (opz.) —</option>
                    {(installatoriDropdown as any[]).map((row: any) => { const inst = row.installatore ?? row; return <option key={inst.id} value={String(inst.id)}>{inst.ragioneSociale || inst.nome || `Installatore #${inst.id}`}</option>; })}
                  </select>
                  <select className={selectCls} value={formOrdine.packId} onChange={e => setFormOrdine(f => ({ ...f, packId: e.target.value as any }))}>
                    <option value="pack1">Pack 1 — €2.000</option>
                    <option value="pack2">Pack 2 — €3.150</option>
                    <option value="pack3">Pack 3 — €5.100</option>
                  </select>
                  <select className={selectCls} value={formOrdine.metodoPagamento} onChange={e => setFormOrdine(f => ({ ...f, metodoPagamento: e.target.value as any }))}>
                    <option value="bonifico">Bonifico</option>
                    <option value="paypal">PayPal</option>
                  </select>
                  <input className={`${inputCls} col-span-2`} placeholder="Note" value={formOrdine.note} onChange={e => setFormOrdine(f => ({ ...f, note: e.target.value }))} />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => creaOrdine.mutate({ ...formOrdine, installatoreId: formOrdine.installatoreId ? Number(formOrdine.installatoreId) : undefined, stato: "pagato" })} disabled={!formOrdine.nomeAcquirente || !formOrdine.emailAcquirente} className="bg-[#4ade80] text-[#1a4a2e] hover:bg-[#4ade80]/90 font-bold">Crea</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowCreaOrdine(false); resetFormOrdine(); }} className="text-white/50">Annulla</Button>
                </div>
              </div>
            )}

            {/* Toolbar selezione ordini */}
            {selOrdini.size > 0 && (
              <div className="flex items-center gap-3 mb-3 px-4 py-2.5 bg-[#f5c518]/10 border border-[#f5c518]/30 rounded-xl">
                <span className="text-[#f5c518] font-bold text-sm">{selOrdini.size} selezionati</span>
                <Button size="sm" variant="ghost" onClick={() => setSelOrdini(new Set())} className="text-white/50 text-xs">Deseleziona tutti</Button>
              </div>
            )}

            {/* Tabella ordini */}
            <div className="bg-[#0e3320] rounded-2xl border border-white/10 overflow-hidden">
              {/* Header colonne */}
              <div className="grid grid-cols-[auto_2fr_1.5fr_1fr_2fr_auto] gap-4 px-5 py-3 border-b border-white/10 text-white/40 text-xs font-semibold uppercase tracking-wide">
                <input type="checkbox" className="w-4 h-4 accent-[#f5c518] cursor-pointer" checked={ordiniFiltered.length > 0 && selOrdini.size === ordiniFiltered.length} onChange={e => setSelOrdini(e.target.checked ? new Set(ordiniFiltered.map(o => o.id)) : new Set())} />
                <span>Installatore / Acquirente</span>
                <span>Pack</span>
                <span>Stato</span>
                <span>Utilizzo Pratiche</span>
                <span>Azioni</span>
              </div>

              {ordiniFiltered.length === 0 ? (
                <div className="px-5 py-10 text-center text-white/30">Nessun ordine trovato.</div>
              ) : (
                <div className="divide-y divide-white/5">
                  {(() => {
                    // Mappa dinamica: slug → { nome, prezzo } dal DB (fallback ai valori statici)
                    const packMap: Record<string, { nome: string; prezzo: number }> = {
                      pack1: { nome: "Pack 1", prezzo: 2000 },
                      pack2: { nome: "Pack 2", prezzo: 3150 },
                      pack3: { nome: "Pack 3", prezzo: 5100 },
                    };
                    (packConfigOrdini as any[]).forEach((p: any) => {
                      if (p.slug) packMap[p.slug] = { nome: p.nome || p.slug, prezzo: parseFloat(p.prezzo || "0") };
                    });
                    return [...ordiniFiltered].sort((a, b) => {
                      if (sortOrdini === "importo") {
                        const ia = parseFloat((a as any).importo || String(packMap[a.packId]?.prezzo ?? 0));
                        const ib = parseFloat((b as any).importo || String(packMap[b.packId]?.prezzo ?? 0));
                        return ib - ia;
                      }
                      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                    }).map((o) => {
                    const packInfo = packMap[o.packId];
                    const nomePackDisplay = (o as any).isSingolo ? (o.note ? `Singola: ${(o.note as string).split('\n')[0].substring(0, 40)}` : "Pratica Singola") : (packInfo?.nome ?? o.packId ?? `Ordine #${o.id}`);
                    const importoDisplay = parseFloat((o as any).importo || String(packInfo?.prezzo ?? 0));
                    const resIncluse = (o as any).pratiche_incluse_residenziali ?? PRATICHE_RES_PER_PACK[o.packId] ?? 0;
                    const busIncluse = (o as any).pratiche_incluse_business ?? PRATICHE_BUS_PER_PACK[o.packId] ?? 0;
                    const resUsate = (o as any).pratiche_usate_residenziali ?? 0;
                    const busUsate = (o as any).pratiche_usate_business ?? 0;
                    const totIncluse = o.pratiche_incluse ?? PRATICHE_PER_PACK[o.packId] ?? 0;
                    const totUsate = o.pratiche_usate ?? 0;
                    const percRes = resIncluse > 0 ? Math.round((resUsate / resIncluse) * 100) : 0;
                    const percBus = busIncluse > 0 ? Math.round((busUsate / busIncluse) * 100) : 0;
                    return (
                      <div key={o.id}>
                        {/* Riga principale */}
                        <div className="grid grid-cols-[auto_2fr_1.5fr_1fr_2fr_auto] gap-4 px-5 py-4 items-center hover:bg-white/3 transition-colors cursor-pointer" onClick={() => setExpandedOrdineId(expandedOrdineId === o.id ? null : o.id)}>
                          <input type="checkbox" className="w-4 h-4 accent-[#f5c518] cursor-pointer" checked={selOrdini.has(o.id)} onChange={() => toggleSelOrdine(o.id)} />
                          {/* Installatore */}
                          <div className="min-w-0">
                            <p className="text-white font-semibold text-sm truncate">{o.ragioneSocialeAcquirente || o.nomeAcquirente || "—"}</p>
                            <p className="text-white/40 text-xs truncate">{o.emailAcquirente} · {new Date(o.createdAt).toLocaleDateString("it-IT")}</p>
                          </div>
                          {/* Pack + Importo */}
                          <div>
                            <p className="text-white font-semibold text-sm">{nomePackDisplay}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {importoDisplay > 0 && (
                                <span className="text-[#f5c518] font-black text-base">€{importoDisplay.toLocaleString("it-IT")}</span>
                              )}
                              <span className="text-white/30 text-xs">{o.metodoPagamento === "paypal" ? "PayPal" : "Bonifico"}</span>
                            </div>
                          </div>
                          {/* Stato */}
                          <div>
                            <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full font-semibold border ${
                              o.stato === "pagato" ? "text-[#4ade80] bg-[#4ade80]/10 border-[#4ade80]/20" :
                              o.stato === "annullato" ? "text-red-400 bg-red-400/10 border-red-400/20" :
                              "text-[#f5c518] bg-[#f5c518]/10 border-[#f5c518]/20"
                            }`}>
                              {o.stato === "pagato" ? "✓ Pagato" : o.stato === "annullato" ? "✗ Annullato" : "⏳ In attesa"}
                            </span>
                          </div>
                          {/* Utilizzo pratiche */}
                          <div className="space-y-1.5">
                            <div>
                              <div className="flex justify-between text-xs mb-0.5">
                                <span className="text-[#4ade80]/80">Res.</span>
                                <span className="text-white/60">{resUsate}/{resIncluse}</span>
                              </div>
                              <div className="w-full bg-white/10 rounded-full h-1.5">
                                <div className="bg-[#4ade80] h-1.5 rounded-full transition-all" style={{ width: `${percRes}%` }} />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-xs mb-0.5">
                                <span className="text-[#f5c518]/80">Bus.</span>
                                <span className="text-white/60">{busUsate}/{busIncluse}</span>
                              </div>
                              <div className="w-full bg-white/10 rounded-full h-1.5">
                                <div className="bg-[#f5c518] h-1.5 rounded-full transition-all" style={{ width: `${percBus}%` }} />
                              </div>
                            </div>
                          </div>
                          {/* Azioni */}
                          <div className="flex items-center gap-1">
                            {o.stato !== "pagato" && (
                              <button onClick={() => aggiornaOrdine.mutate({ id: o.id, stato: "pagato" })}
                                className="p-1.5 rounded-lg bg-[#4ade80]/10 text-[#4ade80] hover:bg-[#4ade80]/20 transition-colors" title="Segna come pagato">
                                <CheckCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {o.stato !== "annullato" && (
                              <button onClick={() => aggiornaOrdine.mutate({ id: o.id, stato: "annullato" })}
                                className="p-1.5 rounded-lg bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors" title="Annulla ordine">
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button onClick={() => { setEditOrdineId(o.id); setEditFormOrdine({ stato: o.stato, note: o.note ?? "", pratiche_incluse: o.pratiche_incluse ?? PRATICHE_PER_PACK[o.packId] ?? 0, pratiche_usate: o.pratiche_usate ?? 0 }); }}
                              className="p-1.5 rounded-lg bg-blue-400/10 text-blue-400 hover:bg-blue-400/20 transition-colors" title="Modifica">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setDeleteModalOrdineId(o.id)}
                              className="p-1.5 rounded-lg bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors" title="Elimina">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            {/* Download PDF ricevuta */}
                            <a
                              href={`/api/ordini/${o.id}/ricevuta.pdf`}
                              download
                              className="p-1.5 rounded-lg bg-[#f5c518]/10 text-[#f5c518] hover:bg-[#f5c518]/20 transition-colors inline-flex"
                              title="Scarica ricevuta PDF"
                            >
                              <FileDown className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>

                        {/* Sezione espandibile: Pack e Pratiche Singole */}
                        {expandedOrdineId === o.id && (
                          <div className="px-5 pb-4 pt-2 bg-white/5 border-t border-white/10">
                            <p className="text-white/60 text-xs font-semibold mb-3">📦 Dettagli Ordine</p>
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-white/50">Installatore ID:</span>
                                <span className="text-white">{o.installatoreId ?? "—"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-white/50">Credito Totale:</span>
                                <span className="text-[#f5c518] font-bold">€{(o as any).creditoTotale?.toLocaleString("it-IT") ?? importoDisplay.toLocaleString("it-IT")}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-white/50">Credito Residuo:</span>
                                <span className={`font-bold ${(o as any).creditoResiduo < 0 ? "text-red-400" : "text-[#4ade80]"}`}>
                                  €{((o as any).creditoResiduo ?? importoDisplay).toLocaleString("it-IT")}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-white/50">Pratiche Residenziali:</span>
                                <span className="text-white">{resUsate}/{resIncluse}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-white/50">Pratiche Business:</span>
                                <span className="text-white">{busUsate}/{busIncluse}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Form modifica inline */}
                        {editOrdineId === o.id && (
                          <div className="px-5 pb-4 pt-2 bg-blue-900/10 border-t border-blue-400/20">
                            <p className="text-blue-400 text-xs font-bold mb-3">Modifica ordine</p>
                            <div className="grid grid-cols-2 gap-3">
                              <select className={selectCls} value={editFormOrdine.stato} onChange={e => setEditFormOrdine(f => ({ ...f, stato: e.target.value as any }))}>
                                <option value="in_attesa">In attesa</option>
                                <option value="pagato">Pagato</option>
                                <option value="annullato">Annullato</option>
                              </select>
                              <input type="number" className={inputCls} placeholder="Pratiche incluse" value={editFormOrdine.pratiche_incluse} onChange={e => setEditFormOrdine(f => ({ ...f, pratiche_incluse: Number(e.target.value) }))} />
                              <input type="number" className={inputCls} placeholder="Pratiche usate" value={editFormOrdine.pratiche_usate} onChange={e => setEditFormOrdine(f => ({ ...f, pratiche_usate: Number(e.target.value) }))} />
                              <input className={inputCls} placeholder="Note" value={editFormOrdine.note} onChange={e => setEditFormOrdine(f => ({ ...f, note: e.target.value }))} />
                            </div>
                            <div className="flex gap-2 mt-3">
                              <Button size="sm" onClick={() => modificaOrdine.mutate({ id: o.id, ...editFormOrdine })} className="bg-blue-600 hover:bg-blue-500 text-white font-bold">Salva</Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditOrdineId(null)} className="text-white/50">Annulla</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                    });
                  })()}
                </div>
              )}
            </div>

            {/* ── SEZIONE PRATICHE SINGOLE ── */}
            {ordiniSingoli.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-black text-[#f5c518] flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" /> Pratiche Singole
                    <span className="text-white/40 text-sm font-normal ml-1">{ordiniSingoli.length} richieste</span>
                  </h3>
                </div>
                <div className="bg-[#0e3320] rounded-2xl border border-white/10 overflow-hidden">
                  {/* Header colonne */}
                  <div className="grid grid-cols-[2fr_1.5fr_1fr_auto] gap-4 px-5 py-2 border-b border-white/10 text-white/30 text-xs font-semibold uppercase tracking-wider">
                    <span>Installatore / Descrizione</span>
                    <span>Importo</span>
                    <span>Stato</span>
                    <span>Azioni</span>
                  </div>
                  <div className="divide-y divide-white/5">
                    {ordiniSingoli.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((o: any) => {
                      const importoSingolo = parseFloat(o.importo || "0");
                      return (
                        <div key={o.id}>
                          <div className="grid grid-cols-[2fr_1.5fr_1fr_auto] gap-4 px-5 py-4 items-center hover:bg-white/3 transition-colors">
                            {/* Installatore */}
                            <div className="min-w-0">
                              <p className="text-white font-semibold text-sm">Ordine #{o.id}</p>
                              <p className="text-white/60 text-xs truncate">{o.ragioneSocialeAcquirente || o.nomeAcquirente || "—"}</p>
                              <p className="text-white/40 text-xs truncate">{o.emailAcquirente} · {new Date(o.createdAt).toLocaleDateString("it-IT")}</p>
                              {o.note && <p className="text-white/25 text-xs mt-0.5 truncate">{o.note.substring(0, 100)}</p>}
                            </div>
                            {/* Importo */}
                            <div>
                              {importoSingolo > 0 ? (
                                <span className="text-[#f5c518] font-black text-base">€{importoSingolo.toLocaleString("it-IT")}</span>
                              ) : (
                                <span className="text-white/30 text-xs">Da definire</span>
                              )}
                            </div>
                            {/* Stato */}
                            <div>
                              <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full font-semibold border ${
                                o.stato === "pagato" ? "text-[#4ade80] bg-[#4ade80]/10 border-[#4ade80]/20" :
                                o.stato === "annullato" ? "text-red-400 bg-red-400/10 border-red-400/20" :
                                "text-[#f5c518] bg-[#f5c518]/10 border-[#f5c518]/20"
                              }`}>
                                {o.stato === "pagato" ? "✓ Pagato" : o.stato === "annullato" ? "✗ Annullato" : "⏳ In attesa"}
                              </span>
                            </div>
                            {/* Azioni */}
                            <div className="flex items-center gap-1">
                              {o.stato !== "pagato" && (
                                <button onClick={() => aggiornaOrdine.mutate({ id: o.id, stato: "pagato" })}
                                  className="p-1.5 rounded-lg bg-[#4ade80]/10 text-[#4ade80] hover:bg-[#4ade80]/20 transition-colors" title="Segna come pagato">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {o.stato !== "annullato" && (
                                <button onClick={() => aggiornaOrdine.mutate({ id: o.id, stato: "annullato" })}
                                  className="p-1.5 rounded-lg bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors" title="Annulla">
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button onClick={() => { setEditOrdineId(o.id); setEditFormOrdine({ stato: o.stato, note: o.note ?? "", pratiche_incluse: 0, pratiche_usate: 0 }); }}
                                className="p-1.5 rounded-lg bg-blue-400/10 text-blue-400 hover:bg-blue-400/20 transition-colors" title="Modifica">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setDeleteModalOrdineId(o.id)}
                                className="p-1.5 rounded-lg bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors" title="Elimina">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <a href={`/api/ordini/${o.id}/ricevuta.pdf`} download
                                className="p-1.5 rounded-lg bg-[#f5c518]/10 text-[#f5c518] hover:bg-[#f5c518]/20 transition-colors inline-flex" title="Scarica PDF">
                                <FileDown className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                          {/* Form modifica inline */}
                          {editOrdineId === o.id && (
                            <div className="px-5 pb-4 pt-2 bg-blue-900/10 border-t border-blue-400/20">
                              <p className="text-blue-400 text-xs font-bold mb-3">Modifica pratica singola</p>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-white/50 text-xs mb-1 block">Stato</label>
                                  <select className="w-full bg-[#0e3320] border border-white/20 text-white rounded-lg px-3 py-2 text-sm" value={editFormOrdine.stato} onChange={e => setEditFormOrdine(f => ({ ...f, stato: e.target.value as any }))}>
                                    <option value="in_attesa">In attesa</option>
                                    <option value="pagato">Pagato</option>
                                    <option value="annullato">Annullato</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-white/50 text-xs mb-1 block">Note</label>
                                  <input className="w-full bg-[#0e3320] border border-white/20 text-white rounded-lg px-3 py-2 text-sm" value={editFormOrdine.note} onChange={e => setEditFormOrdine(f => ({ ...f, note: e.target.value }))} placeholder="Note..." />
                                </div>
                              </div>
                              <div className="flex gap-2 mt-3">
                                <button onClick={() => { aggiornaOrdine.mutate({ id: o.id, stato: editFormOrdine.stato as any, note: editFormOrdine.note }); setEditOrdineId(null); }}
                                  className="bg-[#f5c518] text-[#1a4a2e] font-bold px-4 py-1.5 rounded-lg text-sm">Salva</button>
                                <button onClick={() => setEditOrdineId(null)} className="text-white/50 px-4 py-1.5 rounded-lg text-sm hover:text-white">Annulla</button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {/* ── PRATICHE ── */}
        {tab === "pratiche" && (
          <div>
            {/* FILTRO RAPIDO - Pratiche senza userId */}
            {(pratiche as any[]).filter((p: any) => !p.installatoreId || !(ordini as any[]).find((o: any) => o.id === p.ordineid && o.userId)).length > 0 && (
              <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span className="text-red-300 font-semibold text-sm">⚠️ {(pratiche as any[]).filter((p: any) => !p.installatoreId || !(ordini as any[]).find((o: any) => o.id === p.ordineid && o.userId)).length} pratiche senza user ID</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setShowRipristinaPratiche(!showRipristinaPratiche)} className="text-red-300 hover:bg-red-500/20 text-xs">{showRipristinaPratiche ? "Nascondi" : "Visualizza"}</Button>
                    <Button size="sm" onClick={() => setShowRipristinaPratiche(true)} className="bg-red-600 text-white hover:bg-red-600/90 text-xs font-bold">Ripristina</Button>
                  </div>
                </div>
                {showRipristinaPratiche && (
                  <div className="space-y-2 mt-3 pt-3 border-t border-red-400/20 max-h-64 overflow-y-auto">
                    {(pratiche as any[]).filter((p: any) => !p.installatoreId || !(ordini as any[]).find((o: any) => o.id === p.ordineid && o.userId)).map((p: any) => {
                      const ordine = (ordini as any[]).find((o: any) => o.id === p.ordineid);
                      return (
                        <div key={p.id} className="flex items-center gap-2 bg-black/20 p-2 rounded">
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-semibold truncate">Pratica #{p.id} - {p.nomeTitolare}</p>
                            <p className="text-white/40 text-xs">{p.tipoIter} • {new Date(p.createdAt).toLocaleDateString('it-IT')}</p>
                          </div>
                          <input type="number" placeholder="UserId" id={`userId_pratica_${p.id}`} className="w-20 bg-[#1a4a2e] border border-white/20 text-white rounded px-2 py-1 text-xs" />
                          <Button size="sm" onClick={() => {
                            const userId = Number((document.getElementById(`userId_pratica_${p.id}`) as HTMLInputElement)?.value);
                            if (!userId) { toast.error("Inserisci UserId"); return; }
                            associaUserId.mutate({ installatoreId: ordine?.installatoreId, userId });
                          }} disabled={associaUserId.isPending} className="bg-green-600 text-white hover:bg-green-600/90 text-xs px-2">{associaUserId.isPending ? "..." : "OK"}</Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}


            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl font-black text-[#f5c518]">Pratiche ({praticheFiltered.length})</h2>
              <div className="flex flex-wrap items-center gap-2">
                <Filter className="w-4 h-4 text-white/50" />
                <input type="text" placeholder="Cerca nome titolare..." value={ricercaNomePratiche} onChange={e => setRicercaNomePratiche(e.target.value)} className={selectCls} />
                <select value={filtroInstallatorePratiche} onChange={(e) => setFiltroInstallatorePratiche(e.target.value)} className={selectCls}>
                  <option value="">— Tutti gli installatori —</option>
                  {(installatoriDropdown as any[]).map((row: any) => { const inst = row.installatore ?? row; return <option key={inst.id} value={String(inst.id)}>{inst.ragioneSociale || inst.nome || `Installatore #${inst.id}`}</option>; })}
                </select>
                <select value={filtroPratica} onChange={(e) => setFiltroPratica(e.target.value)} className={selectCls}>
                  {["tutti", "bozza", "inviata", "in_lavorazione", "completata", "rifiutata"].map((s) => (
                    <option key={s} value={s}>{s === "tutti" ? "Tutti gli stati" : s.replace("_", " ")}</option>
                  ))}
                </select>
                <select value={filtroIter} onChange={(e) => setFiltroIter(e.target.value)} className={selectCls}>
                  <option value="tutti">Tutti gli iter</option>
                  {TIPI_ITER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <Button size="sm" onClick={() => {
                  const csv = [['ID', 'Data', 'Installatore', 'Nome Titolare', 'Cognome Titolare', 'Tipo Iter', 'Stato'].join(','), ...praticheFiltered.map(p => [p.id, new Date(p.createdAt).toLocaleDateString('it-IT'), (installatoriDropdown as any[]).find((inst: any) => inst.id === p.installatoreId)?.ragioneSociale || 'N/A', p.nomeTitolare, p.cognomeTitolare, p.tipoIter, p.stato].map(v => `"${v}"`).join(','))].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.download = `pratiche_${new Date().toISOString().split('T')[0]}.csv`;
                  link.click();
                }}
                  className="bg-green-600 text-white hover:bg-green-600/90 font-bold text-xs">
                  <Download className="w-4 h-4 mr-1" /> Esporta CSV
                </Button>
                <Button size="sm" onClick={() => setShowCreaPratica(!showCreaPratica)}
                  className="bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-bold">
                  <Plus className="w-4 h-4 mr-1" /> Nuova
                </Button>
              </div>
            </div>

            {showCreaPratica && (
              <div className="bg-[#0e3320] rounded-2xl p-5 border border-[#f5c518]/30 mb-4 space-y-3">
                <h3 className="text-[#f5c518] font-bold">Crea pratica</h3>
                <div className="grid grid-cols-2 gap-3">
                  <select className={selectCls} value={formPratica.installatoreId} onChange={e => { setFormPratica(f => ({ ...f, installatoreId: e.target.value, ordineid: "" })); }}>
                    <option value="">— Seleziona installatore * —</option>
                    {(installatoriDropdown as any[]).map((row: any) => { const inst = row.installatore ?? row; return <option key={inst.id} value={String(inst.id)}>{inst.ragioneSociale || inst.nome || `Installatore #${inst.id}`}</option>; })}
                  </select>
                  <select className={selectCls} value={formPratica.ordineid} onChange={e => setFormPratica(f => ({ ...f, ordineid: e.target.value }))} disabled={!formPratica.installatoreId}>
                    <option value="">— Seleziona ordine * —</option>
                    {formPratica.installatoreId && (ordini as any[]).filter((o: any) => String(o.installatoreId) === String(formPratica.installatoreId)).map((o: any) => <option key={o.id} value={String(o.id)}>{o.nomePacchetto} (€{parseFloat(o.importo || "0").toLocaleString("it-IT", { maximumFractionDigits: 2 })})</option>)}
                  </select>
                  <select className={selectCls} value={formPratica.tipologia} onChange={e => setFormPratica(f => ({ ...f, tipologia: e.target.value as any }))}>
                    <option value="residenziale">Residenziale</option>
                    <option value="business">Business</option>
                  </select>
                  <select className={`${selectCls} col-span-2`} value={formPratica.tipoIter} onChange={e => setFormPratica(f => ({ ...f, tipoIter: e.target.value as TipoIter }))}>
                    {TIPI_ITER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label} — {o.ente}</option>)}
                  </select>
                  <input className={inputCls} placeholder="Nome titolare" value={formPratica.nomeTitolare} onChange={e => setFormPratica(f => ({ ...f, nomeTitolare: e.target.value }))} />
                  <input className={inputCls} placeholder="Potenza kWp" value={formPratica.potenzaKw} onChange={e => setFormPratica(f => ({ ...f, potenzaKw: e.target.value }))} />
                  <input className={inputCls} placeholder="Comune impianto" value={formPratica.comuneImpianto} onChange={e => setFormPratica(f => ({ ...f, comuneImpianto: e.target.value }))} />
                  <input className={inputCls} placeholder="Provincia" value={formPratica.provinciaImpianto} onChange={e => setFormPratica(f => ({ ...f, provinciaImpianto: e.target.value }))} />
                  <input className={`${inputCls} col-span-2`} placeholder="Indirizzo impianto" value={formPratica.indirizzoImpianto} onChange={e => setFormPratica(f => ({ ...f, indirizzoImpianto: e.target.value }))} />
                  <textarea className={`${inputCls} col-span-2 resize-none`} rows={2} placeholder="Note" value={formPratica.note} onChange={e => setFormPratica(f => ({ ...f, note: e.target.value }))} />
                  <label className="flex items-center gap-2 text-sm text-white/60 col-span-2">
                    <input type="checkbox" checked={formPratica.scalaPack} onChange={e => setFormPratica(f => ({ ...f, scalaPack: e.target.checked }))} className="w-4 h-4" />
                    Scala automaticamente dal pack dell'installatore
                  </label>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => creaPratica.mutate({ ...formPratica, installatoreId: Number(formPratica.installatoreId), ordineid: formPratica.ordineid ? Number(formPratica.ordineid) : undefined, potenzaKw: formPratica.potenzaKw ? formPratica.potenzaKw : undefined })} disabled={!formPratica.installatoreId || !formPratica.ordineid} className="bg-[#4ade80] text-[#1a4a2e] hover:bg-[#4ade80]/90 font-bold">Crea</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowCreaPratica(false); resetFormPratica(); }} className="text-white/50">Annulla</Button>
                </div>
              </div>
            )}

            {/* Toolbar selezione pratiche */}
            {selPratiche.size > 0 && (
              <div className="flex items-center gap-3 mb-3 px-4 py-2.5 bg-[#f5c518]/10 border border-[#f5c518]/30 rounded-xl">
                <span className="text-[#f5c518] font-bold text-sm">{selPratiche.size} pratiche selezionate</span>
                <Button size="sm" variant="ghost" onClick={() => setSelPratiche(new Set())} className="text-white/50 text-xs">Deseleziona tutte</Button>
                <div className="ml-auto flex gap-2">
                  <select className="text-xs bg-[#0e3320] border border-white/20 text-white rounded-lg px-2 py-1" onChange={e => { if (e.target.value) { Array.from(selPratiche).forEach(id => aggiornaPratica.mutate({ id, stato: e.target.value as any })); setSelPratiche(new Set()); } }}>
                    <option value="">Cambia stato...</option>
                    {["bozza","inviata","in_lavorazione","completata","rifiutata"].map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* Checkbox seleziona tutti pratiche */}
            {praticheFiltered.length > 0 && (
              <div className="flex items-center gap-2 px-5 py-2 bg-[#0e3320] rounded-xl border border-white/10 mb-2">
                <input type="checkbox" className="w-4 h-4 accent-[#f5c518] cursor-pointer" checked={selPratiche.size === pratiche.filter(({pratica:p}) => (filtroPratica==="tutti"||p.stato===filtroPratica)&&(filtroIter==="tutti"||p.tipoIter===filtroIter)).length && selPratiche.size > 0} onChange={e => setSelPratiche(e.target.checked ? new Set(pratiche.filter(({pratica:p}) => (filtroPratica==="tutti"||p.stato===filtroPratica)&&(filtroIter==="tutti"||p.tipoIter===filtroIter)).map(({pratica:p}) => p.id)) : new Set())} />
                <span className="text-white/40 text-xs">Seleziona tutte le pratiche filtrate</span>
              </div>
            )}

            <div className="space-y-3">
              {praticheFiltered
                .filter(({ pratica: p }) => filtroPratica === "tutti" || p.stato === filtroPratica)
                .filter(({ pratica: p }) => filtroIter === "tutti" || p.tipoIter === filtroIter)
                .map(({ pratica: p, installatore: inst }) => {
                  const iterDef = p.tipoIter ? getIterDefCustom(p.tipoIter) : null;
                  const currentStepIdx = iterDef ? iterDef.steps.findIndex(s => s.id === p.statoIter) : -1;
                  const currentStep = iterDef && currentStepIdx >= 0 ? iterDef.steps[currentStepIdx] : null;
                  return (
                    <div key={p.id} id={`pratica-${p.id}`} className={`bg-[#0e3320] rounded-2xl border transition-colors ${selPratiche.has(p.id) ? 'border-[#f5c518]/50' : 'border-white/10'}`}>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <input type="checkbox" className="w-4 h-4 accent-[#f5c518] cursor-pointer mt-1 shrink-0" checked={selPratiche.has(p.id)} onChange={() => toggleSelPratica(p.id)} />
                          <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-white font-bold">{p.nomeTitolare ?? `Pratica #${p.id}`}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATO_COLORS_PRATICA[p.stato]}`}>{p.stato.replace("_", " ")}</span>
                            <span className="text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded-full capitalize">{p.tipologia}</span>
                            {iterDef && <span className="text-xs bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded-full">{iterDef.label}</span>}
                          </div>
                          <p className="text-white/60 text-sm">{inst?.ragioneSociale || "—"} · {p.comuneImpianto || "—"} ({p.provinciaImpianto || "—"})</p>
                          <p className="text-white/40 text-xs">{p.potenzaKw ? `${p.potenzaKw} kWp · ` : ""}{new Date(p.createdAt).toLocaleDateString("it-IT")}</p>
                          {currentStep && <p className="text-[#f5c518] text-xs mt-0.5">Step: {currentStep.label} ({currentStepIdx + 1}/{iterDef!.steps.length})</p>}
                          {p.noteAdmin && <p className="text-orange-400 text-xs mt-0.5">Note: {p.noteAdmin}</p>}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 shrink-0">
                          {p.stato === "inviata" && (
                            <Button size="sm" onClick={() => aggiornaPratica.mutate({ id: p.id, stato: "in_lavorazione" })}
                              className="bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-bold text-xs">
                              <Clock className="w-3 h-3 mr-1" /> In Lavorazione
                            </Button>
                          )}
                          {(p.stato === "inviata" || p.stato === "in_lavorazione") && (
                            <>
                              <Button size="sm" onClick={() => aggiornaPratica.mutate({ id: p.id, stato: "completata" })}
                                className="bg-[#4ade80] text-[#1a4a2e] hover:bg-[#4ade80]/90 font-bold text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" /> Completa
                              </Button>
                              <Button size="sm" onClick={() => aggiornaPratica.mutate({ id: p.id, stato: "rifiutata" })}
                                className="bg-red-500/20 text-red-400 hover:bg-red-500/30 font-bold text-xs border border-red-500/30">
                                <XCircle className="w-3 h-3 mr-1" /> Rifiuta
                              </Button>
                            </>
                          )}
                          {iterDef && (
                            <button onClick={() => setExpandedIterPraticaId(expandedIterPraticaId === p.id ? null : p.id)}
                              className="text-white/40 hover:text-white/70 transition-colors p-1" title="Avanza step iter">
                              {expandedIterPraticaId === p.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => { setEditPraticaId(p.id); setEditFormPratica({ tipologia: p.tipologia, tipoIter: (p.tipoIter ?? "connessione_semplificato") as TipoIter, statoIter: p.statoIter ?? "", potenzaKw: p.potenzaKw ?? "", indirizzoImpianto: p.indirizzoImpianto ?? "", comuneImpianto: p.comuneImpianto ?? "", provinciaImpianto: p.provinciaImpianto ?? "", nomeTitolare: p.nomeTitolare ?? "", note: p.note ?? "", noteAdmin: p.noteAdmin ?? "", stato: p.stato }); }} className="text-blue-400 hover:text-blue-300"><Pencil className="w-4 h-4" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => setDeleteModalPraticaId(p.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </div>

                      {/* AVANZA STEP ITER */}
                      {expandedIterPraticaId === p.id && iterDef && (
                        <div className="px-5 pb-5 border-t border-white/5 pt-4">
                          <p className="text-white/50 text-xs font-semibold mb-3">Avanza step iter — {iterDef.label}</p>
                          <div className="flex flex-wrap gap-2">
                            {iterDef.steps.map((step, idx) => (
                              <button key={step.id}
                                onClick={() => aggiornaPratica.mutate({ id: p.id, stato: p.stato, statoIter: step.id })}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                  p.statoIter === step.id
                                    ? "border-[#f5c518] bg-[#f5c518]/15 text-[#f5c518]"
                                    : idx < (iterDef.steps.findIndex(s => s.id === p.statoIter))
                                    ? "border-[#4ade80]/30 bg-[#4ade80]/10 text-[#4ade80]"
                                    : "border-white/15 text-white/40 hover:border-white/30 hover:text-white/60"
                                }`}>
                                {idx + 1}. {step.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* DOCUMENTI CARICATI */}
                      {expandedIterPraticaId === p.id && (
                        <div className="px-5 pb-5 border-t border-white/5 pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-white/50 text-xs font-semibold">Documenti caricati per questa pratica</p>
                            <select
                              className="bg-[#1a4a2e] border border-white/20 text-white/70 text-xs rounded px-2 py-1"
                              value={filtroRevisioneMap[p.id] ?? "tutti"}
                              onChange={e => setFiltroRevisioneMap(m => ({ ...m, [p.id]: e.target.value }))}
                            >
                              <option value="tutti">Tutti</option>
                              <option value="in_attesa">In attesa</option>
                              <option value="approvato">✓ Approvati</option>
                              <option value="rifiutato">✗ Rifiutati</option>
                            </select>
                          </div>
                          {documentiPraticaAdmin.length === 0 ? (
                            <p className="text-white/40 text-xs">Nessun documento caricato</p>
                          ) : (
                            <div className="space-y-2">
                              {documentiPraticaAdmin.filter(d => {
                                const filtro = filtroRevisioneMap[p.id] ?? "tutti";
                                if (filtro === "tutti") return true;
                                return ((d as any).statoRevisione ?? "in_attesa") === filtro;
                              }).map(d => (
                                <div key={d.id} className="flex items-center justify-between bg-white/5 p-2 rounded text-xs gap-3">
                                  <div className="flex-1 min-w-0">
                                    {d.slotNome && (
                                      <p className="text-[#f5c518]/80 font-semibold mb-0.5 truncate">{d.slotNome}</p>
                                    )}
                                    <span className="text-white/50 truncate block">{d.nomeFile}</span>
                                  </div>
                                  <div className="flex flex-col gap-1.5 shrink-0 items-end">
                                    {/* Stato revisione */}
                                    {(d as any).statoRevisione && (d as any).statoRevisione !== 'in_attesa' && (
                                      <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${
                                        (d as any).statoRevisione === 'approvato' ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'
                                      }`}>
                                        {(d as any).statoRevisione === 'approvato' ? '✓ Approvato' : '✗ Rifiutato'}
                                      </span>
                                    )}
                                    {/* Azioni */}
                                    <div className="flex gap-2">
                                      <a href={d.storageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 font-medium">Scarica</a>
                                      <button onClick={() => { if (confirm("Eliminare?")) eliminaDocumento.mutate({ id: d.id }); }} className="text-red-400 hover:text-red-300 font-medium">Elimina</button>
                                    </div>
                                    {/* Revisione */}
                                    <div className="flex flex-col gap-1 w-full">
                                      <input
                                        type="text"
                                        placeholder="Nota revisione (opz.)"
                                        value={notaRevisioneMap[d.id] ?? ""}
                                        onChange={e => setNotaRevisioneMap(m => ({ ...m, [d.id]: e.target.value }))}
                                        className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-white/70 text-xs w-40"
                                      />
                                      <div className="flex gap-1">
                                        <button
                                          onClick={() => revisionaDocumento.mutate({ id: d.id, statoRevisione: 'approvato', notaRevisione: notaRevisioneMap[d.id] ?? undefined })}
                                          className="text-xs px-2 py-0.5 rounded bg-green-400/10 text-green-400 hover:bg-green-400/20 border border-green-400/20 font-semibold">
                                          ✓ Approva
                                        </button>
                                        <button
                                          onClick={() => revisionaDocumento.mutate({ id: d.id, statoRevisione: 'rifiutato', notaRevisione: notaRevisioneMap[d.id] ?? undefined })}
                                          className="text-xs px-2 py-0.5 rounded bg-red-400/10 text-red-400 hover:bg-red-400/20 border border-red-400/20 font-semibold">
                                          ✗ Rifiuta
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {editPraticaId === p.id && (
                        <div className="px-5 pb-5 border-t border-white/10 pt-4 space-y-3">
                          <h4 className="text-[#f5c518] text-sm font-bold">Modifica pratica</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <input className={inputCls} placeholder="Nome titolare" value={editFormPratica.nomeTitolare} onChange={e => setEditFormPratica(f => ({ ...f, nomeTitolare: e.target.value }))} />
                            <select className={selectCls} value={editFormPratica.tipologia} onChange={e => setEditFormPratica(f => ({ ...f, tipologia: e.target.value as any }))}>
                              <option value="residenziale">Residenziale</option>
                              <option value="business">Business</option>
                            </select>
                            <select className={`${selectCls} col-span-2`} value={editFormPratica.tipoIter} onChange={e => setEditFormPratica(f => ({ ...f, tipoIter: e.target.value as TipoIter, statoIter: "" }))}>
                              {TIPI_ITER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                            {editFormPratica.tipoIter && ITER_DEFINIZIONI[editFormPratica.tipoIter] && (
                              <select className={`${selectCls} col-span-2`} value={editFormPratica.statoIter} onChange={e => setEditFormPratica(f => ({ ...f, statoIter: e.target.value }))}>
                                <option value="">— Seleziona step iter —</option>
                                {ITER_DEFINIZIONI[editFormPratica.tipoIter].steps.map((s, i) => (
                                  <option key={s.id} value={s.id}>{i + 1}. {s.label}</option>
                                ))}
                              </select>
                            )}
                            <input className={inputCls} placeholder="Potenza kWp" value={editFormPratica.potenzaKw} onChange={e => setEditFormPratica(f => ({ ...f, potenzaKw: e.target.value }))} />
                            <input className={inputCls} placeholder="Comune" value={editFormPratica.comuneImpianto} onChange={e => setEditFormPratica(f => ({ ...f, comuneImpianto: e.target.value }))} />
                            <input className={inputCls} placeholder="Provincia" value={editFormPratica.provinciaImpianto} onChange={e => setEditFormPratica(f => ({ ...f, provinciaImpianto: e.target.value }))} />
                            <select className={selectCls} value={editFormPratica.stato} onChange={e => setEditFormPratica(f => ({ ...f, stato: e.target.value as any }))}>
                              <option value="bozza">Bozza</option>
                              <option value="inviata">Inviata</option>
                              <option value="in_lavorazione">In lavorazione</option>
                              <option value="completata">Completata</option>
                              <option value="rifiutata">Rifiutata</option>
                            </select>
                            <textarea className={`${inputCls} col-span-2 resize-none`} rows={2} placeholder="Note admin" value={editFormPratica.noteAdmin} onChange={e => setEditFormPratica(f => ({ ...f, noteAdmin: e.target.value }))} />
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => modificaPratica.mutate({ id: p.id, ...editFormPratica, statoIter: editFormPratica.statoIter || undefined })} className="bg-blue-600 hover:bg-blue-500 text-white font-bold">Salva</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditPraticaId(null)} className="text-white/50">Annulla</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ── PACK ── */}
        {tab === "pack" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-[#f5c518] mb-6">Gestione Pack</h2>
            
            {/* ── VISUALIZZA PACK DI INSTALLATORE ── */}
            <VisualizzaPackInst installatoriDropdown={installatoriDropdown} />
            
            {/* ── ASSEGNAZIONE RAPIDA PACCHETTI ── */}
            <div className="bg-purple-500/10 border border-purple-400/30 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Gift className="w-5 h-5 text-purple-400" />
                <h3 className="text-xl font-black text-purple-300">Assegnazione Rapida Pacchetti</h3>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-white/60 text-xs mb-1 block">Installatore *</label>
                  <select id="quickAssignInstallatore" className="w-full bg-[#1a4a2e] border border-white/20 text-white rounded-lg px-3 py-2 text-sm">
                    <option value="">Seleziona installatore...</option>
                    {(installatoriDropdown as any[]).map((row: any) => { const inst = row.installatore ?? row; return <option key={inst.id} value={String(inst.id)}>{inst.ragioneSociale || inst.nome}</option>; })}
                  </select>
                </div>
                <div>
                  <label className="text-white/60 text-xs mb-1 block">Pacchetto *</label>
                  <select id="quickAssignPack" className="w-full bg-[#1a4a2e] border border-white/20 text-white rounded-lg px-3 py-2 text-sm">
                    <option value="">Seleziona pacchetto...</option>
                    {packConfigList.length > 0 ? (
                      <optgroup label="── Pack Standard ──">
                        {packConfigList.filter((p: any) => ["Pack 1","Pack 2","Pack 3"].includes(p.nome)).map((p: any) => <option key={p.id} value={p.slug}>{p.nome} — €{Number(p.prezzo).toLocaleString("it-IT")} ({p.praticheRes} res + {p.praticheBus} bus)</option>)}
                      </optgroup>
                    ) : (
                      <>
                        <option value="pack1">Pack 1 — €2.000 (16 res + 5 bus)</option>
                        <option value="pack2">Pack 2 — €3.150 (30 res + 9 bus)</option>
                        <option value="pack3">Pack 3 — €5.100 (60 res + 20 bus)</option>
                      </>
                    )}
                    {packConfigList.filter((p: any) => !["Pack 1","Pack 2","Pack 3"].includes(p.nome) && p.attivo).length > 0 && (
                      <optgroup label="── Pack Personalizzati ──">
                        {packConfigList.filter((p: any) => !["Pack 1","Pack 2","Pack 3"].includes(p.nome) && p.attivo).map((p: any) => <option key={p.id} value={p.slug}>{p.nome} — €{Number(p.prezzo).toLocaleString("it-IT")}</option>)}
                      </optgroup>
                    )}
                    {promoList.filter((p: any) => p.attivo && p.prezzo).length > 0 && (
                      <optgroup label="── Pacchetti Promo ──">
                        {promoList.filter((p: any) => p.attivo && p.prezzo).map((p: any) => <option key={`promo_${p.id}`} value={`promo_${p.id}`}>🏷 {p.titolo} — €{Number(p.prezzo).toLocaleString("it-IT")}{p.scadenza ? ` (scade ${new Date(p.scadenza).toLocaleDateString("it-IT")})` : ""}</option>)}
                      </optgroup>
                    )}
                  </select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => {
                      const instId = (document.getElementById("quickAssignInstallatore") as HTMLSelectElement)?.value;
                      const packId = (document.getElementById("quickAssignPack") as HTMLSelectElement)?.value;
                      if (!instId || !packId) { toast.error("Seleziona installatore e pacchetto"); return; }
                      
                      const isPromo = packId.startsWith("promo_");
                      const promoSelezionata = isPromo ? promoList.find((p: any) => `promo_${p.id}` === packId) : null;
                      const packData: Record<string, any> = {
                        pack1: { importo: 2000, res: 16, bus: 5 },
                        pack2: { importo: 3150, res: 30, bus: 9 },
                        pack3: { importo: 5100, res: 60, bus: 20 },
                      };
                      const configPack = !isPromo ? packConfigList.find((p: any) => p.slug === packId) : null;
                      const pack = isPromo && promoSelezionata
                        ? { importo: Number(promoSelezionata.prezzo), res: 0, bus: 0, nome: `🏷 ${promoSelezionata.titolo}` }
                        : packData[packId] || (configPack ? { importo: Number(configPack.prezzo), res: configPack.praticheRes, bus: configPack.praticheBus, nome: configPack.nome } : null);
                      
                      if (pack) {
                        assegnaPackaggio.mutate({
                          installatoreId: Number(instId),
                          packId: isPromo ? "custom" : packId as any,
                          nomePacchetto: pack.nome || configPack?.nome,
                          importo: pack.importo,
                          pratiche_incluse_residenziali: pack.res,
                          pratiche_incluse_business: pack.bus,
                          note: isPromo ? `Promo assegnata: ${promoSelezionata?.titolo}` : "Assegnato da Gestione Pack",
                        });
                        (document.getElementById("quickAssignInstallatore") as HTMLSelectElement).value = "";
                        (document.getElementById("quickAssignPack") as HTMLSelectElement).value = "";
                      }
                    }}
                    disabled={assegnaPackaggio.isPending}
                    className="w-full bg-purple-400 text-[#1a4a2e] hover:bg-purple-400/90 font-bold">
                    {assegnaPackaggio.isPending ? "Assegnazione..." : "Assegna"}
                  </Button>
                </div>
              </div>
            </div>
            
            {/* ── ASSEGNAZIONE BULK A PIÙ INSTALLATORI ── */}
            <div className="bg-pink-500/10 border border-pink-400/30 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-pink-400" />
                <h3 className="text-xl font-black text-pink-300">Assegnazione Bulk a Più Installatori</h3>
              </div>
              <div className="space-y-4">
                {/* Selezione Pacchetto */}
                <div>
                  <label className="text-white/60 text-xs mb-2 block font-bold">Seleziona Pacchetto *</label>
                  <select id="bulkAssignPack" className="w-full bg-[#1a4a2e] border border-white/20 text-white rounded-lg px-3 py-2 text-sm">
                    <option value="">Seleziona pacchetto...</option>
                    {packConfigList.length > 0 ? (
                      <optgroup label="── Pack Standard ──">
                        {packConfigList.filter((p: any) => ["Pack 1","Pack 2","Pack 3"].includes(p.nome)).map((p: any) => <option key={p.id} value={p.slug}>{p.nome} — €{Number(p.prezzo).toLocaleString("it-IT")} ({p.praticheRes} res + {p.praticheBus} bus)</option>)}
                      </optgroup>
                    ) : (
                      <>
                        <option value="pack1">Pack 1 — €2.000 (16 res + 5 bus)</option>
                        <option value="pack2">Pack 2 — €3.150 (30 res + 9 bus)</option>
                        <option value="pack3">Pack 3 — €5.100 (60 res + 20 bus)</option>
                      </>
                    )}
                    {packConfigList.filter((p: any) => !["Pack 1","Pack 2","Pack 3"].includes(p.nome) && p.attivo).length > 0 && (
                      <optgroup label="── Pack Personalizzati ──">
                        {packConfigList.filter((p: any) => !["Pack 1","Pack 2","Pack 3"].includes(p.nome) && p.attivo).map((p: any) => <option key={p.id} value={p.slug}>{p.nome} — €{Number(p.prezzo).toLocaleString("it-IT")} ({p.praticheRes} res + {p.praticheBus} bus)</option>)}
                      </optgroup>
                    )}
                    {promoList.filter((p: any) => p.attivo && p.prezzo).length > 0 && (
                      <optgroup label="── Pacchetti Promo ──">
                        {promoList.filter((p: any) => p.attivo && p.prezzo).map((p: any) => <option key={`promo_${p.id}`} value={`promo_${p.id}`}>🏷 {p.titolo} — €{Number(p.prezzo).toLocaleString("it-IT")}</option>)}
                      </optgroup>
                    )}
                  </select>
                </div>
                
                {/* Checkbox Installatori */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-white/60 text-xs font-bold">Seleziona Installatori *</label>
                    <button
                      onClick={() => {
                        const checkboxes = document.querySelectorAll("input[name='bulkInstallatore']") as NodeListOf<HTMLInputElement>;
                        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
                        checkboxes.forEach(cb => cb.checked = !allChecked);
                      }}
                      className="text-pink-400 hover:text-pink-300 text-xs font-semibold">
                      Seleziona/Deseleziona Tutti
                    </button>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3 max-h-48 overflow-y-auto border border-white/10 space-y-2">
                    {(installatoriDropdown as any[]).length === 0 ? (
                      <p className="text-white/30 text-xs">Nessun installatore disponibile</p>
                    ) : (
                      (installatoriDropdown as any[]).map((row: any) => {
                        const inst = row.installatore ?? row;
                        return (
                          <label key={inst.id} className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-2 rounded transition-colors">
                            <input
                              type="checkbox"
                              name="bulkInstallatore"
                              value={String(inst.id)}
                              className="w-4 h-4 accent-pink-400 cursor-pointer"
                            />
                            <span className="text-white text-sm">{inst.ragioneSociale || inst.nome}</span>
                            <span className="text-white/40 text-xs ml-auto">#{inst.id}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
                
                {/* Pulsante Assegna */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      const packId = (document.getElementById("bulkAssignPack") as HTMLSelectElement)?.value;
                      const checkboxes = document.querySelectorAll("input[name='bulkInstallatore']:checked") as NodeListOf<HTMLInputElement>;
                      const selectedInstallatori = Array.from(checkboxes).map(cb => Number(cb.value));
                      
                      if (!packId) { toast.error("Seleziona un pacchetto"); return; }
                      if (selectedInstallatori.length === 0) { toast.error("Seleziona almeno un installatore"); return; }
                      
                      const isPromo = packId.startsWith("promo_");
                      const promoSelezionata = isPromo ? promoList.find((p: any) => `promo_${p.id}` === packId) : null;
                      const packData: Record<string, any> = {
                        pack1: { importo: 2000, res: 16, bus: 5 },
                        pack2: { importo: 3150, res: 30, bus: 9 },
                        pack3: { importo: 5100, res: 60, bus: 20 },
                      };
                      const configPack = !isPromo ? packConfigList.find((p: any) => p.slug === packId) : null;
                      const pack = isPromo && promoSelezionata
                        ? { importo: Number(promoSelezionata.prezzo), res: 0, bus: 0, nome: `🏷 ${promoSelezionata.titolo}` }
                        : packData[packId] || (configPack ? { importo: Number(configPack.prezzo), res: configPack.praticheRes, bus: configPack.praticheBus, nome: configPack.nome } : null);
                      
                      if (pack) {
                        let completed = 0;
                        let failed = 0;
                        
                        selectedInstallatori.forEach((instId) => {
                          assegnaPackaggio.mutate(
                            {
                              installatoreId: instId,
                              packId: isPromo ? "custom" : packId as any,
                              nomePacchetto: pack.nome || configPack?.nome,
                              importo: pack.importo,
                              pratiche_incluse_residenziali: pack.res,
                              pratiche_incluse_business: pack.bus,
                              note: isPromo ? `Promo assegnata: ${promoSelezionata?.titolo}` : "Assegnato da Bulk Assignment",
                            },
                            {
                              onSuccess: () => {
                                completed++;
                                if (completed + failed === selectedInstallatori.length) {
                                  toast.success(`${completed} pacchetti assegnati correttamente${failed > 0 ? `, ${failed} errori` : ""}`);
                                  (document.getElementById("bulkAssignPack") as HTMLSelectElement).value = "";
                                  (document.querySelectorAll("input[name='bulkInstallatore']") as NodeListOf<HTMLInputElement>).forEach(cb => cb.checked = false);
                                }
                              },
                              onError: () => {
                                failed++;
                                if (completed + failed === selectedInstallatori.length) {
                                  toast.error(`${completed} assegnati, ${failed} errori`);
                                }
                              }
                            }
                          );
                        });
                      }
                    }}
                    disabled={assegnaPackaggio.isPending}
                    className="flex-1 bg-pink-400 text-[#1a4a2e] hover:bg-pink-400/90 font-bold">
                    {assegnaPackaggio.isPending ? "Assegnazione in corso..." : "Assegna a Tutti Selezionati"}
                  </Button>
                  <Button
                    onClick={() => {
                      (document.getElementById("bulkAssignPack") as HTMLSelectElement).value = "";
                      (document.querySelectorAll("input[name='bulkInstallatore']") as NodeListOf<HTMLInputElement>).forEach(cb => cb.checked = false);
                    }}
                    variant="outline"
                    className="border-white/20 text-white/60 hover:text-white">
                    Azzera
                  </Button>
                </div>
                
                {/* Info */}
                <div className="flex items-center gap-2 p-3 bg-pink-400/10 border border-pink-400/20 rounded-lg">
                  <span className="text-pink-300 text-xs">ℹ️ Seleziona un pacchetto e uno o più installatori, poi clicca "Assegna" per assegnare il pacchetto a tutti contemporaneamente.</span>
                </div>
              </div>
            </div>
            
            <div className="grid sm:grid-cols-3 gap-5">
              {listaPack.map((p: any) => (
                <div key={p.id} className="bg-[#0e3320] rounded-2xl border border-white/10 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#f5c518]/10 flex items-center justify-center">
                      <Package className="w-5 h-5 text-[#f5c518]" />
                    </div>
                    <div>
                      <h3 className="text-white font-black">{p.nome}</h3>
                      <p className="text-[#f5c518] font-bold text-sm">€{p.prezzo.toLocaleString("it-IT")}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/50">Pratiche totali</span>
                      <span className="text-white font-bold">{p.pratiche_incluse}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">↳ Residenziali</span>
                      <span className="text-[#4ade80] font-semibold">{p.pratiche_res ?? PRATICHE_RES_PER_PACK[p.id] ?? 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">↳ Business</span>
                      <span className="text-[#f5c518] font-semibold">{p.pratiche_bus ?? PRATICHE_BUS_PER_PACK[p.id] ?? 0}</span>
                    </div>
                    <div className="border-t border-white/10 my-1" />
                    <div className="flex justify-between">
                      <span className="text-white/50">Ordini totali</span>
                      <span className="text-white font-bold">{p.ordini_totali}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Ordini confermati</span>
                      <span className="text-[#4ade80] font-bold">{p.ordini_confermati}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Fatturato stimato</span>
                      <span className="text-[#f5c518] font-bold">€{(p.ordini_confermati * p.prezzo).toLocaleString("it-IT")}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* ── EDITOR PACK CONFIGURABILI ── */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-black text-[#4ade80]">Pack Configurabili (Home)</h3>
                <Button size="sm" className="bg-[#4ade80] text-[#0e3320] font-bold hover:bg-[#4ade80]/90"
                  onClick={() => { setEditPackConfig(null); setPackConfigForm({ slug: "", nome: "", prezzo: "", praticheRes: "", prezzoRes: "", praticheBus: "", prezzoBus: "", descrizione: "", badge: "", colore: "green", attivo: true, ordine: "0" }); setShowPackConfigModal(true); }}>
                  <Plus className="w-4 h-4 mr-1" /> Nuovo Pack
                </Button>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                {packConfigList.map((p: any) => (
                  <div key={p.id} className={`bg-[#0e3320] rounded-2xl border p-5 ${p.attivo ? 'border-[#4ade80]/30' : 'border-white/10 opacity-60'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-black">{p.nome}</span>
                          {p.badge && <span className="bg-[#f5c518] text-[#0e3320] text-xs font-bold px-2 py-0.5 rounded-full">{p.badge}</span>}
                          {!p.attivo && <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-0.5 rounded-full">Disattivo</span>}
                        </div>
                        <p className="text-[#f5c518] font-bold text-lg">€{Number(p.prezzo).toLocaleString("it-IT")}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="text-white/50 hover:text-white p-1" onClick={() => { setEditPackConfig(p); setPackConfigForm({ slug: p.slug, nome: p.nome, prezzo: String(p.prezzo), praticheRes: String(p.praticheRes), prezzoRes: String(p.prezzoRes), praticheBus: String(p.praticheBus), prezzoBus: String(p.prezzoBus), descrizione: p.descrizione ?? "", badge: p.badge ?? "", colore: p.colore ?? "green", attivo: p.attivo, ordine: String(p.ordine) }); setShowPackConfigModal(true); }}><Pencil className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 p-1" onClick={() => { if (confirm(`Eliminare il pack "${p.nome}"?`)) eliminaPackConfig.mutate({ id: p.id }); }}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between"><span className="text-white/50">Residenziali</span><span className="text-[#4ade80]">{p.praticheRes} × €{Number(p.prezzoRes).toLocaleString("it-IT")}</span></div>
                      <div className="flex justify-between"><span className="text-white/50">Business</span><span className="text-blue-400">{p.praticheBus} × €{Number(p.prezzoBus).toLocaleString("it-IT")}</span></div>
                      {p.descrizione && <p className="text-white/40 mt-2 text-xs">{p.descrizione}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── EDITOR RICARICHE CONFIGURABILI ── */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-black text-purple-400">Ricariche Configurabili (Home)</h3>
                <Button size="sm" className="bg-purple-400 text-[#0e3320] font-bold hover:bg-purple-400/90"
                  onClick={() => { setEditRicaricaConfig(null); setRicaricaConfigForm({ slug: "", nome: "", prezzo: "", descrizione: "", badge: "", icona: "zap", attivo: true, ordine: "0" }); setShowRicaricaConfigModal(true); }}>
                  <Plus className="w-4 h-4 mr-1" /> Nuova Ricarica
                </Button>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                {ricaricheConfigList.map((r: any) => (
                  <div key={r.id} className={`bg-[#0e3320] rounded-2xl border p-5 ${r.attivo ? 'border-purple-400/30' : 'border-white/10 opacity-60'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-black">{r.nome}</span>
                          {r.badge && <span className="bg-purple-400 text-[#0e3320] text-xs font-bold px-2 py-0.5 rounded-full">{r.badge}</span>}
                          {!r.attivo && <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-0.5 rounded-full">Disattiva</span>}
                        </div>
                        <p className="text-[#f5c518] font-bold text-lg">€{Number(r.prezzo).toLocaleString("it-IT")}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="text-white/50 hover:text-white p-1" onClick={() => { setEditRicaricaConfig(r); setRicaricaConfigForm({ slug: r.slug, nome: r.nome, prezzo: String(r.prezzo), descrizione: r.descrizione ?? "", badge: r.badge ?? "", icona: r.icona ?? "zap", attivo: r.attivo, ordine: String(r.ordine) }); setShowRicaricaConfigModal(true); }}><Pencil className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 p-1" onClick={() => { if (confirm(`Eliminare la ricarica "${r.nome}"?`)) eliminaRicaricaConfig.mutate({ id: r.id }); }}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                    {r.descrizione && <p className="text-white/40 text-xs">{r.descrizione}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* ── PROMO PERSONALIZZATE ── */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-black text-[#f5c518]">Promo Personalizzate Installatori</h3>
                <Button size="sm" className="bg-[#f5c518] text-[#0e3320] font-bold hover:bg-[#f5c518]/90"
                  onClick={() => { setEditPromo(null); setPromoForm({ installatoreId: "0", titolo: "", descrizione: "", prezzo: "", prezzoOriginale: "", cta: "Scopri di più", ctaUrl: "", scadenza: "", attivo: true, colore: "yellow", ordine: "0", visibilita: "home" }); setShowPromoModal(true); }}>
                  <Plus className="w-4 h-4 mr-1" /> Nuova Promo
                </Button>
              </div>
              {promoList.length === 0 ? (
                <div className="bg-[#0e3320] rounded-2xl border border-white/10 p-8 text-center">
                  <p className="text-white/40">Nessuna promo creata. Crea la prima promo personalizzata per un installatore o globale.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {promoList.map((pr: any) => (
                    <div key={pr.id} className={`bg-[#0e3320] rounded-2xl border p-5 ${pr.attivo ? 'border-[#f5c518]/30' : 'border-white/10 opacity-60'}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-black">{pr.titolo}</span>
                            {!pr.attivo && <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-0.5 rounded-full">Disattiva</span>}
                          </div>
                          <p className="text-white/50 text-xs">{pr.installatoreId === 0 ? '🌍 Globale (tutti gli installatori)' : `👤 Installatore ID: ${pr.installatoreId}`}</p>
                          {pr.prezzo && <p className="text-[#f5c518] font-bold">€{Number(pr.prezzo).toLocaleString("it-IT")}{pr.prezzoOriginale && <span className="text-white/30 line-through ml-2 text-sm">€{Number(pr.prezzoOriginale).toLocaleString("it-IT")}</span>}</p>}
                          {pr.descrizione && <p className="text-white/40 text-xs mt-1">{pr.descrizione}</p>}
                          {pr.scadenza && <p className="text-orange-400 text-xs mt-1">⏰ Scade: {new Date(pr.scadenza).toLocaleDateString("it-IT")}</p>}
                        </div>
                        <div className="flex gap-1 ml-3">
                          <Button size="sm" variant="ghost" className="text-white/50 hover:text-white p-1" onClick={() => { setEditPromo(pr); setPromoForm({ installatoreId: String(pr.installatoreId), titolo: pr.titolo, descrizione: pr.descrizione ?? "", prezzo: pr.prezzo ? String(pr.prezzo) : "", prezzoOriginale: pr.prezzoOriginale ? String(pr.prezzoOriginale) : "", cta: pr.cta ?? "Scopri di più", ctaUrl: pr.ctaUrl ?? "", scadenza: pr.scadenza ? new Date(pr.scadenza).toISOString().split('T')[0] : "", attivo: pr.attivo, colore: pr.colore ?? "yellow", ordine: String(pr.ordine), visibilita: (pr.visibilita as any) ?? (pr.installatoreId && pr.installatoreId > 0 ? 'singolo' : 'home') }); setShowPromoModal(true); }}><Pencil className="w-4 h-4" /></Button>
                          <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 p-1" onClick={() => { if (confirm('Eliminare questa promo?')) eliminaPromo.mutate({ id: pr.id }); }}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── CORSA ── */}
        {tab === "corsa" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-[#f5c518] flex items-center gap-3">
                <Trophy className="w-6 h-6" /> Corsa ai €{corsaTarget.toLocaleString("it-IT")}
              </h2>
              {editingTarget ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="bg-[#0e3320] border border-[#f5c518]/40 text-white rounded-lg px-3 py-1.5 text-sm w-36"
                    placeholder="Es. 100000"
                    value={targetInput}
                    onChange={e => setTargetInput(e.target.value)}
                    autoFocus
                  />
                  <Button size="sm" className="bg-[#f5c518] text-[#1a4a2e] font-bold"
                    onClick={() => setCorsaTarget.mutate({ chiave: "corsa_target", valore: targetInput, descrizione: "Target Corsa 100K" })}
                    disabled={setCorsaTarget.isPending}>
                    Salva
                  </Button>
                  <Button size="sm" variant="ghost" className="text-white/50" onClick={() => setEditingTarget(false)}>Annulla</Button>
                </div>
              ) : (
                <Button size="sm" variant="outline"
                  className="border-[#f5c518]/40 text-[#f5c518] hover:bg-[#f5c518]/10"
                  onClick={() => { setTargetInput(String(corsaTarget)); setEditingTarget(true); }}>
                  <Pencil className="w-3.5 h-3.5 mr-1" /> Modifica Target
                </Button>
              )}
            </div>
            {corsaLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-[#f5c518] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* PROGRESS */}
                <div className="bg-[#0e3320] rounded-2xl p-6 border border-[#f5c518]/20">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-white/60 text-sm uppercase tracking-wider font-semibold">CORSA €100K (SOLO PACCHETTI)</p>
                      <p className="text-[#f5c518] font-black text-3xl">€{(corsaData?.totaleCorsa100K ?? 0).toLocaleString("it-IT")}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/60 text-sm uppercase tracking-wider font-semibold">FATTURATO TOTALE (INCL. SINGOLI)</p>
                      <p className="text-[#4ade80] font-black text-xl">€{(corsaData?.totale ?? 0).toLocaleString("it-IT")}</p>
                    </div>
                  </div>
                  <div className="relative h-6 bg-[#1a4a2e] rounded-full overflow-hidden border border-white/10">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(((corsaData?.totaleCorsa100K ?? 0) / corsaTarget) * 100, 100)}%`, background: "linear-gradient(90deg, #1a4a2e 0%, #4ade80 50%, #f5c518 100%)" }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white font-black text-xs drop-shadow">{Math.min(((corsaData?.totaleCorsa100K ?? 0) / corsaTarget) * 100, 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs">
                    <span className="text-white/40">€0</span>
                    <span className="text-[#4ade80] font-semibold">Mancano €{Math.max(0, corsaTarget - (corsaData?.totaleCorsa100K ?? 0)).toLocaleString("it-IT")}</span>
                    <span className="text-white/40">€{corsaTarget.toLocaleString("it-IT")}</span>
                  </div>
                </div>

                {/* CLASSIFICA */}
                <div>
                  <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2"><Medal className="w-5 h-5 text-[#f5c518]" /> Classifica Installatori</h3>
                  {(corsaData?.classifica ?? []).length === 0 ? (
                    <div className="text-center py-10 bg-[#0e3320] rounded-2xl border border-white/10">
                      <Trophy className="w-10 h-10 text-white/20 mx-auto mb-3" />
                      <p className="text-white/50">La classifica è ancora vuota</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(corsaData?.classifica ?? []).map((item: any, i: number) => {
                        const inst = item.installatore;
                        const fatturato = parseFloat(String(item.fatturato ?? 0));
                        const fatturatoCalcolato = parseFloat(String(item.fatturatoCalcolato ?? 0));
                        const fatturatoManuale = parseFloat(String(item.fatturatoManuale ?? 0));
                        const isPodio = i < 3;
                        return (
                          <div key={inst.id} className={`rounded-xl p-4 border flex items-center gap-4 ${isPodio ? "border-[#f5c518]/40 bg-[#f5c518]/5" : "border-white/10 bg-[#0e3320]"}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg shrink-0 ${i === 0 ? "bg-[#f5c518] text-[#1a4a2e]" : i === 1 ? "bg-white/20 text-white" : i === 2 ? "bg-[#cd7f32]/30 text-[#cd7f32]" : "bg-white/10 text-white/50"}`}>
                              {isPodio ? ["🥇","🥈","🥉"][i] : i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-bold truncate">{inst.ragioneSociale}</p>
                              <p className="text-white/50 text-xs">{inst.citta}{inst.provincia ? ` (${inst.provincia})` : ""}</p>
                              {fatturatoManuale > 0 && (
                                <p className="text-white/40 text-xs mt-0.5">
                                  Ordini: €{fatturatoCalcolato.toLocaleString("it-IT")} + Correzione: €{fatturatoManuale.toLocaleString("it-IT")}
                                </p>
                              )}
                              {fatturatoCalcolato > 0 && fatturatoManuale === 0 && (
                                <p className="text-white/40 text-xs mt-0.5">
                                  Da ordini: €{fatturatoCalcolato.toLocaleString("it-IT")}
                                </p>
                              )}
                            </div>
                            <p className="text-[#f5c518] font-black text-sm shrink-0">€{fatturato.toLocaleString("it-IT")}</p>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button size="sm" variant="outline" className="text-xs border-white/20 hover:bg-blue-500/10" onClick={() => {
                                const current = fatturatoManuale;
                                const newVal = prompt(
                                  `Correzione manuale per ${inst.ragioneSociale}\n(viene SOMMATA al fatturato dagli ordini: €${fatturatoCalcolato.toLocaleString("it-IT")})\n\nValore correzione attuale: €${current.toLocaleString("it-IT")}\nInserisci il nuovo valore di correzione:`,
                                  current.toString()
                                );
                                if (newVal !== null && !isNaN(Number(newVal))) {
                                  correggiTotaleFatturato.mutate({ installatoreId: inst.id, valore: Number(newVal) });
                                }
                              }}>Correggi</Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── BACKUP ── */}
        {tab === "backup" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-[#f5c518] mb-6">Backup &amp; Ripristino</h2>

            {/* INFO SITO */}
            <div className="bg-[#0e3320] rounded-2xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <KeyRound className="w-6 h-6 text-[#f5c518]" />
                <h3 className="text-lg font-bold text-white">Informazioni Sito</h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                {[
                  { label: "Nome Sito", val: "Ricaricati di Connessioni" },
                  { label: "URL Sito", val: window.location.origin },
                  { label: "URL Admin", val: `${window.location.origin}/admin` },
                  { label: "URL Portale", val: `${window.location.origin}/portale` },
                  { label: "Email Contatto", val: "info@soluzioniambientali.info" },
                  { label: "PayPal", val: "info@soluzioniambientali.info" },
                  { label: "Intestatario Bonifico", val: "Soluzioni Ambientali di Gennaro Martusciello" },
                  { label: "Admin Loggato", val: user?.name || user?.email || "—" },
                ].map(({ label, val }) => (
                  <div key={label} className="bg-[#1a4a2e] rounded-xl p-3 border border-white/10">
                    <p className="text-white/40 text-xs mb-1">{label}</p>
                    <p className="text-white font-semibold break-all">{val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* BACKUP AUTOMATICO PROGRAMMATO */}
            <div className="bg-[#0e3320] rounded-2xl p-6 border border-[#f5c518]/20">
              <div className="flex items-center gap-3 mb-4">
                <DatabaseBackup className="w-6 h-6 text-[#f5c518]" />
                <h3 className="text-lg font-bold text-white">Backup Automatico Programmato</h3>
              </div>
              <p className="text-white/50 text-sm mb-5">Configura la frequenza del backup automatico. Il backup viene salvato in modo sicuro nello storage del sito.</p>
              <div className="grid sm:grid-cols-2 gap-4 mb-5">
                <div>
                  <p className="text-white/60 text-sm font-semibold mb-2">Frequenza</p>
                  <div className="flex gap-2">
                    {(["giornaliero", "settimanale", "mensile"] as const).map((f) => (
                      <button key={f} onClick={() => setFreqSelezionata(f)}
                        className={`flex-1 rounded-xl border py-2 text-xs font-bold capitalize transition-all ${
                          freqSelezionata === f ? "border-[#f5c518] bg-[#f5c518]/10 text-[#f5c518]" : "border-white/15 text-white/50 hover:border-white/30 hover:text-white"
                        }`}>{f}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-white/60 text-sm font-semibold mb-2">Stato</p>
                  <button onClick={() => setBackupAttivo(!backupAttivo)}
                    className={`w-full rounded-xl border py-2 text-xs font-bold transition-all ${
                      backupAttivo ? "border-[#4ade80] bg-[#4ade80]/10 text-[#4ade80]" : "border-white/15 text-white/50 hover:border-white/30 hover:text-white"
                    }`}>
                    {backupAttivo ? "✓ Attivo" : "✗ Disattivo"}
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => aggiornaConfig.mutate({ frequenza: freqSelezionata, attivo: backupAttivo })}
                  disabled={aggiornaConfig.isPending}
                  className="bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-bold">
                  {aggiornaConfig.isPending ? "Salvataggio..." : "Salva Configurazione"}
                </Button>
                <Button onClick={() => salvaBackupStorage.mutate({ tipo: "manuale" })}
                  disabled={salvaBackupStorage.isPending}
                  className="bg-[#4ade80]/20 text-[#4ade80] border border-[#4ade80]/30 hover:bg-[#4ade80]/30 font-bold">
                  <UploadCloud className="w-4 h-4 mr-2" />
                  {salvaBackupStorage.isPending ? "Salvataggio..." : "Salva su Storage Ora"}
                </Button>
              </div>
              {backupConfig && (
                <div className="mt-4 p-3 bg-white/5 rounded-xl text-xs text-white/50">
                  Config attuale: <strong className="text-white/70">{backupConfig.frequenza}</strong> · Stato: <strong className={backupConfig.attivo ? "text-[#4ade80]" : "text-red-400"}>{backupConfig.attivo ? "Attivo" : "Disattivo"}</strong>
                  {backupConfig.ultimoBackup && <> · Ultimo backup: <strong className="text-white/70">{new Date(backupConfig.ultimoBackup).toLocaleString("it-IT")}</strong></>}
                </div>
              )}
            </div>

            {/* STORICO BACKUP */}
            {storicoBackup.length > 0 && (
              <div className="bg-[#0e3320] rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-4">Storico Backup</h3>
                <div className="space-y-2">
                  {storicoBackup.map((b: any) => (
                    <div key={b.id} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                      <div>
                        <p className="text-white text-sm font-semibold">{new Date(b.createdAt).toLocaleString("it-IT")}</p>
                        <p className="text-white/40 text-xs">{b.tipo} · {(b.dimensioneBytes / 1024).toFixed(1)} KB</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                          b.stato === "completato" ? "bg-[#4ade80]/10 text-[#4ade80]" : "bg-red-400/10 text-red-400"
                        }`}>{b.stato}</span>
                        <a href={b.storageUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" className="bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-bold text-xs">
                            <Download className="w-3 h-3 mr-1" /> Scarica
                          </Button>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ESPORTA BACKUP */}
            <div className="bg-[#0e3320] rounded-2xl p-6 border border-[#4ade80]/20">
              <div className="flex items-center gap-3 mb-3">
                <DatabaseBackup className="w-6 h-6 text-[#4ade80]" />
                <h3 className="text-lg font-bold text-white">Esporta Backup Manuale</h3>
              </div>
              <div className="bg-[#4ade80]/5 border border-[#4ade80]/15 rounded-xl p-4 mb-4">
                <p className="text-[#4ade80] text-xs font-bold mb-2">✓ Il backup include tutto:</p>
                <div className="grid grid-cols-2 gap-1 text-xs text-white/50">
                  <span>• Installatori e account utenti</span>
                  <span>• Ordini e pacchetti</span>
                  <span>• Pratiche e iter</span>
                  <span>• Metadati documenti</span>
                  <span>• Configurazione documenti per iter</span>
                  <span>• Pack configurabili e promo</span>
                  <span>• Personalizzazioni step</span>
                  <span>• Impostazioni corsa/target</span>
                </div>
                <p className="text-white/30 text-xs mt-3">⚠️ I file caricati (PDF, foto) sono salvati nello storage Manus separatamente e non sono inclusi nel JSON.</p>
              </div>
              <p className="text-white/40 text-xs mb-4">Per un ripristino completo del sito usa: (1) questo file JSON + (2) il checkpoint Manus dalla cronologia versioni.</p>
              <Button onClick={handleEsportaBackup} disabled={backupLoading}
                className="bg-[#4ade80] text-[#1a4a2e] hover:bg-[#4ade80]/90 font-bold">
                <Download className="w-4 h-4 mr-2" />
                {backupLoading ? "Preparazione..." : "Scarica Backup Completo (JSON)"}
              </Button>
            </div>

            {/* RIPRISTINO */}
            <div className="bg-[#0e3320] rounded-2xl p-6 border border-red-500/20">
              <div className="flex items-center gap-3 mb-3">
                <UploadCloud className="w-6 h-6 text-red-400" />
                <h3 className="text-lg font-bold text-white">Ripristina da Backup</h3>
              </div>
              <p className="text-white/50 text-sm mb-4">Carica un file di backup JSON precedentemente esportato per ripristinare i dati. <strong className="text-red-400">Attenzione: i dati esistenti verranno sovrascritti.</strong></p>
              <div className="space-y-3">
                <label className="block">
                  <span className="text-white/60 text-sm block mb-2">Seleziona file backup (.json)</span>
                  <input type="file" accept=".json" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => setBackupFileContent(ev.target?.result as string);
                    reader.readAsText(file);
                  }} className="block w-full text-sm text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-[#f5c518] file:text-[#1a4a2e] hover:file:bg-[#f5c518]/90 cursor-pointer" />
                </label>
                {backupFileContent && (
                  <p className="text-[#4ade80] text-sm">File caricato. Pronto per il ripristino.</p>
                )}
                {ripristinoMsg && (
                  <div className="bg-[#4ade80]/10 border border-[#4ade80]/30 rounded-xl p-3">
                    <p className="text-[#4ade80] text-sm font-semibold">{ripristinoMsg}</p>
                  </div>
                )}
                <Button onClick={handleRipristino} disabled={!backupFileContent || ripristina.isPending}
                  className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 font-bold">
                  <UploadCloud className="w-4 h-4 mr-2" />
                  {ripristina.isPending ? "Ripristino in corso..." : "Avvia Ripristino"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── DOCUMENTI ── */}
        {tab === "documenti" && (
          <TabDocumentiAdmin />
        )}

        {/* ── PEC ── */}
        {tab === "pec" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-[#f5c518]">PEC</h2>
                <p className="text-white/40 text-sm mt-0.5">{allPecList?.length || 0} PEC configurate</p>
              </div>
            </div>

            {/* Toolbar selezione PEC */}
            {selPec.size > 0 && (
              <div className="flex items-center gap-3 mb-3 px-4 py-2.5 bg-[#f5c518]/10 border border-[#f5c518]/30 rounded-xl">
                <span className="text-[#f5c518] font-bold text-sm">{selPec.size} selezionati</span>
                <Button size="sm" variant="ghost" onClick={() => setSelPec(selPec.size === (allPecList?.length || 0) ? new Set() : new Set((allPecList || []).map(p => p.id)))} className="text-white/50 text-xs">{selPec.size === (allPecList?.length || 0) ? "Deseleziona tutti" : "Seleziona tutti"}</Button>
                <div className="ml-auto flex gap-2">
                  <Button size="sm" className="bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs" onClick={() => { if (confirm(`Eliminare ${selPec.size} PEC?`)) { Array.from(selPec).forEach(id => eliminaPec.mutate({ id })); setSelPec(new Set()); } }}>Elimina selezionati</Button>
                </div>
              </div>
            )}

            {/* Tabella PEC */}
            <div className="bg-[#0e3320] rounded-2xl border border-white/10 overflow-x-auto">
              {/* Header tabella */}
              <div className="hidden md:grid grid-cols-[auto_2fr_1fr_auto] gap-4 px-5 py-3 border-b border-white/10 text-white/40 text-xs font-semibold uppercase tracking-wide">
                <input type="checkbox" className="w-4 h-4 accent-[#f5c518] cursor-pointer" checked={(allPecList?.length || 0) > 0 && selPec.size === (allPecList?.length || 0)} onChange={e => setSelPec(e.target.checked ? new Set((allPecList || []).map(p => p.id)) : new Set())} />
                <span>Email</span>
                <span>Stato</span>
                <span>Azioni</span>
              </div>

              {(!allPecList || allPecList.length === 0) ? (
                <div className="px-5 py-10 text-center text-white/30">Nessuna PEC configurata.</div>
              ) : (
                (allPecList || []).map((p: any) => (
                  <div key={p.id} className="hidden md:grid grid-cols-[auto_2fr_1fr_auto] gap-4 px-5 py-3 border-b border-white/10 items-center hover:bg-white/5 transition-colors">
                    <input type="checkbox" className="w-4 h-4 accent-[#f5c518] cursor-pointer" checked={selPec.has(p.id)} onChange={e => { const newSel = new Set(selPec); if (e.target.checked) newSel.add(p.id); else newSel.delete(p.id); setSelPec(newSel); }} />
                    <span className="text-white truncate">{p.email}</span>
                    <span className="text-white/60 text-sm">{p.verificato ? "✓ Verificata" : "⏳ Non verificata"}</span>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => { if (confirm("Eliminare questa PEC?")) eliminaPec.mutate({ id: p.id }); }} className="p-1 rounded-lg bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── CRM PROSPECT ── */}
        {tab === "crm" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-[#f5c518]">CRM Prospect Installatori</h2>
              <p className="text-white/40 text-sm">Gestisci i contatti, importa Excel, cerca su Google Maps</p>
            </div>
            <ProspectInstallatoriTab />
          </div>
        )}



        {/* ─── TAB ORDINI PROBABILI ──────────────────────────────────────── */}
        {tab === "ordini_probabili" && (
          <OrdiniProbabiliTab />
        )}

        {/* ─── TAB CORSA 100K PROBABILI ─────────────────────────────────── */}
        {tab === "corsa_100k" && (
          <Corsa100KTab />
        )}

        {/* ── RICARICA CREDITO ── */}
        {tab === "credito" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-[#f5c518]">Ricarica Credito Installatori</h2>
                <p className="text-white/40 text-sm mt-0.5">Ricarica il credito di un installatore per bollette, fibra o fotovoltaico</p>
              </div>
            </div>

            {/* Form ricarica credito */}
            <div className="bg-[#0e3320] border border-[#f5c518]/30 rounded-xl p-6 space-y-4 max-w-lg">
              <div>
                <label className="text-white/60 text-xs mb-2 block">Seleziona Installatore *</label>
                <select 
                  value={creditoInstallatoreId} 
                  onChange={e => setCreditoInstallatoreId(Number(e.target.value))}
                  className={`${selectCls} w-full`}
                >
                  <option value={0}>Scegli un installatore...</option>
                  {(installatori.length > 0 ? installatori : installatoriDropdown).map((row: any) => {
                    // La struttura è { installatore: {...}, user: {...} } oppure oggetto piatto
                    const inst = row.installatore ?? row;
                    const nome = inst.ragioneSociale || inst.nome || `Installatore #${inst.id}`;
                    const credito = inst.creditoResiduo != null && !isNaN(parseFloat(inst.creditoResiduo)) 
                      ? `€${parseFloat(inst.creditoResiduo).toLocaleString('it-IT')}` 
                      : '€0';
                    return (
                      <option key={inst.id} value={inst.id}>
                        {nome} (Credito: {credito})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="text-white/60 text-xs mb-2 block">Importo Ricarica (€) *</label>
                <input 
                  type="number" 
                  min="0" 
                  step="10"
                  value={creditoImporto} 
                  onChange={e => setCreditoImporto(e.target.value)}
                  placeholder="Es. 100, 250, 500"
                  className={`${inputCls} w-full`}
                />
              </div>

              <div>
                <label className="text-white/60 text-xs mb-2 block">Motivo (opzionale)</label>
                <input 
                  type="text" 
                  value={creditoMotivo} 
                  onChange={e => setCreditoMotivo(e.target.value)}
                  placeholder="Es. Bollette portate, Fibra completata"
                  className={`${inputCls} w-full`}
                />
              </div>

              <Button 
                onClick={() => {
                  if (!creditoInstallatoreId) { toast.error("Seleziona un installatore"); return; }
                  if (!creditoImporto || parseFloat(creditoImporto) <= 0) { toast.error("Inserisci un importo valido"); return; }
                  ricaricaCredito.mutate({
                    installatoreId: creditoInstallatoreId,
                    importo: parseFloat(creditoImporto),
                    motivo: creditoMotivo || undefined,
                  });
                }}
                disabled={ricaricaCredito.isPending}
                className="bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-bold w-full"
              >
                {ricaricaCredito.isPending ? "Ricaricamento..." : "💰 Ricarica Credito"}
              </Button>
            </div>

            {/* Configura Soglia Pack Omaggio */}
            <div className="mt-8">
              <h3 className="text-lg font-black text-[#f5c518] mb-4">Configura Soglia Pack Omaggio</h3>
              <p className="text-white/40 text-sm mb-4">Imposta la soglia di credito accumulato che l'installatore deve raggiungere per ottenere il pacchetto omaggio. Default: €2.000.</p>
              <SogliaPackOmaggioForm installatori={installatori.length > 0 ? installatori : installatoriDropdown} />
            </div>

            {/* Storico ricariche recenti */}
            <div className="mt-8">
              <h3 className="text-lg font-black text-[#f5c518] mb-4">Ultimi Crediti Ricaricati</h3>
              <div className="space-y-3">
                {(installatori as any[]).filter((i: any) => i.creditoTotale !== i.creditoResiduo).map((inst: any) => (
                  <div key={inst.id} className="bg-[#0e3320] border border-white/10 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold">{inst.ragioneSociale}</p>
                      <p className="text-white/50 text-sm">Credito residuo: <span className="text-[#4ade80] font-bold">€{parseFloat(inst.creditoResiduo).toLocaleString('it-IT')}</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/50 text-xs">Totale accumulato</p>
                      <p className="text-[#f5c518] font-bold">€{parseFloat(inst.creditoTotale).toLocaleString('it-IT')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab Premi */}
        {tab === "premi" && (
          <PremiAdminTab />
        )}
        {tab === "bollette" && (
          <BolletteDebugTab />
        )}
      </div>
      {/* MODAL LISTINO PERSONALIZZATO */}
      {showListinoModal && expandedInstId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#1a4a2e] border border-[#f5c518]/30 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[#f5c518] font-black text-lg">Listino Personalizzato</h3>
              <Button size="sm" variant="ghost" onClick={() => setShowListinoModal(false)} className="text-white/50">✕</Button>
            </div>
            <div>
              <label className="text-white/60 text-xs mb-1 block">Nome Listino</label>
              <input className="w-full bg-[#0e3320] border border-white/20 rounded-lg px-3 py-2 text-white text-sm" value={listinoNome} onChange={e => setListinoNome(e.target.value)} placeholder="Es. Listino VIP, Listino Fornitore X" />
            </div>
            <div>
              <p className="text-white/60 text-xs mb-3">Inserisci i prezzi personalizzati per ogni voce del listino. Lascia vuoto per usare il prezzo standard.</p>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {LISTINO.map(({ id: key, nome: label, prezzoStandard, categoria }) => (
                  <div key={key} className="flex items-center gap-3 bg-[#0e3320] rounded-lg px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-white/40 text-xs block">{categoria}</span>
                      <span className="text-white/80 text-sm">{label}</span>
                      {typeof prezzoStandard === 'number' && <span className="text-white/30 text-xs ml-0">std: €{prezzoStandard.toLocaleString('it-IT')}</span>}
                    </div>
                    <input
                      type="number"
                      className="w-24 bg-[#1a4a2e] border border-white/20 rounded px-2 py-1 text-white text-sm text-right"
                      placeholder="€ prezzo"
                      value={listinoPrezzi[key]?.prezzo ?? ""}
                      onChange={e => {
                        const val = e.target.value;
                        setListinoPrezzi(prev => {
                          if (!val) { const n = { ...prev }; delete n[key]; return n; }
                          return { ...prev, [key]: { ...prev[key], prezzo: Number(val) } };
                        });
                      }}
                    />
                    <input
                      className="w-32 bg-[#1a4a2e] border border-white/20 rounded px-2 py-1 text-white/60 text-xs"
                      placeholder="Note (opz.)"
                      value={listinoPrezzi[key]?.note ?? ""}
                      onChange={e => {
                        const val = e.target.value;
                        setListinoPrezzi(prev => ({ ...prev, [key]: { ...prev[key], prezzo: prev[key]?.prezzo ?? 0, note: val } }));
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={() => upsertListino.mutate({ installatoreId: expandedInstId!, nomeListino: listinoNome, prezzi: listinoPrezzi })} disabled={upsertListino.isPending} className="bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-black flex-1">
                {upsertListino.isPending ? "Salvataggio..." : "Salva Listino"}
              </Button>
              <Button variant="ghost" onClick={() => setShowListinoModal(false)} className="text-white/50">Annulla</Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PEC */}
      {showPecModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#1a4a2e] border border-orange-400/30 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-orange-400 font-black text-lg">Gestisci PEC</h3>
              <Button size="sm" variant="ghost" onClick={() => setShowPecModal(null)} className="text-white/50">✕</Button>
            </div>
            <div>
              <label className="text-white/60 text-xs mb-1 block">Email PEC</label>
              <input className={`${inputCls} w-full`} placeholder="pec@azienda.it" value={pecEmail} onChange={e => setPecEmail(e.target.value)} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={() => creaPec.mutate({ installatoreId: showPecModal, email: pecEmail })} disabled={!pecEmail || creaPec.isPending} className="bg-orange-400 text-[#1a4a2e] hover:bg-orange-400/90 font-bold flex-1">
                {creaPec.isPending ? "Creazione..." : "Aggiungi PEC"}
              </Button>
              <Button variant="ghost" onClick={() => setShowPecModal(null)} className="text-white/50">Annulla</Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PACCHETTI */}
      {showPackModal !== null && (({ packConfigModal: packConfigModalParam }) => {
        // Trova l'installatore corrente per pre-compilare i campi
        const instCorrente = installatoriDropdown.find(({ installatore: i }: any) => i.id === showPackModal)?.installatore;
        const nomeInst = instCorrente?.ragioneSociale ?? "";
        const emailInst = instCorrente?.email ?? "";
        const isCustom = packSelezionato === "custom";
        // Trova il pack selezionato dalla configurazione (se non è custom)
        const packConfigSelezionato = !isCustom ? packConfigModalParam.find((p: any) => p.slug === packSelezionato) : null;
        // Calcola importo automatico per pack custom
        const importoCalcolato = isCustom
          ? ((Number(packCustomResN) || 0) * (Number(packCustomResP) || 0)) + ((Number(packCustomBusN) || 0) * (Number(packCustomBusP) || 0))
          : 0;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto">
            <div className="bg-[#1a4a2e] border border-purple-400/30 rounded-2xl w-full max-w-lg p-6 space-y-4 my-4">
              <div className="flex items-center justify-between">
                <h3 className="text-purple-400 font-black text-lg">Assegna Pacchetto</h3>
                <Button size="sm" variant="ghost" onClick={() => { setShowPackModal(null); setPackSelezionato("pack1"); setPackCustomNome(""); setPackCustomImporto(""); setPackCustomResN(""); setPackCustomResP(""); setPackCustomBusN(""); setPackCustomBusP(""); }} className="text-white/50">✕</Button>
              </div>

              {/* Selezione pack */}
              <div>
                <label className="text-white/60 text-xs mb-1 block">Seleziona Pacchetto</label>
                <select className={`${selectCls} w-full`} value={packSelezionato} onChange={e => setPackSelezionato(e.target.value)}>
                  {packConfigModalParam.length > 0 ? (
                    packConfigModalParam.map((p: any) => (
                      <option key={p.slug} value={p.slug}>
                        {p.nome} — €{Number(p.prezzo).toLocaleString("it-IT")}
                        {p.praticheRes > 0 || p.praticheBus > 0 ? ` (${p.praticheRes > 0 ? `${p.praticheRes} res × €${Number(p.prezzoRes).toLocaleString("it-IT")}` : ""}${p.praticheRes > 0 && p.praticheBus > 0 ? " + " : ""}${p.praticheBus > 0 ? `${p.praticheBus} bus × €${Number(p.prezzoBus).toLocaleString("it-IT")}` : ""})` : ""}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="pack1">Pack 1 — €2.000 (16 res × €125 + 5 bus × €400)</option>
                      <option value="pack2">Pack 2 — €3.150 (30 res × €105 + 9 bus × €350)</option>
                      <option value="pack3">Pack 3 — €5.100 (60 res × €85 + 20 bus × €250)</option>
                    </>
                  )}
                  <option value="custom">✦ Pacchetto Personalizzato (inserimento manuale)</option>
                </select>
              </div>

              {/* Sezione PEC */}
              {allPecList && allPecList.length > 0 && (
                <div className="bg-orange-400/10 border border-orange-400/30 rounded-xl p-3">
                  <p className="text-orange-400 text-xs font-bold mb-2">📧 PEC Disponibili</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {allPecList.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between text-xs bg-black/20 rounded px-2 py-1">
                        <span className="text-white/70">{p.email}</span>
                        <span className="text-orange-400 text-xs">{p.verificato ? "✓" : "⏳"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Riepilogo pack dalla configurazione */}
              {!isCustom && packConfigSelezionato && (
                <div className="bg-black/20 rounded-xl p-3 border border-white/10">
                  <p className="text-white/50 text-xs mb-2">Riepilogo pacchetto selezionato:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {packConfigSelezionato.praticheRes > 0 && (
                      <div className="bg-[#4ade80]/10 rounded-lg p-2 border border-[#4ade80]/20">
                        <p className="text-[#4ade80] font-bold">{packConfigSelezionato.praticheRes} Pratiche Residenziali</p>
                        <p className="text-white/40">€{Number(packConfigSelezionato.prezzoRes).toLocaleString("it-IT")} / cad</p>
                      </div>
                    )}
                    {packConfigSelezionato.praticheBus > 0 && (
                      <div className="bg-blue-400/10 rounded-lg p-2 border border-blue-400/20">
                        <p className="text-blue-400 font-bold">{packConfigSelezionato.praticheBus} Pratiche Business</p>
                        <p className="text-white/40">€{Number(packConfigSelezionato.prezzoBus).toLocaleString("it-IT")} / cad</p>
                      </div>
                    )}
                  </div>
                  <p className="text-[#f5c518] font-bold text-sm mt-2">Totale: €{Number(packConfigSelezionato.prezzo).toLocaleString("it-IT")}</p>
                  <p className="text-white/50 text-xs mt-3 border-t border-white/10 pt-2">*Se per l'ultima pratica non ci sarà credito a sufficienza, dopo aver acquistato un misto di pratiche residenziali e/o business, quest'ultimo verrà integrato e omaggiato da Soluzioni Ambientali.</p>
                </div>
              )}

              {/* Campi pack personalizzato */}
              {isCustom && (
                <div className="space-y-3">
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Nome Pacchetto *</label>
                    <input className={`${inputCls} w-full`} placeholder="Es. Pack Speciale Cliente" value={packCustomNome} onChange={e => setPackCustomNome(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[#4ade80]/80 text-xs mb-1 block">N° Pratiche Residenziali</label>
                      <input type="number" min="0" className={`${inputCls} w-full`} placeholder="Es. 10" value={packCustomResN} onChange={e => setPackCustomResN(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[#4ade80]/80 text-xs mb-1 block">Prezzo Residenziale (€/cad)</label>
                      <input type="number" min="0" className={`${inputCls} w-full`} placeholder="Es. 125" value={packCustomResP} onChange={e => setPackCustomResP(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-blue-400/80 text-xs mb-1 block">N° Pratiche Business</label>
                      <input type="number" min="0" className={`${inputCls} w-full`} placeholder="Es. 3" value={packCustomBusN} onChange={e => setPackCustomBusN(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-blue-400/80 text-xs mb-1 block">Prezzo Business (€/cad)</label>
                      <input type="number" min="0" className={`${inputCls} w-full`} placeholder="Es. 400" value={packCustomBusP} onChange={e => setPackCustomBusP(e.target.value)} />
                    </div>
                  </div>
                  {/* Importo calcolato automaticamente - SEPARATO */}
                  <div className="bg-black/20 rounded-xl p-3 border border-[#f5c518]/20 space-y-2">
                    {(packCustomResN || 0) > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-[#4ade80] text-xs">Residenziali:</span>
                        <span className="text-[#4ade80] font-bold">€{(Number(packCustomResN) * Number(packCustomResP)).toLocaleString("it-IT")}</span>
                      </div>
                    )}
                    {(packCustomBusN || 0) > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-blue-400 text-xs">Business:</span>
                        <span className="text-blue-400 font-bold">€{(Number(packCustomBusN) * Number(packCustomBusP)).toLocaleString("it-IT")}</span>
                      </div>
                    )}
                    <div className="border-t border-white/10 pt-2 flex items-center justify-between">
                      <span className="text-white/60 text-xs font-bold">Totale:</span>
                      <span className="text-[#f5c518] font-black text-lg">€{importoCalcolato.toLocaleString("it-IT")}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => {
                    if (isCustom) {
                      if (!packCustomNome.trim()) { toast.error("Inserisci il nome del pacchetto"); return; }
                      if (!packCustomResN && !packCustomBusN) { toast.error("Inserisci almeno un tipo di pratica"); return; }
                      assegnaPackaggio.mutate({
                        installatoreId: showPackModal,
                        packId: "custom",
                        nomePacchetto: packCustomNome,
                        importo: importoCalcolato,
                        pratiche_incluse_residenziali: Number(packCustomResN) || 0,
                        pratiche_incluse_business: Number(packCustomBusN) || 0,
                        note: "Pacchetto personalizzato assegnato da admin",
                      });
                    } else if (packConfigSelezionato) {
                      assegnaPackaggio.mutate({
                        installatoreId: showPackModal,
                        packId: "custom",
                        nomePacchetto: packConfigSelezionato.nome,
                        importo: Number(packConfigSelezionato.prezzo),
                        pratiche_incluse_residenziali: packConfigSelezionato.praticheRes || 0,
                        pratiche_incluse_business: packConfigSelezionato.praticheBus || 0,
                        note: `Assegnato da admin: ${packConfigSelezionato.nome}`,
                      });
                    } else {
                      const packData: Record<string, any> = {
                        pack1: { importo: 2000, res: 16, bus: 5 },
                        pack2: { importo: 3150, res: 30, bus: 9 },
                        pack3: { importo: 5100, res: 60, bus: 20 },
                      };
                      const pack = packData[packSelezionato];
                      if (pack) {
                        assegnaPackaggio.mutate({
                          installatoreId: showPackModal,
                          packId: packSelezionato as any,
                          importo: pack.importo,
                          pratiche_incluse_residenziali: pack.res,
                          pratiche_incluse_business: pack.bus,
                          note: "Assegnato da admin",
                        });
                      }
                    }
                    setShowPackModal(null);
                    setPackSelezionato(packConfigModal.length > 0 ? packConfigModal[0].slug : "pack1");
                    setPackCustomNome(""); setPackCustomImporto(""); setPackCustomResN(""); setPackCustomResP(""); setPackCustomBusN(""); setPackCustomBusP("");
                  }}
                  disabled={assegnaPackaggio.isPending}
                  className="bg-purple-400 text-[#1a4a2e] hover:bg-purple-400/90 font-bold flex-1">
                  {assegnaPackaggio.isPending ? "Assegnazione..." : "Assegna Pacchetto"}
                </Button>
                <Button variant="ghost" onClick={() => { setShowPackModal(null); setPackSelezionato(packConfigModalParam.length > 0 ? packConfigModalParam[0].slug : "pack1"); setPackCustomNome(""); setPackCustomImporto(""); setPackCustomResN(""); setPackCustomResP(""); setPackCustomBusN(""); setPackCustomBusP(""); }} className="text-white/50">Annulla</Button>
              </div>
            </div>
          </div>
        );
      })({ packConfigModal })}

      {/* ── MODAL PACK CONFIGURAZIONE ── */}
      {showPackConfigModal && (() => {
        const prezzoFisso = Number(packConfigForm.prezzo) || 0;
        const resN = Number(packConfigForm.praticheRes) || 0;
        const resP = Number(packConfigForm.prezzoRes) || 0;
        const busN = Number(packConfigForm.praticheBus) || 0;
        const busP = Number(packConfigForm.prezzoBus) || 0;
        const totaleRighe = resN * resP + busN * busP;
        const hasPrezzoFisso = prezzoFisso > 0;
        // Il prezzo finale è SEMPRE il prezzo fisso se inserito, altrimenti somma righe
        const prezzoFinale = hasPrezzoFisso ? prezzoFisso : totaleRighe;
        const COLORI: Record<string, string> = { green: '#4ade80', yellow: '#f5c518', blue: '#60a5fa', purple: '#a78bfa' };
        const coloreAttuale = COLORI[packConfigForm.colore] || '#4ade80';
        const slugAuto = packConfigForm.nome
          ? packConfigForm.nome.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")
          : "";

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto">
            <div className="bg-[#1a4a2e] border border-[#4ade80]/30 rounded-2xl w-full max-w-3xl p-6 space-y-5 my-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[#4ade80] font-black text-lg">{editPackConfig ? 'Modifica Pack' : 'Nuovo Pack'}</h3>
                  <p className="text-white/30 text-xs mt-0.5">{editPackConfig ? `Slug: ${packConfigForm.slug}` : "Configura tutti i dettagli del pacchetto"}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => { setShowPackConfigModal(false); setEditPackConfig(null); setPackAssegnaInstallatori(new Set()); setPackAssegnaTutti(false); setPackAssegnaDopoSalva(false); setPackAssegnaModalita("singolo"); }} className="text-white/50">✕</Button>
              </div>

              <div className="grid grid-cols-2 gap-5">
                {/* ── COLONNA SINISTRA ── */}
                <div className="space-y-4">

                  {/* Nome + slug auto */}
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Nome del pacchetto *</label>
                    <input className={`${inputCls} w-full`}
                      value={packConfigForm.nome}
                      onChange={e => setPackConfigForm(f => ({
                        ...f,
                        nome: e.target.value,
                        slug: f.slug || e.target.value.toLowerCase().replace(/\s+/g,"_").replace(/[^a-z0-9_]/g,"")
                      }))}
                      placeholder="Es. Pack Premium, Pack C" />
                    {!editPackConfig && packConfigForm.nome && (
                      <p className="text-white/25 text-xs mt-1">Slug generato: <span className="font-mono">{slugAuto}</span></p>
                    )}
                  </div>

                  {/* Prezzo fisso — IN EVIDENZA */}
                  <div className="bg-[#f5c518]/10 border-2 border-[#f5c518]/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[#f5c518] text-sm font-black">💰 Prezzo Totale del Pacchetto (€)</span>
                    </div>
                    <input type="number" min="0" step="0.01"
                      className={`${inputCls} w-full text-lg font-bold`}
                      value={packConfigForm.prezzo}
                      onChange={e => setPackConfigForm(f => ({...f, prezzo: e.target.value}))}
                      placeholder="Es. 2000" />
                    <p className="text-white/35 text-xs mt-2 leading-relaxed">
                      Questo è il <strong>prezzo fisso</strong> che paga il cliente. I prezzi unitari sotto servono solo per il calcolo interno di ogni pratica, NON si sommano per ottenere il totale.
                    </p>
                  </div>

                  {/* Pratiche residenziali */}
                  <div className="bg-[#4ade80]/5 border border-[#4ade80]/15 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[#4ade80] text-xs font-bold">Pratiche Residenziali</p>
                      {resN > 0 && resP > 0 && (
                        <span className="text-[#4ade80]/60 text-xs">{resN} × €{resP} = <span className="font-bold text-[#4ade80]">€{(resN*resP).toLocaleString("it-IT")}</span></span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-white/40 text-xs mb-1 block">Quantità incluse</label><input type="number" min="0" className={`${inputCls} w-full`} value={packConfigForm.praticheRes} onChange={e => setPackConfigForm(f => ({...f, praticheRes: e.target.value}))} placeholder="Es. 16" /></div>
                      <div><label className="text-white/40 text-xs mb-1 block">Prezzo €/pratica</label><input type="number" min="0" className={`${inputCls} w-full`} value={packConfigForm.prezzoRes} onChange={e => setPackConfigForm(f => ({...f, prezzoRes: e.target.value}))} placeholder="Es. 125" /></div>
                    </div>
                  </div>

                  {/* Pratiche business */}
                  <div className="bg-blue-900/20 border border-blue-400/15 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-blue-400 text-xs font-bold">Pratiche Business</p>
                      {busN > 0 && busP > 0 && (
                        <span className="text-blue-400/60 text-xs">{busN} × €{busP} = <span className="font-bold text-blue-400">€{(busN*busP).toLocaleString("it-IT")}</span></span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-white/40 text-xs mb-1 block">Quantità incluse</label><input type="number" min="0" className={`${inputCls} w-full`} value={packConfigForm.praticheBus} onChange={e => setPackConfigForm(f => ({...f, praticheBus: e.target.value}))} placeholder="Es. 5" /></div>
                      <div><label className="text-white/40 text-xs mb-1 block">Prezzo €/pratica</label><input type="number" min="0" className={`${inputCls} w-full`} value={packConfigForm.prezzoBus} onChange={e => setPackConfigForm(f => ({...f, prezzoBus: e.target.value}))} placeholder="Es. 400" /></div>
                    </div>
                  </div>

                  {/* Riepilogo prezzo — CHIARO */}
                  <div className="bg-black/25 border border-[#f5c518]/20 rounded-xl p-4 space-y-2">
                    <p className="text-white/40 text-xs font-semibold uppercase tracking-wide mb-3">Riepilogo</p>
                    {resN > 0 && <div className="flex justify-between text-sm"><span className="text-[#4ade80]/80">{resN} pratiche res. × €{resP}</span><span className="text-[#4ade80] font-semibold">€{(resN*resP).toLocaleString("it-IT")}</span></div>}
                    {busN > 0 && <div className="flex justify-between text-sm"><span className="text-blue-400/80">{busN} pratiche bus. × €{busP}</span><span className="text-blue-400 font-semibold">€{(busN*busP).toLocaleString("it-IT")}</span></div>}
                    {(resN > 0 || busN > 0) && totaleRighe !== prezzoFisso && hasPrezzoFisso && (
                      <div className="flex justify-between text-xs text-white/20 border-t border-white/5 pt-2">
                        <span className="line-through">Totale calcolato dalle righe:</span>
                        <span className="line-through">€{totaleRighe.toLocaleString("it-IT")}</span>
                      </div>
                    )}
                    <div className="border-t border-[#f5c518]/20 pt-3 flex justify-between items-center">
                      <div>
                        <span className="text-white/60 text-sm font-bold">{hasPrezzoFisso ? "Prezzo fisso pacchetto:" : "Totale calcolato:"}</span>
                        {hasPrezzoFisso && <p className="text-white/25 text-xs">Le pratiche vengono scalate da questo importo</p>}
                      </div>
                      <span className="text-[#f5c518] font-black text-2xl">€{prezzoFinale.toLocaleString("it-IT")}</span>
                    </div>
                  </div>
                </div>

                {/* ── COLONNA DESTRA ── */}
                <div className="space-y-4">

                  {/* Anteprima live */}
                  <div className="rounded-xl border-2 p-4" style={{borderColor: coloreAttuale + "50", backgroundColor: coloreAttuale + "0A"}}>
                    <p className="text-white/30 text-xs font-semibold uppercase tracking-wide mb-3">Anteprima card home</p>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white font-black text-base">{packConfigForm.nome || "Nome Pack"}</span>
                          {packConfigForm.badge && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{backgroundColor: coloreAttuale, color: "#0e3320"}}>{packConfigForm.badge}</span>}
                          {!packConfigForm.attivo && <span className="text-red-400 text-xs bg-red-400/10 px-2 py-0.5 rounded-full">Disattivo</span>}
                        </div>
                        <p className="font-black text-2xl mt-1" style={{color: coloreAttuale}}>€{prezzoFinale.toLocaleString("it-IT")}</p>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-xs border-t border-white/10 pt-3">
                      {resN > 0 && <div className="flex justify-between"><span className="text-white/40">Residenziali</span><span style={{color: coloreAttuale}}>{resN} pratiche × €{resP}</span></div>}
                      {busN > 0 && <div className="flex justify-between"><span className="text-white/40">Business</span><span className="text-blue-400">{busN} pratiche × €{busP}</span></div>}
                      {packConfigForm.descrizione && <p className="text-white/35 mt-2 leading-relaxed">{packConfigForm.descrizione}</p>}
                    </div>
                  </div>

                  {/* Badge, descrizione, colore */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-white/60 text-xs mb-1 block">Badge (opzionale)</label>
                      <input className={`${inputCls} w-full`} value={packConfigForm.badge} onChange={e => setPackConfigForm(f => ({...f, badge: e.target.value}))} placeholder="Più Venduto" />
                    </div>
                    <div>
                      <label className="text-white/60 text-xs mb-1 block">Ordine visualizzazione</label>
                      <input type="number" className={`${inputCls} w-full`} value={packConfigForm.ordine} onChange={e => setPackConfigForm(f => ({...f, ordine: e.target.value}))} />
                    </div>
                  </div>
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Descrizione (opzionale)</label>
                    <textarea className={`${inputCls} w-full resize-none`} rows={2} value={packConfigForm.descrizione} onChange={e => setPackConfigForm(f => ({...f, descrizione: e.target.value}))} placeholder="Es. Ideale per chi inizia. Incluse 16 pratiche residenziali..." />
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <label className="text-white/60 text-xs">Colore card:</label>
                    {Object.entries(COLORI).map(([c, hex]) => (
                      <button key={c} onClick={() => setPackConfigForm(f => ({...f, colore: c}))}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${packConfigForm.colore === c ? 'border-white scale-110' : 'border-transparent opacity-60'}`}
                        style={{backgroundColor: hex}} title={c} />
                    ))}
                    <label className="flex items-center gap-1.5 cursor-pointer ml-auto">
                      <input type="checkbox" checked={packConfigForm.attivo} onChange={e => setPackConfigForm(f => ({...f, attivo: e.target.checked}))} className="w-4 h-4 accent-[#4ade80]" />
                      <span className="text-white/60 text-xs">Visibile in home</span>
                    </label>
                  </div>

                  {/* Assegnazione installatori — 3 MODALITÀ */}
                  <div className="bg-purple-900/20 border border-purple-400/25 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-purple-300 text-sm font-bold">Assegna agli installatori</p>
                        <p className="text-white/30 text-xs mt-0.5">Assegna subito dopo il salvataggio</p>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={packAssegnaDopoSalva} onChange={e => setPackAssegnaDopoSalva(e.target.checked)} className="w-4 h-4 accent-purple-400" />
                        <span className="text-white/50 text-sm">Abilita</span>
                      </label>
                    </div>
                    {packAssegnaDopoSalva && (
                      <div className="space-y-3">
                        {/* 3 modalità */}
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => { setPackAssegnaModalita("singolo"); setPackAssegnaTutti(false); setPackAssegnaInstallatori(new Set()); }}
                            className={`py-2 px-1 rounded-lg text-xs font-semibold border transition-all text-center ${packAssegnaModalita === "singolo" ? "bg-purple-400/20 text-purple-300 border-purple-400/40" : "bg-white/5 text-white/40 border-white/10 hover:border-white/20"}`}>
                            <div className="text-lg mb-0.5">👤</div>
                            Un installatore
                          </button>
                          <button
                            onClick={() => { setPackAssegnaModalita("multiplo"); setPackAssegnaTutti(false); setPackAssegnaInstallatori(new Set()); }}
                            className={`py-2 px-1 rounded-lg text-xs font-semibold border transition-all text-center ${packAssegnaModalita === "multiplo" ? "bg-purple-400/20 text-purple-300 border-purple-400/40" : "bg-white/5 text-white/40 border-white/10 hover:border-white/20"}`}>
                            <div className="text-lg mb-0.5">👥</div>
                            Più installatori
                          </button>
                          <button
                            onClick={() => { setPackAssegnaModalita("tutti"); setPackAssegnaTutti(true); setPackAssegnaInstallatori(new Set()); }}
                            className={`py-2 px-1 rounded-lg text-xs font-semibold border transition-all text-center ${packAssegnaModalita === "tutti" ? "bg-[#f5c518]/20 text-[#f5c518] border-[#f5c518]/40" : "bg-white/5 text-white/40 border-white/10 hover:border-white/20"}`}>
                            <div className="text-lg mb-0.5">🌐</div>
                            Tutti + Home
                          </button>
                        </div>

                        {/* Modalità: singolo o multiplo — lista installatori */}
                        {(packAssegnaModalita === "singolo" || packAssegnaModalita === "multiplo") && (
                          <>
                            <input className={`${inputCls} w-full text-xs`} placeholder="Cerca installatore..." id="pack-inst-search"
                              onChange={e => {
                                const term = e.target.value.toLowerCase();
                                document.querySelectorAll(".pack-inst-row").forEach((el: any) => {
                                  el.style.display = el.dataset.nome?.toLowerCase().includes(term) ? "" : "none";
                                });
                              }} />
                            <div className="max-h-40 overflow-y-auto space-y-1 bg-black/20 rounded-lg p-2">
                              {(installatoriDropdown as any[]).map((row: any) => {
                                const inst = row.installatore ?? row;
                                const isSingolo = packAssegnaModalita === "singolo";
                                return (
                                  <label key={inst.id} data-nome={inst.ragioneSociale || inst.nome}
                                    className="pack-inst-row flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-white/5 transition-colors">
                                    <input
                                      type={isSingolo ? "radio" : "checkbox"}
                                      name={isSingolo ? "packInstSingolo" : undefined}
                                      checked={packAssegnaInstallatori.has(inst.id)}
                                      onChange={e => {
                                        if (isSingolo) {
                                          setPackAssegnaInstallatori(new Set([inst.id]));
                                        } else {
                                          const s = new Set(packAssegnaInstallatori);
                                          if (e.target.checked) s.add(inst.id); else s.delete(inst.id);
                                          setPackAssegnaInstallatori(s);
                                        }
                                      }}
                                      className="w-3.5 h-3.5 accent-purple-400" />
                                    <span className="text-white/80 text-xs flex-1">{inst.ragioneSociale || inst.nome}</span>
                                    <span className="text-white/25 text-xs">#{inst.id}</span>
                                  </label>
                                );
                              })}
                            </div>
                            {packAssegnaModalita === "multiplo" && packAssegnaInstallatori.size > 0 && (
                              <button onClick={() => setPackAssegnaInstallatori(new Set())} className="text-white/30 text-xs hover:text-white/50">Deseleziona tutti</button>
                            )}
                          </>
                        )}

                        {/* Modalità: tutti + home */}
                        {packAssegnaModalita === "tutti" && (
                          <div className="bg-[#f5c518]/8 border border-[#f5c518]/20 rounded-lg p-3 space-y-2">
                            <p className="text-[#f5c518] text-xs font-bold">🌐 Pubblicazione globale</p>
                            <p className="text-white/40 text-xs leading-relaxed">Il pack verrà assegnato a tutti i {(installatoriDropdown as any[]).length} installatori registrati e sarà visibile nella home pubblica e nella pagina promo.</p>
                            <label className="flex items-center gap-2 cursor-pointer mt-1">
                              <input type="checkbox" defaultChecked className="w-3.5 h-3.5 accent-[#f5c518]" />
                              <span className="text-[#f5c518]/70 text-xs">Pubblica anche in home/pagina promo</span>
                            </label>
                          </div>
                        )}

                        {/* Riepilogo */}
                        {(packAssegnaTutti || packAssegnaInstallatori.size > 0) && (
                          <div className={`rounded-lg p-2.5 border ${packAssegnaModalita === "tutti" ? "bg-[#f5c518]/8 border-[#f5c518]/20" : "bg-purple-400/10 border-purple-400/20"}`}>
                            <p className={`text-xs font-semibold ${packAssegnaModalita === "tutti" ? "text-[#f5c518]" : "text-purple-300"}`}>
                              ✓ {packAssegnaTutti
                                ? `Assegnato a tutti i ${(installatoriDropdown as any[]).length} installatori + pubblicato in home`
                                : packAssegnaModalita === "singolo"
                                  ? `Assegnato a 1 installatore selezionato`
                                  : `Assegnato a ${packAssegnaInstallatori.size} installatori selezionati`
                              } — prezzo fisso €{prezzoFinale.toLocaleString("it-IT")}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2 border-t border-white/10">
                <Button className="bg-[#4ade80] text-[#0e3320] font-bold flex-1 text-sm"
                  disabled={creaPackConfig.isPending || modificaPackConfig.isPending}
                  onClick={async () => {
                    if (!packConfigForm.nome.trim()) { toast.error("Il nome è obbligatorio"); return; }
                    if (!packConfigForm.prezzo && !totaleRighe) { toast.error("Inserisci il prezzo del pacchetto"); return; }
                    const slugFinale = editPackConfig ? packConfigForm.slug : (packConfigForm.slug || slugAuto);
                    if (!slugFinale) { toast.error("Impossibile generare lo slug — inserisci il nome"); return; }
                    const payload = {
                      slug: slugFinale,
                      nome: packConfigForm.nome,
                      prezzo: prezzoFinale,
                      praticheRes: resN,
                      prezzoRes: resP,
                      praticheBus: busN,
                      prezzoBus: busP,
                      descrizione: packConfigForm.descrizione || undefined,
                      badge: packConfigForm.badge || undefined,
                      colore: packConfigForm.colore,
                      attivo: packConfigForm.attivo,
                      ordine: Number(packConfigForm.ordine) || 0
                    };
                    if (editPackConfig) modificaPackConfig.mutate({ id: editPackConfig.id, ...payload });
                    else creaPackConfig.mutate(payload);
                    // Assegna agli installatori selezionati
                    if (packAssegnaDopoSalva && (packAssegnaTutti || packAssegnaInstallatori.size > 0)) {
                      const targets = packAssegnaTutti
                        ? (installatoriDropdown as any[]).map((r: any) => (r.installatore ?? r).id)
                        : Array.from(packAssegnaInstallatori);
                      targets.forEach((instId: number) => {
                        assegnaPackaggio.mutate({
                          installatoreId: instId,
                          packId: "custom",
                          nomePacchetto: packConfigForm.nome,
                          importo: prezzoFinale,
                          pratiche_incluse_residenziali: resN,
                          pratiche_incluse_business: busN,
                          note: `Assegnato da pack: ${packConfigForm.nome}`,
                        });
                      });
                      toast.success(`Pack "${packConfigForm.nome}" assegnato a ${targets.length} installatori`);
                    }
                    setShowPackConfigModal(false);
                    setEditPackConfig(null);
                    setPackAssegnaInstallatori(new Set());
                    setPackAssegnaTutti(false);
                    setPackAssegnaDopoSalva(false);
                    setPackAssegnaModalita("singolo");
                  }}>
                  {(creaPackConfig.isPending || modificaPackConfig.isPending) ? "Salvataggio..." : editPackConfig ? "Salva Modifiche" : "Crea Pack"}
                </Button>
                <Button variant="ghost" onClick={() => { setShowPackConfigModal(false); setEditPackConfig(null); setPackAssegnaInstallatori(new Set()); setPackAssegnaTutti(false); setPackAssegnaDopoSalva(false); setPackAssegnaModalita("singolo"); }} className="text-white/50">Annulla</Button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── MODAL RICARICA CONFIGURAZIONE ── */}
      {showRicaricaConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto">
          <div className="bg-[#1a4a2e] border border-purple-400/30 rounded-2xl w-full max-w-md p-6 space-y-4 my-4">
            <div className="flex items-center justify-between">
              <h3 className="text-purple-400 font-black text-lg">{editRicaricaConfig ? 'Modifica Ricarica' : 'Nuova Ricarica'}</h3>
              <Button size="sm" variant="ghost" onClick={() => { setShowRicaricaConfigModal(false); setEditRicaricaConfig(null); }} className="text-white/50">✕</Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-white/60 text-xs mb-1 block">Slug *</label><input className={`${inputCls} w-full`} value={ricaricaConfigForm.slug} onChange={e => setRicaricaConfigForm(f => ({...f, slug: e.target.value}))} placeholder="bollette" disabled={!!editRicaricaConfig} /></div>
              <div><label className="text-white/60 text-xs mb-1 block">Nome *</label><input className={`${inputCls} w-full`} value={ricaricaConfigForm.nome} onChange={e => setRicaricaConfigForm(f => ({...f, nome: e.target.value}))} placeholder="Ricarica Bollette" /></div>
              <div><label className="text-white/60 text-xs mb-1 block">Prezzo (€) *</label><input type="number" className={`${inputCls} w-full`} value={ricaricaConfigForm.prezzo} onChange={e => setRicaricaConfigForm(f => ({...f, prezzo: e.target.value}))} placeholder="150" /></div>
              <div><label className="text-white/60 text-xs mb-1 block">Icona (lucide)</label><input className={`${inputCls} w-full`} value={ricaricaConfigForm.icona} onChange={e => setRicaricaConfigForm(f => ({...f, icona: e.target.value}))} placeholder="zap" /></div>
              <div><label className="text-white/60 text-xs mb-1 block">Ordine</label><input type="number" className={`${inputCls} w-full`} value={ricaricaConfigForm.ordine} onChange={e => setRicaricaConfigForm(f => ({...f, ordine: e.target.value}))} /></div>
              <div><label className="text-white/60 text-xs mb-1 block">Badge</label><input className={`${inputCls} w-full`} value={ricaricaConfigForm.badge} onChange={e => setRicaricaConfigForm(f => ({...f, badge: e.target.value}))} placeholder="Gratis" /></div>
            </div>
            <div><label className="text-white/60 text-xs mb-1 block">Descrizione</label><textarea className={`${inputCls} w-full`} rows={2} value={ricaricaConfigForm.descrizione} onChange={e => setRicaricaConfigForm(f => ({...f, descrizione: e.target.value}))} /></div>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={ricaricaConfigForm.attivo} onChange={e => setRicaricaConfigForm(f => ({...f, attivo: e.target.checked}))} /><span className="text-white/60 text-xs">Attiva</span></label>
            <div className="flex gap-3 pt-2">
              <Button className="bg-purple-400 text-[#0e3320] font-bold flex-1" disabled={creaRicaricaConfig.isPending || modificaRicaricaConfig.isPending}
                onClick={() => {
                  if (!ricaricaConfigForm.nome.trim() || !ricaricaConfigForm.prezzo) { toast.error("Nome e prezzo obbligatori"); return; }
                  const payload = { slug: ricaricaConfigForm.slug, nome: ricaricaConfigForm.nome, prezzo: Number(ricaricaConfigForm.prezzo), descrizione: ricaricaConfigForm.descrizione || undefined, badge: ricaricaConfigForm.badge || undefined, icona: ricaricaConfigForm.icona || "zap", attivo: ricaricaConfigForm.attivo, ordine: Number(ricaricaConfigForm.ordine) || 0 };
                  if (editRicaricaConfig) modificaRicaricaConfig.mutate({ id: editRicaricaConfig.id, ...payload });
                  else creaRicaricaConfig.mutate(payload);
                }}>
                {editRicaricaConfig ? 'Salva Modifiche' : 'Crea Ricarica'}
              </Button>
              <Button variant="ghost" onClick={() => { setShowRicaricaConfigModal(false); setEditRicaricaConfig(null); }} className="text-white/50">Annulla</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL PROMO INSTALLATORE ── */}
      {showPromoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto">
          <div className="bg-[#1a4a2e] border border-[#f5c518]/30 rounded-2xl w-full max-w-lg p-6 space-y-4 my-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[#f5c518] font-black text-lg">{editPromo ? 'Modifica Promo' : 'Nuova Promo'}</h3>
              <Button size="sm" variant="ghost" onClick={() => { setShowPromoModal(false); setEditPromo(null); }} className="text-white/50">✕</Button>
            </div>
            <div>
              <label className="text-white/60 text-xs mb-1 block">Visibilità *</label>
              <select className={`${selectCls} w-full`} value={promoForm.visibilita} onChange={e => setPromoForm(f => ({...f, visibilita: e.target.value as any, installatoreId: e.target.value !== 'singolo' ? '0' : f.installatoreId}))}>
                <option value="home">🏠 Tutti gli installatori + Home pubblica</option>
                <option value="tutti">👥 Solo tutti gli installatori (non in home)</option>
                <option value="singolo">👤 Solo installatore specifico</option>
              </select>
              <p className="text-white/30 text-xs mt-1">
                {promoForm.visibilita === 'home' && 'Visibile a tutti gli installatori nel portale e nella home pubblica'}
                {promoForm.visibilita === 'tutti' && 'Visibile a tutti gli installatori nel portale, non nella home pubblica'}
                {promoForm.visibilita === 'singolo' && 'Visibile solo all\'installatore selezionato'}
              </p>
            </div>
            {promoForm.visibilita === 'singolo' && (
              <div>
                <label className="text-white/60 text-xs mb-1 block">Installatore Specifico *</label>
                <select className={`${selectCls} w-full`} value={promoForm.installatoreId} onChange={e => setPromoForm(f => ({...f, installatoreId: e.target.value}))}>
                  <option value="0">Scegli un installatore...</option>
                  {installatoriDropdown.map((row: any) => {
                    const inst = row.installatore ?? row;
                    return <option key={inst.id} value={String(inst.id)}>{inst.ragioneSociale || inst.nome || `Installatore #${inst.id}`}</option>;
                  })}
                </select>
              </div>
            )}
            <div><label className="text-white/60 text-xs mb-1 block">Titolo *</label><input className={`${inputCls} w-full`} value={promoForm.titolo} onChange={e => setPromoForm(f => ({...f, titolo: e.target.value}))} placeholder="Offerta Speciale Maggio" /></div>
            <div><label className="text-white/60 text-xs mb-1 block">Descrizione</label><textarea className={`${inputCls} w-full`} rows={2} value={promoForm.descrizione} onChange={e => setPromoForm(f => ({...f, descrizione: e.target.value}))} placeholder="Descrizione dell'offerta..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[#f5c518]/80 text-xs mb-1 block">Prezzo promo (€)</label><input type="number" className={`${inputCls} w-full`} value={promoForm.prezzo} onChange={e => setPromoForm(f => ({...f, prezzo: e.target.value}))} placeholder="1500" /></div>
              <div><label className="text-white/40 text-xs mb-1 block">Prezzo originale (€)</label><input type="number" className={`${inputCls} w-full`} value={promoForm.prezzoOriginale} onChange={e => setPromoForm(f => ({...f, prezzoOriginale: e.target.value}))} placeholder="2000" /></div>
              <div><label className="text-white/60 text-xs mb-1 block">Testo pulsante</label><input className={`${inputCls} w-full`} value={promoForm.cta} onChange={e => setPromoForm(f => ({...f, cta: e.target.value}))} placeholder="Scopri di più" /></div>
              <div><label className="text-white/60 text-xs mb-1 block">Link pulsante</label><input className={`${inputCls} w-full`} value={promoForm.ctaUrl} onChange={e => setPromoForm(f => ({...f, ctaUrl: e.target.value}))} placeholder="/acquista" /></div>
              <div><label className="text-white/60 text-xs mb-1 block">Scadenza (opz.)</label><input type="date" className={`${inputCls} w-full`} value={promoForm.scadenza} onChange={e => setPromoForm(f => ({...f, scadenza: e.target.value}))} /></div>
              <div><label className="text-white/60 text-xs mb-1 block">Ordine</label><input type="number" className={`${inputCls} w-full`} value={promoForm.ordine} onChange={e => setPromoForm(f => ({...f, ordine: e.target.value}))} /></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-white/60 text-xs">Colore:</label>
                {['yellow','green','blue','red'].map(c => <button key={c} onClick={() => setPromoForm(f => ({...f, colore: c}))} className={`w-6 h-6 rounded-full border-2 ${promoForm.colore === c ? 'border-white' : 'border-transparent'}`} style={{backgroundColor: c === 'yellow' ? '#f5c518' : c === 'green' ? '#4ade80' : c === 'blue' ? '#60a5fa' : '#f87171'}} />)}
              </div>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={promoForm.attivo} onChange={e => setPromoForm(f => ({...f, attivo: e.target.checked}))} /><span className="text-white/60 text-xs">Attiva</span></label>
            </div>
            <div className="flex gap-3 pt-2">
              <Button className="bg-[#f5c518] text-[#0e3320] font-bold flex-1" disabled={creaPromo.isPending || modificaPromo.isPending}
                onClick={() => {
                  if (!promoForm.titolo.trim()) { toast.error("Il titolo è obbligatorio"); return; }
                  const instId = promoForm.visibilita === 'singolo' ? (Number(promoForm.installatoreId) || 0) : 0;
                  if (promoForm.visibilita === 'singolo' && instId === 0) { toast.error("Seleziona un installatore specifico"); return; }
                  const payload = { installatoreId: instId, titolo: promoForm.titolo, descrizione: promoForm.descrizione || undefined, prezzo: promoForm.prezzo ? Number(promoForm.prezzo) : undefined, prezzoOriginale: promoForm.prezzoOriginale ? Number(promoForm.prezzoOriginale) : undefined, cta: promoForm.cta || "Scopri di più", ctaUrl: promoForm.ctaUrl || undefined, scadenza: promoForm.scadenza || undefined, attivo: promoForm.attivo, colore: promoForm.colore, ordine: Number(promoForm.ordine) || 0, visibilita: promoForm.visibilita };
                  if (editPromo) modificaPromo.mutate({ id: editPromo.id, ...payload });
                  else creaPromo.mutate(payload);
                }}>
                {editPromo ? 'Salva Modifiche' : 'Crea Promo'}
              </Button>
              <Button variant="ghost" onClick={() => { setShowPromoModal(false); setEditPromo(null); }} className="text-white/50">Annulla</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── COMPONENTE DOCUMENTI ───────────────────────────────────────────────────
function DocumentiTab() {
  const utils = trpc.useUtils();
  const { data: documenti = [], isLoading } = trpc.documenti.listaAdmin.useQuery(undefined);
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({ nome: "", descrizione: "", stato: "obbligatorio" as string, ordine: 0 });

  const crea = trpc.documenti.creaAdmin.useMutation({
    onSuccess: () => {
      utils.documenti.listaAdmin.invalidate();
      utils.documenti.miei.invalidate();
      setShowForm(false);
      setForm({ nome: "", descrizione: "", stato: "obbligatorio", ordine: 0 });
      toast.success("Documento creato e sincronizzato con tutti gli installatori");
    },
    onError: (err) => toast.error((err as any).message || "Errore nella creazione"),
  });

  const handleCrea = () => {
    if (!form.nome.trim()) { toast.error("Inserisci il nome del documento"); return; }
    crea.mutate({ nome: form.nome, descrizione: form.descrizione || undefined, stato: form.stato as any, ordine: form.ordine });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-[#f5c518]">Documenti</h2>
          <p className="text-white/40 text-sm mt-1">Crea documenti che verranno sincronizzati con gli installatori</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-[#f5c518] text-[#1a4a2e] font-bold px-4 py-2 rounded-lg text-sm hover:bg-[#f5c518]/90 transition-colors">
          <Plus className="w-4 h-4" /> Nuovo Documento
        </button>
      </div>

      {showForm && (
        <div className="bg-[#0e3320] border border-[#f5c518]/30 rounded-xl p-5 space-y-4">
          <h3 className="text-[#f5c518] font-bold">Nuovo Documento</h3>
          <div className="space-y-3">
            <div>
              <label className="text-white/60 text-xs mb-1 block">Nome Documento *</label>
              <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="es. Dichiarazione conformità DM 37/08" className="w-full bg-[#1a4a2e] border border-white/20 text-white rounded-lg px-3 py-2 text-sm placeholder:text-white/30" />
            </div>
            <div>
              <label className="text-white/60 text-xs mb-1 block">Descrizione</label>
              <textarea value={form.descrizione} onChange={e => setForm(f => ({ ...f, descrizione: e.target.value }))} placeholder="Descrizione opzionale..." className="w-full bg-[#1a4a2e] border border-white/20 text-white rounded-lg px-3 py-2 text-sm placeholder:text-white/30 h-20" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-white/60 text-xs mb-1 block">Stato</label>
                <select value={form.stato} onChange={e => setForm(f => ({ ...f, stato: e.target.value }))} className="w-full bg-[#1a4a2e] border border-white/20 text-white rounded-lg px-3 py-2 text-sm">
                  <option value="obbligatorio">Obbligatorio</option>
                  <option value="opzionale">Opzionale</option>
                  <option value="consigliato">Consigliato</option>
                </select>
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1 block">Ordine</label>
                <input type="number" value={form.ordine} onChange={e => setForm(f => ({ ...f, ordine: Number(e.target.value) }))} className="w-full bg-[#1a4a2e] border border-white/20 text-white rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleCrea} disabled={crea.isPending} className="flex-1 bg-[#f5c518] text-[#1a4a2e] font-bold px-4 py-2 rounded-lg text-sm hover:bg-[#f5c518]/90 transition-colors disabled:opacity-50">
                {crea.isPending ? "Creando..." : "Crea e Sincronizza"}
              </button>
              <button onClick={() => setShowForm(false)} className="flex-1 bg-white/10 text-white font-bold px-4 py-2 rounded-lg text-sm hover:bg-white/20 transition-colors">
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista documenti */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-white/50 text-sm">Caricamento...</div>
        ) : documenti.length === 0 ? (
          <div className="bg-[#0e3320] border border-white/10 rounded-xl p-4 text-white/50 text-sm text-center">Nessun documento creato</div>
        ) : (
          documenti.map((doc: any) => (
            <div key={doc.id} className="bg-[#0e3320] border border-white/10 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-bold text-white">{doc.nome}</div>
                  {doc.descrizione && <div className="text-white/60 text-sm mt-1">{doc.descrizione}</div>}
                  <div className="flex gap-2 mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${doc.stato === "obbligatorio" ? "bg-red-500/20 text-red-300" : doc.stato === "opzionale" ? "bg-blue-500/20 text-blue-300" : "bg-yellow-500/20 text-yellow-300"}`}>
                      {doc.stato}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/60">Ordine: {doc.ordine}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Cancellazione Ordine Protetta */}
      {deleteModalOrdineId !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#0e3320] border border-[#f5c518]/30 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-[#f5c518] mb-4">⚠️ Conferma Cancellazione Ordine</h3>
            <p className="text-white/70 text-sm mb-4">Inserisci la password per confermare l'eliminazione di questo ordine.</p>
            <input
              type="password"
              value={deletePassword}
              onChange={e => setDeletePassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-[#1a4a2e] border border-white/20 text-white rounded-lg px-3 py-2 text-sm mb-4"
              onKeyDown={e => e.key === "Enter" && deleteOrdineProtected.mutate({ ordineId: deleteModalOrdineId, password: deletePassword })}
            />
            <div className="flex gap-2">
              <button
                onClick={() => deleteOrdineProtected.mutate({ ordineId: deleteModalOrdineId, password: deletePassword })}
                disabled={deleteOrdineProtected.isPending || !deletePassword}
                className="flex-1 bg-red-500/20 text-red-300 hover:bg-red-500/30 font-bold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                {deleteOrdineProtected.isPending ? "Eliminando..." : "Elimina"}
              </button>
              <button
                onClick={() => { setDeleteModalOrdineId(null); setDeletePassword(""); }}
                className="flex-1 bg-white/10 text-white hover:bg-white/20 font-bold px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cancellazione Pratica Protetta */}
      {deleteModalPraticaId !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#0e3320] border border-[#f5c518]/30 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-[#f5c518] mb-4">⚠️ Conferma Cancellazione Pratica</h3>
            <p className="text-white/70 text-sm mb-4">Inserisci la password per confermare l'eliminazione di questa pratica.</p>
            <input
              type="password"
              value={deletePassword}
              onChange={e => setDeletePassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-[#1a4a2e] border border-white/20 text-white rounded-lg px-3 py-2 text-sm mb-4"
              onKeyDown={e => e.key === "Enter" && deletePraticaProtected.mutate({ praticaId: deleteModalPraticaId, password: deletePassword })}
            />
            <div className="flex gap-2">
              <button
                onClick={() => deletePraticaProtected.mutate({ praticaId: deleteModalPraticaId, password: deletePassword })}
                disabled={deletePraticaProtected.isPending || !deletePassword}
                className="flex-1 bg-red-500/20 text-red-300 hover:bg-red-500/30 font-bold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                {deletePraticaProtected.isPending ? "Eliminando..." : "Elimina"}
              </button>
              <button
                onClick={() => { setDeleteModalPraticaId(null); setDeletePassword(""); }}
                className="flex-1 bg-white/10 text-white hover:bg-white/20 font-bold px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
