import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function NoteLegali() {
  return (
    <div className="min-h-screen bg-[#0d2818] text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-[#f5c518] hover:text-yellow-300 mb-8 transition-colors">
          <ArrowLeft size={18} />
          Torna alla Home
        </Link>

        <h1 className="text-3xl font-bold text-[#f5c518] mb-2">Note Legali</h1>
        <p className="text-gray-400 mb-8 text-sm">Ultimo aggiornamento: 7 maggio 2026</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Informazioni sul Titolare del Sito</h2>
            <div className="p-4 bg-[#1a4a2e]/50 rounded-lg border border-[#1a4a2e] space-y-2">
              <p><strong className="text-white">Ragione Sociale:</strong> Soluzioni Ambientali di Gennaro Martusciello</p>
              <p><strong className="text-white">Titolare:</strong> Gennaro Martusciello</p>
              <p><strong className="text-white">Sede Legale e Ufficio Tecnico:</strong> Via Terni, 10 – 74121 Taranto (TA)</p>
              <p><strong className="text-white">Service Point:</strong> Via Orazio Flacco, 4/A – 74121 Taranto (TA)</p>
              <p><strong className="text-white">Codice Fiscale:</strong> MRTGNR77D15L049S</p>
              <p><strong className="text-white">Partita IVA:</strong> 03107700738</p>
              <p><strong className="text-white">Telefono:</strong> 099 4000569 (Sede) — 099 9945086 (Service Point)</p>
              <p><strong className="text-white">Cellulare:</strong> +39 328 6143468</p>
              <p><strong className="text-white">Email:</strong> <a href="mailto:info@soluzioniambientali.info" className="text-[#f5c518] hover:underline">info@soluzioniambientali.info</a> (amministrativa)</p>
              <p><strong className="text-white">Email Pratiche:</strong> <a href="mailto:energie@soluzioniambientali.info" className="text-[#f5c518] hover:underline">energie@soluzioniambientali.info</a></p>
              <p><strong className="text-white">PEC:</strong> <a href="mailto:info@pec.soluzioniambientali.info" className="text-[#f5c518] hover:underline">info@pec.soluzioniambientali.info</a></p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Proprietà del Sito</h2>
            <p>
              Il sito web <strong className="text-white">www.soluzionipratiche.info</strong> è di proprietà di Soluzioni Ambientali di Gennaro Martusciello.
              Tutti i contenuti presenti sul sito (testi, immagini, grafica, loghi, software) sono protetti dalle norme sul diritto d'autore
              (L. 633/1941 e successive modifiche) e dalle norme sulla proprietà intellettuale.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Limitazione di Responsabilità</h2>
            <p>
              Soluzioni Ambientali di Gennaro Martusciello non garantisce che il sito sia privo di errori o interruzioni.
              Il titolare non è responsabile per danni diretti o indiretti derivanti dall'utilizzo o dall'impossibilità di utilizzo del sito.
              I contenuti informativi presenti sul sito hanno carattere puramente indicativo e non costituiscono consulenza professionale.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Link a Siti Esterni</h2>
            <p>
              Il sito potrebbe contenere link a siti web di terze parti. Soluzioni Ambientali di Gennaro Martusciello
              non è responsabile del contenuto di tali siti e non ne condivide necessariamente le politiche.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Normativa Applicabile</h2>
            <p>
              Il presente sito è conforme alla normativa italiana ed europea applicabile, tra cui:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Regolamento UE 2016/679 (GDPR) — Protezione dei dati personali</li>
              <li>D.Lgs. 196/2003 (Codice Privacy) come modificato dal D.Lgs. 101/2018</li>
              <li>D.Lgs. 70/2003 — Commercio elettronico</li>
              <li>D.Lgs. 206/2005 (Codice del Consumo)</li>
              <li>Linee Guida Garante Privacy sui cookie (10 giugno 2021)</li>
            </ul>
          </section>

          <section>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link href="/privacy-policy" className="text-[#f5c518] hover:underline">Privacy Policy</Link>
              <span className="text-gray-600">|</span>
              <Link href="/cookie-policy" className="text-[#f5c518] hover:underline">Cookie Policy</Link>
              <span className="text-gray-600">|</span>
              <Link href="/termini-condizioni" className="text-[#f5c518] hover:underline">Termini e Condizioni</Link>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
