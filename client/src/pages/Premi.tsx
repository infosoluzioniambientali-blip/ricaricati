import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Trophy, AlertCircle, Upload, Users, Tag } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";

export default function Premi() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [subTab, setSubTab] = useState<"bollette" | "nominativi" | "codici">("bollette");

  // Se non autenticato, mostra messaggio
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0e3320] text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-black mb-4">Accedi per visualizzare i Premi</h1>
          <p className="text-white/70 mb-6">Devi essere autenticato per accedere alla sezione premi e bonus.</p>
          <Button
            onClick={() => setLocation("/portale")}
            className="bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-bold"
          >
            Accedi Ora
          </Button>
        </div>
      </div>
    );
  }

  // Carica dati installatore
  const { data: installatore } = trpc.installatori.mio.useQuery();

  // Bollette
  const { data: bollette = [] } = trpc.premi.mieBollette.useQuery(undefined, { enabled: !!installatore });
  const [formBolletta, setFormBolletta] = useState({ nomeCliente: "", telefonoCliente: "", emailCliente: "", note: "" });
  const [allegato, setAllegato] = useState<{ base64: string; mimeType: string; nomeFile: string } | null>(null);
  const [uploadingAllegato, setUploadingAllegato] = useState(false);
  const inviaBolletta = trpc.premi.inviaBolletta.useMutation({
    onSuccess: () => {
      utils.premi.mieBollette.invalidate();
      toast.success("Bolletta inviata! Verrà revisionata dall'ufficio.");
      setFormBolletta({ nomeCliente: "", telefonoCliente: "", emailCliente: "", note: "" });
      setAllegato(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleAllegatoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 16 * 1024 * 1024) {
      toast.error("File troppo grande (max 16MB)");
      return;
    }
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
    inviaBolletta.mutate({
      nomeCliente: formBolletta.nomeCliente,
      telefonoCliente: formBolletta.telefonoCliente || undefined,
      emailCliente: formBolletta.emailCliente || undefined,
      note: formBolletta.note || undefined,
      fileUrl,
      fileKey,
      nomeFile,
    });
  };

  // Nominativi
  const { data: nominativi = [] } = trpc.premi.mieiNominativi.useQuery(undefined, { enabled: !!installatore });
  const [formNominativo, setFormNominativo] = useState({ nomeInstallatore: "", azienda: "", telefono: "", email: "", citta: "", note: "" });
  const segnalaNominativo = trpc.premi.segnalaNominativo.useMutation({
    onSuccess: () => {
      utils.premi.mieiNominativi.invalidate();
      toast.success("Nominativo segnalato! Verrà contattato dall'ufficio.");
      setFormNominativo({ nomeInstallatore: "", azienda: "", telefono: "", email: "", citta: "", note: "" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Codici referral
  const [codiceInput, setCodiceInput] = useState("");
  const riscattaCodice = trpc.premi.riscattaCodice.useMutation({
    onSuccess: (data: any) => {
      utils.installatori.mio.invalidate();
      toast.success(`Codice riscattato! Hai ricevuto €${data.credito} di credito.`);
      setCodiceInput("");
    },
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
    <div className="min-h-screen bg-[#0e3320] text-white">
      {/* Header con pulsante indietro */}
      <div className="bg-gradient-to-b from-[#1a4a2e] to-[#0e3320] border-b border-[#f5c518]/20 py-6">
        <div className="max-w-6xl mx-auto px-4">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 text-[#f5c518] hover:text-[#f5c518]/80 mb-4 font-semibold text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Indietro
          </button>
          <h1 className="text-4xl font-black text-white">Premi</h1>
        </div>
      </div>

      {/* Contenuto */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="space-y-6">
          {/* CONTATORE PROMO - Progress bar verso pack omaggio */}
          {(() => {
            const creditoTotale = parseFloat(installatore?.creditoTotale || "0");
            const soglia = parseFloat(installatore?.sogliaPackOmaggio || "2000");
            const percentuale = Math.min(100, (creditoTotale / soglia) * 100);
            const raggiunto = creditoTotale >= soglia;
            return (
              <div
                className={`rounded-xl p-5 border ${
                  raggiunto
                    ? "bg-green-500/10 border-green-500/40"
                    : "bg-[#0e3320] border-[#f5c518]/20"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Trophy className={`w-5 h-5 ${raggiunto ? "text-green-400" : "text-[#f5c518]"}`} />
                    <span className={`font-bold text-sm ${raggiunto ? "text-green-400" : "text-white"}`}>
                      {raggiunto ? "🎉 Promo Guadagnato!" : "Contatore Promo"}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-full ${
                      raggiunto ? "bg-green-500/20 text-green-400" : "bg-[#f5c518]/20 text-[#f5c518]"
                    }`}
                  >
                    €{creditoTotale.toLocaleString("it-IT", { minimumFractionDigits: 0 })} / €
                    {soglia.toLocaleString("it-IT", { minimumFractionDigits: 0 })}
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
                    : `Mancano €${Math.max(0, soglia - creditoTotale).toLocaleString("it-IT", { minimumFractionDigits: 0 })} per ottenere il tuo pacchetto omaggio. Accumula credito inviando bollette e segnalando installatori.`}
                </p>
              </div>
            );
          })()}

          {/* Sub-tabs */}
          <div className="flex gap-2 flex-wrap">
            {(["bollette", "nominativi", "codici"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setSubTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                  subTab === t ? "bg-[#f5c518] text-[#1a4a2e]" : "bg-white/10 text-white/60 hover:text-white"
                }`}
              >
                {t === "bollette" && <>Bollette</>}
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
                    Invia le bollette dei tuoi clienti. L'ufficio le revisionerà e ti accrediterà un bonus in credito. Il bonus viene calcolato in base al valore della bolletta e al tipo di pratica.
                  </p>
                </div>
              </div>

              {/* Form invio bolletta */}
              <div className="bg-[#0e3320] border border-white/10 rounded-xl p-5 space-y-4">
                <h3 className="text-white font-bold text-sm">Invia Bolletta</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-white/70 text-xs mb-1 block">Nome Cliente *</Label>
                    <Input
                      value={formBolletta.nomeCliente}
                      onChange={(e) => setFormBolletta({ ...formBolletta, nomeCliente: e.target.value })}
                      placeholder="es. Mario Rossi"
                      className="bg-[#1a4a2e] border-white/20 text-white placeholder:text-white/30"
                    />
                  </div>
                  <div>
                    <Label className="text-white/70 text-xs mb-1 block">Telefono</Label>
                    <Input
                      value={formBolletta.telefonoCliente}
                      onChange={(e) => setFormBolletta({ ...formBolletta, telefonoCliente: e.target.value })}
                      placeholder="es. 3201234567"
                      className="bg-[#1a4a2e] border-white/20 text-white placeholder:text-white/30"
                    />
                  </div>
                  <div>
                    <Label className="text-white/70 text-xs mb-1 block">Email</Label>
                    <Input
                      value={formBolletta.emailCliente}
                      onChange={(e) => setFormBolletta({ ...formBolletta, emailCliente: e.target.value })}
                      placeholder="es. mario@example.com"
                      className="bg-[#1a4a2e] border-white/20 text-white placeholder:text-white/30"
                    />
                  </div>
                  <div>
                    <Label className="text-white/70 text-xs mb-1 block">Allegato Bolletta (PDF/JPG)</Label>
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleAllegatoChange}
                      className="bg-[#1a4a2e] border-white/20 text-white/50 text-xs"
                    />
                    {allegato && <p className="text-[#4ade80] text-xs mt-1">✓ {allegato.nomeFile}</p>}
                  </div>
                </div>
                <div>
                  <Label className="text-white/70 text-xs mb-1 block">Note</Label>
                  <textarea
                    value={formBolletta.note}
                    onChange={(e) => setFormBolletta({ ...formBolletta, note: e.target.value })}
                    placeholder="Informazioni aggiuntive..."
                    className="w-full bg-[#1a4a2e] border border-white/20 text-white rounded-lg px-3 py-2 text-sm placeholder:text-white/30 resize-none"
                    rows={3}
                  />
                </div>
                <Button
                  onClick={handleInviaBolletta}
                  disabled={!formBolletta.nomeCliente || inviaBolletta.isPending}
                  className="w-full bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-bold disabled:opacity-50"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {inviaBolletta.isPending ? "Invio in corso..." : "Invia Bolletta"}
                </Button>
              </div>

              {/* Lista bollette inviate */}
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
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${STATO_BADGE[b.stato] || "bg-white/10 text-white/60"}`}>
                          {STATO_LABEL[b.stato] || b.stato}
                        </span>
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
              {/* Box condizioni */}
              <div className="bg-blue-500/10 border border-blue-500/40 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-400 font-bold text-sm mb-1">Come funziona il referral</p>
                  <p className="text-white/70 text-xs leading-relaxed">
                    Segnala installatori interessati ai nostri servizi. Se si convertono in clienti attivi, riceverai un bonus in credito.
                  </p>
                </div>
              </div>

              {/* Form segnalazione */}
              <div className="bg-[#0e3320] border border-white/10 rounded-xl p-5 space-y-4">
                <h3 className="text-white font-bold text-sm">Segnala Nominativo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-white/70 text-xs mb-1 block">Nome Installatore *</Label>
                    <Input
                      value={formNominativo.nomeInstallatore}
                      onChange={(e) => setFormNominativo({ ...formNominativo, nomeInstallatore: e.target.value })}
                      placeholder="es. Marco Bianchi"
                      className="bg-[#1a4a2e] border-white/20 text-white placeholder:text-white/30"
                    />
                  </div>
                  <div>
                    <Label className="text-white/70 text-xs mb-1 block">Azienda</Label>
                    <Input
                      value={formNominativo.azienda}
                      onChange={(e) => setFormNominativo({ ...formNominativo, azienda: e.target.value })}
                      placeholder="es. Impianti Solari S.r.l."
                      className="bg-[#1a4a2e] border-white/20 text-white placeholder:text-white/30"
                    />
                  </div>
                  <div>
                    <Label className="text-white/70 text-xs mb-1 block">Telefono</Label>
                    <Input
                      value={formNominativo.telefono}
                      onChange={(e) => setFormNominativo({ ...formNominativo, telefono: e.target.value })}
                      placeholder="es. 3201234567"
                      className="bg-[#1a4a2e] border-white/20 text-white placeholder:text-white/30"
                    />
                  </div>
                  <div>
                    <Label className="text-white/70 text-xs mb-1 block">Email</Label>
                    <Input
                      value={formNominativo.email}
                      onChange={(e) => setFormNominativo({ ...formNominativo, email: e.target.value })}
                      placeholder="es. marco@example.com"
                      className="bg-[#1a4a2e] border-white/20 text-white placeholder:text-white/30"
                    />
                  </div>
                  <div>
                    <Label className="text-white/70 text-xs mb-1 block">Città</Label>
                    <Input
                      value={formNominativo.citta}
                      onChange={(e) => setFormNominativo({ ...formNominativo, citta: e.target.value })}
                      placeholder="es. Milano"
                      className="bg-[#1a4a2e] border-white/20 text-white placeholder:text-white/30"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-white/70 text-xs mb-1 block">Note</Label>
                  <textarea
                    value={formNominativo.note}
                    onChange={(e) => setFormNominativo({ ...formNominativo, note: e.target.value })}
                    placeholder="Perché pensi che potrebbe essere interessato?"
                    className="w-full bg-[#1a4a2e] border border-white/20 text-white rounded-lg px-3 py-2 text-sm placeholder:text-white/30 resize-none"
                    rows={3}
                  />
                </div>
                <Button
                  onClick={() => segnalaNominativo.mutate(formNominativo)}
                  disabled={!formNominativo.nomeInstallatore || segnalaNominativo.isPending}
                  className="w-full bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-bold disabled:opacity-50"
                >
                  {segnalaNominativo.isPending ? "Invio in corso..." : "Segnala Nominativo"}
                </Button>
              </div>

              {/* Lista nominativi segnalati */}
              {nominativi.length > 0 && (
                <div>
                  <h3 className="text-white/70 text-sm font-semibold mb-2">Nominativi Segnalati ({nominativi.length})</h3>
                  <div className="space-y-2">
                    {nominativi.map((n: any) => (
                      <div key={n.id} className="bg-[#0e3320] border border-white/10 rounded-xl p-4 flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm truncate">{n.nomeInstallatore}</p>
                          <p className="text-white/40 text-xs">{n.azienda || "Azienda non specificata"}</p>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${STATO_BADGE[n.stato] || "bg-white/10 text-white/60"}`}>
                          {STATO_LABEL[n.stato] || n.stato}
                        </span>
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
              {/* Box condizioni */}
              <div className="bg-purple-500/10 border border-purple-500/40 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-purple-400 font-bold text-sm mb-1">Riscatta Codice Promo</p>
                  <p className="text-white/70 text-xs leading-relaxed">
                    Hai ricevuto un codice promo? Inseriscilo qui per riscattare il credito associato.
                  </p>
                </div>
              </div>

              {/* Form riscatto */}
              <div className="bg-[#0e3320] border border-white/10 rounded-xl p-5 space-y-4">
                <h3 className="text-white font-bold text-sm">Riscatta Codice</h3>
                <div className="flex gap-2">
                  <Input
                    value={codiceInput}
                    onChange={(e) => setCodiceInput(e.target.value.toUpperCase())}
                    placeholder="es. PROMO2024"
                    className="bg-[#1a4a2e] border-white/20 text-white placeholder:text-white/30 flex-1"
                  />
                  <Button
                    onClick={() => riscattaCodice.mutate({ codice: codiceInput })}
                    disabled={!codiceInput || riscattaCodice.isPending}
                    className="bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-bold disabled:opacity-50"
                  >
                    Riscatta
                  </Button>
                </div>
              </div>

              {/* Credito disponibile */}
              {installatore && (
                <div className="bg-gradient-to-r from-[#f5c518]/10 to-[#4ade80]/10 border border-[#f5c518]/20 rounded-xl p-6 text-center">
                  <p className="text-white/70 mb-2 text-sm">Credito Totale Disponibile</p>
                  <h2 className="text-4xl font-black text-[#f5c518] mb-2">
                    €{parseFloat(installatore.creditoResiduo).toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                  </h2>
                  <p className="text-white/50 text-xs">Credito accumulato da codici promo e premi. Verrà scalato dalle prossime pratiche.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
