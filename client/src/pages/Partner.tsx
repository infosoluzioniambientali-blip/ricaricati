import { useState } from "react";
import { Link } from "wouter";
import { Zap, LogIn, ChevronRight, Handshake, HardHat, Wrench, Building2, TrendingUp, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Partner() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-[#1a4a2e] text-white">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-[#1a4a2e]/95 backdrop-blur border-b border-white/10">
        <div className="container flex items-center justify-between h-16">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Zap className="w-6 h-6 text-[#4ade80]" />
              <span className="font-black text-xl text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>
                RICARICATI <span className="text-[#f5c518]">DI CONNESSIONI</span>
              </span>
            </div>
          </Link>
          <div className="flex md:hidden items-center gap-2">
            {!isAuthenticated ? (
              <Button size="sm" onClick={() => setShowLoginModal(true)} className="bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-bold text-xs gap-1.5 px-3">
                <LogIn className="w-3.5 h-3.5" />
                Accedi
              </Button>
            ) : (
              <Link href="/portale">
                <Button size="sm" className="bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-bold text-xs px-3">
                  Portale
                </Button>
              </Link>
            )}
          </div>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-white/70 hover:text-[#f5c518] transition-colors text-sm font-medium">Home</Link>
            <Link href="/listino" className="text-white/70 hover:text-white text-sm font-semibold transition-colors">Listino Singole</Link>
            <Link href="/partner" className="text-[#f5c518] text-sm font-semibold">Partner</Link>
            {!isAuthenticated ? (
              <Button onClick={() => setShowLoginModal(true)} variant="outline" className="border-white/30 text-white hover:bg-white/10 font-bold text-sm gap-2">
                <LogIn className="w-4 h-4" />
                Login Installatore
              </Button>
            ) : (
              <Link href="/portale">
                <Button variant="outline" className="border-[#f5c518] text-[#f5c518] hover:bg-[#f5c518] hover:text-[#1a4a2e] font-bold text-sm">
                  Portale Installatori
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a4a2e] via-[#0e3320] to-[#1a4a2e]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#f5c518]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#4ade80]/5 rounded-full blur-3xl" />
        <div className="container relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-[#f5c518]/10 border border-[#f5c518]/30 rounded-full px-4 py-2 mb-6">
              <Handshake className="w-4 h-4 text-[#f5c518]" />
              <span className="text-[#f5c518] text-sm font-semibold uppercase tracking-wider">Pratiche All'Ingrosso — Rivendita</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6" style={{ fontFamily: "Montserrat, sans-serif" }}>
              ACQUISTA<br />
              <span className="text-[#f5c518]">E RIVENDI</span>
            </h1>
            <p className="text-xl text-white/80 mb-4 max-w-2xl">
              Sei un tecnico, un geometra o un professionista del settore energetico?
            </p>
            <p className="text-white/60 mb-10 max-w-2xl">
              Acquista le pratiche fotovoltaiche da noi <strong className="text-white">all'ingrosso</strong> e rivendile ai tuoi clienti al prezzo che preferisci. Noi siamo il grossista — tu guadagni la differenza su ogni connessione.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="mailto:info@soluzioniambientali.info?subject=Richiesta%20Partnership%20Rivendita">
                <Button size="lg" className="bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-black text-base px-8">
                  Diventa Partner <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </a>
              <a href="https://wa.me/393286143468?text=Ciao%2C%20sono%20interessato%20alla%20partnership%20per%20rivendita%20pratiche%20fotovoltaiche" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="border-[#4ade80] text-[#4ade80] hover:bg-[#4ade80] hover:text-[#1a4a2e] font-bold text-base px-8">
                  Scrivici su WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CHI PUÒ DIVENTARE PARTNER */}
      <section className="py-20 bg-[#0e3320]">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4" style={{ fontFamily: "Montserrat, sans-serif" }}>
              CHI PUÒ <span className="text-[#f5c518]">RIVENDERE</span>
            </h2>
            <p className="text-white/60 max-w-xl mx-auto">Chiunque lavori nel settore energetico o abbia clienti con impianti fotovoltaici può acquistare da noi all'ingrosso e rivendere con margine.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              {
                icon: HardHat,
                titolo: "Tecnici & Periti",
                desc: "Geometri, periti industriali, tecnici energetici che gestiscono pratiche per conto dei clienti. Acquista da noi all'ingrosso e fattura al tuo cliente il prezzo che preferisci.",
                esempi: ["Geometri", "Periti industriali", "Tecnici energetici", "Consulenti fotovoltaico"],
              },
              {
                icon: Wrench,
                titolo: "Installatori & Imprese",
                desc: "Installatori fotovoltaici che vogliono offrire anche il servizio di connessione alla rete senza gestirlo internamente. Pratiche pronte, senza pensieri.",
                esempi: ["Installatori FV", "Imprese elettriche", "Manutentori impianti", "Serramentisti con FV"],
              },
              {
                icon: Building2,
                titolo: "Energy Manager & Agenti",
                desc: "Consulenti energetici e agenti commerciali che propongono soluzioni fotovoltaiche alle aziende. Aggiungi le pratiche al tuo portafoglio servizi.",
                esempi: ["Energy manager", "Agenti commerciali", "Consulenti ESG", "Broker energetici"],
              },
            ].map((cat) => (
              <div key={cat.titolo} className="bg-[#1a4a2e] rounded-2xl border border-white/10 p-8">
                <div className="w-12 h-12 rounded-xl bg-[#f5c518]/10 border border-[#f5c518]/20 flex items-center justify-center mb-6">
                  <cat.icon className="w-6 h-6 text-[#f5c518]" />
                </div>
                <h3 className="text-xl font-black text-white mb-3" style={{ fontFamily: "Montserrat, sans-serif" }}>{cat.titolo}</h3>
                <p className="text-white/60 text-sm mb-5 leading-relaxed">{cat.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {cat.esempi.map((e) => (
                    <span key={e} className="text-xs bg-white/5 border border-white/10 text-white/50 px-2 py-1 rounded-full">{e}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* COME FUNZIONA */}
          <div className="bg-[#1a4a2e] rounded-2xl border border-[#f5c518]/30 p-8 mb-12">
            <h3 className="text-2xl font-black text-[#f5c518] mb-8 text-center" style={{ fontFamily: "Montserrat, sans-serif" }}>COME FUNZIONA</h3>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: "1", titolo: "Acquisti da noi", desc: "Compri un pacchetto di pratiche all'ingrosso al prezzo grossista (da €85 res. / €250 bus.)" },
                { step: "2", titolo: "Hai il tuo stock", desc: "Le pratiche non scadono mai — le usi quando ne hai bisogno, senza fretta." },
                { step: "3", titolo: "Servi i tuoi clienti", desc: "Usi le pratiche per i tuoi clienti e fatturi loro il prezzo che ritieni giusto." },
                { step: "4", titolo: "Guadagni la differenza", desc: "Il mercato paga €200–1.500 a pratica. Tu la paghi molto meno — il margine è tuo." },
              ].map((s) => (
                <div key={s.step} className="text-center">
                  <div className="w-12 h-12 rounded-full bg-[#f5c518] text-[#1a4a2e] font-black text-xl flex items-center justify-center mx-auto mb-4">{s.step}</div>
                  <h4 className="text-white font-black mb-2">{s.titolo}</h4>
                  <p className="text-white/50 text-sm leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* VANTAGGI */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-[#1a4a2e] rounded-2xl border border-white/10 p-8">
              <h3 className="text-xl font-black text-white mb-6" style={{ fontFamily: "Montserrat, sans-serif" }}>PERCHÉ CONVIENE</h3>
              <div className="space-y-4">
                {[
                  "Prezzi all'ingrosso: da €85 residenziale, da €250 business",
                  "Pratiche senza scadenza — usi lo stock quando vuoi",
                  "Schema unifilare incluso nel prezzo",
                  "Nessun vincolo di rivendita — fatturi ai tuoi clienti il prezzo che preferisci",
                  "Supporto tecnico incluso per ogni pratica",
                  "Portale dedicato per monitorare le pratiche in tempo reale",
                ].map((v) => (
                  <div key={v} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#4ade80] shrink-0 mt-0.5" />
                    <span className="text-white/70 text-sm">{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#1a4a2e] rounded-2xl border border-[#4ade80]/30 p-8">
              <h3 className="text-xl font-black text-[#4ade80] mb-6" style={{ fontFamily: "Montserrat, sans-serif" }}>IL TUO MARGINE POTENZIALE</h3>
              <div className="space-y-4">
                <div className="bg-[#0e3320] rounded-xl p-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-white/60 text-sm">Pratica residenziale — mercato</span>
                    <span className="text-white font-bold">€200–250</span>
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-white/60 text-sm">Pratica residenziale — da noi</span>
                    <span className="text-[#4ade80] font-bold">€85</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-white/10 pt-2 mt-2">
                    <span className="text-[#f5c518] font-black text-sm">Margine potenziale</span>
                    <span className="text-[#f5c518] font-black">fino a €165 a pratica</span>
                  </div>
                </div>
                <div className="bg-[#0e3320] rounded-xl p-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-white/60 text-sm">Pratica business — mercato</span>
                    <span className="text-white font-bold">€800–1.500+</span>
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-white/60 text-sm">Pratica business — da noi</span>
                    <span className="text-[#4ade80] font-bold">€250</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-white/10 pt-2 mt-2">
                    <span className="text-[#f5c518] font-black text-sm">Margine potenziale</span>
                    <span className="text-[#f5c518] font-black">fino a €1.250 a pratica</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#f5c518]">
        <div className="container text-center">
          <div className="inline-flex items-center gap-2 bg-[#1a4a2e]/10 rounded-full px-4 py-2 mb-6">
            <TrendingUp className="w-4 h-4 text-[#1a4a2e]" />
            <span className="text-[#1a4a2e] text-sm font-bold uppercase tracking-wider">Inizia a rivendere oggi</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-[#1a4a2e] mb-4" style={{ fontFamily: "Montserrat, sans-serif" }}>
            Contattaci per diventare partner.
          </h2>
          <p className="text-[#1a4a2e]/70 mb-10 text-lg max-w-xl mx-auto">Scrivici via email o WhatsApp — ti spieghiamo come acquistare le pratiche all'ingrosso e iniziare a rivendere subito.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="mailto:info@soluzioniambientali.info?subject=Richiesta%20Partnership%20Rivendita">
              <Button size="lg" className="bg-[#1a4a2e] text-white hover:bg-[#0e3320] font-black text-lg px-10 py-6">
                Scrivici via Email <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </a>
            <a href="https://wa.me/393286143468?text=Ciao%2C%20sono%20interessato%20alla%20partnership%20per%20rivendita%20pratiche%20fotovoltaiche" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-[#1a4a2e] text-[#1a4a2e] hover:bg-[#1a4a2e] hover:text-white font-bold text-lg px-10 py-6">
                WhatsApp: 328 6143468
              </Button>
            </a>
          </div>
          <p className="text-[#1a4a2e]/50 text-sm mt-8">Tel: 099 4000569 — info@soluzioniambientali.info</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0e3320] border-t border-white/10">
        <div className="container py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-[#4ade80]" />
              <span className="font-black text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>RICARICATI DI CONNESSIONI</span>
            </div>
            <p className="text-white/40 text-xs leading-relaxed">
              Soluzioni Ambientali di Gennaro Martusciello<br />
              Via Terni, 10 – 74121 Taranto (TA)<br />
              P.IVA: 03107700738
            </p>
            <p className="text-white/30 text-xs mt-2">
              Tel: 099 4000569 — Cell: +39 328 6143468<br />
              <a href="mailto:info@soluzioniambientali.info" className="hover:text-[#f5c518] transition-colors">info@soluzioniambientali.info</a>
            </p>
          </div>
          <div>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">Navigazione</p>
            <div className="flex flex-col gap-2 text-sm text-white/50">
              <Link href="/" className="hover:text-[#f5c518] transition-colors">Home</Link>
              <Link href="/portale" className="hover:text-[#f5c518] transition-colors">Portale Installatori</Link>
              <Link href="/acquista" className="hover:text-[#f5c518] transition-colors">Acquista</Link>
              <Link href="/listino" className="hover:text-[#f5c518] transition-colors">Listino Pratiche</Link>
              <Link href="/partner" className="hover:text-[#f5c518] transition-colors">Partner</Link>
            </div>
          </div>
          <div>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">Informazioni Legali</p>
            <div className="flex flex-col gap-2 text-sm text-white/50">
              <Link href="/privacy-policy" className="hover:text-[#f5c518] transition-colors">Privacy Policy</Link>
              <Link href="/cookie-policy" className="hover:text-[#f5c518] transition-colors">Cookie Policy</Link>
              <Link href="/termini-condizioni" className="hover:text-[#f5c518] transition-colors">Termini e Condizioni</Link>
              <Link href="/note-legali" className="hover:text-[#f5c518] transition-colors">Note Legali</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 py-4">
          <div className="container flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/30">
            <p>© 2026 Soluzioni Ambientali di Gennaro Martusciello — Tutti i diritti riservati</p>
            <p>I prezzi indicati si intendono IVA esclusa salvo diversa indicazione</p>
          </div>
        </div>
      </footer>

      {/* Modal Login */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="bg-[#1a4a2e] border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-black">Login Installatore</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <p className="text-white/70 text-sm">
              Accedi al tuo portale per gestire i tuoi pacchetti, pratiche e ordini.
            </p>
            <a href={getLoginUrl("/portale")}>
              <Button className="w-full bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-black text-base py-6">
                <LogIn className="mr-2 w-5 h-5" />
                Accedi con Google
              </Button>
            </a>
            <div className="text-center">
              <Link href="/portale/registrazione" className="text-white/50 hover:text-[#f5c518] text-sm transition-colors">
                Non sei ancora registrato? Registrati qui
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
