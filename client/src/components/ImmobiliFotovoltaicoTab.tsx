import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Building2, TreePine, MapPin, X, Sun } from "lucide-react";

const REGIONI = [
  "Abruzzo","Basilicata","Calabria","Campania","Emilia-Romagna","Friuli-Venezia Giulia",
  "Lazio","Liguria","Lombardia","Marche","Molise","Piemonte","Puglia","Sardegna","Sicilia",
  "Toscana","Trentino-Alto Adige","Umbria","Valle d'Aosta","Veneto"
];

const EMPTY_FORM = {
  tipo: "capannone" as "capannone" | "terreno",
  titolo: "",
  regione: "", provincia: "", comune: "", indirizzo: "",
  superficieMq: "" as any,
  superficieEttari: "",
  attivitaEnergivora: false,
  tipoAttivita: "",
  vicinanzaAutostrada: false,
  vicinanzaAreaIndustriale: false,
  distanzaAutostradaKm: "",
  distanzaAreaIndustrialeKm: "",
  potenzaStimataKwp: "",
  disponibilita: "disponibile" as "vendita" | "affitto" | "disponibile" | "trattativa",
  prezzoEuro: "",
  nomeContatto: "",
  telefonoContatto: "",
  emailContatto: "",
  note: "",
  pubblicato: true,
};

const DISPONIBILITA_OPTIONS = [
  { value: "disponibile", label: "Disponibile" },
  { value: "vendita", label: "In vendita" },
  { value: "affitto", label: "In affitto" },
  { value: "trattativa", label: "In trattativa" },
];

