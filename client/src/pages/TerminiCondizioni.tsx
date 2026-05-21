import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function TerminiCondizioni() {
  return (
    <div className="min-h-screen bg-[#0d2818] text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-[#f5c518] hover:text-yellow-300 mb-8 transition-colors">
          <ArrowLeft size={18} />
          Torna alla Home
        </Link>

        <h1 className="text-3xl font-bold text-[#f5c518] mb-2">Termini e Condizioni di Vendita</h1>
        <p className="text-gray-400 mb-8 text-sm">Ultimo aggiornamento: 7 maggio 2026</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Informazioni sul Venditore</h2>
            <p>
              Il presente sito web <strong className="text-white">www.soluzionipratiche.info</strong> è gestito da:
            </p>
            <div className="mt-3 p-4 bg-[#1a4a2e]/50 rounded-lg border border-[#1a4a2e]">
              <p><strong className="text-white">Soluzioni Ambientali di Gennaro Martusciello</strong></p>
              <p>Sede Legale: Via Terni, 10 – 74121 Taranto (TA)</p>
              <p>Service Point: Via Orazio Flacco, 4/A – 74121 Taranto (TA)</p>
              <p>P.IVA: 03107700738 — C.F.: MRTGNR77D15L049S</p>
              <p>Tel: 099 4000569 — Cell: +39 328 6143468</p>
              <p>Email: <a href="mailto:info@soluzioniambientali.info" className="text-[#f5c518] hover:underline">info@soluzioniambientali.info</a></p>
              <p>PEC: <a href="mailto:info@pec.soluzioniambientali.info" className="text-[#f5c518] hover:underline">info@pec.soluzioniambientali.info</a></p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Oggetto del Contratto</h2>
            <p>
              I presenti Termini e Condizioni regolano l'acquisto di <strong className="text-white">pacchetti di servizi professionali</strong> (pratiche amministrative, iter burocratici, progettazione tecnica) e di <strong className="text-white">pratiche singole</strong> tramite la piattaforma www.soluzionipratiche.info, destinata esclusivamente a operatori professionali del settore energetico (installatori, tecnici, agenti).
            </p>
            <p className="mt-2 text-sm text-yellow-300">
              ⚠️ La piattaforma è riservata a professionisti (B2B). Non si applica la normativa a tutela dei consumatori finali (D.Lgs. 206/2005) per i rapporti tra professionisti.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Pacchetti Disponibili e Prezzi</h2>
            <p>I prezzi indicati sono espressi in Euro e si intendono <strong className="text-white">IVA esclusa</strong>, salvo diversa indicazione.</p>
            <div className="overflow-x-auto mt-3">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left py-2 pr-4 text-white">Pacchetto</th>
                    <th className="text-left py-2 pr-4 text-white">Prezzo (IVA esclusa)</th>
                    <th className="text-left py-2 text-white">Contenuto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  <tr>
                    <td className="py-2 pr-4 font-semibold text-[#f5c518]">Pack 1</td>
                    <td className="py-2 pr-4">€ 2.000,00</td>
                    <td className="py-2">Pacchetto base pratiche</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-semibold text-[#f5c518]">Pack 2</td>
                    <td className="py-2 pr-4">€ 3.150,00</td>
                    <td className="py-2">Pacchetto intermedio pratiche</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-semibold text-[#f5c518]">Pack 3</td>
                    <td className="py-2 pr-4">€ 5.100,00</td>
                    <td className="py-2">Pacchetto completo pratiche</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm text-gray-400">
              Il venditore si riserva il diritto di modificare i prezzi in qualsiasi momento. Le modifiche non avranno effetto sugli ordini già confermati.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Procedura d'Ordine</h2>
            <p>Per effettuare un acquisto è necessario:</p>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Registrarsi alla piattaforma come installatore</li>
              <li>Attendere l'approvazione dell'account da parte dell'amministratore</li>
              <li>Selezionare il pacchetto o le pratiche singole desiderate</li>
              <li>Compilare il modulo d'ordine con i dati richiesti</li>
              <li>Scegliere il metodo di pagamento (PayPal o bonifico bancario)</li>
              <li>Confermare l'ordine</li>
            </ol>
            <p className="mt-3">
              L'ordine si intende concluso al momento della <strong className="text-white">conferma scritta</strong> da parte del venditore via email.
              Il venditore si riserva il diritto di non accettare ordini senza fornire motivazione.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Metodi di Pagamento</h2>
            <p>Sono accettati i seguenti metodi di pagamento:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong className="text-white">PayPal</strong> — pagamento immediato tramite conto PayPal o carta di credito/debito</li>
              <li><strong className="text-white">Bonifico Bancario</strong> — intestatario: Soluzioni Ambientali di Gennaro Martusciello — IBAN: IT19 I030 6234 2100 0000 2824 470. Il servizio sarà attivato dopo la ricezione del pagamento.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Erogazione del Servizio</h2>
            <p>
              I pacchetti acquistati vengono attivati entro <strong className="text-white">48 ore lavorative</strong> dalla conferma del pagamento.
              Le pratiche singole vengono prese in carico entro <strong className="text-white">5 giorni lavorativi</strong> dalla ricezione della documentazione completa.
              I tempi di completamento variano in base alla complessità della pratica e ai tempi degli enti coinvolti (GSE, ARERA, Agenzia delle Dogane, Terna, distributori).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Diritto di Recesso</h2>
            <p>
              Trattandosi di contratti B2B (tra professionisti), il diritto di recesso previsto dal D.Lgs. 206/2005 per i consumatori finali <strong className="text-white">non si applica</strong>.
            </p>
            <p className="mt-2">
              Tuttavia, il venditore riconosce la possibilità di recesso entro <strong className="text-white">14 giorni</strong> dall'acquisto, purché il servizio non sia ancora stato avviato.
              Per esercitare il recesso, inviare comunicazione scritta a <a href="mailto:info@soluzioniambientali.info" className="text-[#f5c518] hover:underline">info@soluzioniambientali.info</a> o via PEC.
              Non è possibile recedere dopo l'avvio della lavorazione della pratica.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Responsabilità</h2>
            <p>
              Il venditore si impegna a svolgere le pratiche con diligenza professionale. Non è responsabile per:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Ritardi imputabili agli enti pubblici (GSE, ARERA, distributori, ecc.)</li>
              <li>Esito negativo delle pratiche dovuto a documentazione incompleta o errata fornita dal cliente</li>
              <li>Variazioni normative successive alla presa in carico della pratica</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Proprietà Intellettuale</h2>
            <p>
              Tutti i contenuti del sito (testi, immagini, loghi, software) sono di proprietà di Soluzioni Ambientali di Gennaro Martusciello
              o dei rispettivi titolari. È vietata la riproduzione, distribuzione o utilizzo non autorizzato.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Legge Applicabile e Foro Competente</h2>
            <p>
              I presenti Termini e Condizioni sono regolati dalla legge italiana.
              Per qualsiasi controversia derivante dall'interpretazione o esecuzione del presente contratto,
              è competente in via esclusiva il <strong className="text-white">Foro di Taranto</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Modifiche ai Termini</h2>
            <p>
              Il venditore si riserva il diritto di modificare i presenti Termini e Condizioni in qualsiasi momento.
              Le modifiche saranno pubblicate su questa pagina e avranno effetto dalla data di pubblicazione.
              L'utilizzo continuato del sito dopo la pubblicazione delle modifiche costituisce accettazione delle stesse.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
