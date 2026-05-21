import { useLocation } from "wouter";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

export default function Promo() {
  const [, setLocation] = useLocation();
  const { data: promoHome = [] } = trpc.promo.getPromoHome.useQuery();

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
              Promo & Offerte
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-12">
        {promoHome.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/60 text-lg">Nessuna offerta disponibile al momento.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(promoHome as any[]).map((pr: any) => {
              const coloreMap: Record<string, string> = {
                yellow: "border-[#f5c518]/50 bg-[#f5c518]/5",
                green: "border-[#4ade80]/50 bg-[#4ade80]/5",
                blue: "border-blue-400/50 bg-blue-400/5",
                pink: "border-pink-400/50 bg-pink-400/5",
              };
              const textColoreMap: Record<string, string> = {
                yellow: "text-[#f5c518]",
                green: "text-[#4ade80]",
                blue: "text-blue-400",
                pink: "text-pink-400",
              };
              const borderClass = coloreMap[pr.colore] || coloreMap.yellow;
              const textClass = textColoreMap[pr.colore] || textColoreMap.yellow;

              return (
                <div key={pr.id} className={`rounded-2xl border p-6 bg-[#1a4a2e] ${borderClass}`}>
                  <h4 className="text-white font-black text-lg mb-2">{pr.titolo}</h4>
                  {pr.descrizione && <p className="text-white/60 text-sm mb-3">{pr.descrizione}</p>}
                  {pr.prezzo && (
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className={`font-black text-3xl ${textClass}`}>€{Number(pr.prezzo).toLocaleString("it-IT")}</span>
                      {pr.prezzoOriginale && (
                        <span className="text-white/30 line-through text-lg">€{Number(pr.prezzoOriginale).toLocaleString("it-IT")}</span>
                      )}
                    </div>
                  )}
                  {pr.scadenza && (
                    <p className="text-orange-400 text-xs mb-3">⏰ Offerta valida fino al {new Date(pr.scadenza).toLocaleDateString("it-IT")}</p>
                  )}
                  {pr.cta && pr.ctaUrl && (
                    <a
                      href={pr.ctaUrl}
                      className={`inline-block mt-2 font-bold text-sm px-4 py-2 rounded-lg ${textClass} border ${borderClass} hover:opacity-80 transition-opacity`}
                    >
                      {pr.cta} →
                    </a>
                  )}
                  <a
                    href={`https://wa.me/393757187150?text=${encodeURIComponent(`Ciao, sono interessato all'offerta "${pr.titolo}" di Ricaricati di Connessioni.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-3 font-bold text-sm px-4 py-2 rounded-lg bg-[#25D366] text-white hover:bg-[#25D366]/90 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Info su WhatsApp
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
