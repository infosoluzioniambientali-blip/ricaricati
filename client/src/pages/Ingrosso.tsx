import { useState } from "react";
import { Link } from "wouter";
import { Zap, CheckCircle2, ChevronRight, Phone, Mail, MessageCircle, TrendingDown, Clock, Shield, Star, ArrowRight, HardHat, Wrench, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";

// Dati pack statici per la landing
const PACKS = [
  { id: 1, nome: "Pack Base", prezzo: 2000, res: 16, bus: 5, prezzoRes: 125, prezzoBus: 400, highlight: false },
  { id: 2, nome: "Pack Pro", prezzo: 3150, res: 30, bus: 9, prezzoRes: 105, prezzoBus: 350, highlight: true },
  { id: 3, nome: "Pack Max", prezzo: 5100, res: 60, bus: 20, prezzoRes: 85, prezzoBus: 250, highlight: false },
];

export default function Ingrosso() {
  const [nome, setNome] = useState("");
  const [telefono, setTelefono] = useState("");
  const [categoria, setCategoria] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const addProspect = trpc.prospectInstallatori.leadIngrosso.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (e: { message?: string }) => {
      setError(e.message || "Errore nell'invio. Riprova.");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!nome.trim() || !telefono.trim()) {
      setError("Inserisci nome e telefono per continuare.");
      return;
    }
    setError("");
    addProspect.mutate({
      ragioneSociale: nome.trim(),
      telefono: telefono.trim(),
      note: `Lead da landing /ingrosso — categoria: ${categoria || "non specificata"}`,
      settore: categoria || "installatore",
    });
  };

  return (
    <div className="min-h-screen bg-[#1a4a2e] text-white">
      {/* NAVBAR minimal — ottimizzata per conversione */}
      <nav className="sticky top-0 z-50 bg-[#1a4a2e]/95 backdrop-blur border-b border-white/10">
        <div className="container flex items-center justify-between h-16">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Zap className="w-6 h-6 text-[#4ade80]" />
              <span className="font-black text-lg text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>
                RICARICATI <span className="text-[#f5c518]">DI CONNESSIONI</span>
              </span>
            </div>
          </Link>
          <a href="https://wa.me/393286143468?text=Ciao%2C%20voglio%20info%20sulle%20pratiche%20all'ingrosso" target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="bg-[#25d366] text-white hover:bg-[#25d366]/90 font-bold gap-2">
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </Button>
          </a>
        </div>
      </nav>

      {/* HERO — above the fold ottimizzato per ads */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a4a2e] via-[#0e3320] to-[#1a4a2e]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#f5c518]/5 rounded-full blur-3xl" />
        <div className="container relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* LEFT: headline + benefit */}
            <div>
              <div className="inline-flex items-center gap-2 bg-[#f5c518]/10 border border-[#f5c518]/30 rounded-full px-4 py-2 mb-6">
                <TrendingDown className="w-4 h-4 text-[#f5c518]" />
                <span className="text-[#f5c518] text-sm font-semibold uppercase tracking-wider">Pratiche Fotovoltaico All'Ingrosso</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6" style={{ fontFamily: "Montserrat, sans-serif" }}>
                PRATICHE<br />
                <span className="text-[#f5c518]">FOTOVOLTAICO</span><br />
                DA <span className="text-[#4ade80]">€85</span>
              </h1>
              <p className="text-xl text-white/80 mb-6">
                Il mercato le fa pagare <span className="line-through text-red-400">€200–1.500</span>.<br />
                Noi siamo il grossista: prezzi all'ingrosso, <strong className="text-white">zero scadenza</strong>.
              </p>
              <div className="space-y-3 mb-8">
                {[
                  "Residenziale da €85 a pratica (mercato: €200–250)",
                  "Business da €250 a pratica (mercato: €800–1.500+)",
                  "Pratiche senza scadenza — usi lo stock quando vuoi",
                  "Schema unifilare incluso nel prezzo",
                  "Per installatori, geometri, tecnici e professionisti",
                ].map((v) => (
                  <div key={v} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#4ade80] shrink-0 mt-0.5" />
                    <span className="text-white/80 text-sm">{v}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <a href="#form-lead">
                  <Button size="lg" className="bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-black text-base px-8">
                    Richiedi il Listino Gratuito <ChevronRight className="ml-2 w-5 h-5" />
                  </Button>
                </a>
                <a href="https://wa.me/393286143468?text=Ciao%2C%20voglio%20info%20sulle%20pratiche%20fotovoltaico%20all'ingrosso" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline" className="border-[#25d366] text-[#25d366] hover:bg-[#25d366] hover:text-white font-bold text-base px-8 gap-2">
                    <MessageCircle className="w-5 h-5" />
                    WhatsApp Ora
                  </Button>
                </a>
              </div>
            </div>

            {/* RIGHT: form lead */}
            <div id="form-lead" className="bg-[#0e3320] rounded-2xl border border-[#f5c518]/30 p-8">
              {submitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-[#4ade80]/20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-[#4ade80]" />
                  </div>
                  <h3 className="text-white font-black text-2xl mb-3" style={{ fontFamily: "Montserrat, sans-serif" }}>Richiesta inviata!</h3>
                  <p className="text-white/70 mb-6">Ti contatteremo entro poche ore su WhatsApp con il listino completo e tutti i dettagli.</p>
                  <a href="https://wa.me/393286143468?text=Ciao%2C%20ho%20appena%20inviato%20la%20richiesta%20dal%20sito%20per%20le%20pratiche%20all'ingrosso" target="_blank" rel="noopener noreferrer">
                    <Button className="bg-[#25d366] text-white hover:bg-[#25d366]/90 font-bold gap-2 w-full">
                      <MessageCircle className="w-5 h-5" />
                      Scrivici subito su WhatsApp
                    </Button>
                  </a>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-black text-white mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    Ricevi il listino gratuito
                  </h2>
                  <p className="text-white/60 text-sm mb-6">Lascia i tuoi dati — ti contatteremo su WhatsApp entro poche ore con prezzi e dettagli.</p>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label className="text-white/80 text-sm mb-1 block">Nome e Cognome *</Label>
                      <Input
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Es. Mario Rossi"
                        className="bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-[#f5c518]"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-white/80 text-sm mb-1 block">Numero WhatsApp *</Label>
                      <Input
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        placeholder="Es. 328 6143468"
                        type="tel"
                        className="bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-[#f5c518]"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-white/80 text-sm mb-1 block">Sei un...</Label>
                      <select
                        value={categoria}
                        onChange={(e) => setCategoria(e.target.value)}
                        className="w-full bg-white/5 border border-white/20 text-white rounded-md px-3 py-2 text-sm focus:border-[#f5c518] focus:outline-none"
                      >
                        <option value="" className="bg-[#1a4a2e]">Seleziona categoria</option>
                        <option value="installatore" className="bg-[#1a4a2e]">Installatore fotovoltaico</option>
                        <option value="geometra" className="bg-[#1a4a2e]">Geometra / Tecnico</option>
                        <option value="energy-manager" className="bg-[#1a4a2e]">Energy Manager / Consulente</option>
                        <option value="impresa" className="bg-[#1a4a2e]">Impresa elettrica</option>
                        <option value="agente" className="bg-[#1a4a2e]">Agente commerciale</option>
                        <option value="altro" className="bg-[#1a4a2e]">Altro</option>
                      </select>
                    </div>
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    <Button
                      type="submit"
                      disabled={addProspect.isPending}
                      className="w-full bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-black text-base py-6"
                    >
                      {addProspect.isPending ? "Invio in corso..." : "Ricevi il Listino Gratuito →"}
                    </Button>
                    <p className="text-white/30 text-xs text-center">Nessuno spam. Ti contatteremo solo per i prezzi richiesti.</p>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF — numeri */}
      <section className="py-10 bg-[#f5c518]">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { val: "€85", label: "Prezzo minimo residenziale" },
              { val: "€250", label: "Prezzo minimo business" },
              { val: "0", label: "Scadenza pratiche" },
              { val: "-80%", label: "Risparmio vs mercato" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-3xl md:text-4xl font-black text-[#1a4a2e]" style={{ fontFamily: "Montserrat, sans-serif" }}>{s.val}</div>
                <div className="text-[#1a4a2e]/70 text-sm font-semibold mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CHI PUÒ ACQUISTARE */}
      <section className="py-20 bg-[#0e3320]">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3" style={{ fontFamily: "Montserrat, sans-serif" }}>
              CHI PUÒ <span className="text-[#f5c518]">ACQUISTARE</span>
            </h2>
            <p className="text-white/60 max-w-lg mx-auto">Chiunque lavori nel settore fotovoltaico o abbia clienti con impianti solari.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { icon: HardHat, titolo: "Installatori FV", desc: "Offri il servizio di connessione senza gestirlo internamente. Pratiche pronte, prezzi imbattibili." },
              { icon: Wrench, titolo: "Tecnici & Geometri", desc: "Acquista all'ingrosso e rivendi ai tuoi clienti al prezzo che preferisci. Il margine è tuo." },
              { icon: Building2, titolo: "Energy Manager & Agenti", desc: "Aggiungi le pratiche fotovoltaiche al tuo portafoglio servizi con costi minimi." },
            ].map((cat) => (
              <div key={cat.titolo} className="bg-[#1a4a2e] rounded-xl border border-white/10 p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-[#f5c518]/10 border border-[#f5c518]/20 flex items-center justify-center mx-auto mb-4">
                  <cat.icon className="w-6 h-6 text-[#f5c518]" />
                </div>
                <h3 className="text-white font-black text-lg mb-2">{cat.titolo}</h3>
                <p className="text-white/60 text-sm">{cat.desc}</p>
              </div>
            ))}
          </div>

          {/* PREZZI PACK */}
          <h3 className="text-2xl font-black text-[#f5c518] mb-6 text-center" style={{ fontFamily: "Montserrat, sans-serif" }}>I NOSTRI PACK ALL'INGROSSO</h3>
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {PACKS.map((pack) => (
              <div key={pack.id} className={`rounded-2xl border p-6 ${pack.highlight ? "border-[#f5c518] bg-[#1a4a2e]" : "border-white/10 bg-[#1a4a2e]"}`}>
                {pack.highlight && (
                  <div className="bg-[#f5c518] text-[#1a4a2e] text-xs font-black px-3 py-1 rounded-full inline-block mb-3">PIÙ SCELTO</div>
                )}
                <h4 className="text-white font-black text-xl mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>{pack.nome}</h4>
                <div className="text-3xl font-black text-[#f5c518] mb-4">€{pack.prezzo.toLocaleString()}</div>
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Pratiche residenziali</span>
                    <span className="text-white font-bold">{pack.res} pz</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Pratiche business</span>
                    <span className="text-white font-bold">{pack.bus} pz</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-white/10 pt-2">
                    <span className="text-white/60">Prezzo/pratica res.</span>
                    <span className="text-[#4ade80] font-black">€{pack.prezzoRes}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Prezzo/pratica bus.</span>
                    <span className="text-[#4ade80] font-black">€{pack.prezzoBus}</span>
                  </div>
                </div>
                <a href="#form-lead">
                  <Button className={`w-full font-black ${pack.highlight ? "bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90" : "bg-white/10 text-white hover:bg-[#f5c518] hover:text-[#1a4a2e]"}`}>
                    Richiedi Info
                  </Button>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VANTAGGI */}
      <section className="py-20 bg-[#1a4a2e]">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-white mb-3" style={{ fontFamily: "Montserrat, sans-serif" }}>PERCHÉ SCEGLIERE <span className="text-[#f5c518]">NOI</span></h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: TrendingDown, titolo: "Prezzi imbattibili", desc: "Fino all'80% in meno rispetto al mercato. Residenziale da €85, business da €250." },
              { icon: Clock, titolo: "Zero scadenza", desc: "Le pratiche non scadono mai. Compri oggi, usi quando ne hai bisogno." },
              { icon: Shield, titolo: "Schema unifilare incluso", desc: "Il mercato lo fa pagare a parte. Da noi è incluso nel prezzo di ogni pratica." },
              { icon: Star, titolo: "Portale dedicato", desc: "Accedi al tuo portale personale per monitorare le pratiche in tempo reale." },
              { icon: CheckCircle2, titolo: "Supporto tecnico", desc: "Il nostro team ti supporta per ogni pratica, dalla richiesta alla connessione." },
              { icon: ArrowRight, titolo: "Acquisto semplice", desc: "Scegli il pack, paghi e ricevi le pratiche immediatamente nel tuo portale." },
            ].map((v) => (
              <div key={v.titolo} className="bg-[#0e3320] rounded-xl p-6 border border-white/10">
                <v.icon className="w-7 h-7 text-[#f5c518] mb-3" />
                <h3 className="text-white font-bold text-lg mb-2">{v.titolo}</h3>
                <p className="text-white/60 text-sm">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINALE */}
      <section className="py-20 bg-[#f5c518]">
        <div className="container text-center">
          <h2 className="text-4xl md:text-5xl font-black text-[#1a4a2e] mb-4" style={{ fontFamily: "Montserrat, sans-serif" }}>
            Inizia oggi. È gratuito informarsi.
          </h2>
          <p className="text-[#1a4a2e]/70 mb-8 text-lg max-w-xl mx-auto">Lascia il tuo numero — ti mandiamo il listino completo su WhatsApp entro poche ore.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="#form-lead">
              <Button size="lg" className="bg-[#1a4a2e] text-white hover:bg-[#0e3320] font-black text-lg px-10 py-6">
                Ricevi il Listino Gratuito <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </a>
            <a href="https://wa.me/393286143468?text=Ciao%2C%20voglio%20info%20sulle%20pratiche%20fotovoltaico%20all'ingrosso" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-[#1a4a2e] text-[#1a4a2e] hover:bg-[#1a4a2e] hover:text-white font-bold text-lg px-10 py-6 gap-2">
                <MessageCircle className="w-5 h-5" />
                WhatsApp: 328 6143468
              </Button>
            </a>
          </div>
          <div className="flex flex-wrap justify-center gap-6 mt-8 text-[#1a4a2e]/60 text-sm">
            <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> 099 4000569</span>
            <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> info@soluzioniambientali.info</span>
          </div>
        </div>
      </section>

      {/* FOOTER minimal */}
      <footer className="bg-[#0e3320] border-t border-white/10 py-6">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/30">
          <p>© 2026 Soluzioni Ambientali di Gennaro Martusciello — P.IVA: 03107700738</p>
          <div className="flex gap-4">
            <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/termini-condizioni" className="hover:text-white transition-colors">Termini</Link>
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
