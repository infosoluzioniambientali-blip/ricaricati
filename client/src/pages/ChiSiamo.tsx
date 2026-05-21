import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function ChiSiamo() {
  return (
    <div className="min-h-screen bg-[#1a4a2e] text-white py-20">
      <div className="container">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black mb-6 text-[#f5c518]">Chi Siamo</h1>
          <p className="text-lg text-white/80 mb-8">
            Ricaricati di Connessioni è il partner ideale per gli installatori di pratiche fotovoltaiche, fibra e bollette energetiche. Offriamo soluzioni innovative e convenienti per far crescere il vostro business.
          </p>
          
          <div className="bg-white/5 rounded-xl p-8 mb-8 border border-white/10">
            <h2 className="text-2xl font-bold mb-4 text-[#f5c518]">La Nostra Missione</h2>
            <p className="text-white/80">
              Semplificare la gestione delle pratiche fotovoltaiche e ridurre i costi operativi degli installatori, permettendo loro di concentrarsi sulla crescita del business.
            </p>
          </div>

          <Link href="/">
            <Button className="bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-bold">
              Torna alla Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
