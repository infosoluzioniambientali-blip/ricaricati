import { Link } from "wouter";
import { Zap, ArrowLeft, Trophy, TrendingUp, Medal } from "lucide-react";
import { trpc } from "@/lib/trpc";

const OBIETTIVO = 100000;

const MEDAGLIE = ["🥇", "🥈", "🥉"];

export default function Corsa() {
  const { data, isLoading } = trpc.installatori.classifica.useQuery(undefined, { refetchInterval: 60000 });

  const totale = data?.totale ?? 0;
  const classifica = data?.classifica ?? [];
  const percentuale = Math.min((totale / OBIETTIVO) * 100, 100);

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
              RICARICATI <span className="text-[#f5c518]">DI CONNESSIONI</span>
            </span>
          </div>
        </div>
      </nav>

      <div className="container py-12">
        {/* HERO */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-[#f5c518]/10 border border-[#f5c518]/30 rounded-full px-4 py-2 mb-6">
            <Trophy className="w-4 h-4 text-[#f5c518]" />
            <span className="text-[#f5c518] text-sm font-semibold uppercase tracking-wider">Competizione Esclusiva</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-4" style={{ fontFamily: "Montserrat, sans-serif" }}>
            CORSA AI <span className="text-[#f5c518]">€100.000</span>
          </h1>
          <p className="text-white/60 max-w-xl mx-auto text-lg">
            La classifica degli installatori più attivi della rete. Chi raggiunge l'obiettivo vince un premio esclusivo!
          </p>
        </div>

        {/* PROGRESS BAR */}
        <div className="max-w-3xl mx-auto mb-14">
          <div className="bg-[#0e3320] rounded-3xl p-8 border border-[#f5c518]/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white/60 text-sm uppercase tracking-wider font-semibold">Fatturato Totale Rete</p>
                <p className="text-[#f5c518] font-black text-4xl">
                  €{totale.toLocaleString("it-IT", { minimumFractionDigits: 0 })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white/60 text-sm uppercase tracking-wider font-semibold">Obiettivo</p>
                <p className="text-white font-black text-4xl">€100.000</p>
              </div>
            </div>

            <div className="relative h-8 bg-[#1a4a2e] rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${percentuale}%`,
                  background: "linear-gradient(90deg, #1a4a2e 0%, #4ade80 50%, #f5c518 100%)",
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white font-black text-sm drop-shadow">
                  {percentuale.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="flex justify-between mt-3 text-sm">
              <span className="text-white/40">€0</span>
              <span className="text-[#4ade80] font-semibold">
                Mancano €{Math.max(0, OBIETTIVO - totale).toLocaleString("it-IT")}
              </span>
              <span className="text-white/40">€100.000</span>
            </div>
          </div>
        </div>

        {/* CLASSIFICA */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-black text-[#f5c518] mb-6 flex items-center gap-3" style={{ fontFamily: "Montserrat, sans-serif" }}>
            <Medal className="w-6 h-6" />
            Classifica Installatori
          </h2>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#f5c518] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : classifica.length === 0 ? (
            <div className="text-center py-16 bg-[#0e3320] rounded-2xl border border-white/10">
              <Trophy className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/50 mb-2">La classifica è ancora vuota</p>
              <p className="text-white/30 text-sm">Sii il primo a salire in cima!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {classifica.map((item, i) => {
                const inst = item.installatore;
                const fatturato = parseFloat(String(inst.totaleFatturato ?? 0));
                const quota = OBIETTIVO > 0 ? (fatturato / OBIETTIVO) * 100 : 0;
                const isPodio = i < 3;

                return (
                  <div
                    key={inst.id}
                    className={`rounded-2xl p-5 border flex items-center gap-4 ${isPodio ? "border-[#f5c518]/40 bg-[#f5c518]/5" : "border-white/10 bg-[#0e3320]"}`}
                  >
                    {/* POSIZIONE */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl shrink-0 ${i === 0 ? "bg-[#f5c518] text-[#1a4a2e]" : i === 1 ? "bg-white/20 text-white" : i === 2 ? "bg-[#cd7f32]/30 text-[#cd7f32]" : "bg-white/10 text-white/50"}`}>
                      {isPodio ? MEDAGLIE[i] : i + 1}
                    </div>

                    {/* INFO */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold truncate">{inst.ragioneSociale}</p>
                      <p className="text-white/50 text-sm">{inst.citta}{inst.provincia ? ` (${inst.provincia})` : ""}</p>
                      <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-[#4ade80] rounded-full transition-all" style={{ width: `${Math.min(quota, 100)}%` }} />
                      </div>
                    </div>

                    {/* FATTURATO */}
                    <div className="text-right shrink-0">
                      <p className={`font-black text-lg ${isPodio ? "text-[#f5c518]" : "text-white"}`}>
                        €{fatturato.toLocaleString("it-IT")}
                      </p>
                      <p className="text-white/40 text-xs">{quota.toFixed(1)}% obiettivo</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* CTA */}
          <div className="mt-10 bg-[#f5c518] rounded-2xl p-8 text-center">
            <TrendingUp className="w-10 h-10 text-[#1a4a2e] mx-auto mb-3" />
            <h3 className="text-[#1a4a2e] font-black text-2xl mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Vuoi scalare la classifica?
            </h3>
            <p className="text-[#1a4a2e]/70 mb-6">Acquista un pack e inizia a inserire pratiche. Ogni pratica completata aumenta il tuo punteggio!</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/acquista">
                <button className="bg-[#1a4a2e] text-white font-black px-8 py-3 rounded-xl hover:bg-[#0e3320] transition-colors">
                  Acquista un Pack
                </button>
              </Link>
              <Link href="/portale">
                <button className="bg-[#1a4a2e]/20 text-[#1a4a2e] font-bold px-8 py-3 rounded-xl hover:bg-[#1a4a2e]/30 transition-colors border border-[#1a4a2e]/30">
                  Portale Installatori
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
