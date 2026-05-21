import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect, useState } from "react";

export default function OffertaPersonalizzata() {
  const { token } = useParams<{ token: string }>();
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [selectedPack, setSelectedPack] = useState<string | null>(null);

  // @ts-ignore - sub-router ai non inferito da TypeScript
  const { data: offerta, isLoading: isLoadingOfferta, error: errorOfferta } = trpc.prospectInstallatori.ai.getProspectByToken.useQuery(
    { token: token || "" },
    { enabled: !!token }
  );

  // @ts-ignore - sub-router ai non inferito da TypeScript
  const { data: packInstallatore, isLoading: isLoadingPack } = trpc.prospectInstallatori.ai.getPackInstallatore.useQuery(
    { prospectId: offerta?.prospectId || 0 },
    { enabled: !!offerta }
  );

  const packs = [
    { id: "pack1", nome: "Pack 1", prezzo: 2000, pratiche: 16, color: "bg-blue-600" },
    { id: "pack2", nome: "Pack 2", prezzo: 3150, pratiche: 30, color: "bg-purple-600" },
    { id: "pack3", nome: "Pack 3", prezzo: 5100, pratiche: 60, color: "bg-green-600" },
  ];

  useEffect(() => {
    if (offerta?.pack) {
      setSelectedPack(offerta.pack);
    }
  }, [offerta]);

  // Mostra errore se offerta non trovata
  useEffect(() => {
    if (errorOfferta) {
      console.error("Errore nel caricamento dell'offerta", errorOfferta);
    }
  }, [errorOfferta]);

  if (isLoadingOfferta) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-yellow-500" />
          <p className="text-white">Caricamento offerta personalizzata...</p>
        </div>
      </div>
    );
  }

  if (errorOfferta || !offerta) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <Card className="bg-slate-800 border-red-500 p-8 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-bold text-white">Offerta non trovata</h2>
          </div>
          <p className="text-gray-300 mb-6">L'offerta è scaduta o non è più disponibile.</p>
          <Button onClick={() => navigate("/")} className="w-full bg-yellow-500 hover:bg-yellow-600">
            Torna alla home
          </Button>
        </Card>
      </div>
    );
  }

  const selectedPackData = packs.find(p => p.id === selectedPack);
  const sconto = offerta.sconto || 0;
  const prezzoOriginale = selectedPackData?.prezzo || 0;
  const prezzoScontato = Math.round(prezzoOriginale * (1 - sconto / 100));
  const risparmi = prezzoOriginale - prezzoScontato;

  const handleAcquista = () => {
    if (!isAuthenticated) {
      navigate("/portale/registrazione");
      return;
    }
    // Reindirizza alla pagina di acquisto con il pack pre-selezionato
    navigate(`/acquista?pack=${selectedPack}&sconto=${sconto}&token=${token}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Offerta Speciale per <span className="text-yellow-500">{offerta.nome}</span>
          </h1>
          <p className="text-xl text-gray-300">
            Proposta personalizzata con sconto fino al <span className="text-yellow-500 font-bold">{sconto}%</span>
          </p>
          {offerta.messaggio && (
            <p className="text-lg text-gray-400 mt-4 italic">"{offerta.messaggio}"</p>
          )}
        </div>

        {/* Messaggio personalizzato */}
        {offerta.messaggio && (
          <Card className="bg-slate-800 border-yellow-500/30 p-6 mb-12">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Messaggio speciale per te</h3>
                <p className="text-gray-300">{offerta.messaggio}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Selezione Pack */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Scegli il tuo pacchetto</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {packs.map(pack => (
              <Card
                key={pack.id}
                className={`cursor-pointer transition-all border-2 ${
                  selectedPack === pack.id
                    ? "border-yellow-500 bg-slate-700"
                    : "border-slate-600 bg-slate-800 hover:border-yellow-500/50"
                }`}
                onClick={() => setSelectedPack(pack.id)}
              >
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-4">{pack.nome}</h3>
                  <div className="mb-4">
                    <p className="text-sm text-gray-400">Pratiche incluse</p>
                    <p className="text-3xl font-bold text-yellow-500">{pack.pratiche}</p>
                  </div>
                  <div className="border-t border-slate-600 pt-4">
                    <p className="text-sm text-gray-400 mb-2">Prezzo</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold text-white">€{pack.prezzo}</p>
                      {sconto > 0 && (
                        <p className="text-sm text-gray-400 line-through">€{pack.prezzo}</p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Riepilogo offerta */}
        {selectedPackData && (
          <Card className="bg-slate-800 border-yellow-500/30 p-8 mb-12">
            <h3 className="text-2xl font-bold text-white mb-6">Riepilogo della tua offerta</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-slate-600">
                <span className="text-gray-300">{selectedPackData.nome} ({selectedPackData.pratiche} pratiche)</span>
                <span className="text-white font-semibold">€{prezzoOriginale}</span>
              </div>
              {sconto > 0 && (
                <div className="flex justify-between items-center pb-4 border-b border-slate-600">
                  <span className="text-yellow-500 font-semibold">Sconto {sconto}%</span>
                  <span className="text-yellow-500 font-semibold">-€{risparmi}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-4">
                <span className="text-lg font-bold text-white">Totale</span>
                <span className="text-3xl font-bold text-yellow-500">€{prezzoScontato}</span>
              </div>
              {offerta.scadenza && (
                <div className="mt-4 pt-4 border-t border-slate-600">
                  <p className="text-sm text-gray-400">
                    Offerta valida fino al <span className="text-yellow-500">{new Date(offerta.scadenza).toLocaleDateString("it-IT")}</span>
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleAcquista}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg px-8 py-6"
          >
            Acquista Ora
          </Button>
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="border-yellow-500 text-yellow-500 hover:bg-yellow-500/10 font-bold text-lg px-8 py-6"
          >
            Continua a Navigare
          </Button>
        </div>
      </div>
    </div>
  );
}
