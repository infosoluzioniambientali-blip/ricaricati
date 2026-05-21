import PDFDocument from "pdfkit";

interface PackPDFProps {
  packNome: string;
  packPrezzo: string;
  residenziali: number;
  prezzoRes: number;
  business: number;
  prezzoBus: number;
  ricBollette: number;
  ricPratiche: number;
  nomeAcquirente: string;
  dataAcquisto: string;
}

export function generatePackPDF(props: PackPDFProps) {
  const doc = new PDFDocument({ size: "A4", margin: 40 });

  // HEADER
  doc.fontSize(28).font("Helvetica-Bold").text("Ricaricati di Connessioni", { align: "left" });
  doc.fontSize(14).font("Helvetica").fillColor("#666").text("Dettagli del tuo Pack Acquistato", { align: "left" });
  doc.moveTo(40, doc.y + 5).lineTo(555, doc.y + 5).stroke("#1a4a2e").moveDown();

  // INFORMAZIONI ORDINE
  doc.fontSize(16).font("Helvetica-Bold").fillColor("#1a4a2e").text("Informazioni Ordine");
  doc.moveTo(40, doc.y + 3).lineTo(555, doc.y + 3).stroke("#f5c518").moveDown(0.5);

  doc.fontSize(11).font("Helvetica").fillColor("#000");
  doc.text(`Cliente: ${props.nomeAcquirente}`, { align: "left" });
  doc.text(`Data Acquisto: ${props.dataAcquisto}`, { align: "left" });
  doc.text(`Pack Acquistato: ${props.packNome}`, { align: "left" });
  doc.text(`Importo Totale: ${props.packPrezzo}`, { align: "left" });
  doc.moveDown();

  // SPECIFICHE TECNICHE
  doc.fontSize(16).font("Helvetica-Bold").fillColor("#1a4a2e").text("Specifiche Tecniche");
  doc.moveTo(40, doc.y + 3).lineTo(555, doc.y + 3).stroke("#f5c518").moveDown(0.5);

  doc.fontSize(11).font("Helvetica").fillColor("#666").text("Pratiche in BT (Bologna-Taranto) da 1 a 100 kW");
  doc.moveDown(0.3);

  doc.fontSize(11).font("Helvetica").fillColor("#000");
  doc.text(`Pratiche Residenziali: ${props.residenziali} × €${props.prezzoRes}/cad`, { align: "left" });
  doc.text(`Pratiche Business: ${props.business} × €${props.prezzoBus}/cad`, { align: "left" });
  doc.text(`Ricarica con Bollette: €${props.ricBollette}/cad`, { align: "left" });
  doc.text(`Ricarica con Pratiche: €${props.ricPratiche}/cad`, { align: "left" });
  doc.moveDown();

  // SPIEGAZIONE CREDITO RESIDUO
  doc.fontSize(16).font("Helvetica-Bold").fillColor("#1a4a2e").text("Come Funziona il Credito Residuo");
  doc.moveTo(40, doc.y + 3).lineTo(555, doc.y + 3).stroke("#f5c518").moveDown(0.5);

  // Highlight box
  doc.rect(50, doc.y, 465, 60).fillAndStroke("#f5c518", "#1a4a2e");
  doc.fontSize(12).font("Helvetica-Bold").fillColor("#1a4a2e");
  doc.text("Quando il credito residuo non è sufficiente a coprire il costo di una pratica,", 60, doc.y + 10, { width: 445, align: "left" });
  doc.text("la parte mancante viene omaggiata. Non perdi nulla!", 60, doc.y, { width: 445, align: "left" });
  doc.moveDown(3);

  // ESEMPIO PRATICO
  doc.fontSize(12).font("Helvetica-Bold").fillColor("#1a4a2e").text("Esempio Pratico");
  doc.rect(50, doc.y, 465, 80).fillAndStroke("#f0f0f0", "#4ade80");

  doc.fontSize(10).font("Helvetica").fillColor("#333");
  doc.text("• Credito residuo disponibile: €30", 60, doc.y + 10, { width: 445, align: "left" });
  doc.text("• Costo pratica residenziale: €85", 60, doc.y, { width: 445, align: "left" });
  doc.text("• Calcolo: €30 (scalati dal credito) + €55 (omaggiati)", 60, doc.y, { width: 445, align: "left" });
  doc.text("• Risultato: Pratica creata gratuitamente, credito residuo = €0", 60, doc.y, { width: 445, align: "left" });
  doc.moveDown(4);

  doc.fontSize(11).font("Helvetica").fillColor("#333");
  doc.text(
    "Questo sistema ti permette di utilizzare completamente il tuo pack senza sprechi. Anche se il credito non è sufficiente per una pratica, potrai comunque crearla e il resto sarà omaggiato.",
    { align: "left", width: 475 }
  );
  doc.moveDown();

  // PRATICHE MISTE
  doc.fontSize(16).font("Helvetica-Bold").fillColor("#1a4a2e").text("Pratiche Miste");
  doc.moveTo(40, doc.y + 3).lineTo(555, doc.y + 3).stroke("#f5c518").moveDown(0.5);

  doc.fontSize(11).font("Helvetica").fillColor("#333");
  doc.text(
    "Puoi combinare pratiche residenziali e business come preferisci. Ad esempio, puoi utilizzare 10 pratiche residenziali e 3 business, oppure tutte residenziali o tutte business. La scelta è tua!",
    { align: "left", width: 475 }
  );
  doc.moveDown();

  // FOOTER
  doc.fontSize(9).font("Helvetica").fillColor("#999");
  doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke("#e0e0e0");
  doc.moveDown(0.5);
  doc.text("Ricaricati di Connessioni - Pratiche Fotovoltaiche all'Ingrosso", { align: "center" });
  doc.text("www.soluzionipratiche.info", { align: "center" });

  return doc;
}
