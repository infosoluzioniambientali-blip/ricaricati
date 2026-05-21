import { useLocation } from "wouter";
import { ChevronLeft, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PackBenvenuto() {
  const [, setLocation] = useLocation();

  const handleWhatsApp = () => {
    const phone = "+393757187150";
    const message = "Ciao! Sono interessato al Pack Benvenuto per nuovi installatori. Mi piacerebbe ricevere più informazioni.";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#0e3320]">
      {/* Header */}
      <div className="bg-[#1a4a2e] border-b border-white/10 py-4 sticky top-0 z-10">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setLocation("/")}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-black text-[#f5c518]" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Pack Benvenuto
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-12">
        <div className="max-w-2xl mx-auto">
          {/* Main Card */}
          <div className="rounded-2xl border-2 border-[#f5c518] bg-gradient-to-r from-[#f5c518]/10 to-[#1a4a2e] p-8 md:p-12 mb-8">
            <div className="inline-block bg-[#f5c518] text-[#1a4a2e] font-black text-xs px-4 py-2 rounded-full uppercase tracking-wider mb-6">
              Per i nuovi installatori
            </div>

            <h2 className="text-4xl md:text-5xl font-black text-[#f5c518] mb-4" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Pack Benvenuto
            </h2>

            <p className="text-white/70 text-lg mb-8">
              Il tuo primo pacchetto con condizioni speciali. Pratiche BT 1-100 kW.
            </p>

            {/* Features */}
            <div className="space-y-4 mb-10">
              <div className="flex items-start gap-4">
                <div className="text-[#f5c518] text-2xl font-black">✓</div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">5 Pratiche Residenziali</h3>
                  <p className="text-white/60">a €100 cadauna</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="text-[#f5c518] text-2xl font-black">✓</div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">2 Pratiche Business</h3>
                  <p className="text-white/60">a €250 cadauna</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="text-[#f5c518] text-2xl font-black">✓</div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">Schema Unifilare Incluso</h3>
                  <p className="text-white/60">Nessun costo aggiuntivo</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="text-[#f5c518] text-2xl font-black">✓</div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">Scadenza Mai</h3>
                  <p className="text-white/60">Usi il pacchetto con i tuoi tempi</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="text-[#f5c518] text-2xl font-black">✓</div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">Credito Residuo Omaggiato*</h3>
                  <p className="text-white/60 text-sm">*Se per l'ultima pratica non ci sarà credito a sufficienza, dopo aver acquistato un misto di pratiche residenziali e/o business, quest'ultimo verrà integrato e omaggiato da Soluzioni Ambientali.</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <Button
              onClick={handleWhatsApp}
              className="w-full bg-green-500 text-white hover:bg-green-600 font-black text-lg py-6 flex items-center justify-center gap-3"
            >
              <MessageCircle className="w-6 h-6" />
              Richiedi su WhatsApp
            </Button>

            <p className="text-white/40 text-sm text-center mt-6">
              Il nostro team risponderà entro poche ore per confermare la tua richiesta
            </p>
          </div>

          {/* Info Section */}
          <div className="bg-[#1a4a2e] border border-white/10 rounded-2xl p-8">
            <h3 className="text-white font-black text-xl mb-4">Come funziona?</h3>
            <ol className="space-y-4 text-white/70">
              <li className="flex gap-4">
                <span className="text-[#f5c518] font-black text-lg flex-shrink-0">1</span>
                <span>Clicca su "Richiedi su WhatsApp" e contattaci</span>
              </li>
              <li className="flex gap-4">
                <span className="text-[#f5c518] font-black text-lg flex-shrink-0">2</span>
                <span>Conferma i tuoi dati e la richiesta del Pack Benvenuto</span>
              </li>
              <li className="flex gap-4">
                <span className="text-[#f5c518] font-black text-lg flex-shrink-0">3</span>
                <span>Ricevi l'accesso al tuo portale installatore con il pacchetto attivo</span>
              </li>
              <li className="flex gap-4">
                <span className="text-[#f5c518] font-black text-lg flex-shrink-0">4</span>
                <span>Inizia a gestire le tue pratiche fotovoltaiche</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
