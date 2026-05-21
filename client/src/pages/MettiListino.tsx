import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function MettiListino() {
  return (
    <div className="min-h-screen bg-[#1a4a2e] text-white py-20">
      <div className="container">
        <h1 className="text-4xl md:text-5xl font-black mb-6 text-[#f5c518]">Metti Listino</h1>
        <p className="text-lg text-white/80 mb-8">
          Aggiungi le tue pratiche al listino.
        </p>
        <Link href="/">
          <Button className="bg-[#f5c518] text-[#1a4a2e] hover:bg-[#f5c518]/90 font-bold">
            Torna alla Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
