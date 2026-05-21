import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-[#0d2818] text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-[#f5c518] hover:text-yellow-300 mb-8 transition-colors">
          <ArrowLeft size={18} />
          Torna alla Home
        </Link>

        <h1 className="text-3xl font-bold text-[#f5c518] mb-2">Cookie Policy</h1>
        <p className="text-gray-400 mb-8 text-sm">Ultimo aggiornamento: 7 maggio 2026</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Cosa sono i Cookie</h2>
            <p>
              I cookie sono piccoli file di testo che i siti web visitati dall'utente inviano al suo terminale (computer, tablet, smartphone),
              dove vengono memorizzati per essere poi ritrasmessi agli stessi siti alla visita successiva.
              Grazie ai cookie un sito ricorda le azioni e le preferenze dell'utente nel corso del tempo.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Cookie Utilizzati da Questo Sito</h2>

            <h3 className="text-lg font-medium text-[#4ade80] mt-4 mb-2">Cookie Tecnici (necessari)</h3>
            <p className="mb-2">Questi cookie sono indispensabili per il funzionamento del sito e non richiedono il consenso dell'utente ai sensi dell'art. 122 del D.Lgs. 196/2003 e delle Linee Guida Garante 2021.</p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left py-2 pr-4 text-white">Nome</th>
                    <th className="text-left py-2 pr-4 text-white">Finalità</th>
                    <th className="text-left py-2 text-white">Durata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  <tr>
                    <td className="py-2 pr-4 font-mono text-xs">app_session_id</td>
                    <td className="py-2 pr-4">Mantiene la sessione di autenticazione dell'utente loggato</td>
                    <td className="py-2">Sessione / 7 giorni</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-mono text-xs">cookie_consent</td>
                    <td className="py-2 pr-4">Memorizza la preferenza dell'utente sul consenso ai cookie</td>
                    <td className="py-2">12 mesi</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-sm text-gray-400">
              Questo sito utilizza esclusivamente cookie tecnici strettamente necessari al funzionamento. Non vengono installati cookie di profilazione o di terze parti senza il consenso dell'utente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Come Gestire i Cookie</h2>
            <p>
              L'utente può gestire le preferenze sui cookie direttamente dal banner che appare al primo accesso al sito,
              oppure tramite le impostazioni del proprio browser. Di seguito i link alle istruzioni dei principali browser:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><a href="https://support.google.com/chrome/answer/95647" className="text-[#f5c518] hover:underline" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
              <li><a href="https://support.mozilla.org/it/kb/Attivare%20e%20disattivare%20i%20cookie" className="text-[#f5c518] hover:underline" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
              <li><a href="https://support.apple.com/it-it/guide/safari/sfri11471/mac" className="text-[#f5c518] hover:underline" target="_blank" rel="noopener noreferrer">Apple Safari</a></li>
              <li><a href="https://support.microsoft.com/it-it/microsoft-edge/eliminare-i-cookie-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" className="text-[#f5c518] hover:underline" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
            </ul>
            <p className="mt-3 text-sm text-gray-400">
              Attenzione: la disabilitazione dei cookie tecnici potrebbe compromettere il corretto funzionamento del sito.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Titolare del Trattamento</h2>
            <p>
              <strong className="text-white">Soluzioni Ambientali di Gennaro Martusciello</strong><br />
              Via Terni, 10 – 74121 Taranto (TA)<br />
              P.IVA: 03107700738<br />
              Email: <a href="mailto:info@soluzioniambientali.info" className="text-[#f5c518] hover:underline">info@soluzioniambientali.info</a>
            </p>
          </section>

          <section>
            <p className="text-sm text-gray-400">
              Per ulteriori informazioni sul trattamento dei dati personali, consultare la nostra{" "}
              <Link href="/privacy-policy" className="text-[#f5c518] hover:underline">Privacy Policy</Link>.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
