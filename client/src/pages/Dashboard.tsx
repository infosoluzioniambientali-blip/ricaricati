import React, { useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Upload, CheckCircle, Clock, XCircle, ChevronDown, ChevronUp,
  FileDown, Package, ShoppingCart, AlertCircle, ExternalLink,
  FileText, Building2, Home, Plus, Trophy, Gift, Users, Tag, Send
} from "lucide-react";
import { toast } from "sonner";
import { ITER_DEFINIZIONI, type TipoIter, type DocumentoRichiesto, ITER_DA_PACK, isIterDaPack } from "@shared/iter";
import type { Pratica, Ordine } from "@shared/types";
import { LISTINO } from "@shared/listino";

// ─── COSTANTI ─────────────────────────────────────────────────────────────────
const NOMI_PACK: Record<string, string> = {
  pack1: "Pack 1",
  pack2: "Pack 2",
  pack3: "Pack 3",
  singolo: "Pratiche Singole",
};
const PREZZI_PACK: Record<string, string> = {
  pack1: "€ 2.000",
  pack2: "€ 3.150",
  pack3: "€ 5.100",
};
const PRATICHE_RES_PER_PACK: Record<string, number> = { pack1: 16, pack2: 30, pack3: 60 };
const PRATICHE_BUS_PER_PACK: Record<string, number> = { pack1: 5, pack2: 9, pack3: 20 };

// ─── SCARICA RICEVUTA ────────────────────────────────────────────────────────────
function ScaricaRicevutaButton({ ordineId }: { ordineId: number }) {
  const [isLoading, setIsLoading] = useState(false);
  const generaRicevuta = trpc.ordini.generaRicevuta.useQuery(
    { ordineId },
    { enabled: false }
  );

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const result = await generaRicevuta.refetch();
      const url = result.data?.url;
      if (url) {
        // Prova download diretto, fallback apertura in nuova tab
        const link = document.createElement("a");
        link.href = url;
        link.download = `ricevuta-ordine-${ordineId}.pdf`;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Ricevuta scaricata!");
      } else {
        toast.error("Ricevuta non disponibile. Riprova tra qualche secondo.");
      }
    } catch (error: any) {
      toast.error("Errore generazione ricevuta: " + (error?.message || "Riprova"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleDownload}
      disabled={isLoading}
      className="text-[#f5c518] border-[#f5c518]/30 hover:bg-[#f5c518]/10 text-xs w-full"
    >
      <FileDown className="w-3 h-3 mr-1" />
      {isLoading ? "Generazione in corso..." : "Scarica Ricevuta PDF"}
    </Button>
  );
}

