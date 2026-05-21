import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Zap, ArrowLeft, HardHat, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export default function Registrazione() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const [form, setForm] = useState({ ragioneSociale: "", partitaIva: "", telefono: "", citta: "", provincia: "" });
  const [done, setDone] = useState(false);

  const registra = trpc.installatori.registra.useMutation({
    onSuccess: () => { setDone(true); toast.success("Registrazione completata!"); },
    onError: (e) => toast.error(e.message),
  });

  if (loading) return (
    <div className="min-h-screen bg-[#1a4a2e] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#f5c518] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isAuthenticated) return (
    <div className="min-h-screen bg-[#1a4a2e] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#0e3320] rounded-3xl p-10 border border-white/10 text-center">
        <HardHat className="w-12 h-12 text-[#f5c518] mx-auto mb-4" />
        <h2 className="text-2xl font-black text-white mb-3">Accedi prima di registrarti</h2>
        <p className="text-white/60 mb-6">Per completare la registrazione come installatore devi prima accedere con il tuo account.</p>
        <a href={getLoginUrl()}>
          <Button className="bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-black">Accedi ora</Button>
        </a>
      </div>
    </div>
  );

  if (done) return (
    <div className="min-h-screen bg-[#1a4a2e] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#0e3320] rounded-3xl p-10 border border-[#4ade80]/30 text-center">
        <CheckCircle className="w-16 h-16 text-[#4ade80] mx-auto mb-6" />
        <h2 className="text-2xl font-black text-white mb-3">Registrazione Inviata!</h2>
        <p className="text-white/60 mb-6">Il tuo profilo installatore per <strong className="text-white">{form.ragioneSociale}</strong> è in attesa di approvazione. Riceverai una notifica appena il tuo account sarà attivato.</p>
        <Link href="/portale">
          <Button className="bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-black">Vai al Portale</Button>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#1a4a2e] text-white">
      <nav className="sticky top-0 z-50 bg-[#1a4a2e]/95 backdrop-blur border-b border-white/10">
        <div className="container flex items-center gap-4 h-16">
          <Link href="/portale" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Portale</span>
          </Link>
          <div className="flex items-center gap-2 ml-auto">
            <Zap className="w-5 h-5 text-[#4ade80]" />
            <span className="font-black text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>RICARICATI <span className="text-[#f5c518]">DI CONNESSIONI</span></span>
          </div>
        </div>
      </nav>

      <div className="container py-12">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-10">
            <HardHat className="w-10 h-10 text-[#f5c518] mx-auto mb-4" />
            <h1 className="text-3xl font-black text-white mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>Registrazione Installatore</h1>
            <p className="text-white/60">Compila i tuoi dati aziendali per accedere al portale</p>
            {user && <p className="text-[#4ade80] text-sm mt-2">Loggato come: {user.name || user.email}</p>}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); registra.mutate({ ragioneSociale: form.ragioneSociale, partitaIva: form.partitaIva || undefined, telefono: form.telefono || undefined, citta: form.citta || undefined, provincia: form.provincia || undefined }); }}
            className="bg-[#0e3320] rounded-3xl p-8 border border-white/10 space-y-5">
            <div>
              <Label className="text-white/80 mb-1 block">Ragione Sociale / Nome Azienda *</Label>
              <Input value={form.ragioneSociale} onChange={(e) => setForm({ ...form, ragioneSociale: e.target.value })}
                placeholder="Rossi Impianti S.r.l." className="bg-[#1a4a2e] border-white/20 text-white placeholder:text-white/30" required />
            </div>
            <div>
              <Label className="text-white/80 mb-1 block">Partita IVA</Label>
              <Input value={form.partitaIva} onChange={(e) => setForm({ ...form, partitaIva: e.target.value })}
                placeholder="IT12345678901" className="bg-[#1a4a2e] border-white/20 text-white placeholder:text-white/30" />
            </div>
            <div>
              <Label className="text-white/80 mb-1 block">Telefono</Label>
              <Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                placeholder="+39 333 1234567" className="bg-[#1a4a2e] border-white/20 text-white placeholder:text-white/30" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white/80 mb-1 block">Città</Label>
                <Input value={form.citta} onChange={(e) => setForm({ ...form, citta: e.target.value })}
                  placeholder="Bari" className="bg-[#1a4a2e] border-white/20 text-white placeholder:text-white/30" />
              </div>
              <div>
                <Label className="text-white/80 mb-1 block">Provincia</Label>
                <Input value={form.provincia} onChange={(e) => setForm({ ...form, provincia: e.target.value })}
                  placeholder="BA" maxLength={2} className="bg-[#1a4a2e] border-white/20 text-white placeholder:text-white/30" />
              </div>
            </div>

            <div className="bg-[#1a4a2e] rounded-xl p-4 border border-[#f5c518]/20">
              <p className="text-[#f5c518] text-xs font-bold uppercase tracking-wider mb-1">Nota</p>
              <p className="text-white/60 text-xs">Dopo la registrazione, il tuo account sarà esaminato dall'amministratore. Riceverai una notifica di approvazione entro 24 ore.</p>
            </div>

            <Button type="submit" disabled={registra.isPending}
              className="w-full bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-black py-6 text-base">
              {registra.isPending ? "Invio in corso..." : "Invia Richiesta di Registrazione"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
