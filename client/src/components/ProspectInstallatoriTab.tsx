import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Users, Download, Upload, Search, MapPin, Phone, Mail, Globe,
  Trash2, CheckSquare, Square, X, Plus, Loader2, FileSpreadsheet,
  Handshake, Star, UserCheck, Eye, Pencil, ChevronDown, RotateCcw, AlertTriangle
} from "lucide-react";

const REGIONI = [
  "Abruzzo","Basilicata","Calabria","Campania","Emilia-Romagna","Friuli-Venezia Giulia",
  "Lazio","Liguria","Lombardia","Marche","Molise","Piemonte","Puglia","Sardegna",
  "Sicilia","Toscana","Trentino-Alto Adige","Umbria","Valle d'Aosta","Veneto"
];

const SETTORI = [
  "Impianti Fotovoltaici","Installatori Elettrici","Termoidraulica",
  "Edilizia","Energie Rinnovabili","Efficienza Energetica",
];

type StatoContatto = "nuovo" | "da_contattare" | "contattato" | "trattativa" | "interessato" | "accordo" | "cliente_attivo" | "cliente" | "non_interessato";
type Fonte = "webinar" | "excel" | "google_maps" | "manuale" | "cciaa" | "linkedin" | "altro";

const STATO_COLORS: Record<StatoContatto, string> = {
  nuovo: "bg-slate-600",
  da_contattare: "bg-slate-500",
  contattato: "bg-blue-500",
  trattativa: "bg-orange-500",
  interessato: "bg-yellow-500",
  accordo: "bg-purple-500",
  cliente_attivo: "bg-green-500",
  cliente: "bg-green-600",
  non_interessato: "bg-red-500",
};

const STATO_LABELS: Record<StatoContatto, string> = {
  nuovo: "Nuovo",
  da_contattare: "Da contattare",
  contattato: "Contattato",
  trattativa: "In trattativa",
  interessato: "C'è interesse",
  accordo: "Accordo firmato",
  cliente_attivo: "Cliente attivo",
  cliente: "Cliente",
  non_interessato: "Non c'è interesse",
};

const FONTE_LABELS: Record<Fonte, string> = {
  webinar: "🎓 Webinar",
  excel: "📊 Excel",
  google_maps: "🗺️ Google Maps",
  manuale: "✍️ Manuale",
  cciaa: "🏛️ CCIAA",
  linkedin: "💼 LinkedIn",
  altro: "📋 Altro",
};

// Mappa colonne Excel → campi DB
function mapExcelRow(row: Record<string, any>, fonte: Fonte): Record<string, any> | null {
  const get = (...keys: string[]) => {
    for (const k of keys) {
      const val = row[k] ?? row[k.toLowerCase()] ?? row[k.toUpperCase()];
      if (val !== undefined && val !== null && String(val).trim() !== "") return String(val).trim();
    }
    return undefined;
  };
  const ragioneSociale = get("ragioneSociale", "Ragione Sociale", "Azienda", "Nome Azienda", "Company", "nome", "Nome", "Nominativo");
  if (!ragioneSociale) return null;
  return {
    ragioneSociale,
    nome: get("nome", "Nome", "Referente", "Contatto", "First Name", "LastName"),
    email: get("email", "Email", "E-mail", "Mail"),
    telefono: get("telefono", "Telefono", "Tel", "Phone", "Cellulare", "Cell"),
    settore: get("settore", "Settore", "Categoria"),
    regione: get("regione", "Regione"),
    provincia: get("provincia", "Provincia", "Prov"),
    comune: get("comune", "Comune", "Città", "Citta"),
    note: get("note", "Note", "Commenti"),
    fonte,
    statoContatto: "nuovo" as StatoContatto,
  };
}

