import { Link } from "wouter";
import { Zap, MessageCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RecuperaPassword() {
  const WHATSAPP_NUMBER = "393757187150";
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Ciao, ho bisogno di recuperare la password del mio account su Ricaricati di Connessioni.")}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a2a1a] via-[#1a4a2e] to-[#0e3320] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#1a4a2e]/80 border border-white/10 rounded-2xl p-8 text-center space-y-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Zap className="w-6 h-6 text-[#f5c518]" />
          <span className="text-white font-black text-lg">RICARICATI <span className="text-[#4ade80]">DI CONNESSIONI</span></span>
        </div>

        <h1 className="text-white text-2xl font-black">Recupera Password</h1>
        
        <p className="text-white/70 text-sm leading-relaxed">
          Per recuperare le credenziali del tuo account, contatta la nostra assistenza su WhatsApp. 
          Ti aiuteremo a reimpostare la password in pochi minuti.
        </p>

        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
          <Button className="w-full bg-[#25D366] hover:bg-[#25D366]/90 text-white font-bold text-base py-6 mt-4">
            <MessageCircle className="mr-2 w-5 h-5" />
            Contattaci su WhatsApp
          </Button>
        </a>

        <p className="text-white/40 text-xs">
          Risponderemo il prima possibile durante gli orari di assistenza.
        </p>

        <Link href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Torna alla Home
        </Link>
      </div>
    </div>
  );
}