// ─── SLOT DOCUMENTI ───────────────────────────────────────────────────────────
function SlotDocumenti({
  pratica,
  docs,
  utils,
}: {
  pratica: Pratica;
  docs: { id: number; nomeFile: string; tipoFile: string | null; slotNome: string | null; categoriaDocumento: string | null; storageKey: string; storageUrl: string; createdAt: Date }[];
  utils: ReturnType<typeof trpc.useUtils>;
}) {
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Carica configurazione documenti personalizzata (o globale) dal DB
  const { data: configDocs } = trpc.documenti.configPerIter.useQuery(
    { tipoIter: pratica.tipoIter ?? "" },
    { enabled: !!pratica.tipoIter }
  );

  const uploadDoc = trpc.pratiche.uploadDocumento.useMutation({
    onSuccess: () => {
      utils.pratiche.documenti.invalidate({ praticaId: pratica.id });
      toast.success("✓ Documento caricato!");
    },
    onError: (e) => toast.error(`Errore: ${e.message}`),
  });

  const handleUploadSlot = (slotNome: string, file: File) => {
    if (file.size > 10 * 1024 * 1024) { toast.error("File troppo grande (max 10MB)"); return; }
    setUploadingSlot(slotNome);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = (ev.target?.result as string).split(",")[1];
      try {
        await uploadDoc.mutateAsync({ praticaId: pratica.id, nomeFile: file.name, tipoFile: file.type, slotNome, categoriaDocumento: slotNome, fileBase64: base64 });
      } finally { setUploadingSlot(null); }
    };
    reader.onerror = () => { toast.error("Errore lettura file"); setUploadingSlot(null); };
    reader.readAsDataURL(file);
  };

  if (!pratica.tipoIter) return <p className="text-white/40 text-xs italic">Nessun iter configurato per questa pratica.</p>;
  const def = ITER_DEFINIZIONI[pratica.tipoIter as TipoIter];
  if (!def) return null;

  // Se ci sono documenti configurati nel DB, usali come lista piatta (un unico step "Documenti")
  // altrimenti usa la struttura a step dell'iter
  const hasConfigDocs = configDocs && configDocs.length > 0;

  const stepsConDocs = def.steps.filter((s: any) => {
    const d = s.documentiConPriorita ?? (s.documentiRichiesti ?? []).map((n: string) => ({ nome: n, priorita: "obbligatorio" }));
    return d.length > 0;
  });
  if (!hasConfigDocs && stepsConDocs.length === 0) return <p className="text-white/40 text-xs italic">Nessun documento richiesto per questo iter.</p>;

  const docsBySlot: Record<string, typeof docs[0][]> = {};
  for (const doc of docs) {
    const key = doc.slotNome || doc.categoriaDocumento || "extra";
    if (!docsBySlot[key]) docsBySlot[key] = [];
    docsBySlot[key].push(doc);
  }

  // Stili per badge importanza documento
  const PRIORITA_STYLE: Record<string, { badge: string; dot: string }> = {
    obbligatorio: { badge: "text-red-400 bg-red-400/10 border-red-400/20", dot: "bg-red-400/20 border-red-400/30" },
    consigliato: { badge: "text-[#f5c518] bg-[#f5c518]/10 border-[#f5c518]/20", dot: "bg-[#f5c518]/20 border-[#f5c518]/30" },
    opzionale: { badge: "text-white/40 bg-white/5 border-white/10", dot: "bg-white/5 border-white/10" },
  };

  // Calcola totali per la progress bar
  const totaleSlot = hasConfigDocs
    ? configDocs!.length
    : stepsConDocs.reduce((acc: number, s: any) => acc + (s.documentiConPriorita ?? s.documentiRichiesti ?? []).length, 0);
  const totaleCaricati = Object.keys(docsBySlot).filter(k => k !== "extra").length;

  // ─── CARD DOCUMENTO (nuova versione grande con accordion per step) ───────────
  const renderDocCard = (nomeDoc: string, priorita: string, note?: string | null, responsabileInserimento?: string) => {
    const caricati = docsBySlot[nomeDoc] || [];
    const isCaricato = caricati.length > 0;
    const isUploading = uploadingSlot === nomeDoc;
    const isDocumentoSistema = responsabileInserimento === "sistema";
    const docPrincipale = caricati[0];
    const statoRevisione = (docPrincipale as any)?.statoRevisione;
    const notaRevisione = (docPrincipale as any)?.notaRevisione;

    // Stile card in base allo stato
    const cardStyle = isDocumentoSistema
      ? "border-blue-400/25 bg-blue-900/10"
      : isCaricato && statoRevisione === "approvato"
        ? "border-[#4ade80]/25 bg-[#4ade80]/5"
        : isCaricato && statoRevisione === "rifiutato"
          ? "border-red-400/40 bg-red-900/10"
          : isCaricato
            ? "border-[#4ade80]/15 bg-white/3"
            : priorita === "obbligatorio"
              ? "border-red-400/20 bg-red-900/5"
              : priorita === "consigliato"
                ? "border-[#f5c518]/15 bg-[#f5c518]/5"
                : "border-white/8 bg-white/2";

    // Icona in base al tipo
    const fileExt = docPrincipale?.nomeFile?.split(".").pop()?.toLowerCase() ?? "";
    const iconClass = fileExt === "pdf" ? "ti-file-type-pdf"
      : ["jpg","jpeg","png","gif","webp"].includes(fileExt) ? "ti-photo"
      : ["doc","docx"].includes(fileExt) ? "ti-file-word"
      : "ti-file";

    return (
      <div key={nomeDoc} className={`rounded-xl border p-4 flex flex-col gap-3 ${cardStyle}`}>
        {/* Header card */}
        <div className="flex items-start gap-3">
          {/* Icona stato */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isDocumentoSistema ? "bg-blue-400/15 text-blue-400"
            : isCaricato && statoRevisione === "approvato" ? "bg-[#4ade80]/15 text-[#4ade80]"
            : isCaricato && statoRevisione === "rifiutato" ? "bg-red-400/15 text-red-400"
            : isCaricato ? "bg-[#4ade80]/10 text-[#4ade80]"
            : priorita === "obbligatorio" ? "bg-red-400/10 text-red-400"
            : priorita === "consigliato" ? "bg-[#f5c518]/10 text-[#f5c518]"
            : "bg-white/5 text-white/30"
          }`}>
            <i className={`ti ${isDocumentoSistema ? "ti-shield-check" : isCaricato ? `ti ${iconClass}` : "ti-upload"}`} style={{fontSize:"18px"}} aria-hidden="true" />
          </div>
          {/* Nome e note */}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold leading-snug ${
              isDocumentoSistema ? "text-blue-300"
              : isCaricato ? "text-white"
              : "text-white/80"
            }`}>{nomeDoc}</p>
            {note && <p className="text-white/35 text-xs mt-1 leading-relaxed">{note}</p>}
          </div>
        </div>

        {/* File caricato o stato revisione */}
        {isCaricato && docPrincipale && (
          <div className={`rounded-lg px-3 py-2 ${
            statoRevisione === "approvato" ? "bg-[#4ade80]/8" :
            statoRevisione === "rifiutato" ? "bg-red-400/8" :
            isDocumentoSistema ? "bg-blue-400/8" :
            "bg-white/5"
          }`}>
            <button
              onClick={async () => {
                try {
                  const res = await utils.pratiche.getDocumentoDownloadUrl.fetch({ documentoId: docPrincipale.id });
                  const a = document.createElement("a");
                  a.href = res.url;
                  a.download = docPrincipale.nomeFile;
                  a.target = "_blank";
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                } catch { toast.error("Errore download"); }
              }}
              className={`flex items-center gap-2 text-xs font-medium w-full text-left truncate ${
                isDocumentoSistema ? "text-blue-300 hover:text-blue-200" : "text-[#4ade80] hover:text-[#4ade80]/80"
              }`}>
              <FileDown className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{docPrincipale.nomeFile}</span>
              <ExternalLink className="w-3 h-3 shrink-0 ml-auto" />
            </button>
            {notaRevisione && (
              <p className={`text-xs italic mt-1.5 ${statoRevisione === "rifiutato" ? "text-red-400" : "text-white/40"}`}>
                {notaRevisione}
              </p>
            )}
          </div>
        )}

        {/* Footer: badge + pulsante */}
        <div className="flex items-center justify-between gap-2 mt-auto">
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
            isDocumentoSistema ? "bg-blue-400/10 text-blue-400"
            : statoRevisione === "approvato" ? "bg-[#4ade80]/10 text-[#4ade80]"
            : statoRevisione === "rifiutato" ? "bg-red-400/10 text-red-400"
            : isCaricato ? "bg-white/8 text-white/50"
            : priorita === "obbligatorio" ? "bg-red-400/10 text-red-400"
            : priorita === "consigliato" ? "bg-[#f5c518]/10 text-[#f5c518]"
            : "bg-white/5 text-white/30"
          }`}>
            {isDocumentoSistema ? "Da noi"
            : statoRevisione === "approvato" ? "✓ Approvato"
            : statoRevisione === "rifiutato" ? "✗ Rifiutato"
            : isCaricato ? "Caricato"
            : priorita === "obbligatorio" ? "Obbligatorio"
            : priorita === "consigliato" ? "Consigliato"
            : "Opzionale"}
          </span>
          {!isDocumentoSistema && (
            <>
              <input
                ref={(el) => { inputRefs.current[nomeDoc] = el; }}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadSlot(nomeDoc, f); e.target.value = ""; }}
              />
              <button
                disabled={isUploading}
                onClick={() => inputRefs.current[nomeDoc]?.click()}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                  isUploading ? "opacity-50 cursor-not-allowed border-white/10 text-white/30" :
                  statoRevisione === "rifiutato" ? "border-red-400/40 text-red-400 hover:bg-red-400/10" :
                  isCaricato ? "border-white/15 text-white/40 hover:bg-white/5" :
                  priorita === "obbligatorio" ? "border-red-400/40 text-red-400 hover:bg-red-400/10" :
                  priorita === "consigliato" ? "border-[#f5c518]/40 text-[#f5c518] hover:bg-[#f5c518]/10" :
                  "border-white/15 text-white/40 hover:bg-white/5"
                }`}>
                {isUploading
                  ? <><div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> Caricamento...</>
                  : <><Upload className="w-3 h-3" />{statoRevisione === "rifiutato" ? "Ricarica" : isCaricato ? "Sostituisci" : "Carica"}</>}
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  // ─── ACCORDION STEP ─────────────────────────────────────────────────────────
  const [openSteps, setOpenSteps] = React.useState<Set<string>>(() => {
    // Apri di default solo lo step corrente
    const stepCorrente = stepsConDocs.find((s: any) => {
      const docs = s.documentiConPriorita ?? (s.documentiRichiesti ?? []).map((n: string) => ({ nome: n }));
      return docs.some((d: any) => (docsBySlot[d.nome] ?? []).length === 0);
    });
    return new Set(stepCorrente ? [stepCorrente.id] : stepsConDocs.slice(0, 1).map((s: any) => s.id));
  });

  const toggleStep = (stepId: string) => {
    setOpenSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepId)) next.delete(stepId);
      else next.add(stepId);
      return next;
    });
  };

  const renderStepAccordion = (step: any, docsConPriorita: DocumentoRichiesto[]) => {
    const stepCaricati = docsConPriorita.filter((d) => (docsBySlot[d.nome] ?? []).length > 0).length;
    const isCompleto = stepCaricati === docsConPriorita.length && docsConPriorita.length > 0;
    const hasRifiutati = docsConPriorita.some(d => {
      const caricati = docsBySlot[d.nome] ?? [];
      return caricati.some((c: any) => c.statoRevisione === "rifiutato");
    });
    const isOpen = openSteps.has(step.id);

    return (
      <div key={step.id} className={`rounded-xl border overflow-hidden transition-colors ${
        isCompleto ? "border-[#4ade80]/20" : hasRifiutati ? "border-red-400/30" : "border-white/10"
      }`}>
        {/* Header accordion */}
        <button
          onClick={() => toggleStep(step.id)}
          className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-colors ${
            isCompleto ? "bg-[#4ade80]/5 hover:bg-[#4ade80]/8" :
            hasRifiutati ? "bg-red-400/5 hover:bg-red-400/8" :
            "bg-white/3 hover:bg-white/5"
          }`}>
          {/* Cerchio numero/stato */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
            isCompleto ? "bg-[#4ade80]/15 text-[#4ade80]" :
            hasRifiutati ? "bg-red-400/15 text-red-400" :
            "bg-white/8 text-white/50"
          }`}>
            {isCompleto ? <CheckCircle className="w-4 h-4" /> : hasRifiutati ? <XCircle className="w-4 h-4" /> : <span>{step.id}</span>}
          </div>
          {/* Titolo step */}
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-sm ${
              isCompleto ? "text-[#4ade80]" : hasRifiutati ? "text-red-400" : "text-white/80"
            }`}>{step.label}</p>
            {step.descrizione && !isOpen && (
              <p className="text-white/30 text-xs mt-0.5 truncate">{step.descrizione}</p>
            )}
          </div>
          {/* Badge contatore + chevron */}
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
              isCompleto ? "bg-[#4ade80]/10 text-[#4ade80]" :
              hasRifiutati ? "bg-red-400/10 text-red-400" :
              "bg-white/8 text-white/40"
            }`}>{stepCaricati}/{docsConPriorita.length}</span>
            <ChevronDown className={`w-4 h-4 text-white/30 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </div>
        </button>

        {/* Body accordion */}
        {isOpen && (
          <div className="px-5 pb-5 pt-4 border-t border-white/8">
            {step.descrizione && (
              <p className="text-white/40 text-xs leading-relaxed mb-4 pl-1 border-l-2 border-white/10 ml-1 pl-3">{step.descrizione}</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {docsConPriorita.map((doc) => renderDocCard(doc.nome, doc.priorita, doc.note))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Barra progresso globale */}
      <div className="flex items-center justify-between mb-1">
        <p className="text-white/50 text-xs font-semibold uppercase tracking-wide">Documenti</p>
        <span className="text-xs text-white/40">{totaleCaricati}/{totaleSlot} caricati</span>
      </div>
      <div className="w-full bg-white/8 rounded-full h-1.5 mb-4">
        <div className="bg-[#4ade80] h-1.5 rounded-full transition-all" style={{ width: `${totaleSlot > 0 ? Math.round((totaleCaricati / totaleSlot) * 100) : 0}%` }} />
      </div>

      {/* Accordion per step */}
      {hasConfigDocs ? (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <div className="px-5 py-3 bg-white/3 border-b border-white/8 flex items-center justify-between">
            <p className="text-white/70 text-sm font-semibold">Documenti Richiesti</p>
            <span className="text-xs text-white/40">{totaleCaricati}/{totaleSlot}</span>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {configDocs!.map((cfg) => renderDocCard(
              cfg.nomeDocumenti,
              (cfg as any).importanza ?? (cfg.obbligatorio ? "obbligatorio" : "opzionale"),
              cfg.note,
              cfg.responsabileInserimento
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {stepsConDocs.map((step: any) => {
            const docsConPriorita: DocumentoRichiesto[] = step.documentiConPriorita
              ?? (step.documentiRichiesti ?? []).map((nome: string) => ({ nome, priorita: "obbligatorio" as const }));
            return renderStepAccordion(step, docsConPriorita);
          })}
        </div>
      )}
    </div>
  );
}

// ─── ITER TIMELINE ───────────────────────────────────────────────────────────
function IterTimeline({ pratica, iterDef, utils }: {
  pratica: Pratica;
  iterDef: NonNullable<(typeof ITER_DEFINIZIONI)[TipoIter]>;
  utils: ReturnType<typeof trpc.useUtils>;
}) {
  // Carica personalizzazioni step dal DB e applica sovrascritture
  const { data: stepCustom = [] } = trpc.configStepIter.tuttiGliStep.useQuery(undefined, { staleTime: 60000 });
  const iterDefCustom = React.useMemo(() => {
    const customs = stepCustom.filter((s: any) => s.tipoIter === pratica.tipoIter);
    if (!customs.length) return iterDef;
    return {
      ...iterDef,
      steps: iterDef.steps.map(step => {
        const c = customs.find((x: any) => x.stepId === step.id);
        return c ? { ...step, label: c.labelCustom || step.label, descrizione: c.descrizioneCustom || step.descrizione } : step;
      }),
    };
  }, [iterDef, stepCustom, pratica.tipoIter]);

  const aggiornaIter = trpc.pratiche.aggiornaStatoIter.useMutation({
    onSuccess: () => {
      utils.pratiche.mie.invalidate();
      toast.success("Iter aggiornato");
    },
    onError: (err) => toast.error(err.message),
  });

  const steps = iterDefCustom.steps;
  const statoCorrente = pratica.statoIter;
  const idxCorrente = steps.findIndex(s => s.id === statoCorrente);
  const stepCorrente = idxCorrente >= 0 ? steps[idxCorrente] : null;
  const stepSuccessivo = idxCorrente >= 0 && idxCorrente < steps.length - 1 ? steps[idxCorrente + 1] : null;
  const percentuale = steps.length > 0 ? Math.round(((idxCorrente + 1) / steps.length) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-white/70 text-xs font-bold uppercase tracking-wider">Avanzamento Iter</p>
        <span className="text-[#f5c518] text-xs font-bold">{percentuale}%</span>
      </div>
      {/* Barra avanzamento */}
      <div className="w-full bg-white/10 rounded-full h-1.5 mb-4">
        <div className="bg-[#f5c518] h-1.5 rounded-full transition-all" style={{ width: `${percentuale}%` }} />
      </div>
      {/* Step list */}
      <div className="space-y-1.5">
        {steps.map((step, idx) => {
          const isCompleted = idx < idxCorrente;
          const isCurrent = idx === idxCorrente;
          const isFuture = idx > idxCorrente;
          return (
            <div key={step.id} className={`flex items-start gap-3 p-2.5 rounded-lg border transition-colors ${
              isCompleted ? "border-[#4ade80]/20 bg-[#4ade80]/5" :
              isCurrent ? "border-[#f5c518]/30 bg-[#f5c518]/5" :
              "border-white/5 bg-white/2 opacity-50"
            }`}>
              {/* Icona step */}
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                isCompleted ? "bg-[#4ade80] text-[#0a2a1a]" :
                isCurrent ? "bg-[#f5c518] text-[#0a2a1a]" :
                "bg-white/10 text-white/30"
              }`}>
                {isCompleted ? (
                  <CheckCircle className="w-3 h-3" />
                ) : isCurrent ? (
                  <Clock className="w-3 h-3" />
                ) : (
                  <span className="text-xs font-bold">{idx + 1}</span>
                )}
              </div>
              {/* Testo step */}
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold ${
                  isCompleted ? "text-[#4ade80]" : isCurrent ? "text-[#f5c518]" : "text-white/40"
                }`}>{step.label}</p>
                {isCurrent && (
                  <p className="text-white/40 text-xs mt-0.5 leading-relaxed">{step.descrizione}</p>
                )}
              </div>
              {/* Badge step corrente */}
              {isCurrent && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-[#f5c518]/20 text-[#f5c518] font-semibold shrink-0">In corso</span>
              )}
            </div>
          );
        })}
      </div>
      {/* Pulsante avanza step (solo se pratica inviata/in lavorazione e c'è un passo successivo) */}
      {stepSuccessivo && (pratica.stato === "inviata" || pratica.stato === "in_lavorazione") && (
        <div className="mt-3 p-3 rounded-lg border border-white/10 bg-white/5">
          <p className="text-white/50 text-xs mb-2">Prossimo step: <span className="text-white/80 font-semibold">{stepSuccessivo.label}</span></p>
          <Button
            size="sm"
            onClick={() => aggiornaIter.mutate({ praticaId: pratica.id, nuovoStatoIter: stepSuccessivo.id })}
            disabled={aggiornaIter.isPending}
            className="bg-white/10 hover:bg-white/20 text-white text-xs h-7 border border-white/20">
            {aggiornaIter.isPending ? "Aggiornamento..." : `Avanza a: ${stepSuccessivo.label}`}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── CARD PRATICA ─────────────────────────────────────────────────────────────
const STATO_COLORS: Record<string, string> = {
  bozza: "text-white/50 bg-white/10 border-white/10",
  inviata: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  in_lavorazione: "text-[#f5c518] bg-[#f5c518]/10 border-[#f5c518]/20",
  completata: "text-[#4ade80] bg-[#4ade80]/10 border-[#4ade80]/20",
  rifiutata: "text-red-400 bg-red-400/10 border-red-400/20",
};
const STATO_ICONS: Record<string, React.ElementType> = {
  bozza: Clock, inviata: Clock, in_lavorazione: Clock, completata: CheckCircle, rifiutata: XCircle,
};
const STATO_LABEL: Record<string, string> = {
  bozza: "Bozza", inviata: "Inviata", in_lavorazione: "In lavorazione", completata: "Completata", rifiutata: "Rifiutata",
};

function CardPratica({ p, onInvia, utils }: { p: Pratica; onInvia: (id: number) => void; utils: ReturnType<typeof trpc.useUtils> }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = STATO_ICONS[p.stato] || Clock;
  const iterDef = p.tipoIter ? ITER_DEFINIZIONI[p.tipoIter as TipoIter] : null;
  const { data: docs = [] } = trpc.pratiche.documenti.useQuery({ praticaId: p.id });
  const docsCaricati = docs.length;
  // Barra progresso documenti obbligatori
  const { data: configDocs } = trpc.documenti.configPerIter.useQuery(
    { tipoIter: p.tipoIter ?? "" },
    { enabled: !!p.tipoIter }
  );
  const obbligatoriTotale = configDocs?.filter((c: any) => (c.importanza === 'obbligatorio' || c.obbligatorio === true) && c.responsabileInserimento !== 'sistema').length ?? 0;
  const slotCaricatiSet = new Set(docs.map((d: any) => d.slotNome).filter(Boolean));
  const obbligatoriCaricati = configDocs?.filter((c: any) => (c.importanza === 'obbligatorio' || c.obbligatorio === true) && c.responsabileInserimento !== 'sistema' && slotCaricatiSet.has(c.nomeDocumenti)).length ?? 0;
  const tuttiCompleti = obbligatoriTotale > 0 && obbligatoriCaricati >= obbligatoriTotale;

  return (
    <div className="bg-[#0e3320] rounded-xl border border-white/10 overflow-hidden">
      {/* Header cliccabile */}
      <button className="w-full text-left p-4 hover:bg-white/5 transition-colors" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Riga 1: numero + stato */}
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-white font-bold text-sm">Pratica #{p.id}</span>
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold border ${STATO_COLORS[p.stato]}`}>
                <Icon className="w-3 h-3" />{STATO_LABEL[p.stato] ?? p.stato}
              </span>
              {p.tipologia === "business"
                ? <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-400/10 text-purple-400 border border-purple-400/20"><Building2 className="w-3 h-3" />Business</span>
                : <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-400/10 text-blue-400 border border-blue-400/20"><Home className="w-3 h-3" />Residenziale</span>}
            </div>
            {/* Riga 2: titolare */}
            <p className="text-white/80 text-sm font-semibold truncate">{p.nomeTitolare || "Titolare non specificato"}</p>
            {/* Riga 3: location + potenza */}
            <p className="text-white/50 text-xs mt-0.5">
              {p.comuneImpianto || "—"}{p.provinciaImpianto ? ` (${p.provinciaImpianto})` : ""}
              {p.potenzaKw ? ` · ${p.potenzaKw} kW` : ""}
              {p.indirizzoImpianto ? ` · ${p.indirizzoImpianto}` : ""}
            </p>
            {/* Riga 4: iter + documenti */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {iterDef && (
                <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                  {iterDef.label}
                </span>
              )}
              {docsCaricati > 0 && (
                <span className="text-xs px-2 py-0.5 rounded bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/20">
                  <FileText className="w-3 h-3 inline mr-1" />{docsCaricati} doc{docsCaricati !== 1 ? "." : ""}
                </span>
              )}
              {p.note && <span className="text-xs text-white/30 truncate max-w-xs">{p.note}</span>}
              {/* Badge completezza documenti */}
              {obbligatoriTotale > 0 && (
                tuttiCompleti
                  ? <span className="text-xs px-2 py-0.5 rounded-full bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/20 font-semibold">✓ Documenti completi</span>
                  : <span className="text-xs px-2 py-0.5 rounded-full bg-[#f5c518]/10 text-[#f5c518] border border-[#f5c518]/20">{obbligatoriCaricati}/{obbligatoriTotale} doc. obbligatori</span>
              )}
            </div>
            {/* Barra progresso documenti obbligatori */}
            {obbligatoriTotale > 0 && (
              <div className="mt-2">
                <div className="w-full bg-white/10 rounded-full h-1">
                  <div className={`h-1 rounded-full transition-all ${tuttiCompleti ? 'bg-[#4ade80]' : 'bg-[#f5c518]'}`}
                    style={{ width: `${Math.round((obbligatoriCaricati / obbligatoriTotale) * 100)}%` }} />
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {p.stato === "bozza" && (
              <Button size="sm" onClick={(e) => { e.stopPropagation(); onInvia(p.id); }}
                className="bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-bold text-xs h-8">
                Invia
              </Button>
            )}
            <div className="text-white/40 p-1">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>
        </div>
      </button>

      {/* Sezione espansa: iter + documenti */}
      {expanded && (
        <div className="border-t border-white/10 p-4 bg-[#0a2a1a] space-y-5">
          {/* Nota admin */}
          {p.noteAdmin && (
            <div className="p-3 rounded-lg bg-[#f5c518]/10 border border-[#f5c518]/20">
              <p className="text-[#f5c518] text-xs font-semibold mb-0.5">Nota dall'ufficio:</p>
              <p className="text-white/70 text-sm">{p.noteAdmin}</p>
            </div>
          )}
          {/* Visualizzazione iter */}
          {iterDef && (
            <IterTimeline pratica={p} iterDef={iterDef} utils={utils} />
          )}
          {/* Slot documenti */}
          <SlotDocumenti pratica={p} docs={docs} utils={utils} />
        </div>
      )}
    </div>
  );
}

// ─── CARD ORDINE ──────────────────────────────────────────────────────────────
function CardOrdine({ o, creditoPromoDisponibile = 0, onCreditoApplicato }: { o: Ordine; creditoPromoDisponibile?: number; onCreditoApplicato?: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [showApplicaCredito, setShowApplicaCredito] = useState(false);
  const [importoCredito, setImportoCredito] = useState("");
  const utils = trpc.useUtils();
  const applicaCredito = trpc.pack.applicaCreditoAOrdine.useMutation({
    onSuccess: (data) => {
      toast.success(`Credito applicato! Credito promo rimanente: €${data.creditoPromoRimanente.toFixed(2)}`);
      setShowApplicaCredito(false);
      setImportoCredito("");
      utils.ordini.miei.invalidate();
      utils.installatori.mio.invalidate();
      onCreditoApplicato?.();
    },
    onError: (e) => toast.error(e.message),
  });
  const resIncluse = (o as any).pratiche_incluse_residenziali ?? PRATICHE_RES_PER_PACK[o.packId] ?? 0;
  const busIncluse = (o as any).pratiche_incluse_business ?? PRATICHE_BUS_PER_PACK[o.packId] ?? 0;
  const resUsate = (o as any).pratiche_usate_residenziali ?? 0;
  const busUsate = (o as any).pratiche_usate_business ?? 0;
  const isSingolo = o.packId === "singolo";

  const statoStyle = o.stato === "pagato"
    ? "text-[#4ade80] bg-[#4ade80]/10 border-[#4ade80]/20"
    : o.stato === "annullato"
    ? "text-red-400 bg-red-400/10 border-red-400/20"
    : "text-[#f5c518] bg-[#f5c518]/10 border-[#f5c518]/20";
  const statoLabel = o.stato === "pagato" ? "✓ Pagato" : o.stato === "annullato" ? "✗ Annullato" : "⏳ In attesa";

  return (
    <div className="bg-[#0e3320] rounded-xl border border-white/10 overflow-hidden">
      <button className="w-full text-left p-4 hover:bg-white/5 transition-colors" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Riga 1: numero ordine + stato + badge assegnazione */}
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-white font-bold text-sm">Ordine #{o.id}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${statoStyle}`}>{statoLabel}</span>
              {(o as any).tipoOrdine === "assegnazione_admin" && (
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold border border-purple-400/30 bg-purple-400/10 text-purple-300">👤 Assegnato da Admin</span>
              )}
            </div>
            {/* Riga 2: pack + importo + data */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-white/80 text-sm font-semibold">
                {isSingolo ? "Pratiche Singole" : ((o as any).nomePacchetto || NOMI_PACK[o.packId] || "Pacchetto Personalizzato")}
              </span>
              <span className="text-white/40 text-xs">·</span>
              <span className="text-white/60 text-sm">€{Number(o.importo).toFixed(2)}</span>
              <span className="text-white/40 text-xs">·</span>
              <span className="text-white/50 text-xs">{new Date(o.createdAt).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })}</span>
            </div>
            {/* Riga 3: utilizzo pratiche (solo pack) */}
            {!isSingolo && o.stato === "pagato" && (
              <div className="flex gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <Home className="w-3 h-3 text-blue-400 shrink-0" />
                  <div className="w-20 bg-white/10 rounded-full h-1.5">
                    <div className="bg-blue-400 h-1.5 rounded-full" style={{ width: `${resIncluse > 0 ? Math.min(100, (resUsate / resIncluse) * 100) : 0}%` }} />
                  </div>
                  <span className="text-white/50 text-xs">{resUsate}/{resIncluse} res.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-3 h-3 text-purple-400 shrink-0" />
                  <div className="w-20 bg-white/10 rounded-full h-1.5">
                    <div className="bg-purple-400 h-1.5 rounded-full" style={{ width: `${busIncluse > 0 ? Math.min(100, (busUsate / busIncluse) * 100) : 0}%` }} />
                  </div>
                  <span className="text-white/50 text-xs">{busUsate}/{busIncluse} bus.</span>
                </div>
              </div>
            )}
          </div>
          <div className="text-white/40 p-1 shrink-0">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {/* Dettagli espansi */}
      {expanded && (
        <div className="border-t border-white/10 p-4 bg-[#0a2a1a] space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-white/40 text-xs mb-0.5">Acquirente</p>
              <p className="text-white/80 font-medium">{o.nomeAcquirente}</p>
              {o.ragioneSocialeAcquirente && <p className="text-white/50 text-xs">{o.ragioneSocialeAcquirente}</p>}
            </div>
            <div>
              <p className="text-white/40 text-xs mb-0.5">Contatto</p>
              {o.emailAcquirente && !o.emailAcquirente.includes("noemail@") && <p className="text-white/70 text-xs">{o.emailAcquirente}</p>}
              {o.telefonoAcquirente && <p className="text-white/70 text-xs">{o.telefonoAcquirente}</p>}
              {(!o.emailAcquirente || o.emailAcquirente.includes("noemail@")) && !o.telefonoAcquirente && <p className="text-white/40 text-xs italic">—</p>}
            </div>
            <div>
              <p className="text-white/40 text-xs mb-0.5">Metodo pagamento</p>
              <p className="text-white/70">{o.metodoPagamento === "paypal" ? "PayPal" : "Bonifico bancario"}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs mb-0.5">Data ordine</p>
              <p className="text-white/70">{new Date(o.createdAt).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })}</p>
            </div>
          </div>
          {o.note && !o.note.startsWith("[ASSEGNAZIONE ADMIN]") && !o.note.startsWith("[ADMIN]") && (
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <p className="text-white/40 text-xs mb-0.5">Note</p>
              <p className="text-white/70 text-sm whitespace-pre-wrap">{o.note}</p>
            </div>
          )}
          {o.stato === "in_attesa" && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-[#f5c518]/10 border border-[#f5c518]/20">
              <AlertCircle className="w-4 h-4 text-[#f5c518] shrink-0 mt-0.5" />
              <p className="text-[#f5c518]/80 text-xs">
                Il tuo ordine è in attesa di conferma. Dopo il pagamento, l'ufficio attiverà il pack entro 24 ore lavorative.
              </p>
            </div>
          )}
          {/* Pulsanti azioni */}
          <div className="border-t border-white/10 pt-3 space-y-2">
            {o.stato === "pagato" && (
              <ScaricaRicevutaButton ordineId={o.id} />
            )}
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Ciao! Ho un ordine #${o.id} per ${isSingolo ? "Pratiche Singole" : NOMI_PACK[o.packId] ?? o.packId} da €${Number(o.importo).toFixed(2)}. Stato: ${o.stato === "pagato" ? "Pagato ✓" : o.stato === "annullato" ? "Annullato" : "In attesa"}. Vorrei informazioni.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25d366] hover:bg-[#25d366]/90 text-white font-bold px-4 py-2 rounded-lg transition-colors text-xs w-full justify-center"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-5.031 1.378c-3.055 2.2-5.02 5.97-5.02 9.981 0 1.396.264 2.823.786 4.171l-1.24 4.738 4.86-1.271c1.26.736 2.786 1.124 4.514 1.124 5.21 0 9.447-4.168 9.447-9.268 0-2.324-.795-4.579-2.368-6.283-1.573-1.705-3.858-2.64-6.198-2.64"/>
              </svg>
              Contatta via WhatsApp
            </a>
          </div>

          {/* Applica Credito Promo */}
          {!isSingolo && o.stato === "pagato" && creditoPromoDisponibile > 0 && (
            <div className="border-t border-white/10 pt-3">
              {!showApplicaCredito ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowApplicaCredito(true)}
                  className="text-green-400 border-green-400/30 hover:bg-green-400/10 text-xs"
                >
                  <Gift className="w-3 h-3 mr-1" />
                  Applica Credito Promo (€{creditoPromoDisponibile.toFixed(2)} disponibili)
                </Button>
              ) : (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 space-y-2">
                  <p className="text-green-400 font-bold text-xs">Applica Credito Promo a questo pacchetto</p>
                  <p className="text-white/50 text-xs">Credito disponibile: €{creditoPromoDisponibile.toFixed(2)}</p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      max={creditoPromoDisponibile}
                      step="1"
                      className="flex-1 bg-white/5 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm"
                      placeholder={`Max €${creditoPromoDisponibile.toFixed(2)}`}
                      value={importoCredito}
                      onChange={e => setImportoCredito(e.target.value)}
                    />
                    <Button
                      size="sm"
                      disabled={applicaCredito.isPending || !importoCredito || Number(importoCredito) <= 0 || Number(importoCredito) > creditoPromoDisponibile}
                      onClick={() => applicaCredito.mutate({ ordineId: o.id, importo: Number(importoCredito) })}
                      className="bg-green-500 text-white hover:bg-green-500/90 font-bold text-xs"
                    >
                      {applicaCredito.isPending ? "..." : "Applica"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setShowApplicaCredito(false); setImportoCredito(""); }} className="text-white/50 text-xs">Annulla</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── TAB ACQUISTA ─────────────────────────────────────────────────────────────
function TabAcquista({ installatore }: { installatore: any }) {
  const [, navigate] = useLocation();
  const { data: listino } = trpc.installatori.mioListino.useQuery(undefined, { enabled: !!installatore });
  const prezziPersonalizzati: Record<string, { prezzo: number; note?: string }> = listino?.prezzi
    ? JSON.parse(listino.prezzi as string)
    : {};
  const hasListino = Object.keys(prezziPersonalizzati).length > 0;

  const PACK_INFO = [
    { id: "pack1", nome: "Pack 1", prezzo: "€ 2.000", res: 16, bus: 5, prezzoRes: "€ 125/cad", prezioBus: "€ 400/cad" },
    { id: "pack2", nome: "Pack 2", prezzo: "€ 3.150", res: 30, bus: 9, prezzoRes: "€ 105/cad", prezioBus: "€ 350/cad", highlight: true },
    { id: "pack3", nome: "Pack 3", prezzo: "€ 5.100", res: 60, bus: 20, prezzoRes: "€ 85/cad", prezioBus: "€ 250/cad" },
  ];

  // Raggruppa listino per categoria
  const categorieListino = LISTINO.reduce((acc, s) => {
    if (!acc[s.categoria]) acc[s.categoria] = [];
    acc[s.categoria].push(s);
    return acc;
  }, {} as Record<string, typeof LISTINO>);

  return (
    <div className="space-y-8">
      {/* Sezione Pack */}
      <div>
        <h2 className="text-white font-bold text-lg mb-1">Pack Pratiche</h2>
        <p className="text-white/50 text-sm mb-4">Acquista un pack per avere pratiche a prezzo ridotto. Il pack viene attivato dopo la conferma del pagamento.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PACK_INFO.map((pack) => (
            <div key={pack.id} className={`rounded-xl border p-5 relative ${pack.highlight ? "border-[#f5c518]/50 bg-[#f5c518]/5" : "border-white/10 bg-[#0e3320]"}`}>
              {pack.highlight && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <span className="bg-[#f5c518] text-[#1a4a2e] text-xs font-bold px-3 py-0.5 rounded-full">PIÙ POPOLARE</span>
                </div>
              )}
              <div className="mb-3">
                <p className="text-white font-bold text-base">{pack.nome}</p>
                <p className="text-[#f5c518] font-bold text-2xl mt-1">{pack.prezzo}</p>
              </div>
              <div className="space-y-1.5 mb-4 text-sm">
                <div className="flex items-center gap-2">
                  <Home className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="text-white/70">{pack.res} pratiche residenziali</span>
                  <span className="text-white/40 text-xs ml-auto">{pack.prezzoRes}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="text-white/70">{pack.bus} pratiche business</span>
                  <span className="text-white/40 text-xs ml-auto">{pack.prezioBus}</span>
                </div>
              </div>
              <Button
                className={`w-full font-bold ${pack.highlight ? "bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90" : "bg-white/10 text-white hover:bg-white/20"}`}
                onClick={() => navigate(`/acquista?pack=${pack.id}`)}>
                <ShoppingCart className="w-4 h-4 mr-2" />Acquista
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Sezione Listino Personalizzato */}
      {hasListino && (
        <div>
          <h2 className="text-white font-bold text-lg mb-1">Il Tuo Listino Riservato</h2>
          <p className="text-white/50 text-sm mb-4">Prezzi personalizzati assegnati al tuo account da Soluzioni Ambientali.</p>
          <div className="bg-[#0e3320] rounded-xl border border-[#f5c518]/20 overflow-hidden">
            <div className="px-4 py-3 bg-[#f5c518]/10 border-b border-[#f5c518]/20">
              <p className="text-[#f5c518] font-bold text-sm">{listino?.nomeListino ?? "Listino Personalizzato"}</p>
            </div>
            <div className="divide-y divide-white/5">
              {Object.entries(prezziPersonalizzati).map(([id, val]) => {
                const servizio = LISTINO.find(s => s.id === id);
                return (
                  <div key={id} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-white/80 text-sm font-medium truncate">{servizio?.nome ?? id}</p>
                      {servizio?.categoria && <p className="text-white/40 text-xs">{servizio.categoria}</p>}
                      {val.note && <p className="text-white/40 text-xs italic">{val.note}</p>}
                    </div>
                    <span className="text-[#f5c518] font-bold text-sm shrink-0">€ {val.prezzo.toLocaleString("it-IT")}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Sezione Pratiche Singole */}
      <div>
        <h2 className="text-white font-bold text-lg mb-1">Pratiche Singole</h2>
        <p className="text-white/50 text-sm mb-4">Acquista singole pratiche senza pack. I prezzi sono quelli del listino standard (o personalizzato se disponibile).</p>
        <div className="space-y-4">
          {Object.entries(categorieListino).map(([cat, servizi]) => (
            <div key={cat} className="bg-[#0e3320] rounded-xl border border-white/10 overflow-hidden">
              <div className="px-4 py-2.5 bg-white/5 border-b border-white/10">
                <p className="text-white/70 text-xs font-bold uppercase tracking-wide">{cat}</p>
              </div>
              <div className="divide-y divide-white/5">
                {servizi.map((s) => {
                  const prezzoCustom = prezziPersonalizzati[s.id];
                  const prezzoMostrato = prezzoCustom ? prezzoCustom.prezzo : (typeof s.prezzoStandard === "number" ? s.prezzoStandard : null);
                  return (
                    <div key={s.id} className="px-4 py-3 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-white/80 text-sm font-medium">{s.nome}</p>
                        {s.notePrezzo && <p className="text-white/40 text-xs">{s.notePrezzo}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        {prezzoCustom ? (
                          <span className="text-[#f5c518] font-bold text-sm">€ {prezzoCustom.prezzo.toLocaleString("it-IT")}</span>
                        ) : prezzoMostrato !== null ? (
                          <span className="text-white/70 text-sm">€ {prezzoMostrato.toLocaleString("it-IT")}</span>
                        ) : (
                          <span className="text-white/40 text-xs italic">Da concordare</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 text-center">
          <p className="text-white/60 text-sm mb-3">Per acquistare pratiche singole, contatta l'ufficio o usa il modulo di richiesta.</p>
          <Button onClick={() => navigate("/acquista")} className="bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-bold">
            <ShoppingCart className="w-4 h-4 mr-2" />Vai alla pagina Acquista
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── TAB PREMI ────────────────────────────────────────────────────────────────
function TabPremi({ installatore }: { installatore: any }) {
  const utils = trpc.useUtils();
  const [subTab, setSubTab] = useState<"bollette" | "nominativi" | "codici">("bollette");

  // Bollette
  const { data: bollette = [] } = trpc.premi.mieBollette.useQuery(undefined, { enabled: !!installatore });
  const [formBolletta, setFormBolletta] = useState({ nomeCliente: "", telefonoCliente: "", emailCliente: "", note: "" });
  const [allegato, setAllegato] = useState<{ base64: string; mimeType: string; nomeFile: string } | null>(null);
  const [uploadingAllegato, setUploadingAllegato] = useState(false);
  const inviaBolletta = trpc.premi.inviaBolletta.useMutation({
    onSuccess: () => { utils.premi.mieBollette.invalidate(); toast.success("Bolletta inviata! Verrà revisionata dall'ufficio."); setFormBolletta({ nomeCliente: "", telefonoCliente: "", emailCliente: "", note: "" }); setAllegato(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const handleAllegatoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 16 * 1024 * 1024) { toast.error("File troppo grande (max 16MB)"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setAllegato({ base64, mimeType: file.type, nomeFile: file.name });
    };
    reader.readAsDataURL(file);
  };

  const handleInviaBolletta = async () => {
    let fileUrl: string | undefined;
    let fileKey: string | undefined;
    let nomeFile: string | undefined;
    if (allegato) {
      setUploadingAllegato(true);
      try {
        const resp = await fetch("/api/premi/upload-bolletta", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(allegato),
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || "Errore upload");
        fileUrl = data.fileUrl;
        fileKey = data.fileKey;
        nomeFile = data.nomeFile;
      } catch (err: any) {
        toast.error(err.message || "Errore upload allegato");
        setUploadingAllegato(false);
        return;
      } finally {
        setUploadingAllegato(false);
      }
    }
    // Aggiungi dataCambio e nuovoFornitore alle note (no db:push necessario)
    const notaCompleta = [
      (formBolletta as any).dataCambio ? `Data cambio fornitore: ${new Date((formBolletta as any).dataCambio).toLocaleDateString("it-IT")}` : "",
      (formBolletta as any).nuovoFornitore ? `Nuovo fornitore: ${(formBolletta as any).nuovoFornitore}` : "",
      formBolletta.note || "",
    ].filter(Boolean).join(" | ");

    inviaBolletta.mutate({
      nomeCliente: formBolletta.nomeCliente,
      telefonoCliente: formBolletta.telefonoCliente || undefined,
      emailCliente: formBolletta.emailCliente || undefined,
      note: notaCompleta || undefined,
      fileUrl,
      fileKey,
      nomeFile,
    });
  };

  // Nominativi
  const { data: nominativi = [] } = trpc.premi.mieiNominativi.useQuery(undefined, { enabled: !!installatore });
  const [formNominativo, setFormNominativo] = useState({ nomeInstallatore: "", azienda: "", telefono: "", email: "", citta: "", note: "", pacchettoDiInteresse: "" });
  const segnalaNominativo = trpc.premi.segnalaNominativo.useMutation({
    onSuccess: () => { utils.premi.mieiNominativi.invalidate(); toast.success("Nominativo segnalato! Verrà contattato dall'ufficio."); setFormNominativo({ nomeInstallatore: "", azienda: "", telefono: "", email: "", citta: "", note: "", pacchettoDiInteresse: "" }); },
    onError: (e: any) => toast.error(e.message),
  });

  // Codici referral
  const [codiceInput, setCodiceInput] = useState("");
  const riscattaCodice = trpc.premi.riscattaCodice.useMutation({
    onSuccess: (data: any) => { utils.installatori.mio.invalidate(); toast.success(`Codice riscattato! Hai ricevuto €${data.credito} di credito.`); setCodiceInput(""); },
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
    convertito: "Convertito ✔",
    non_interessato: "Non c'è interesse",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-white font-bold text-lg mb-1 flex items-center gap-2"><Trophy className="w-5 h-5 text-[#f5c518]" /> Premi &amp; Bonus</h2>
        <p className="text-white/50 text-sm mb-4">Guadagna credito inviando bollette, segnalando installatori e riscattando codici promo.</p>
      </div>

      {/* CONTATORE PROMO - Progress bar verso pack omaggio */}
      {(() => {
        const creditoTotale = parseFloat(installatore?.creditoTotale || "0");
        const soglia = parseFloat(installatore?.sogliaPackOmaggio || "2000");
        const percentuale = Math.min(100, (creditoTotale / soglia) * 100);
        const raggiunto = creditoTotale >= soglia;
        return (
          <div className={`rounded-xl p-5 border ${
            raggiunto
              ? "bg-green-500/10 border-green-500/40"
              : "bg-[#0e3320] border-[#f5c518]/20"
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy className={`w-5 h-5 ${raggiunto ? "text-green-400" : "text-[#f5c518]"}`} />
                <span className={`font-bold text-sm ${raggiunto ? "text-green-400" : "text-white"}`}>
                  {raggiunto ? "🎉 Pack Omaggio Guadagnato!" : "Contatore Promo — Pack Omaggio"}
                </span>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                raggiunto ? "bg-green-500/20 text-green-400" : "bg-[#f5c518]/20 text-[#f5c518]"
              }`}>
                €{creditoTotale.toLocaleString("it-IT", { minimumFractionDigits: 0 })} / €{soglia.toLocaleString("it-IT", { minimumFractionDigits: 0 })}
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-white/10 rounded-full h-3 mb-2 overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all duration-700 ${
                  raggiunto ? "bg-green-400" : "bg-gradient-to-r from-[#f5c518] to-[#ffdd44]"
                }`}
                style={{ width: `${percentuale}%` }}
              />
            </div>
            <p className="text-white/50 text-xs">
              {raggiunto
                ? "Hai raggiunto la soglia! L'ufficio ti contatterà per assegnare il tuo pacchetto omaggio."
                : `Mancano €${Math.max(0, soglia - creditoTotale).toLocaleString("it-IT", { minimumFractionDigits: 0 })} per ottenere il tuo pacchetto omaggio. Accumula credito inviando bollette e segnalando installatori.`
              }
            </p>
          </div>
        );
      })()}

      {/* Sub-tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["bollette", "nominativi", "codici"] as const).map((t) => (
          <button key={t} onClick={() => setSubTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
              subTab === t ? "bg-[#f5c518] text-[#1a4a2e]" : "bg-white/10 text-white/60 hover:text-white"
            }`}>
            {t === "bollette" && <><Gift className="w-4 h-4" /> Bollette</>}
            {t === "nominativi" && <><Users className="w-4 h-4" /> Nominativi</>}
            {t === "codici" && <><Tag className="w-4 h-4" /> Codici Promo</>}
          </button>
        ))}
      </div>

      {/* BOLLETTE */}
      {subTab === "bollette" && (
        <div className="space-y-4">
          {/* Box condizioni bonus bollette */}
          <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-400 font-bold text-sm mb-1">Condizioni per ricevere il bonus</p>
              <p className="text-white/70 text-xs leading-relaxed">
                Il bonus verrà erogato <strong className="text-white">solo se la bolletta sarà cambiata dal cliente portato dall'installatore con noi</strong>, e comunque <strong className="text-white">non prima di due mesi dal cambio</strong>. Il codice promo verrà assegnato direttamente dall'ufficio.
              </p>
            </div>
          </div>
          <div className="bg-[#0e3320] border border-[#f5c518]/20 rounded-xl p-5">
            <h3 className="text-white font-bold mb-1">Invia una Bolletta</h3>
            <p className="text-white/50 text-xs mb-4">Invia la bolletta di un cliente per ricevere credito. L'ufficio la revisionerà e ti accrediterà il bonus.</p>
            <div className="bg-[#f5c518]/8 border border-[#f5c518]/20 rounded-lg p-3 mb-4">
              <p className="text-[#f5c518] text-xs font-bold mb-1">Come funziona il bonus bollette</p>
              <p className="text-white/50 text-xs leading-relaxed">
                1. Porti un cliente a cambiare fornitore con noi · 2. Inserisci qui i suoi dati e la data del cambio · 3. Noi verifichiamo dopo 2 mesi che il cambio sia andato a buon fine · 4. Se confermato, ti accreditiamo il bonus
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-white/70 text-xs mb-1 block">Nome Cliente *</Label>
                <Input value={formBolletta.nomeCliente} onChange={e => setFormBolletta(f => ({...f, nomeCliente: e.target.value}))} placeholder="Mario Rossi" className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-white/70 text-xs mb-1 block">Telefono</Label>
                  <Input value={formBolletta.telefonoCliente} onChange={e => setFormBolletta(f => ({...f, telefonoCliente: e.target.value}))} placeholder="+39 123..." className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
                </div>
                <div>
                  <Label className="text-white/70 text-xs mb-1 block">Email</Label>
                  <Input value={formBolletta.emailCliente} onChange={e => setFormBolletta(f => ({...f, emailCliente: e.target.value}))} placeholder="mario@..." className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-white/70 text-xs mb-1 block">Data cambio fornitore *</Label>
                  <Input
                    type="date"
                    value={(formBolletta as any).dataCambio || ""}
                    onChange={e => setFormBolletta(f => ({...f, dataCambio: e.target.value} as any))}
                    max={new Date().toISOString().split("T")[0]}
                    className="bg-white/5 border-white/10 text-white" />

                </div>
                <div>
                  <Label className="text-white/70 text-xs mb-1 block">Nuovo fornitore</Label>
                  <Input value={(formBolletta as any).nuovoFornitore || ""} onChange={e => setFormBolletta(f => ({...f, nuovoFornitore: e.target.value} as any))} placeholder="Es. Enel, Edison, Eni..." className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
                </div>
              </div>
              <div>
                <Label className="text-white/70 text-xs mb-1 block">Note</Label>
                <Input value={formBolletta.note} onChange={e => setFormBolletta(f => ({...f, note: e.target.value}))} placeholder="Tipo contratto, fornitore precedente..." className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
              </div>
              {/* Upload allegato bolletta */}
              <div>
                <Label className="text-white/70 text-xs mb-1 block">Allega Bolletta (PDF o immagine, max 16MB)</Label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 cursor-pointer">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                      allegato
                        ? "bg-green-500/10 border-green-500/40 text-green-400"
                        : "bg-white/5 border-white/10 text-white/50 hover:border-white/30"
                    }`}>
                      <FileText className="w-4 h-4 shrink-0" />
                      <span className="truncate">{allegato ? allegato.nomeFile : "Clicca per allegare la bolletta..."}</span>
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      className="hidden"
                      onChange={handleAllegatoChange}
                    />
                  </label>
                  {allegato && (
                    <Button size="sm" variant="ghost" onClick={() => setAllegato(null)} className="text-red-400 hover:text-red-300 text-xs shrink-0">Rimuovi</Button>
                  )}
                </div>
              </div>
              <Button
                disabled={inviaBolletta.isPending || uploadingAllegato || !formBolletta.nomeCliente.trim()}
                onClick={handleInviaBolletta}
                className="bg-[#f5c518] text-[#1a4a2e] font-bold hover:bg-[#f5c518]/90 flex items-center gap-2">
                <Send className="w-4 h-4" />
                {uploadingAllegato ? "Upload in corso..." : inviaBolletta.isPending ? "Invio..." : "Invia Bolletta"}
              </Button>
            </div>
          </div>
          {bollette.length > 0 && (
            <div>
              <h3 className="text-white/70 text-sm font-semibold mb-2">Bollette Inviate ({bollette.length})</h3>
              <div className="space-y-2">
                {bollette.map((b: any) => (
                  <div key={b.id} className="bg-[#0e3320] border border-white/10 rounded-xl p-4 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{b.nomeCliente}</p>
                      <p className="text-white/40 text-xs">{new Date(b.createdAt).toLocaleDateString("it-IT")}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${STATO_BADGE[b.stato] || "bg-white/10 text-white/50"}`}>{STATO_LABEL[b.stato] || b.stato}</span>
                      {b.stato === "approvato" && parseFloat(b.creditoAssegnato || "0") > 0 && (
                        <p className="text-[#f5c518] text-xs font-bold mt-1">+€{parseFloat(b.creditoAssegnato).toLocaleString("it-IT")}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* NOMINATIVI */}
      {subTab === "nominativi" && (
        <div className="space-y-4">
          {/* Box condizioni bonus nominativi */}
          <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-400 font-bold text-sm mb-1">Condizioni per ricevere il bonus</p>
              <p className="text-white/70 text-xs leading-relaxed">
                Il bonus verrà erogato <strong className="text-white">solo se l'installatore segnalato acquisterà e pagerà un pacchetto</strong>. Il codice promo verrà assegnato direttamente dall'ufficio dopo la conferma del pagamento.
              </p>
            </div>
          </div>
          <div className="bg-[#0e3320] border border-[#f5c518]/20 rounded-xl p-5">
            <h3 className="text-white font-bold mb-1">Segnala un Installatore</h3>
            <p className="text-white/50 text-xs mb-4">Segnala un installatore che potrebbe essere interessato ai nostri servizi. Se acquista un pacchetto, ricevi un bonus credito.</p>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4">
              <p className="text-amber-400 text-xs"><strong>⚠️ Importante:</strong> Il bonus verrà erogato <strong>solo se l'installatore segnalato acquisterà e pagherà un pacchetto</strong>. Il codice promo verrà assegnato direttamente dall'ufficio dopo la conferma del pagamento.</p>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-white/70 text-xs mb-1 block">Nome Installatore *</Label>
                  <Input value={formNominativo.nomeInstallatore} onChange={e => setFormNominativo(f => ({...f, nomeInstallatore: e.target.value}))} placeholder="Mario Rossi" className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
                </div>
                <div>
                  <Label className="text-white/70 text-xs mb-1 block">Azienda</Label>
                  <Input value={formNominativo.azienda} onChange={e => setFormNominativo(f => ({...f, azienda: e.target.value}))} placeholder="Rossi Impianti" className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-white/70 text-xs mb-1 block">Telefono</Label>
                  <Input value={formNominativo.telefono} onChange={e => setFormNominativo(f => ({...f, telefono: e.target.value}))} placeholder="+39 123..." className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
                </div>
                <div>
                  <Label className="text-white/70 text-xs mb-1 block">Città</Label>
                  <Input value={formNominativo.citta} onChange={e => setFormNominativo(f => ({...f, citta: e.target.value}))} placeholder="Milano" className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
                </div>
              </div>
              <div>
                <Label className="text-white/70 text-xs mb-1 block">Email</Label>
                <Input value={formNominativo.email} onChange={e => setFormNominativo(f => ({...f, email: e.target.value}))} placeholder="mario@..." className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
              </div>
              <div>
                <Label className="text-white/70 text-xs mb-1 block">Pacchetto di Interesse</Label>
                <Select value={formNominativo.pacchettoDiInteresse} onValueChange={val => setFormNominativo(f => ({...f, pacchettoDiInteresse: val}))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Scegli un pacchetto" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0e3320] border-white/10">
                    <SelectItem value="pack1" className="text-white">Pack 1 (€2.000)</SelectItem>
                    <SelectItem value="pack2" className="text-white">Pack 2 (€3.150)</SelectItem>
                    <SelectItem value="pack3" className="text-white">Pack 3 (€5.100)</SelectItem>
                    <SelectItem value="singolo" className="text-white">Pratiche Singole</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white/70 text-xs mb-1 block">Note</Label>
                <Input value={formNominativo.note} onChange={e => setFormNominativo(f => ({...f, note: e.target.value}))} placeholder="Come lo conosci, interesse..." className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
              </div>
              <Button disabled={segnalaNominativo.isPending || !formNominativo.nomeInstallatore.trim()} onClick={() => segnalaNominativo.mutate({ nomeInstallatore: formNominativo.nomeInstallatore, azienda: formNominativo.azienda || undefined, telefono: formNominativo.telefono || undefined, email: formNominativo.email || undefined, citta: formNominativo.citta || undefined, note: formNominativo.note || undefined, pacchettoDiInteresse: formNominativo.pacchettoDiInteresse || undefined })} className="bg-[#f5c518] text-[#1a4a2e] font-bold hover:bg-[#f5c518]/90 flex items-center gap-2">
                <Send className="w-4 h-4" /> {segnalaNominativo.isPending ? "Invio..." : "Segnala Nominativo"}
              </Button>
            </div>
          </div>
          {nominativi.length > 0 && (
            <div>
              <h3 className="text-white/70 text-sm font-semibold mb-2">Nominativi Segnalati ({nominativi.length})</h3>
              <div className="space-y-2">
                {nominativi.map((n: any) => (
                  <div key={n.id} className="bg-[#0e3320] border border-white/10 rounded-xl p-4 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{n.nomeInstallatore}{n.azienda ? ` — ${n.azienda}` : ""}</p>
                      <p className="text-white/40 text-xs">{new Date(n.createdAt).toLocaleDateString("it-IT")}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${STATO_BADGE[n.stato] || "bg-white/10 text-white/50"}`}>{STATO_LABEL[n.stato] || n.stato}</span>
                      {n.stato === "convertito" && parseFloat(n.creditoAssegnato || "0") > 0 && (
                        <p className="text-[#f5c518] text-xs font-bold mt-1">+€{parseFloat(n.creditoAssegnato).toLocaleString("it-IT")}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CODICI PROMO */}
      {subTab === "codici" && (
        <div className="space-y-4">
          {/* Saldo credito promo */}
          {parseFloat(installatore?.creditoResiduo || "0") > 0 && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-green-400 font-bold text-lg">€{parseFloat(installatore.creditoResiduo).toLocaleString("it-IT", { minimumFractionDigits: 2 })} di credito disponibile</p>
                <p className="text-white/50 text-xs">Credito accumulato da codici promo e premi. Verrà scalato dalle prossime pratiche.</p>
              </div>
            </div>
          )}
          {/* Codice promo personale dell'installatore */}
          {installatore?.codicePromo && (
            <div className="bg-[#f5c518]/10 border border-[#f5c518]/30 rounded-xl p-5">
              <h3 className="text-[#f5c518] font-bold mb-1 flex items-center gap-2"><Tag className="w-4 h-4" /> Il Tuo Codice Promo Personale</h3>
              <p className="text-white/60 text-xs mb-3">Questo è il tuo codice promo univoco. Condividilo con l'ufficio o usalo per ricevere credito.</p>
              <div className="flex items-center gap-3">
                <span className="font-mono text-2xl font-black text-[#f5c518] tracking-widest bg-[#0e3320] px-4 py-2 rounded-lg border border-[#f5c518]/30">{installatore.codicePromo}</span>
                <Button size="sm" variant="outline" className="border-[#f5c518]/30 text-[#f5c518] hover:bg-[#f5c518]/10" onClick={() => { navigator.clipboard.writeText(installatore.codicePromo); toast.success("Codice copiato!"); }}>Copia</Button>
              </div>
            </div>
          )}
          <div className="bg-[#0e3320] border border-[#f5c518]/20 rounded-xl p-5">
            <h3 className="text-white font-bold mb-1">Riscatta Codice Promo</h3>
            <p className="text-white/50 text-xs mb-4">Riscatta i codici ricevuti dall'ufficio per ricevere credito sul tuo account.</p>
            <div className="flex gap-3">
              <Input value={codiceInput} onChange={e => setCodiceInput(e.target.value.toUpperCase())} placeholder="Es. PROMO-ABC123" className="bg-white/5 border-white/10 text-white placeholder:text-white/30 font-mono uppercase" />
              <Button disabled={riscattaCodice.isPending || !codiceInput.trim()} onClick={() => riscattaCodice.mutate({ codice: codiceInput })} className="bg-[#f5c518] text-[#1a4a2e] font-bold hover:bg-[#f5c518]/90 shrink-0">
                {riscattaCodice.isPending ? "..." : "Riscatta"}
              </Button>
            </div>
          </div>
          <div className="bg-[#0e3320] border border-white/10 rounded-xl p-5">
            <h3 className="text-white font-bold mb-3">Come funziona?</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#f5c518] text-[#1a4a2e] font-black flex items-center justify-center text-xs shrink-0">1</span>
                <p className="text-white/70"><strong className="text-white">Bollette:</strong> Invia le bollette dei tuoi clienti. L'ufficio le revisionerà e ti accrediterà un bonus.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#f5c518] text-[#1a4a2e] font-black flex items-center justify-center text-xs shrink-0">2</span>
                <p className="text-white/70"><strong className="text-white">Nominativi:</strong> Segnala installatori che potrebbero essere interessati. Se si convertono, ricevi un bonus.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#f5c518] text-[#1a4a2e] font-black flex items-center justify-center text-xs shrink-0">3</span>
                <p className="text-white/70"><strong className="text-white">Codici Promo:</strong> Riscatta i codici ricevuti dall'ufficio per ricevere credito sul tuo account.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading, logout } = useAuth();
  const utils = trpc.useUtils();

  const { data: installatore, isLoading: loadingInst } = trpc.installatori.mio.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  });

  const { data: pratiche = [], isLoading: loadingPratiche } = trpc.pratiche.mie.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: ordini = [], isLoading: loadingOrdini } = trpc.ordini.miei.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const inviaPratica = trpc.pratiche.invia.useMutation({
    onSuccess: () => { utils.pratiche.mie.invalidate(); toast.success("Pratica inviata!"); },
    onError: (e) => toast.error(e.message),
  });

  const creaPratica = trpc.pratiche.crea.useMutation({
    onSuccess: () => {
      utils.pratiche.mie.invalidate();
      utils.ordini.miei.invalidate();
      utils.installatori.mio.invalidate();
      utils.pack.mioRiepilogo.invalidate();
      setShowNuovaPratica(false);
      toast.success("Pratica creata!");
    },
    onError: (e) => toast.error(e.message),
  });

  const [tab, setTab] = useState<"pratiche" | "ordini" | "premi" | "acquista">("pratiche");
  const [showNuovaPratica, setShowNuovaPratica] = useState(false);
  const [formPratica, setFormPratica] = useState({
    tipologia: "residenziale" as "residenziale" | "business",
    tipoIter: "connessione_semplificato" as TipoIter,
    potenzaKw: "",
    indirizzoImpianto: "",
    comuneImpianto: "",
    provinciaImpianto: "",
    nomeTitolare: "",
    note: "",
  });
  const [praticaSingola, setPraticaSingola] = useState(false);

  const { data: packRiepilogo } = trpc.pack.mioRiepilogo.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: ordiniConCredito = [] } = trpc.pack.mioiOrdiniConCredito.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Promo personalizzate per questo installatore
  const { data: promoList = [] } = trpc.promo.mie.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Separa pack e pratiche singole
  const packAcquistati = ordiniConCredito.filter((o: any) => !o.isSingolo);
  const singoleAcquistate = ordiniConCredito.filter((o: any) => o.isSingolo);
  const [ordineSelezionato, setOrdineSelezionato] = useState<number | null>(null);

  if (loading || loadingInst) return (
    <div className="flex items-center justify-center h-screen bg-[#1a4a2e] text-white">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#f5c518] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-white/60 text-sm">Caricamento...</p>
      </div>
    </div>
  );
  if (!isAuthenticated) return (navigate("/"), null);

  const TABS = [
    { id: "pratiche" as const, label: "Le Mie Pratiche", count: pratiche.length },
    { id: "ordini" as const, label: "I Miei Ordini", count: ordini.length },
    { id: "premi" as const, label: "Premi", count: null },
    { id: "acquista" as const, label: "Acquista", count: null },
  ];

  return (
    <div className="min-h-screen bg-[#1a4a2e] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0e3320]">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">Portale Installatore</h1>
            {installatore && (
              <p className="text-white/50 text-xs mt-0.5">
                {installatore.ragioneSociale}
                {installatore.citta ? ` · ${installatore.citta}` : ""}
                {installatore.stato === "in_attesa" && (
                  <span className="ml-2 text-[#f5c518] bg-[#f5c518]/10 px-1.5 py-0.5 rounded text-xs">In attesa di approvazione</span>
                )}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => navigate("/")} className="text-xs border-white/20 text-white/60 hover:text-white bg-transparent">
              Home
            </Button>
            <Button size="sm" variant="outline" onClick={() => logout()} className="text-xs border-white/20 text-white/60 hover:text-white bg-transparent">
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10 bg-[#0e3320]">
        <div className="max-w-5xl mx-auto px-4 flex">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                tab === t.id ? "border-[#f5c518] text-[#f5c518]" : "border-transparent text-white/50 hover:text-white"
              }`}>
              {t.label}
              {t.count !== null && t.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === t.id ? "bg-[#f5c518]/20 text-[#f5c518]" : "bg-white/10 text-white/40"}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* Sezione Pacchetti e Singole */}
        {tab === "pratiche" && ordiniConCredito.length > 0 && (
          <div className="mb-6 space-y-4">
            {/* Slot per ogni pacchetto acquistato */}
            {packAcquistati.map((pack: any, idx: number) => {
              const creditoTotale = pack.creditoTotale || 0;
              const creditoResiduo = pack.creditoResiduo ?? creditoTotale;
              const percentuale = creditoTotale > 0 ? Math.round((creditoResiduo / creditoTotale) * 100) : 0;
              return (
                <div key={pack.id} className="p-5 rounded-xl bg-[#0e3320] border border-[#f5c518]/20">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-white font-bold text-lg">I Miei Pack</h2>
                    <span className="text-[#f5c518] text-sm font-semibold">{NOMI_PACK[pack.packId] || pack.packId}</span>
                  </div>
                  {/* Barra credito */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/50">Credito residuo</span>
                      <span className={`font-bold ${creditoResiduo < 0 ? "text-red-400" : "text-[#f5c518]"}`}>
                        {creditoResiduo < 0 ? `-€${Math.abs(creditoResiduo).toLocaleString("it-IT")}` : `€${creditoResiduo.toLocaleString("it-IT")}`} / €{creditoTotale.toLocaleString("it-IT")}
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div className={`h-2 rounded-full transition-all ${creditoResiduo < 0 ? "bg-red-500" : "bg-[#f5c518]"}`} style={{ width: `${Math.max(0, percentuale)}%` }} />
                    </div>
                    {creditoResiduo <= 0 && (
                      <div className="mt-2 bg-red-500/15 border border-red-500/40 rounded-lg p-3 flex items-center justify-between gap-2">
                        <div>
                          <p className="text-red-400 text-xs font-bold">⚠ Credito esaurito</p>
                          <p className="text-red-300/70 text-xs">Rinnova il pack per continuare ad aprire pratiche</p>
                        </div>
                        <Button size="sm" onClick={() => setTab("acquista")} className="bg-red-500 hover:bg-red-600 text-white text-xs shrink-0">Rinnova</Button>
                      </div>
                    )}
                    {creditoResiduo > 0 && percentuale < 20 && (
                      <div className="mt-2 bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 flex items-center justify-between gap-2">
                        <p className="text-amber-400 text-xs">⚠ Credito quasi esaurito ({percentuale}%)</p>
                        <Button size="sm" variant="outline" onClick={() => setTab("acquista")} className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 text-xs shrink-0">Rinnova</Button>
                      </div>
                    )}
                  </div>
                  {/* Contatore pratiche residenziali e business */}
                  {(pack.pratiche_incluse_residenziali > 0 || pack.pratiche_incluse_business > 0) && (
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {pack.pratiche_incluse_residenziali > 0 && (
                        <div className="bg-[#4ade80]/10 rounded-lg p-2 border border-[#4ade80]/20">
                          <p className="text-[#4ade80] text-xs font-bold">Residenziali</p>
                          <p className="text-white text-sm font-bold">{pack.pratiche_usate_residenziali || 0}/{pack.pratiche_incluse_residenziali}</p>
                          <div className="w-full bg-white/10 rounded-full h-1 mt-1">
                            <div className="bg-[#4ade80] h-1 rounded-full" style={{ width: `${pack.pratiche_incluse_residenziali > 0 ? Math.min(100, ((pack.pratiche_usate_residenziali || 0) / pack.pratiche_incluse_residenziali) * 100) : 0}%` }} />
                          </div>
                        </div>
                      )}
                      {pack.pratiche_incluse_business > 0 && (
                        <div className="bg-blue-400/10 rounded-lg p-2 border border-blue-400/20">
                          <p className="text-blue-400 text-xs font-bold">Business</p>
                          <p className="text-white text-sm font-bold">{pack.pratiche_usate_business || 0}/{pack.pratiche_incluse_business}</p>
                          <div className="w-full bg-white/10 rounded-full h-1 mt-1">
                            <div className="bg-blue-400 h-1 rounded-full" style={{ width: `${pack.pratiche_incluse_business > 0 ? Math.min(100, ((pack.pratiche_usate_business || 0) / pack.pratiche_incluse_business) * 100) : 0}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Prezzi per pratica */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-white/5 rounded-lg p-2 border border-white/10 text-center">
                      <p className="text-white/40 text-xs">Residenziale</p>
                      <p className="text-white font-bold">€{pack.prezzoResidenziale}</p>
                      <p className="text-white/30 text-xs">per pratica</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2 border border-white/10 text-center">
                      <p className="text-white/40 text-xs">Business</p>
                      <p className="text-white font-bold">€{pack.prezzoBusiness}</p>
                      <p className="text-white/30 text-xs">per pratica</p>
                    </div>
                  </div>
                  {/* Istruzioni flusso */}
                  <div className="bg-blue-900/15 border border-blue-400/15 rounded-lg px-3 py-2 mb-3">
                    <p className="text-blue-300 text-xs font-semibold mb-1">Come funziona</p>
                    <p className="text-white/40 text-xs leading-relaxed">1. Clicca <strong className="text-white/60">+ Nuova Pratica</strong> e compila i dati del cliente · 2. Salva in bozza e carica i documenti · 3. Clicca <strong className="text-white/60">Invia</strong> quando tutto è pronto</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {pack.stato !== "pagato" ? (
                      <div className="flex-1 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                        <p className="text-amber-400 text-xs font-bold">⏳ In attesa di conferma pagamento</p>
                        <p className="text-amber-300/60 text-xs mt-0.5">Il tuo ordine è stato ricevuto. Non appena l'ufficio confermerà il pagamento potrai creare pratiche.</p>
                      </div>
                    ) : creditoResiduo <= 0 ? (
                      <div className="flex-1 bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center justify-between gap-2">
                        <div>
                          <p className="text-red-400 text-xs font-bold">⚠ Credito esaurito</p>
                          <p className="text-red-300/60 text-xs">Acquista un nuovo pack per continuare</p>
                        </div>
                        <Button size="sm" onClick={() => setTab("acquista")} className="bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 text-xs shrink-0 font-bold">Acquista</Button>
                      </div>
                    ) : (
                      <>
                        <Button
                          onClick={() => {
                            setOrdineSelezionato(pack.id);
                            setPraticaSingola(false);
                            setFormPratica(f => ({ ...f, tipoIter: "connessione_semplificato" }));
                            setShowNuovaPratica(true);
                          }}
                          className="bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-bold flex-1">
                          <Plus className="w-4 h-4 mr-2" /> Nuova Pratica da Pack
                        </Button>
                        <Button onClick={() => setTab("acquista")} variant="outline" className="border-[#f5c518]/50 text-[#f5c518] hover:bg-[#f5c518]/10 text-xs">
                          Acquista altro
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Sezione Pratiche Singole (GSE, Terna, ENEA, Dogane, ecc.) */}
            <div className="p-5 rounded-xl bg-[#0e3320] border border-white/20">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-white font-bold text-lg">Pratiche Singole</h2>
                  <p className="text-white/40 text-xs mt-0.5">GSE, Terna, ENEA, Dogane, ARERA, ecc.</p>
                </div>
                {singoleAcquistate.length > 0 && (
                  <span className="text-white/50 text-sm">{singoleAcquistate.length} acquistate</span>
                )}
              </div>
              {singoleAcquistate.length > 0 && (
                <div className="space-y-2 mb-3">
                  {singoleAcquistate.map((s: any) => {
                    const usata = pratiche.some((p: any) => p.ordineId === s.id);
                    return (
                      <div key={s.id} className={`flex items-center justify-between p-2 rounded-lg border ${usata ? "border-white/10 bg-white/5 opacity-50" : "border-[#f5c518]/20 bg-[#f5c518]/5"}`}>
                        <div>
                          <span className="text-white text-sm font-semibold">Pratica Singola</span>
                          <span className="text-white/40 text-xs ml-2">€{parseFloat(s.importo).toLocaleString("it-IT")}</span>
                        </div>
                        {usata ? (
                          <span className="text-white/30 text-xs">✓ Pratica compilata</span>
                        ) : s.stato !== "pagato" ? (
                          <span className="text-amber-400/70 text-xs">⏳ In attesa conferma</span>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => {
                              setOrdineSelezionato(s.id);
                              setPraticaSingola(true);
                              setFormPratica(f => ({ ...f, tipoIter: "gse" }));
                              setShowNuovaPratica(true);
                            }}
                            className="bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-bold text-xs h-7">
                            <Plus className="w-3 h-3 mr-1" /> Compila pratica
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="bg-blue-900/15 border border-blue-400/15 rounded-lg px-3 py-2 mb-3">
                <p className="text-blue-300 text-xs font-semibold mb-1">Come funzionano le pratiche singole</p>
                <p className="text-white/40 text-xs leading-relaxed">Acquista una pratica singola dalla tab <strong className="text-white/60">Acquista</strong>. Dopo la conferma del pagamento, apparirà qui il pulsante per compilarla.</p>
              </div>
            </div>
          </div>
        )}

        {/* Box Promo Personalizzate — RIMOSSO da tab pratiche, spostato a tab ordini */}

        {/* Tab Pratiche */}
        {tab === "pratiche" && (
          <div className="space-y-4">
            {loadingPratiche ? (
              <div className="text-center py-12 text-white/40">Caricamento pratiche...</div>
            ) : pratiche.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/50 mb-2">Nessuna pratica ancora.</p>
                <p className="text-white/30 text-sm">Crea la tua prima pratica usando il pulsante "+ Crea Pratica" nella sezione Il Mio Pack, oppure acquista una pratica singola.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Pratiche da Pack — solo connessione_ordinario e connessione_semplificato */}
                {pratiche.filter((p: any) => isIterDaPack(p.tipoIter as any)).length > 0 && (
                  <div>
                    <h3 className="text-[#f5c518] font-bold mb-3 flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Pratiche da Pack
                      <span className="text-white/30 text-xs font-normal">(Connessione Ordinario / Semplificato)</span>
                    </h3>
                    <div className="space-y-3">
                      {pratiche.filter((p: any) => isIterDaPack(p.tipoIter as any)).map((p) => (
                        <CardPratica key={p.id} p={p as Pratica} onInvia={(id) => inviaPratica.mutate({ id })} utils={utils} />
                      ))}
                    </div>
                  </div>
                )}
                {/* Pratiche Singole — GSE, Terna, ENEA, Dogane, ARERA, ecc. */}
                {pratiche.filter((p: any) => !isIterDaPack(p.tipoIter as any)).length > 0 && (
                  <div>
                    <h3 className="text-[#f5c518] font-bold mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Pratiche Singole
                      <span className="text-white/30 text-xs font-normal">(GSE, Terna, ENEA, Dogane, ecc.)</span>
                    </h3>
                    <div className="space-y-3">
                      {pratiche.filter((p: any) => !isIterDaPack(p.tipoIter as any)).map((p) => (
                        <CardPratica key={p.id} p={p as Pratica} onInvia={(id) => inviaPratica.mutate({ id })} utils={utils} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab Ordini */}
        {tab === "ordini" && (
          <div className="space-y-4">
            {/* Sezione Promo Esclusive */}
            {promoList && promoList.length > 0 && (
              <div className="mb-6 space-y-3">
                {promoList.map((promo: any) => (
                   <div key={promo.id} className="rounded-xl border-2 border-[#f5c518] bg-[#1a4a2e] p-6 space-y-4">
                     <div>
                       <div className="inline-block bg-[#f5c518] text-[#1a4a2e] px-3 py-1 rounded-full text-xs font-black mb-3">PER I NUOVI INSTALLATORI</div>
                       <h3 className="text-[#f5c518] font-black text-3xl mb-2">{promo.titolo}</h3>
                       <p className="text-white/70 text-sm">{promo.descrizione}</p>
                     </div>
                     <div className="bg-white/5 rounded-lg p-4 border border-white/10 space-y-3">
                       <div className="flex justify-between items-center">
                         <span className="text-white/70 text-sm">Pratiche Residenziali</span>
                         <span className="text-[#f5c518] font-bold">5 × €100/cad</span>
                       </div>
                       <div className="flex justify-between items-center">
                         <span className="text-white/70 text-sm">Pratiche Business</span>
                         <span className="text-[#f5c518] font-bold">2 × €250/cad</span>
                       </div>
                       <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                         <span className="text-white/70 text-sm">Schema unifilare</span>
                         <span className="text-[#4ade80] font-bold">Incluso</span>
                       </div>
                       <div className="flex justify-between items-center">
                         <span className="text-white/70 text-sm">Scadenza</span>
                         <span className="text-[#4ade80] font-bold">Mai</span>
                       </div>
                       <div className="flex justify-between items-center">
                         <span className="text-white/70 text-sm">Credito residuo</span>
                         <span className="text-[#4ade80] font-bold">Omaggiato*</span>
                       </div>
                       <div className="text-white/40 text-xs pt-2 border-t border-white/10">
                         *Se per l'ultima pratica non ci sarà credito a sufficienza, dopo aver acquistato un misto di pratiche residenziali e/o business, quest'ultimo verrà integrato e omaggiato da Soluzioni Ambientali.
                       </div>
                     </div>
                     <Button onClick={() => {
                       const tel = "+393333333333";
                       const msg = encodeURIComponent(`Buongiorno,\n\nSono interessato al Pack Benvenuto di Ricaricati di Connessioni.\n\nPotete fornirmi maggiori dettagli?\n\nGrazie`);
                       window.open(`https://wa.me/${tel}?text=${msg}`, "_blank");
                     }} className="w-full bg-[#25d366] text-white hover:bg-[#25d366]/90 font-bold py-3">
                       💬 Richiedi su WhatsApp
                     </Button>
                   </div>
                 ))}
              </div>
            )}
            {loadingOrdini ? (
              <div className="text-center py-12 text-white/40">Caricamento ordini...</div>
            ) : ordini.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/50 mb-2">Nessun ordine ancora.</p>
                <Button onClick={() => setTab("acquista")} className="bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-bold mt-2">
                  Acquista un Pack
                </Button>
              </div>
            ) : (
              ordini.map((o) => (
                <CardOrdine
                  key={o.id}
                  o={o as Ordine}
                  creditoPromoDisponibile={parseFloat(installatore?.creditoResiduo || "0")}
                  onCreditoApplicato={() => utils.ordini.miei.invalidate()}
                />
              ))
            )}
          </div>
        )}

        {/* Tab Premi */}
        {tab === "premi" && <TabPremi installatore={installatore} />}

        {/* Tab Acquista */}
        {tab === "acquista" && <TabAcquista installatore={installatore} />}
      </div>

      {/* Modal Crea Pratica */}
      <Dialog open={showNuovaPratica} onOpenChange={setShowNuovaPratica}>
        <DialogContent className="bg-[#0e3320] border border-[#f5c518]/20 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-bold">
              {praticaSingola ? "Nuova Pratica Singola" : "Nuova Pratica da Pack"}
            </DialogTitle>
          </DialogHeader>
          {/* Banner tipo pratica */}
          <div className={`flex items-center gap-3 p-3 rounded-lg border ${praticaSingola ? "bg-white/5 border-white/20" : "bg-[#f5c518]/5 border-[#f5c518]/30"}`}>
            {praticaSingola ? (
              <FileText className="w-5 h-5 text-white/50 flex-shrink-0" />
            ) : (
              <Package className="w-5 h-5 text-[#f5c518] flex-shrink-0" />
            )}
            <div className="flex-1">
              {praticaSingola ? (
                <p className="text-white/70 text-sm">Pratica singola — GSE, Terna, ENEA, Dogane, ARERA, ecc. (non scala dal credito pack)</p>
              ) : (
                <p className="text-[#f5c518]/80 text-sm">Pratica da pack — Connessione Ordinario o Semplificato (scala dal credito del pack selezionato)</p>
              )}
            </div>
          </div>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white/70 text-sm">Tipologia</Label>
                <Select defaultValue="residenziale" onValueChange={(val) => setFormPratica(f => ({ ...f, tipologia: val as "residenziale" | "business" }))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0e3320] border-white/10">
                    <SelectItem value="residenziale">Residenziale</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white/70 text-sm">Tipo Iter</Label>
                <Select
                  defaultValue={praticaSingola ? "gse" : "connessione_semplificato"}
                  value={formPratica.tipoIter}
                  onValueChange={(val) => setFormPratica(f => ({ ...f, tipoIter: val as TipoIter }))}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0e3320] border-white/10">
                    {Object.entries(ITER_DEFINIZIONI)
                      .filter(([key]) => praticaSingola ? !ITER_DA_PACK.includes(key as TipoIter) : ITER_DA_PACK.includes(key as TipoIter))
                      .map(([key, def]) => (
                        <SelectItem key={key} value={key}>{def.label}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-white/70 text-sm">Potenza (kW)</Label>
              <Input placeholder="Es. 5.5" className="bg-white/5 border-white/10 text-white" onChange={(e) => setFormPratica(f => ({ ...f, potenzaKw: e.target.value }))} />
            </div>
            <div>
              <Label className="text-white/70 text-sm">Indirizzo Impianto</Label>
              <Input placeholder="Via/Piazza, numero" className="bg-white/5 border-white/10 text-white" onChange={(e) => setFormPratica(f => ({ ...f, indirizzoImpianto: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white/70 text-sm">Comune</Label>
                <Input placeholder="Comune" className="bg-white/5 border-white/10 text-white" onChange={(e) => setFormPratica(f => ({ ...f, comuneImpianto: e.target.value }))} />
              </div>
              <div>
                <Label className="text-white/70 text-sm">Provincia</Label>
                <Input placeholder="Provincia" className="bg-white/5 border-white/10 text-white" onChange={(e) => setFormPratica(f => ({ ...f, provinciaImpianto: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label className="text-white/70 text-sm">Nome Titolare</Label>
              <Input placeholder="Nome e Cognome" className="bg-white/5 border-white/10 text-white" onChange={(e) => setFormPratica(f => ({ ...f, nomeTitolare: e.target.value }))} />
            </div>
            <div>
              <Label className="text-white/70 text-sm">Note</Label>
              <Input placeholder="Note aggiuntive" className="bg-white/5 border-white/10 text-white" onChange={(e) => setFormPratica(f => ({ ...f, note: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowNuovaPratica(false)} variant="outline" className="border-white/10 text-white hover:bg-white/5">
              Annulla
            </Button>
            <Button
              onClick={() => creaPratica.mutate({ ...formPratica, ordineId: ordineSelezionato ?? undefined } as any)}
              disabled={creaPratica.isPending}
              className="bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-bold">
              {creaPratica.isPending ? "Creazione..." : "Crea Pratica"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


// ─── SEZIONE DOCUMENTI ────────────────────────────────────────────────────────────
function DocumentiSection() {
  const { data: documenti = { daCompilare: [], ricevuti: [] }, isLoading } = trpc.documenti.miei.useQuery(undefined);

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-white flex items-center gap-2">
        <FileText className="w-5 h-5 text-[#f5c518]" />
        Documenti
      </h3>

      {isLoading ? (
        <div className="text-white/50 text-sm">Caricamento documenti...</div>
      ) : (
        <>
          {/* Documenti da compilare */}
          <div>
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              Documenti da compilare ({documenti.daCompilare.length})
            </h4>
            {documenti.daCompilare.length === 0 ? (
              <div className="bg-[#0e3320] border border-white/10 rounded-lg p-4 text-white/50 text-sm text-center">
                Nessun documento da compilare
              </div>
            ) : (
              <div className="space-y-2">
                {documenti.daCompilare.map((doc: any) => (
                  <div key={doc.id} className="bg-[#0e3320] border border-white/10 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-white">{doc.nome}</div>
                        {doc.descrizione && <div className="text-white/60 text-sm mt-1">{doc.descrizione}</div>}
                        <span className={`inline-block text-xs px-2 py-1 rounded-full mt-2 ${doc.stato === "obbligatorio" ? "bg-red-500/20 text-red-300" : doc.stato === "opzionale" ? "bg-blue-500/20 text-blue-300" : "bg-yellow-500/20 text-yellow-300"}`}>
                          {doc.stato}
                        </span>
                      </div>
                      <button className="bg-[#f5c518] text-[#1a4a2e] font-bold px-3 py-1 rounded-lg text-sm hover:bg-[#f5c518]/90 transition-colors">
                        Carica
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Documenti ricevuti */}
          <div>
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Documenti ricevuti dall'admin ({documenti.ricevuti.length})
            </h4>
            {documenti.ricevuti.length === 0 ? (
              <div className="bg-[#0e3320] border border-white/10 rounded-lg p-4 text-white/50 text-sm text-center">
                Nessun documento ricevuto
              </div>
            ) : (
              <div className="space-y-2">
                {documenti.ricevuti.map((doc: any) => (
                  <div key={doc.id} className="bg-[#0e3320] border border-white/10 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-white">{doc.nome}</div>
                        {doc.descrizione && <div className="text-white/60 text-sm mt-1">{doc.descrizione}</div>}
                        {doc.fileUrl && (
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-block text-xs px-2 py-1 rounded-full mt-2 bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-colors">
                            Visualizza
                          </a>
                        )}
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