// Componente per mostrare i pacchetti acquistati da un prospect
function PackAcquistatiSection({ prospectId }: { prospectId: number }) {
  // @ts-ignore - sub-router ai non inferito da TypeScript
  const { data, isLoading } = trpc.prospectInstallatori.ai.getPackInstallatore.useQuery({ prospectId });
  if (isLoading) return <div className="text-white/30 text-xs py-2"><Loader2 className="w-3 h-3 animate-spin inline mr-1" />Caricamento pacchetti...</div>;
  if (!data?.pack?.length) return null;
  const PACK_LABELS: Record<string, string> = { pack1: 'Pack 1 (5 pratiche)', pack2: 'Pack 2 (10 pratiche)', pack3: 'Pack 3 (20 pratiche)', singolo: 'Pratica Singola' };
  return (
    <div className="mt-2 p-3 bg-[#0e3320] rounded-lg border border-yellow-500/20">
      <p className="text-yellow-400 text-xs font-bold mb-2 flex items-center gap-1">
        <Star className="w-3 h-3" /> Pacchetti Acquistati
      </p>
      <div className="space-y-1">
        {(data.pack as any[]).map((p: any) => (
          <div key={p.id} className="flex items-center justify-between text-xs">
            <span className="text-white/70">{PACK_LABELS[p.packId] ?? p.packId}</span>
            <div className="flex items-center gap-2">
              <span className="text-white/40">{p.pratiche_usate ?? 0}/{p.pratiche_incluse ?? 0} usate</span>
              <span className={`px-1.5 py-0.5 rounded text-white ${ p.stato === 'pagato' ? 'bg-green-700' : p.stato === 'in_attesa' ? 'bg-yellow-700' : 'bg-red-800' }`}>{p.stato}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Componente per aggiungere un pacchetto direttamente dal CRM
function AggiungiPacchettoSection({ prospectId }: { prospectId: number }) {
  const [open, setOpen] = useState(false);
  const [packId, setPackId] = useState<"pack1" | "pack2" | "pack3">("pack1");
  const utils = trpc.useUtils();
  const PACK_LABELS = { pack1: 'Pack 1 — €2.000 (5 pratiche)', pack2: 'Pack 2 — €3.150 (10 pratiche)', pack3: 'Pack 3 — €5.100 (20 pratiche)' };
  // @ts-ignore
  const { data: packData } = trpc.prospectInstallatori.ai.getPackInstallatore.useQuery({ prospectId });
  const installatoreId = packData?.installatoreId as number | undefined;
  // @ts-ignore
  const aggiungiMut = trpc.ordini.creaAdmin.useMutation({
    onSuccess: () => {
      toast.success('Pacchetto aggiunto con successo');
      setOpen(false);
      // @ts-ignore
      utils.prospectInstallatori.ai.getPackInstallatore.invalidate({ prospectId });
    },
    onError: () => toast.error('Errore aggiunta pacchetto'),
  });
  if (!installatoreId) return null;
  return (
    <div className="mt-2">
      {!open ? (
        <button onClick={() => setOpen(true)}
          className="text-xs text-green-400/70 hover:text-green-400 flex items-center gap-1 transition-colors">
          <Plus className="w-3 h-3" /> Aggiungi pacchetto dal CRM
        </button>
      ) : (
        <div className="p-3 bg-[#0e3320] rounded-lg border border-green-500/20 space-y-2">
          <p className="text-green-400 text-xs font-bold">Aggiungi Pacchetto</p>
          <Select value={packId} onValueChange={(v: any) => setPackId(v)}>
            <SelectTrigger className="bg-[#1a4a2e] border-white/20 text-white text-xs h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PACK_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs h-7"
              disabled={aggiungiMut.isPending}
              onClick={() => aggiungiMut.mutate({
                installatoreId,
                packId,
                metodoPagamento: 'bonifico',
                nomeAcquirente: 'Admin CRM',
                emailAcquirente: 'admin@ricaricati.it',
                stato: 'pagato',
              })}>
              {aggiungiMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Conferma'}
            </Button>
            <Button size="sm" variant="ghost" className="text-white/40 text-xs h-7" onClick={() => setOpen(false)}>Annulla</Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProspectInstallatoriTab() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  // Vista attiva: lista o cestino
  const [vistaAttiva, setVistaAttiva] = useState<"lista" | "cestino" | "kanban">("lista");
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  // Filtri Kanban
  const [kanbanQ, setKanbanQ] = useState("");
  const [kanbanDataDa, setKanbanDataDa] = useState("");
  const [kanbanDataA, setKanbanDataA] = useState("");
  const [kanbanFiltroStato, setKanbanFiltroStato] = useState<string>("");

  // Filtri lista
  const [q, setQ] = useState("");
  const [filtroRegione, setFiltroRegione] = useState<string>("");
  const [filtroStato, setFiltroStato] = useState<string>("");
  const [selezionati, setSelezionati] = useState<Set<number>>(new Set());

  // Dialog stati
  const [showCercaDialog, setShowCercaDialog] = useState(false);
  const [showNuovoDialog, setShowNuovoDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showDettaglioDialog, setShowDettaglioDialog] = useState<any | null>(null);
  const [showAccordoDialog, setShowAccordoDialog] = useState<any | null>(null);

  // Cerca Google Maps
  const [cercaQuery, setCercaQuery] = useState("installatori fotovoltaico");
  const [cercaProvincia, setCercaProvincia] = useState("");
  const [cercaRegione, setCercaRegione] = useState("");
  const [cercaResults, setCercaResults] = useState<any[]>([]);
  const [cercaSelezionati, setCercaSelezionati] = useState<Set<number>>(new Set());
  const [cercaLoading, setCercaLoading] = useState(false);

  // Import Excel
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importFonte, setImportFonte] = useState<Fonte>("excel");
  const [importLoading, setImportLoading] = useState(false);

  // Nuovo form
  const [nuovoForm, setNuovoForm] = useState({
    ragioneSociale: "", nome: "", settore: "Impianti Fotovoltaici", regione: "",
    provincia: "", comune: "", telefono: "", email: "", sito: "", note: "",
    fonte: "manuale" as Fonte, referente: "", statoContatto: "nuovo" as StatoContatto,
  });

  // Accordo form
  const [accordoForm, setAccordoForm] = useState({ sconto: "", noteAccordo: "" });

  const { data: installatori, refetch, isLoading } = trpc.prospectInstallatori.lista.useQuery({
    q: q || undefined,
    regione: filtroRegione || undefined,
    statoContatto: (filtroStato || undefined) as any,
  });

  const eliminaMut = trpc.prospectInstallatori.elimina.useMutation({
    onSuccess: () => {
      utils.prospectInstallatori.lista.invalidate();
      utils.prospectInstallatori.cestino.invalidate();
      toast.success("Spostato nel cestino");
    }
  });
  const ripristinaMut = trpc.prospectInstallatori.ripristina.useMutation({
    onSuccess: () => {
      utils.prospectInstallatori.lista.invalidate();
      utils.prospectInstallatori.cestino.invalidate();
      toast.success("Contatto ripristinato!");
    }
  });
  const eliminaDefinitivoMut = trpc.prospectInstallatori.eliminaDefinitivo.useMutation({
    onSuccess: () => {
      utils.prospectInstallatori.cestino.invalidate();
      toast.success("Eliminato definitivamente");
    }
  });
  const { data: cestino, isLoading: cestinoLoading } = trpc.prospectInstallatori.cestino.useQuery();
  const creaMut = trpc.prospectInstallatori.crea.useMutation({
    onSuccess: () => { utils.prospectInstallatori.lista.invalidate(); setShowNuovoDialog(false); toast.success("Aggiunto!"); }
  });
  const aggiornaMut = trpc.prospectInstallatori.aggiorna.useMutation({
    onSuccess: () => { utils.prospectInstallatori.lista.invalidate(); setShowDettaglioDialog(null); setShowAccordoDialog(null); toast.success("Aggiornato!"); }
  });
  const importaBulkMut = trpc.prospectInstallatori.importaBulk.useMutation({
    onSuccess: (r) => {
      utils.prospectInstallatori.lista.invalidate();
      setShowImportDialog(false);
      setImportPreview([]);
      toast.success(`Importati ${r.importati} contatti${r.saltati > 0 ? ` (${r.saltati} saltati)` : ""}`);
    },
    onError: (e) => toast.error(e.message),
  });
  const cercaGMMut = trpc.prospectInstallatori.cercaGoogleMaps.useMutation({
    onSuccess: (r) => {
      setCercaResults(r.results);
      setCercaSelezionati(new Set(r.results.map((_: any, i: number) => i))); // seleziona tutti di default
      setCercaLoading(false);
      if (r.results.length === 0) toast.error("Nessun risultato. Prova con una zona diversa.");
      else toast.success(`Trovati ${r.results.length} installatori (tutti pre-selezionati)`);
    },
    onError: (e) => { toast.error(e.message); setCercaLoading(false); },
  });
  const unificaDuplicatiMut = trpc.prospectInstallatori.unificaDuplicati.useMutation({
    onSuccess: (r) => {
      utils.prospectInstallatori.lista.invalidate();
      if (r.eliminati === 0) toast.success("Nessun duplicato trovato!");
      else toast.success(`Unificati ${r.eliminati} duplicati — ${r.unificati} contatti principali mantenuti`);
    },
    onError: (e) => toast.error(e.message),
  });
  const fixRegioniMut = trpc.prospectInstallatori.fixRegioni.useMutation({
    onSuccess: (r) => {
      utils.prospectInstallatori.lista.invalidate();
      toast.success(`Regioni aggiornate: ${r.aggiornati} contatti`);
    },
    onError: (e) => toast.error(e.message),
  });

  // ── AI mutations ──────────────────────────────────────────────────────────
  const [aiScore, setAiScore] = useState<Record<number, any>>({});
  const [aiProposta, setAiProposta] = useState<Record<number, string>>({});
  const [aiLinkOfferta, setAiLinkOfferta] = useState<Record<number, string>>({});
  const [aiLoading, setAiLoading] = useState<Record<number, string>>({}); // id → 'score'|'proposta'|'link'
  const [showAiDialog, setShowAiDialog] = useState<{ id: number; tipo: 'score' | 'proposta' | 'link' } | null>(null);
  const [linkForm, setLinkForm] = useState({ pack: '' as '' | 'pack1' | 'pack2' | 'pack3', sconto: '', giorni: '30', messaggio: '' });

  // @ts-ignore - sub-router ai non inferito da TypeScript
  const analizzaScoreMut = trpc.prospectInstallatori.ai.calcolaScore.useMutation({
    onSuccess: (r: any, vars: any) => {
      setAiScore(prev => ({ ...prev, [vars.id]: r }));
      setAiLoading(prev => { const n = {...prev}; delete n[vars.id]; return n; });
      utils.prospectInstallatori.lista.invalidate();
      toast.success(`Score AI: ${r.score}/100`);
    },
    onError: (e: any) => { toast.error(e.message); setAiLoading({}); },
  });

  // @ts-ignore - sub-router ai non inferito da TypeScript
  const generaPropostaMut = trpc.prospectInstallatori.ai.generaProposta.useMutation({
    onSuccess: (r: any, vars: any) => {
      setAiProposta(prev => ({ ...prev, [vars.id]: r.testo }));
      setAiLoading(prev => { const n = {...prev}; delete n[vars.id]; return n; });
      setShowAiDialog({ id: vars.id, tipo: 'proposta' });
      
      // Scarica il PDF
      if (r.pdfBase64 && r.fileName) {
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${r.pdfBase64}`;
        link.download = r.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Proposta PDF scaricata!');
      }
    },
    onError: (e: any) => { toast.error(e.message); setAiLoading({}); },
  });

  // @ts-ignore - sub-router ai non inferito da TypeScript
  const creaLinkOffertaMut = trpc.prospectInstallatori.ai.creaLinkOfferta.useMutation({
    onSuccess: (r: any, vars: any) => {
      setAiLinkOfferta(prev => ({ ...prev, [vars.id]: r.url }));
      setAiLoading(prev => { const n = {...prev}; delete n[vars.id]; return n; });
      setShowAiDialog({ id: vars.id, tipo: 'link' });
      toast.success('Link offerta creato!');
    },
    onError: (e: any) => { toast.error(e.message); setAiLoading({}); },
  });

  const handleExportCsv = () => {
    if (!installatori?.length) return;
    const rows = installatori.map(i => ({
      "Ragione Sociale": i.ragioneSociale,
      "Nome": i.nome ?? "",
      "Email": i.email ?? "",
      "Telefono": i.telefono ?? "",
      "Settore": i.settore ?? "",
      "Regione": i.regione ?? "",
      "Provincia": i.provincia ?? "",
      "Comune": i.comune ?? "",
      "Stato": STATO_LABELS[i.statoContatto as StatoContatto] ?? i.statoContatto,
      "Fonte": i.fonte ?? "",
      "Referente": i.referente ?? "",
      "Note": i.note ?? "",
    }));
    toast.info("Export Excel disponibile nel prossimo aggiornamento");
  };

  const handleImportFile = () => {
    toast.info("Import Excel disponibile nel prossimo aggiornamento");
  };

  const toggleSel = (id: number) => {
    setSelezionati(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleCercaSel = (idx: number) => {
    setCercaSelezionati(prev => { const n = new Set(prev); n.has(idx) ? n.delete(idx) : n.add(idx); return n; });
  };

  const importaSelezionatiGM = async () => {
    const toImport = cercaResults.filter((_, i) => cercaSelezionati.has(i));
    if (!toImport.length) return;
    importaBulkMut.mutate({ records: toImport });
    setShowCercaDialog(false);
    setCercaResults([]);
    setCercaSelezionati(new Set());
  };

  const totalCount = installatori?.length ?? 0;

  // Statistiche rapide
  const stats = {
    totale: totalCount,
    accordi: installatori?.filter(i => i.statoContatto === "accordo" || i.statoContatto === "cliente_attivo" || i.statoContatto === "cliente").length ?? 0,
    trattativa: installatori?.filter(i => i.statoContatto === "trattativa" || i.statoContatto === "interessato").length ?? 0,
    nuovi: installatori?.filter(i => i.statoContatto === "nuovo" || i.statoContatto === "da_contattare").length ?? 0,
  };

  return (
    <div className="space-y-5">
      {/* Tab switcher: Lista / Cestino */}
      <div className="flex gap-2">
        <button
          onClick={() => setVistaAttiva("lista")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            vistaAttiva === "lista" ? "bg-green-600 text-white" : "bg-white/5 text-white/50 hover:bg-white/10"
          }`}>
          <Users className="w-4 h-4" /> Contatti ({installatori?.length ?? 0})
        </button>
        <button
          onClick={() => setVistaAttiva("kanban")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            vistaAttiva === "kanban" ? "bg-purple-600 text-white" : "bg-white/5 text-white/50 hover:bg-white/10"
          }`}>
          <Eye className="w-4 h-4" /> Pipeline Kanban
        </button>
        <button
          onClick={() => setVistaAttiva("cestino")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            vistaAttiva === "cestino" ? "bg-red-700 text-white" : "bg-white/5 text-white/50 hover:bg-white/10"
          }`}>
          <Trash2 className="w-4 h-4" /> Cestino {(cestino?.length ?? 0) > 0 && <span className="bg-red-500 text-white text-xs rounded-full px-1.5">{cestino?.length}</span>}
        </button>
      </div>

      {/* ── VISTA CESTINO ── */}
      {vistaAttiva === "cestino" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-500/30 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-red-300 text-sm">I contatti nel cestino possono essere ripristinati o eliminati definitivamente.</p>
          </div>
          {cestinoLoading ? (
            <div className="flex items-center justify-center py-10 text-white/40">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Caricamento...
            </div>
          ) : !cestino?.length ? (
            <div className="text-center py-16 text-white/40">
              <Trash2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">Cestino vuoto</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cestino.map((inst) => (
                <div key={inst.id} className="flex items-center gap-3 p-4 rounded-xl border bg-red-900/10 border-red-500/20">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white/70 text-sm truncate">{inst.ragioneSociale}</p>
                    {inst.nome && <span className="text-white/30 text-xs">({inst.nome})</span>}
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {inst.email && <span className="text-white/30 text-xs">{inst.email}</span>}
                      {inst.telefono && <span className="text-white/30 text-xs">{inst.telefono}</span>}
                      {inst.eliminatoAt && (
                        <span className="text-red-400/60 text-xs">Eliminato il {new Date(inst.eliminatoAt).toLocaleDateString("it-IT")}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="sm" variant="ghost" className="text-green-400/70 hover:text-green-400 p-1"
                      title="Ripristina"
                      onClick={() => ripristinaMut.mutate({ id: inst.id })}>
                      <RotateCcw className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-400/60 hover:text-red-400 p-1"
                      title="Elimina definitivamente"
                      onClick={() => {
                        if (confirm(`Eliminare definitivamente "${inst.ragioneSociale}"? Questa azione non può essere annullata.`))
                          eliminaDefinitivoMut.mutate({ id: inst.id });
                      }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── VISTA KANBAN ── */}
      {vistaAttiva === "kanban" && (
        <div className="space-y-3">
          {/* Barra filtri Kanban */}
          <div className="flex flex-wrap gap-2 items-end bg-[#0e3320] rounded-xl p-3 border border-white/10">
            <div className="flex-1 min-w-[180px]">
              <p className="text-white/40 text-xs mb-1">Cerca per nome / azienda</p>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                <Input
                  value={kanbanQ}
                  onChange={e => setKanbanQ(e.target.value)}
                  placeholder="Nome, ragione sociale..."
                  className="pl-8 h-8 text-xs bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>
            </div>
            <div className="min-w-[140px]">
              <p className="text-white/40 text-xs mb-1">Data registrazione da</p>
              <Input
                type="date"
                value={kanbanDataDa}
                onChange={e => setKanbanDataDa(e.target.value)}
                className="h-8 text-xs bg-white/5 border-white/10 text-white [color-scheme:dark]"
              />
            </div>
            <div className="min-w-[140px]">
              <p className="text-white/40 text-xs mb-1">Data registrazione a</p>
              <Input
                type="date"
                value={kanbanDataA}
                onChange={e => setKanbanDataA(e.target.value)}
                className="h-8 text-xs bg-white/5 border-white/10 text-white [color-scheme:dark]"
              />
            </div>
            <div className="min-w-[140px]">
              <p className="text-white/40 text-xs mb-1">Filtra colonna</p>
              <Select value={kanbanFiltroStato} onValueChange={setKanbanFiltroStato}>
                <SelectTrigger className="h-8 text-xs bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Tutte le colonne" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tutte le colonne</SelectItem>
                  {(["nuovo","da_contattare","contattato","trattativa","interessato","accordo","cliente_attivo"] as StatoContatto[]).map(s => (
                    <SelectItem key={s} value={s}>{STATO_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(kanbanQ || kanbanDataDa || kanbanDataA || kanbanFiltroStato) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setKanbanQ(""); setKanbanDataDa(""); setKanbanDataA(""); setKanbanFiltroStato(""); }}
                className="h-8 text-xs border-red-500/40 text-red-400 hover:bg-red-500/10 self-end">
                <X className="w-3 h-3 mr-1" /> Azzera filtri
              </Button>
            )}
          </div>

          <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {((["nuovo","da_contattare","contattato","trattativa","interessato","accordo","cliente_attivo"] as StatoContatto[]).filter(s => !kanbanFiltroStato || s === kanbanFiltroStato)).map(stato => {
              const colInstallatori = (installatori ?? []).filter(i => {
                if (i.statoContatto !== stato) return false;
                // Filtro per nome / ragione sociale
                if (kanbanQ) {
                  const qLow = kanbanQ.toLowerCase();
                  const match =
                    (i.ragioneSociale ?? "").toLowerCase().includes(qLow) ||
                    (i.nome ?? "").toLowerCase().includes(qLow) ||
                    (i.email ?? "").toLowerCase().includes(qLow);
                  if (!match) return false;
                }
                // Filtro per data di registrazione
                if (kanbanDataDa && i.createdAt) {
                  const created = new Date(i.createdAt);
                  const da = new Date(kanbanDataDa);
                  if (created < da) return false;
                }
                if (kanbanDataA && i.createdAt) {
                  const created = new Date(i.createdAt);
                  const a = new Date(kanbanDataA);
                  a.setHours(23, 59, 59, 999);
                  if (created > a) return false;
                }
                return true;
              });
              return (
                <div key={stato}
                  className={`w-64 rounded-xl border transition-colors ${
                    dragOverCol === stato ? "border-yellow-400/60 bg-yellow-400/5" : "border-white/10 bg-[#0e3320]"
                  }`}
                  onDragOver={e => { e.preventDefault(); setDragOverCol(stato); }}
                  onDragLeave={() => setDragOverCol(null)}
                  onDrop={async e => {
                    e.preventDefault();
                    setDragOverCol(null);
                    if (draggedId !== null) {
                      try {
                        // @ts-ignore
                        await utils.client.prospectInstallatori.aggiorna.mutate({ id: draggedId, statoContatto: stato });
                        utils.prospectInstallatori.lista.invalidate();
                        toast.success(`Spostato in "${STATO_LABELS[stato]}"`);
                      } catch { toast.error("Errore spostamento"); }
                      setDraggedId(null);
                    }
                  }}>
                  <div className="p-3 border-b border-white/10 flex items-center justify-between">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full text-white ${STATO_COLORS[stato]}`}>{STATO_LABELS[stato]}</span>
                    <span className="text-white/40 text-xs">{colInstallatori.length}</span>
                  </div>
                  <div className="p-2 space-y-2 min-h-[120px] max-h-[70vh] overflow-y-auto">
                    {colInstallatori.map(inst => (
                      <div key={inst.id}
                        draggable
                        onDragStart={() => setDraggedId(inst.id)}
                        onDragEnd={() => { setDraggedId(null); setDragOverCol(null); }}
                        className={`p-3 rounded-lg border cursor-grab active:cursor-grabbing transition-opacity ${
                          draggedId === inst.id ? "opacity-40" : "opacity-100"
                        } bg-[#1a4a2e] border-white/10 hover:border-white/20`}
                        onClick={() => setShowDettaglioDialog(inst)}>
                        <p className="font-semibold text-white text-xs truncate">{inst.ragioneSociale}</p>
                        {inst.nome && <p className="text-white/40 text-xs truncate">{inst.nome}</p>}
                        {inst.scoreAI ? <p className="text-yellow-400 text-xs mt-1">⭐ Score: {inst.scoreAI}/100</p> : null}
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {inst.email && <span className="text-white/30 text-xs">✉</span>}
                          {inst.telefono && <span className="text-white/30 text-xs">📞</span>}
                          {inst.regione && <span className="text-white/30 text-xs">{inst.regione}</span>}
                        </div>
                      </div>
                    ))}
                    {colInstallatori.length === 0 && (
                      <p className="text-white/20 text-xs text-center py-4">Nessun contatto</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        </div>
      )}

      {/* ── VISTA LISTA (default) ── */}
      {vistaAttiva === "lista" && <>
      {/* Statistiche rapide */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Totale contatti", val: stats.totale, color: "text-white", icon: Users },
          { label: "Con accordo", val: stats.accordi, color: "text-green-400", icon: Handshake },
          { label: "In trattativa", val: stats.trattativa, color: "text-yellow-400", icon: Star },
          { label: "Da contattare", val: stats.nuovi, color: "text-blue-400", icon: UserCheck },
        ].map(s => (
          <div key={s.label} className="bg-[#0e3320] rounded-xl p-4 border border-white/10">
            <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
            <p className={`font-black text-2xl ${s.color}`}>{s.val}</p>
            <p className="text-white/50 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Barra azioni */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" onClick={() => setShowNuovoDialog(true)}
            className="bg-green-600 hover:bg-green-700 text-white">
            <Plus className="w-4 h-4 mr-1" /> Nuovo contatto
          </Button>
          <Button size="sm" onClick={() => setShowCercaDialog(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white">
            <Search className="w-4 h-4 mr-1" /> Cerca su Google Maps
          </Button>
          <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}
            className="border-purple-500 text-purple-400 hover:bg-purple-500/10">
            <FileSpreadsheet className="w-4 h-4 mr-1" /> Import Excel
          </Button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportFile} />
          <Button size="sm" variant="outline" onClick={handleExportCsv}
            className="border-slate-500 text-slate-300 hover:bg-slate-500/10">
            <Download className="w-4 h-4 mr-1" /> Export Excel
          </Button>
          <Button size="sm" variant="outline"
            onClick={() => { if (confirm("Cercare e unificare i duplicati (stessa email o ragione sociale simile)? I duplicati verranno spostati nel cestino.")) unificaDuplicatiMut.mutate(); }}
            disabled={unificaDuplicatiMut.isPending}
            className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10">
            {unificaDuplicatiMut.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckSquare className="w-4 h-4 mr-1" />}
            Unifica duplicati
          </Button>
          <Button size="sm" variant="outline"
            onClick={() => { if (confirm("Aggiornare la regione di tutti i contatti importati da Google Maps che non hanno ancora la regione impostata?")) fixRegioniMut.mutate(); }}
            disabled={fixRegioniMut.isPending}
            className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10">
            {fixRegioniMut.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <MapPin className="w-4 h-4 mr-1" />}
            Ripara regioni
          </Button>
        </div>
      </div>

      {/* Filtri */}
      <div className="flex gap-2 flex-wrap">
        <Input placeholder="Cerca per nome, email, telefono..." value={q} onChange={e => setQ(e.target.value)}
          className="max-w-xs bg-white/5 border-white/10 text-white placeholder:text-white/30" />
        <Select value={filtroRegione} onValueChange={setFiltroRegione}>
          <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="Regione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tutte le regioni</SelectItem>
            {REGIONI.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filtroStato} onValueChange={setFiltroStato}>
          <SelectTrigger className="w-44 bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="Stato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tutti gli stati</SelectItem>
            {Object.entries(STATO_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        {(filtroRegione || filtroStato || q) && (
          <Button size="sm" variant="ghost" onClick={() => { setFiltroRegione(""); setFiltroStato(""); setQ(""); }}
            className="text-white/50">
            <X className="w-4 h-4 mr-1" /> Reset
          </Button>
        )}
      </div>

      {/* Selezione tutti */}
      <div className="flex items-center gap-3 text-sm text-white/60">
        <button onClick={() => setSelezionati(
          selezionati.size === totalCount && totalCount > 0 ? new Set() : new Set(installatori?.map(i => i.id) ?? [])
        )} className="flex items-center gap-1 hover:text-white transition-colors">
          {selezionati.size === totalCount && totalCount > 0
            ? <CheckSquare className="w-4 h-4 text-green-400" />
            : <Square className="w-4 h-4" />}
          Seleziona tutti
        </button>
        <span>{totalCount} contatti</span>
        {selezionati.size > 0 && (
          <Button size="sm" variant="outline" className="border-red-500/40 text-red-400 hover:bg-red-500/10 ml-2"
            onClick={() => {
              if (!confirm(`Eliminare ${selezionati.size} contatti?`)) return;
              selezionati.forEach(id => eliminaMut.mutate({ id }));
              setSelezionati(new Set());
            }}>
            <Trash2 className="w-3 h-3 mr-1" /> Elimina selezionati
          </Button>
        )}
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex items-center justify-center py-10 text-white/40">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Caricamento...
        </div>
      ) : !installatori?.length ? (
        <div className="text-center py-16 text-white/40">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Nessun contatto trovato</p>
          <p className="text-sm mt-1">Importa un file Excel o cerca su Google Maps</p>
        </div>
      ) : (
        <div className="space-y-2">
          {installatori.map((inst) => (
            <div key={inst.id}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-colors cursor-pointer ${selezionati.has(inst.id) ? "bg-green-900/20 border-green-500/30" : "bg-[#0e3320] border-white/10 hover:border-white/20"}`}
              onClick={() => toggleSel(inst.id)}>
              <div onClick={e => e.stopPropagation()}>
                <button onClick={() => toggleSel(inst.id)} className="text-white/40 hover:text-white">
                  {selezionati.has(inst.id) ? <CheckSquare className="w-4 h-4 text-green-400" /> : <Square className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-white text-sm truncate">{inst.ragioneSociale}</p>
                  {inst.nome && <span className="text-white/40 text-xs">({inst.nome})</span>}
                  <span className={`text-xs px-2 py-0.5 rounded-full text-white ${STATO_COLORS[inst.statoContatto as StatoContatto] ?? "bg-slate-600"}`}>
                    {STATO_LABELS[inst.statoContatto as StatoContatto] ?? inst.statoContatto}
                  </span>
                  {inst.fonte && (
                    <span className="text-xs text-white/30">{FONTE_LABELS[inst.fonte as Fonte] ?? inst.fonte}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {inst.settore && <span className="text-white/40 text-xs">{inst.settore}</span>}
                  {(inst.comune || inst.regione) && (
                    <span className="flex items-center gap-1 text-white/40 text-xs">
                      <MapPin className="w-3 h-3" />{inst.comune ?? inst.regione}
                    </span>
                  )}
                  {inst.telefono && (
                    <a href={`tel:${inst.telefono}`} onClick={e => e.stopPropagation()}
                      className="flex items-center gap-1 text-blue-400 text-xs hover:text-blue-300">
                      <Phone className="w-3 h-3" />{inst.telefono}
                    </a>
                  )}
                  {inst.email && (
                    <a href={`mailto:${inst.email}`} onClick={e => e.stopPropagation()}
                      className="flex items-center gap-1 text-blue-400 text-xs hover:text-blue-300 truncate max-w-[180px]">
                      <Mail className="w-3 h-3" />{inst.email}
                    </a>
                  )}
                </div>
                {inst.note && <p className="text-white/30 text-xs mt-1 truncate">{inst.note}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                <Button size="sm" variant="ghost" className="text-white/40 hover:text-white p-1"
                  onClick={() => setShowDettaglioDialog(inst)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                {(inst.statoContatto === "accordo" || inst.statoContatto === "cliente_attivo") && (
                  <Button size="sm" variant="ghost" className="text-purple-400 hover:text-purple-300 p-1"
                    onClick={() => { setShowAccordoDialog(inst); setAccordoForm({ sconto: inst.sconto ?? "", noteAccordo: inst.noteAccordo ?? "" }); }}>
                    <Handshake className="w-3.5 h-3.5" />
                  </Button>
                )}
                <Button size="sm" variant="ghost" className="text-red-400/60 hover:text-red-400 p-1"
                  onClick={() => { if (confirm(`Eliminare ${inst.ragioneSociale}?`)) eliminaMut.mutate({ id: inst.id }); }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      </> }

      {/* ── DIALOG NUOVO CONTATTO ── */}
      <Dialog open={showNuovoDialog} onOpenChange={setShowNuovoDialog}>
        <DialogContent className="bg-[#1a4a2e] border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-[#f5c518]">Nuovo Contatto</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-white/50 text-xs mb-1 block">Ragione Sociale *</label>
                <Input className="bg-[#0e3320] border-white/20 text-white" value={nuovoForm.ragioneSociale}
                  onChange={e => setNuovoForm(p => ({ ...p, ragioneSociale: e.target.value }))} placeholder="Azienda Srl" />
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1 block">Nome referente</label>
                <Input className="bg-[#0e3320] border-white/20 text-white" value={nuovoForm.nome}
                  onChange={e => setNuovoForm(p => ({ ...p, nome: e.target.value }))} placeholder="Mario Rossi" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-white/50 text-xs mb-1 block">Email</label>
                <Input className="bg-[#0e3320] border-white/20 text-white" value={nuovoForm.email}
                  onChange={e => setNuovoForm(p => ({ ...p, email: e.target.value }))} placeholder="info@azienda.it" />
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1 block">Telefono</label>
                <Input className="bg-[#0e3320] border-white/20 text-white" value={nuovoForm.telefono}
                  onChange={e => setNuovoForm(p => ({ ...p, telefono: e.target.value }))} placeholder="+39 333 000 0000" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-white/50 text-xs mb-1 block">Regione</label>
                <select className="w-full bg-[#0e3320] border border-white/20 text-white rounded-lg px-3 py-2 text-sm"
                  value={nuovoForm.regione} onChange={e => setNuovoForm(p => ({ ...p, regione: e.target.value }))}>
                  <option value="">— Seleziona —</option>
                  {REGIONI.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1 block">Provincia</label>
                <Input className="bg-[#0e3320] border-white/20 text-white" value={nuovoForm.provincia}
                  onChange={e => setNuovoForm(p => ({ ...p, provincia: e.target.value }))} placeholder="NA" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-white/50 text-xs mb-1 block">Stato</label>
                <select className="w-full bg-[#0e3320] border border-white/20 text-white rounded-lg px-3 py-2 text-sm"
                  value={nuovoForm.statoContatto} onChange={e => setNuovoForm(p => ({ ...p, statoContatto: e.target.value as StatoContatto }))}>
                  {Object.entries(STATO_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1 block">Fonte</label>
                <select className="w-full bg-[#0e3320] border border-white/20 text-white rounded-lg px-3 py-2 text-sm"
                  value={nuovoForm.fonte} onChange={e => setNuovoForm(p => ({ ...p, fonte: e.target.value as Fonte }))}>
                  {Object.entries(FONTE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-white/50 text-xs mb-1 block">Referente interno</label>
              <Input className="bg-[#0e3320] border-white/20 text-white" value={nuovoForm.referente}
                onChange={e => setNuovoForm(p => ({ ...p, referente: e.target.value }))} placeholder="Chi lo segue" />
            </div>
            <div>
              <label className="text-white/50 text-xs mb-1 block">Note</label>
              <Textarea className="bg-[#0e3320] border-white/20 text-white" value={nuovoForm.note}
                onChange={e => setNuovoForm(p => ({ ...p, note: e.target.value }))} rows={3} placeholder="Note libere..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNuovoDialog(false)} className="text-white/50">Annulla</Button>
            <Button onClick={() => creaMut.mutate(nuovoForm as any)} disabled={!nuovoForm.ragioneSociale || creaMut.isPending}
              className="bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-black">
              {creaMut.isPending ? "Salvataggio..." : "Aggiungi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG DETTAGLIO/MODIFICA ── */}
      <Dialog open={!!showDettaglioDialog} onOpenChange={() => setShowDettaglioDialog(null)}>
        <DialogContent className="bg-[#1a4a2e] border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-[#f5c518]">Modifica Contatto</DialogTitle></DialogHeader>
          {showDettaglioDialog && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/50 text-xs mb-1 block">Ragione Sociale</label>
                  <Input className="bg-[#0e3320] border-white/20 text-white"
                    defaultValue={showDettaglioDialog.ragioneSociale}
                    onChange={e => setShowDettaglioDialog((p: any) => ({ ...p, ragioneSociale: e.target.value }))} />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1 block">Nome referente</label>
                  <Input className="bg-[#0e3320] border-white/20 text-white"
                    defaultValue={showDettaglioDialog.nome ?? ""}
                    onChange={e => setShowDettaglioDialog((p: any) => ({ ...p, nome: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/50 text-xs mb-1 block">Email</label>
                  <Input className="bg-[#0e3320] border-white/20 text-white"
                    defaultValue={showDettaglioDialog.email ?? ""}
                    onChange={e => setShowDettaglioDialog((p: any) => ({ ...p, email: e.target.value }))} />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1 block">Telefono</label>
                  <Input className="bg-[#0e3320] border-white/20 text-white"
                    defaultValue={showDettaglioDialog.telefono ?? ""}
                    onChange={e => setShowDettaglioDialog((p: any) => ({ ...p, telefono: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/50 text-xs mb-1 block">Stato</label>
                  <select className="w-full bg-[#0e3320] border border-white/20 text-white rounded-lg px-3 py-2 text-sm"
                    value={showDettaglioDialog.statoContatto}
                    onChange={e => setShowDettaglioDialog((p: any) => ({ ...p, statoContatto: e.target.value }))}>
                    {Object.entries(STATO_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1 block">Referente interno</label>
                  <Input className="bg-[#0e3320] border-white/20 text-white"
                    defaultValue={showDettaglioDialog.referente ?? ""}
                    onChange={e => setShowDettaglioDialog((p: any) => ({ ...p, referente: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1 block">Note</label>
                <Textarea className="bg-[#0e3320] border-white/20 text-white" rows={3}
                  defaultValue={showDettaglioDialog.note ?? ""}
                  onChange={e => setShowDettaglioDialog((p: any) => ({ ...p, note: e.target.value }))} />
              </div>
              {/* Sezione Pacchetti Acquistati */}
              <PackAcquistatiSection prospectId={showDettaglioDialog.id} />
              {/* Aggiunta pacchetto dal CRM */}
              <AggiungiPacchettoSection prospectId={showDettaglioDialog.id} />
            </div>
          )}
          {showDettaglioDialog && (
          <DialogFooter className="flex flex-wrap gap-2 justify-between">
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => {
                if (!showDettaglioDialog?.email) {
                  toast.error("Email richiesta per generare la proposta");
                  return;
                }
                generaPropostaMut.mutate({ id: showDettaglioDialog.id });
              }} disabled={generaPropostaMut.isPending} className="text-white/70 border-white/20 hover:bg-white/10">
                {generaPropostaMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span className="ml-1 hidden sm:inline">Proposta PDF</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                if (!showDettaglioDialog?.email) {
                  toast.error("Email richiesta per il link offerta");
                  return;
                }
                creaLinkOffertaMut.mutate({ id: showDettaglioDialog.id });
              }} disabled={creaLinkOffertaMut.isPending} className="text-white/70 border-white/20 hover:bg-white/10">
                {creaLinkOffertaMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                <span className="ml-1 hidden sm:inline">Link Offerta</span>
              </Button>
              {/* Pulsante WhatsApp */}
              {showDettaglioDialog?.telefono && (
                <Button variant="outline" size="sm" onClick={() => {
                  const tel = (showDettaglioDialog?.telefono ?? "").replace(/[^0-9+]/g, "");
                  const nome = showDettaglioDialog?.ragioneSociale || showDettaglioDialog?.nome || "";
                  const msg = encodeURIComponent(`Buongiorno ${nome},\n\nLa contatto riguardo alla nostra offerta esclusiva per installatori fotovoltaico.\n\nRicaricati di Connessioni offre pacchetti pratiche a prezzi fissi, senza sorprese.\n\nPosso inviarle maggiori dettagli?\n\nCordiali saluti`);
                  window.open(`https://wa.me/${tel}?text=${msg}`, "_blank");
                }} className="text-green-400 border-green-500/30 hover:bg-green-500/10">
                  <Phone className="w-4 h-4" />
                  <span className="ml-1 hidden sm:inline">WhatsApp</span>
                </Button>
              )}
              {/* Pulsante Email */}
              {showDettaglioDialog?.email && (
                <Button variant="outline" size="sm" onClick={() => {
                  const nome = showDettaglioDialog?.ragioneSociale || showDettaglioDialog?.nome || "";
                  const oggetto = encodeURIComponent(`Offerta Esclusiva Installatori Fotovoltaico — Ricaricati di Connessioni`);
                  const corpo = encodeURIComponent(`Gentile ${nome},\n\nLa contatto per presentarle la nostra offerta esclusiva per installatori fotovoltaico.\n\nRicaricati di Connessioni offre pacchetti pratiche a prezzi fissi:\n- Pack 1: €2.000 (5 pratiche)\n- Pack 2: €3.150 (10 pratiche)\n- Pack 3: €5.100 (20 pratiche)\n\nPer maggiori informazioni visiti: ${window.location.origin}\n\nCordiali saluti,\nTeam Ricaricati di Connessioni`);
                  window.open(`mailto:${showDettaglioDialog?.email}?subject=${oggetto}&body=${corpo}`, "_blank");
                }} className="text-blue-400 border-blue-500/30 hover:bg-blue-500/10">
                  <Mail className="w-4 h-4" />
                  <span className="ml-1 hidden sm:inline">Email</span>
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setShowDettaglioDialog(null)} className="text-white/50">Annulla</Button>
              <Button onClick={() => aggiornaMut.mutate({ id: showDettaglioDialog.id, ...showDettaglioDialog })}
                disabled={aggiornaMut.isPending}
                className="bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-black">
                {aggiornaMut.isPending ? "Salvataggio..." : "Salva"}
              </Button>
            </div>
          </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* ── DIALOG ACCORDO ── */}
      <Dialog open={!!showAccordoDialog} onOpenChange={() => setShowAccordoDialog(null)}>
        <DialogContent className="bg-[#1a4a2e] border-purple-500/30 text-white max-w-md">
          <DialogHeader><DialogTitle className="text-purple-400">Gestione Accordo</DialogTitle></DialogHeader>
          {showAccordoDialog && (
            <div className="space-y-3">
              <p className="text-white/60 text-sm">{showAccordoDialog.ragioneSociale}</p>
              <div>
                <label className="text-white/50 text-xs mb-1 block">Sconto applicato (%)</label>
                <Input className="bg-[#0e3320] border-white/20 text-white" type="number" min="0" max="100"
                  value={accordoForm.sconto} onChange={e => setAccordoForm(p => ({ ...p, sconto: e.target.value }))}
                  placeholder="Es. 10" />
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1 block">Note accordo</label>
                <Textarea className="bg-[#0e3320] border-white/20 text-white" rows={4}
                  value={accordoForm.noteAccordo} onChange={e => setAccordoForm(p => ({ ...p, noteAccordo: e.target.value }))}
                  placeholder="Dettagli dell'accordo, condizioni, scadenze..." />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAccordoDialog(null)} className="text-white/50">Annulla</Button>
            <Button onClick={() => aggiornaMut.mutate({
              id: showAccordoDialog.id,
              sconto: accordoForm.sconto ? Number(accordoForm.sconto) : undefined,
              noteAccordo: accordoForm.noteAccordo,
              dataAccordo: new Date().toISOString(),
            })} disabled={aggiornaMut.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white font-black">
              {aggiornaMut.isPending ? "Salvataggio..." : "Salva Accordo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG IMPORT EXCEL ── */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="bg-[#1a4a2e] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-[#f5c518]">Import Excel — Anteprima</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <label className="text-white/50 text-xs">Fonte:</label>
              <select className="bg-[#0e3320] border border-white/20 text-white rounded-lg px-3 py-2 text-sm"
                value={importFonte} onChange={e => setImportFonte(e.target.value as Fonte)}>
                {Object.entries(FONTE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <span className="text-white/40 text-sm">{importPreview.length} contatti pronti</span>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {importPreview.slice(0, 50).map((r, i) => (
                <div key={i} className="flex items-center gap-3 bg-[#0e3320] rounded-lg px-3 py-2 text-sm">
                  <span className="text-white/30 w-6 text-right">{i + 1}</span>
                  <span className="font-medium text-white flex-1 truncate">{r.ragioneSociale}</span>
                  {r.nome && <span className="text-white/50 truncate max-w-[120px]">{r.nome}</span>}
                  {r.email && <span className="text-blue-400 truncate max-w-[160px]">{r.email}</span>}
                  {r.telefono && <span className="text-white/50">{r.telefono}</span>}
                </div>
              ))}
              {importPreview.length > 50 && (
                <p className="text-white/30 text-xs text-center py-2">... e altri {importPreview.length - 50} contatti</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setShowImportDialog(false); setImportPreview([]); }} className="text-white/50">Annulla</Button>
            <Button onClick={() => importaBulkMut.mutate({ records: importPreview.map(r => ({ ...r, fonte: importFonte })) })}
              disabled={importaBulkMut.isPending || !importPreview.length}
              className="bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-black">
              {importaBulkMut.isPending ? "Importazione..." : `Importa ${importPreview.length} contatti`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG CERCA GOOGLE MAPS (fullscreen) ── */}
      <Dialog open={showCercaDialog} onOpenChange={setShowCercaDialog}>
        <DialogContent className="bg-[#1a4a2e] border-blue-500/30 text-white w-[95vw] max-w-[95vw] h-[90vh] max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-blue-400 flex items-center gap-2">
              <Search className="w-5 h-5" /> Cerca Installatori su Google Maps
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-white/50 text-xs mb-1 block">Tipo di ricerca</label>
                <Input className="bg-[#0e3320] border-white/20 text-white" value={cercaQuery}
                  onChange={e => setCercaQuery(e.target.value)} placeholder="Es. installatori fotovoltaico" />
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1 block">Regione (ricerca estesa)</label>
                <select className="w-full bg-[#0e3320] border border-white/20 text-white rounded-lg px-3 py-2 text-sm"
                  value={cercaRegione} onChange={e => { setCercaRegione(e.target.value); setCercaProvincia(""); }}>
                  <option value="">— Tutte le regioni —</option>
                  {REGIONI.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1 block">Provincia specifica (opzionale)</label>
                <Input className="bg-[#0e3320] border-white/20 text-white" value={cercaProvincia}
                  onChange={e => setCercaProvincia(e.target.value)} placeholder="Es. Bari, Lecce, Napoli" />
              </div>
            </div>
            <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-300">
              <strong>Suggerimento:</strong> Seleziona una regione per una ricerca estesa su tutte le province (es. Puglia cerca Bari, Lecce, Taranto, Foggia, Brindisi, BAT). Tutti i risultati vengono pre-selezionati automaticamente.
            </div>
            <Button onClick={() => {
              setCercaLoading(true);
              setCercaResults([]);
              cercaGMMut.mutate({ query: cercaQuery, regione: cercaRegione || undefined, provincia: cercaProvincia || undefined });
            }} disabled={cercaLoading || !cercaQuery}
              className="bg-blue-600 hover:bg-blue-700 text-white w-full">
              {cercaLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Ricerca in corso (può richiedere 30-60 secondi per regioni grandi)...</> : <><Search className="w-4 h-4 mr-2" /> Avvia Ricerca</>}
            </Button>

            {cercaResults.length > 0 && (
              <>
                <div className="flex items-center justify-between sticky top-0 bg-[#1a4a2e] py-2 z-10">
                  <p className="text-white/60 text-sm font-medium">{cercaResults.length} installatori trovati</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/40">{cercaSelezionati.size} selezionati</span>
                    <button onClick={() => setCercaSelezionati(
                      cercaSelezionati.size === cercaResults.length ? new Set() : new Set(cercaResults.map((_, i) => i))
                    )} className="text-xs text-blue-400 hover:text-blue-300 font-medium">
                      {cercaSelezionati.size === cercaResults.length ? "Deseleziona tutti" : "Seleziona tutti"}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {cercaResults.map((r, i) => (
                    <div key={i} onClick={() => toggleCercaSel(i)}
                      className={`flex items-start gap-2 p-3 rounded-lg cursor-pointer transition-colors ${cercaSelezionati.has(i) ? "bg-blue-900/30 border border-blue-500/40" : "bg-[#0e3320] border border-white/5 hover:border-white/20"}`}>
                      {cercaSelezionati.has(i) ? <CheckSquare className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" /> : <Square className="w-4 h-4 text-white/30 shrink-0 mt-0.5" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm leading-tight">{r.ragioneSociale}</p>
                        {r.indirizzo && <p className="text-white/40 text-xs mt-0.5 leading-tight">{r.indirizzo}</p>}
                        {r.telefono && <p className="text-blue-400 text-xs mt-0.5">{r.telefono}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          {cercaResults.length > 0 && (
            <div className="shrink-0 pt-3 border-t border-white/10">
              <Button onClick={importaSelezionatiGM} disabled={cercaSelezionati.size === 0 || importaBulkMut.isPending}
                className="bg-green-600 hover:bg-green-700 text-white w-full">
                {importaBulkMut.isPending ? "Importazione..." : `Importa ${cercaSelezionati.size} installatori nel CRM`}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
