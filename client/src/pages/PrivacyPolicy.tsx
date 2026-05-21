import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#0d2818] text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-[#f5c518] hover:text-yellow-300 mb-8 transition-colors">
          <ArrowLeft size={18} />
          Torna alla Home
        </Link>

        <h1 className="text-3xl font-bold text-[#f5c518] mb-2">Privacy Policy</h1>
        <p className="text-gray-400 mb-8 text-sm">Ultimo aggiornamento: 7 maggio 2026</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Titolare del Trattamento</h2>
            <p>
              Il Titolare del trattamento dei dati personali è <strong className="text-white">Soluzioni Ambientali di Gennaro Martusciello</strong>,
              con sede legale in Via Terni, 10 – 74121 Taranto (TA), P.IVA 03107700738, C.F. MRTGNR77D15L049S.
            </p>
            <p className="mt-2">
              Contatti: <a href="mailto:info@soluzioniambientali.info" className="text-[#f5c518] hover:underline">info@soluzioniambientali.info</a> — Tel. 099 4000569 — PEC: <a href="mailto:info@pec.soluzioniambientali.info" className="text-[#f5c518] hover:underline">info@pec.soluzioniambientali.info</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Tipologie di Dati Trattati</h2>
            <p>Il Titolare tratta le seguenti categorie di dati personali:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong className="text-white">Dati identificativi:</strong> nome, cognome, codice fiscale, partita IVA</li>
              <li><strong className="text-white">Dati di contatto:</strong> indirizzo email, numero di telefono, indirizzo postale</li>
              <li><strong className="text-white">Dati di navigazione:</strong> indirizzo IP, tipo di browser, pagine visitate, orari di accesso</li>
              <li><strong className="text-white">Dati relativi agli ordini:</strong> pacchetti acquistati, metodo di pagamento (non vengono memorizzati dati di carte di credito)</li>
              <li><strong className="text-white">Documenti tecnici:</strong> file caricati dagli installatori nell'ambito delle pratiche</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Finalità e Base Giuridica del Trattamento</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm mt-2">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left py-2 pr-4 text-white">Finalità</th>
                    <th className="text-left py-2 pr-4 text-white">Base giuridica</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  <tr><td className="py-2 pr-4">Registrazione e gestione account installatore</td><td className="py-2">Esecuzione contratto (art. 6.1.b GDPR)</td></tr>
                  <tr><td className="py-2 pr-4">Elaborazione ordini e pagamenti</td><td className="py-2">Esecuzione contratto (art. 6.1.b GDPR)</td></tr>
                  <tr><td className="py-2 pr-4">Gestione pratiche e documenti</td><td className="py-2">Esecuzione contratto (art. 6.1.b GDPR)</td></tr>
                  <tr><td className="py-2 pr-4">Adempimenti fiscali e contabili</td><td className="py-2">Obbligo legale (art. 6.1.c GDPR)</td></tr>
                  <tr><td className="py-2 pr-4">Comunicazioni commerciali (con consenso)</td><td className="py-2">Consenso (art. 6.1.a GDPR)</td></tr>
                  <tr><td className="py-2 pr-4">Sicurezza e prevenzione frodi</td><td className="py-2">Legittimo interesse (art. 6.1.f GDPR)</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Modalità di Trattamento e Conservazione</h2>
            <p>
              I dati sono trattati con strumenti informatici e telematici, con misure di sicurezza adeguate a prevenire accessi non autorizzati.
              I dati relativi agli ordini e alle pratiche sono conservati per <strong className="text-white">10 anni</strong> in conformità agli obblighi fiscali.
              I dati di navigazione sono conservati per <strong className="text-white">12 mesi</strong>. I dati degli account non più attivi sono cancellati dopo <strong className="text-white">2 anni</strong> dall'ultima attività.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Comunicazione e Diffusione dei Dati</h2>
            <p>
              I dati non sono diffusi a terzi. Possono essere comunicati a:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Enti pubblici (GSE, ARERA, Agenzia delle Dogane, Terna, distributori) nell'ambito delle pratiche</li>
              <li>Consulenti fiscali e commercialisti per adempimenti contabili</li>
              <li>Fornitori di servizi IT (hosting, database) in qualità di Responsabili del Trattamento</li>
              <li>Autorità giudiziarie o amministrative, se richiesto dalla legge</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Diritti degli Interessati</h2>
            <p>Ai sensi degli artt. 15-22 del GDPR, l'interessato ha diritto di:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong className="text-white">Accesso</strong> ai propri dati personali</li>
              <li><strong className="text-white">Rettifica</strong> dei dati inesatti o incompleti</li>
              <li><strong className="text-white">Cancellazione</strong> ("diritto all'oblio")</li>
              <li><strong className="text-white">Limitazione</strong> del trattamento</li>
              <li><strong className="text-white">Portabilità</strong> dei dati</li>
              <li><strong className="text-white">Opposizione</strong> al trattamento</li>
              <li><strong className="text-white">Revoca del consenso</strong> in qualsiasi momento</li>
              <li><strong className="text-white">Reclamo</strong> al Garante per la Protezione dei Dati Personali (<a href="https://www.garanteprivacy.it" className="text-[#f5c518] hover:underline" target="_blank" rel="noopener noreferrer">www.garanteprivacy.it</a>)</li>
            </ul>
            <p className="mt-3">
              Per esercitare i propri diritti, scrivere a: <a href="mailto:info@soluzioniambientali.info" className="text-[#f5c518] hover:underline">info@soluzioniambientali.info</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Cookie</h2>
            <p>
              Per informazioni sui cookie utilizzati da questo sito, consultare la nostra{" "}
              <Link href="/cookie-policy" className="text-[#f5c518] hover:underline">Cookie Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Modifiche alla Privacy Policy</h2>
            <p>
              Il Titolare si riserva il diritto di modificare la presente Privacy Policy in qualsiasi momento.
              Le modifiche saranno pubblicate su questa pagina con indicazione della data di aggiornamento.
              Si invita a consultare periodicamente questa pagina.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
