import { Link } from "wouter";
import { Zap, HardHat, ArrowLeft, LogIn, UserPlus, FileText, Upload, TrendingUp, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";

export default function Portale() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const { data: installatore, isLoading: loadingInst } = trpc.installatori.mio.useQuery(undefined, { enabled: isAuthenticated });

  if (loading || loadingInst) {
    return (
      <div className="min-h-screen bg-[#1a4a2e] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#f5c518] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a4a2e] text-white">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-[#1a4a2e]/95 backdrop-blur border-b border-white/10">
        <div className="container flex items-center gap-4 h-16">
          <Link href="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Home</span>
          </Link>
          <div className="flex items-center gap-2 ml-auto">
            <Zap className="w-5 h-5 text-[#4ade80]" />
            <span className="font-black text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>
              PORTALE <span className="text-[#f5c518]">INSTALLATORI</span>
            </span>
          </div>
          {isAuthenticated && (
            <Button
              onClick={logout}
              variant="outline"
              size="sm"
              className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-400 gap-2 ml-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          )}
        </div>
      </nav>

      <div className="container py-16">
        {!isAuthenticated ? (
          /* NON LOGGATO */
          <div className="max-w-2xl mx-auto text-center">
            <HardHat className="w-16 h-16 text-[#f5c518] mx-auto mb-6" />
            <h1 className="text-4xl font-black text-white mb-4" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Portale <span className="text-[#f5c518]">Installatori</span>
            </h1>
            <p className="text-white/60 mb-10 text-lg">
              Accedi al tuo portale personale per gestire le pratiche, caricare documenti e monitorare il tuo saldo crediti.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-10">
              {[
                { icon: FileText, titolo: "Gestione Pratiche", desc: "Inserisci e monitora lo stato di ogni pratica fotovoltaica" },
                { icon: Upload, titolo: "Upload Documenti", desc: "Carica i documenti necessari direttamente dal portale" },
                { icon: TrendingUp, titolo: "Saldo Crediti", desc: "Monitora il tuo saldo pratiche residenziali e business" },
                { icon: TrendingUp, titolo: "Storico Ordini", desc: "Visualizza tutti i tuoi acquisti e lo stato dei pagamenti" },
              ].map((f) => (
                <div key={f.titolo} className="bg-[#0e3320] rounded-2xl p-5 border border-white/10 text-left">
                  <f.icon className="w-6 h-6 text-[#4ade80] mb-3" />
                  <h3 className="text-white font-bold mb-1">{f.titolo}</h3>
                  <p className="text-white/50 text-sm">{f.desc}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href={getLoginUrl()}>
                <Button size="lg" className="bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-black px-10">
                  <LogIn className="w-5 h-5 mr-2" />
                  Accedi
                </Button>
              </a>
              <a href={getLoginUrl()}>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-bold px-10">
                  <UserPlus className="w-5 h-5 mr-2" />
                  Registrati come Installatore
                </Button>
              </a>
            </div>

            <div className="mt-12 bg-[#0e3320] rounded-2xl p-6 border border-white/10">
              <p className="text-white/60 text-sm mb-4 font-semibold uppercase tracking-wider">Come funziona</p>
              <div className="grid sm:grid-cols-4 gap-4">
                {[
                  { n: "1", t: "Registrazione", d: "Compila i tuoi dati aziendali" },
                  { n: "2", t: "Approvazione", d: "L'admin approva il tuo account" },
                  { n: "3", t: "Login", d: "Accedi con email e password" },
                  { n: "4", t: "Gestione", d: "Inserisci pratiche e documenti" },
                ].map((s) => (
                  <div key={s.n} className="text-center">
                    <div className="w-10 h-10 rounded-full bg-[#f5c518] text-[#1a4a2e] font-black text-lg flex items-center justify-center mx-auto mb-2">{s.n}</div>
                    <p className="text-white font-semibold text-sm">{s.t}</p>
                    <p className="text-white/50 text-xs">{s.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : installatore ? (
          /* LOGGATO CON PROFILO INSTALLATORE */
          <div className="max-w-2xl mx-auto text-center">
            {installatore.stato === "in_attesa" ? (
              <div className="bg-[#0e3320] rounded-3xl p-10 border border-[#f5c518]/30">
                <div className="w-16 h-16 rounded-full bg-[#f5c518]/10 border-2 border-[#f5c518] flex items-center justify-center mx-auto mb-6">
                  <HardHat className="w-8 h-8 text-[#f5c518]" />
                </div>
                <h2 className="text-2xl font-black text-white mb-3">In attesa di approvazione</h2>
                <p className="text-white/60 mb-6">Il tuo profilo installatore per <strong className="text-white">{installatore.ragioneSociale}</strong> è in attesa di approvazione da parte dell'amministratore. Riceverai una notifica appena approvato.</p>
                <Link href="/">
                  <Button className="bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-bold">Torna alla Home</Button>
                </Link>
              </div>
            ) : installatore.stato === "rifiutato" ? (
              <div className="bg-[#0e3320] rounded-3xl p-10 border border-red-500/30">
                <h2 className="text-2xl font-black text-white mb-3">Account non approvato</h2>
                <p className="text-white/60 mb-6">Il tuo account installatore non è stato approvato. Contatta l'amministratore per maggiori informazioni.</p>
                <Link href="/">
                  <Button className="bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-bold">Torna alla Home</Button>
                </Link>
              </div>
            ) : (
              /* APPROVATO → redirect alla dashboard */
              <div className="text-center">
                <p className="text-white/60 mb-4">Benvenuto, {installatore.ragioneSociale}!</p>
                <Link href="/portale/dashboard">
                  <Button className="bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-black">Vai al Centro di Controllo</Button>
                </Link>
              </div>
            )}
          </div>
        ) : (
          /* LOGGATO MA SENZA PROFILO INSTALLATORE */
          <div className="max-w-lg mx-auto text-center">
            <div className="bg-[#0e3320] rounded-3xl p-10 border border-white/10">
              <HardHat className="w-12 h-12 text-[#f5c518] mx-auto mb-4" />
              <h2 className="text-2xl font-black text-white mb-3">Completa la registrazione</h2>
              <p className="text-white/60 mb-6">Sei loggato come <strong className="text-white">{user?.name || user?.email}</strong>. Completa il tuo profilo installatore per accedere al portale.</p>
              <Link href="/portale/registrazione">
                <Button className="bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-black">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Registrati come Installatore
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
