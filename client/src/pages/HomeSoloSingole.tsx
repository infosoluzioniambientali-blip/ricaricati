import { Link } from "wouter";
import { Zap, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { LISTINO, CATEGORIE_ORDINATE } from "../../../shared/listino";

// Formatta un prezzo in modo sicuro (gestisce number, string, undefined)
function formatPrezzo(val: number | string | null | undefined): string {
  if (val === null || val === undefined) return "Da concordare";
  if (typeof val === "string") {
    const n = parseFloat(val);
    if (isNaN(n)) return val;
    return `€${n.toFixed(2)}`;
  }
  return `€${val.toFixed(2)}`;
}

// Restituisce il prezzo numerico base di una pratica (standard o forniture o premium)
function getPrezzoBase(pratica: typeof LISTINO[number]): number | null {
  const v = pratica.prezzoStandard ?? pratica.prezzoForniture ?? pratica.prezzoPremium;
  if (v === null || v === undefined) return null;
  if (typeof v === "string") {
    const n = parseFloat(v);
    return isNaN(n) ? null : n;
  }
  return v;
}

export default function HomeSoloSingole() {
  const { user } = useAuth();
  const { data: listinoPersonalizzato } = trpc.installatori.mioListino.useQuery();

  // Estrai i prezzi personalizzati dal listino (shape: { [id]: { prezzo: number; note?: string } })
  const prezziPersonalizzati: Record<string, { prezzo: number; note?: string }> = {};
  if (listinoPersonalizzato) {
    try {
      const parsed = JSON.parse(listinoPersonalizzato.prezzi || "{}");
      Object.assign(prezziPersonalizzati, parsed);
    } catch {
      // Se il parsing fallisce, usa i prezzi standard
    }
  }

  // Raggruppa per categoria
  const pratichePerCategoria = CATEGORIE_ORDINATE.reduce(
    (acc: Record<string, typeof LISTINO>, cat: string) => {
      const pratiche = LISTINO.filter((p) => p.categoria === cat);
      if (pratiche.length > 0) {
        acc[cat] = pratiche;
      }
      return acc;
    },
    {} as Record<string, typeof LISTINO>
  );

  return (
    <div className="min-h-screen bg-[#1a4a2e]">
      {/* Navbar */}
      <nav className="bg-[#0e3320] border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#f5c518] flex items-center justify-center">
              <Zap className="w-6 h-6 text-[#1a4a2e]" />
            </div>
            <span className="text-white font-black text-lg">RICARICATI</span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <Link href="/portale/dashboard">
                <Button
                  variant="outline"
                  className="border-[#f5c518] text-[#f5c518] hover:bg-[#f5c518]/10"
                >
                  Portale Installatori
                </Button>
              </Link>
            ) : (
              <a
                href={`${window.location.origin}/api/oauth/login?returnPath=${encodeURIComponent(
                  window.location.pathname
                )}`}
              >
                <Button className="bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-black">
                  Accedi
                </Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-6 px-4 py-2 rounded-full bg-[#f5c518]/10 border border-[#f5c518]/20">
            <span className="text-[#f5c518] font-bold text-sm">LISTINO PRATICHE PERSONALIZZATO</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-white mb-6 leading-tight">
            Le tue pratiche al <span className="text-[#f5c518]">prezzo riservato</span>
          </h1>
          <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto">
            Acquista le pratiche singole per residenziali e business direttamente dal tuo listino
            personalizzato. Nessun vincolo, massima flessibilità.
          </p>
          <Link href="/portale/dashboard">
            <Button className="bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-black text-lg px-8 py-6 h-auto">
              Scopri le Pratiche <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Vantaggi */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#0e3320]/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { titolo: "Prezzi Riservati", testo: "Accedi ai tuoi prezzi personalizzati per ogni pratica residenziale e business." },
              { titolo: "Massima Flessibilità", testo: "Compra solo quello che ti serve, quando ti serve. Nessun obbligo di pacchetto." },
              { titolo: "Supporto Dedicato", testo: "Il tuo team è sempre disponibile per domande e assistenza tecnica." },
            ].map((v) => (
              <div key={v.titolo} className="bg-[#0e3320] rounded-2xl p-8 border border-white/10">
                <div className="w-12 h-12 rounded-lg bg-[#f5c518]/10 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-6 h-6 text-[#f5c518]" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{v.titolo}</h3>
                <p className="text-white/60">{v.testo}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categorie Pratiche */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-black text-white mb-12 text-center">Le Pratiche Disponibili</h2>
          <div className="space-y-12">
            {CATEGORIE_ORDINATE.map((categoria: string) => {
              const pratiche = pratichePerCategoria[categoria];
              if (!pratiche) return null;

              return (
                <div key={categoria}>
                  <div className="flex items-center gap-3 mb-6">
                    <h3 className="text-2xl font-bold text-white capitalize">{categoria}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pratiche.map((pratica) => {
                      const personalizzato = prezziPersonalizzati[String(pratica.id)];
                      const isPersonalizzato = personalizzato !== undefined && personalizzato !== null;
                      const prezzoBase = getPrezzoBase(pratica);

                      // Prezzo effettivo: personalizzato se disponibile, altrimenti base
                      const prezzoEffettivo: number | null = isPersonalizzato
                        ? personalizzato.prezzo
                        : prezzoBase;

                      return (
                        <div
                          key={pratica.id}
                          className="bg-[#0e3320] rounded-xl p-6 border border-white/10 hover:border-[#f5c518]/30 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="text-white font-bold flex-1">{pratica.nome}</h4>
                            {isPersonalizzato && (
                              <span className="text-xs font-bold bg-[#f5c518]/20 text-[#f5c518] px-2 py-1 rounded ml-2 shrink-0">
                                Tuo prezzo
                              </span>
                            )}
                          </div>
                          <p className="text-white/60 text-sm mb-4">{pratica.descrizione}</p>
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span
                              className={`text-2xl font-black ${
                                isPersonalizzato ? "text-[#f5c518]" : "text-white"
                              }`}
                            >
                              {prezzoEffettivo !== null ? `€${prezzoEffettivo.toFixed(2)}` : "Da concordare"}
                            </span>
                            {isPersonalizzato && prezzoBase !== null && personalizzato.prezzo < prezzoBase && (
                              <span className="text-sm text-white/50 line-through">
                                €{prezzoBase.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Finale */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0e3320]/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-black text-white mb-6">Pronto a iniziare?</h2>
          <p className="text-xl text-white/70 mb-10">
            Accedi al tuo portale e inizia a gestire le tue pratiche con i prezzi riservati.
          </p>
          <Link href="/portale/dashboard">
            <Button className="bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-black text-lg px-8 py-6 h-auto">
              Vai al Portale <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0e3320] border-t border-white/10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#f5c518] flex items-center justify-center">
                  <Zap className="w-5 h-5 text-[#1a4a2e]" />
                </div>
                <span className="text-white font-black">RICARICATI</span>
              </div>
              <p className="text-white/60 text-sm">La piattaforma per gestire le tue pratiche energetiche.</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Prodotti</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-white/60 hover:text-[#f5c518] text-sm transition-colors">Pratiche Residenziali</a></li>
                <li><a href="#" className="text-white/60 hover:text-[#f5c518] text-sm transition-colors">Pratiche Business</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Azienda</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-white/60 hover:text-[#f5c518] text-sm transition-colors">Chi Siamo</a></li>
                <li><a href="#" className="text-white/60 hover:text-[#f5c518] text-sm transition-colors">Contatti</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Legale</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-white/60 hover:text-[#f5c518] text-sm transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-white/60 hover:text-[#f5c518] text-sm transition-colors">Termini di Servizio</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-white/60 text-sm">
            <p>&copy; 2026 Ricaricati di Connessioni. Tutti i diritti riservati.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