export function ImmobiliFotovoltaicoTab({ inputCls, selectCls }: { inputCls: string; selectCls: string }) {
  const utils = trpc.useUtils();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [filtroTipo, setFiltroTipo] = useState<"" | "capannone" | "terreno">("");
  const [filtroRegione, setFiltroRegione] = useState("");

  const { data: lista = [], isLoading } = trpc.immobiliFotovoltaico.listaAdmin.useQuery({
    tipo: filtroTipo || undefined,
    regione: filtroRegione || undefined,
  });

  const crea = trpc.immobiliFotovoltaico.crea.useMutation({
    onSuccess: () => { utils.immobiliFotovoltaico.listaAdmin.invalidate(); utils.immobiliFotovoltaico.lista.invalidate(); toast.success("Opportunità aggiunta!"); setShowForm(false); setForm({ ...EMPTY_FORM }); },
    onError: (e) => toast.error(e.message),
  });
  const aggiorna = trpc.immobiliFotovoltaico.aggiorna.useMutation({
    onSuccess: () => { utils.immobiliFotovoltaico.listaAdmin.invalidate(); utils.immobiliFotovoltaico.lista.invalidate(); toast.success("Aggiornato!"); setEditId(null); },
    onError: (e) => toast.error(e.message),
  });
  const elimina = trpc.immobiliFotovoltaico.elimina.useMutation({
    onSuccess: () => { utils.immobiliFotovoltaico.listaAdmin.invalidate(); utils.immobiliFotovoltaico.lista.invalidate(); toast.success("Eliminato"); },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = () => {
    const data = {
      ...form,
      superficieMq: form.superficieMq ? Number(form.superficieMq) : undefined,
    };
    if (editId !== null) {
      aggiorna.mutate({ id: editId, ...data });
    } else {
      crea.mutate(data);
    }
  };

  const startEdit = (item: any) => {
    setEditId(item.id);
    setForm({
      tipo: item.tipo,
      titolo: item.titolo,
      regione: item.regione ?? "",
      provincia: item.provincia ?? "",
      comune: item.comune ?? "",
      indirizzo: item.indirizzo ?? "",
      superficieMq: item.superficieMq ?? "",
      superficieEttari: item.superficieEttari ?? "",
      attivitaEnergivora: item.attivitaEnergivora ?? false,
      tipoAttivita: item.tipoAttivita ?? "",
      vicinanzaAutostrada: item.vicinanzaAutostrada ?? false,
      vicinanzaAreaIndustriale: item.vicinanzaAreaIndustriale ?? false,
      distanzaAutostradaKm: item.distanzaAutostradaKm ?? "",
      distanzaAreaIndustrialeKm: item.distanzaAreaIndustrialeKm ?? "",
      potenzaStimataKwp: item.potenzaStimataKwp ?? "",
      disponibilita: item.disponibilita ?? "disponibile",
      prezzoEuro: item.prezzoEuro ?? "",
      nomeContatto: item.nomeContatto ?? "",
      telefonoContatto: item.telefonoContatto ?? "",
      emailContatto: item.emailContatto ?? "",
      note: item.note ?? "",
      pubblicato: item.pubblicato ?? true,
    });
    setShowForm(false);
  };

  const checkboxCls = "accent-[#4ade80] w-4 h-4";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-[#f5c518]">Opportunità Fotovoltaico ({lista.length})</h2>
        <Button size="sm" onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ ...EMPTY_FORM }); }}
          className="bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-bold">
          <Plus className="w-4 h-4 mr-1" /> Aggiungi
        </Button>
      </div>

      {/* Form */}
      {(showForm || editId !== null) && (
        <div className="bg-[#0e3320] rounded-2xl p-5 border border-[#f5c518]/30 mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[#f5c518] font-bold">{editId !== null ? "Modifica opportunità" : "Nuova opportunità"}</h3>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {/* Tipo */}
            <div className="col-span-2 flex gap-3">
              {(["capannone", "terreno"] as const).map(t => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="tipo" value={t} checked={form.tipo === t} onChange={() => setForm(f => ({ ...f, tipo: t }))} className={checkboxCls} />
                  <span className="text-white text-sm font-semibold capitalize">{t}</span>
                </label>
              ))}
            </div>
            <input className={`${inputCls} col-span-2`} placeholder="Titolo *" value={form.titolo} onChange={e => setForm(f => ({ ...f, titolo: e.target.value }))} />
            <select className={selectCls} value={form.regione} onChange={e => setForm(f => ({ ...f, regione: e.target.value }))}>
              <option value="">Regione</option>
              {REGIONI.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <input className={inputCls} placeholder="Provincia" value={form.provincia} onChange={e => setForm(f => ({ ...f, provincia: e.target.value }))} />
            <input className={inputCls} placeholder="Comune" value={form.comune} onChange={e => setForm(f => ({ ...f, comune: e.target.value }))} />
            <input className={inputCls} placeholder="Indirizzo" value={form.indirizzo} onChange={e => setForm(f => ({ ...f, indirizzo: e.target.value }))} />

            {form.tipo === "capannone" ? (
              <input className={inputCls} placeholder="Superficie (m²)" type="number" value={form.superficieMq} onChange={e => setForm(f => ({ ...f, superficieMq: e.target.value }))} />
            ) : (
              <input className={inputCls} placeholder="Superficie (ettari)" value={form.superficieEttari} onChange={e => setForm(f => ({ ...f, superficieEttari: e.target.value }))} />
            )}
            <input className={inputCls} placeholder="Potenza stimata (kWp)" value={form.potenzaStimataKwp} onChange={e => setForm(f => ({ ...f, potenzaStimataKwp: e.target.value }))} />

            {/* Caratteristiche specifiche */}
            {form.tipo === "capannone" && (
              <>
                <label className="flex items-center gap-2 cursor-pointer col-span-2">
                  <input type="checkbox" checked={form.attivitaEnergivora} onChange={e => setForm(f => ({ ...f, attivitaEnergivora: e.target.checked }))} className={checkboxCls} />
                  <span className="text-white/70 text-sm">Attività energivora presente</span>
                </label>
                {form.attivitaEnergivora && (
                  <input className={`${inputCls} col-span-2`} placeholder="Tipo attività (es. Fonderia, Ceramica)" value={form.tipoAttivita} onChange={e => setForm(f => ({ ...f, tipoAttivita: e.target.value }))} />
                )}
              </>
            )}
            {form.tipo === "terreno" && (
              <>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.vicinanzaAutostrada} onChange={e => setForm(f => ({ ...f, vicinanzaAutostrada: e.target.checked }))} className={checkboxCls} />
                  <span className="text-white/70 text-sm">Vicino autostrada</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.vicinanzaAreaIndustriale} onChange={e => setForm(f => ({ ...f, vicinanzaAreaIndustriale: e.target.checked }))} className={checkboxCls} />
                  <span className="text-white/70 text-sm">Vicino area industriale</span>
                </label>
                {form.vicinanzaAutostrada && (
                  <input className={inputCls} placeholder="Distanza autostrada (km)" value={form.distanzaAutostradaKm} onChange={e => setForm(f => ({ ...f, distanzaAutostradaKm: e.target.value }))} />
                )}
                {form.vicinanzaAreaIndustriale && (
                  <input className={inputCls} placeholder="Distanza area industriale (km)" value={form.distanzaAreaIndustrialeKm} onChange={e => setForm(f => ({ ...f, distanzaAreaIndustrialeKm: e.target.value }))} />
                )}
              </>
            )}

            <select className={selectCls} value={form.disponibilita} onChange={e => setForm(f => ({ ...f, disponibilita: e.target.value as any }))}>
              {DISPONIBILITA_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <input className={inputCls} placeholder="Prezzo (€)" value={form.prezzoEuro} onChange={e => setForm(f => ({ ...f, prezzoEuro: e.target.value }))} />
            <input className={inputCls} placeholder="Nome contatto" value={form.nomeContatto} onChange={e => setForm(f => ({ ...f, nomeContatto: e.target.value }))} />
            <input className={inputCls} placeholder="Telefono contatto" value={form.telefonoContatto} onChange={e => setForm(f => ({ ...f, telefonoContatto: e.target.value }))} />
            <input className={`${inputCls} col-span-2`} placeholder="Email contatto" value={form.emailContatto} onChange={e => setForm(f => ({ ...f, emailContatto: e.target.value }))} />
            <textarea className={`${inputCls} col-span-2 resize-none`} rows={2} placeholder="Note" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
            <label className="flex items-center gap-2 cursor-pointer col-span-2">
              <input type="checkbox" checked={form.pubblicato} onChange={e => setForm(f => ({ ...f, pubblicato: e.target.checked }))} className={checkboxCls} />
              <span className="text-white/70 text-sm">Pubblicato (visibile sul sito)</span>
            </label>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={!form.titolo || crea.isPending || aggiorna.isPending}
              className="bg-[#4ade80] text-[#1a4a2e] hover:bg-[#4ade80]/90 font-bold">
              {crea.isPending || aggiorna.isPending ? "Salvataggio..." : editId !== null ? "Aggiorna" : "Crea"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowForm(false); setEditId(null); }} className="text-white/50">Annulla</Button>
          </div>
        </div>
      )}

      {/* Filtri */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex gap-2">
          {(["", "capannone", "terreno"] as const).map(t => (
            <button key={t} onClick={() => setFiltroTipo(t)}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${filtroTipo === t ? "bg-[#f5c518] text-[#1a4a2e]" : "border border-white/20 text-white/60 hover:text-white"}`}>
              {t === "" ? "Tutti" : t === "capannone" ? "Capannoni" : "Terreni"}
            </button>
          ))}
        </div>
        <select className={selectCls} value={filtroRegione} onChange={e => setFiltroRegione(e.target.value)}>
          <option value="">Tutte le regioni</option>
          {REGIONI.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="bg-[#0e3320] rounded-xl h-16 animate-pulse border border-white/10" />)}</div>
      ) : lista.length === 0 ? (
        <div className="text-center py-12 bg-[#0e3320] rounded-2xl border border-white/10">
          <Sun className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/50">Nessuna opportunità inserita</p>
        </div>
      ) : (
        <div className="space-y-2">
          {lista.map((item: any) => (
            <div key={item.id} className="bg-[#0e3320] rounded-xl border border-white/10 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.tipo === "capannone" ? "bg-blue-500/20" : "bg-[#4ade80]/10"}`}>
                  {item.tipo === "capannone" ? <Building2 className="w-4 h-4 text-blue-400" /> : <TreePine className="w-4 h-4 text-[#4ade80]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-bold text-sm">{item.titolo}</span>
                    {!item.pubblicato && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Bozza</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {(item.comune || item.regione) && <span className="flex items-center gap-1 text-white/50 text-xs"><MapPin className="w-3 h-3" />{[item.comune, item.provincia, item.regione].filter(Boolean).join(", ")}</span>}
                    {item.tipo === "capannone" && item.superficieMq && <span className="text-white/50 text-xs">{Number(item.superficieMq).toLocaleString("it-IT")} m²</span>}
                    {item.tipo === "terreno" && item.superficieEttari && <span className="text-white/50 text-xs">{item.superficieEttari} ha</span>}
                    {item.potenzaStimataKwp && <span className="text-[#f5c518] text-xs font-semibold">{item.potenzaStimataKwp} kWp</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => startEdit(item)} className="text-blue-400 hover:text-blue-300"><Pencil className="w-4 h-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => { if (confirm("Eliminare questa opportunità?")) elimina.mutate({ id: item.id }); }} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
