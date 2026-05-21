import PDFDocument from "pdfkit";

export interface RicevutaOrdineData {
  id: number;
  packId: string;
  importo: string;
  metodoPagamento: string;
  stato: string;
  nomeAcquirente: string;
  emailAcquirente: string;
  telefonoAcquirente?: string | null;
  ragioneSocialeAcquirente?: string | null;
  note?: string | null;
  pratiche_incluse: number;
  pratiche_incluse_residenziali: number;
  pratiche_incluse_business: number;
  createdAt: Date;
  installatoreRagioneSociale?: string | null;
  installatorePartitaIva?: string | null;
  installatoreCitta?: string | null;
  installatoreProvincia?: string | null;
}

const NOMI_PACK: Record<string, string> = {
  pack1: "Pack 1",
  pack2: "Pack 2",
  pack3: "Pack 3",
  singolo: "Pratiche Singole",
};

const PREZZI_PACK: Record<string, string> = {
  pack1: "€ 2.000,00",
  pack2: "€ 3.150,00",
  pack3: "€ 5.100,00",
  singolo: "—",
};

const VERDE_SCURO = "#1a4a2e";
const GIALLO = "#f5c518";
const GRIGIO = "#555555";
const GRIGIO_CHIARO = "#888888";

function formatData(d: Date): string {
  return new Date(d).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatMetodo(m: string): string {
  return m === "paypal" ? "PayPal" : "Bonifico bancario";
}

function formatStato(s: string): string {
  if (s === "pagato") return "PAGATO";
  if (s === "in_attesa") return "IN ATTESA";
  if (s === "annullato") return "ANNULLATO";
  return s.toUpperCase();
}

export function generateRicevutaPDF(data: RicevutaOrdineData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageW = doc.page.width;
    const margin = 50;
    const contentW = pageW - margin * 2;

    // ─── HEADER ──────────────────────────────────────────────────────────────
    // Barra verde in cima
    doc.rect(0, 0, pageW, 80).fill(VERDE_SCURO);

    // Logo / nome azienda
    doc.fontSize(22).fillColor(GIALLO).font("Helvetica-Bold")
      .text("RICARICATI DI CONNESSIONI", margin, 22, { width: contentW * 0.65 });
    doc.fontSize(9).fillColor("white").font("Helvetica")
      .text("Pratiche fotovoltaico per installatori", margin, 48, { width: contentW * 0.65 });

    // Numero ricevuta in alto a destra
    doc.fontSize(9).fillColor(GIALLO).font("Helvetica-Bold")
      .text("RICEVUTA ORDINE", pageW - margin - 130, 22, { width: 130, align: "right" });
    doc.fontSize(18).fillColor("white").font("Helvetica-Bold")
      .text(`#${String(data.id).padStart(5, "0")}`, pageW - margin - 130, 38, { width: 130, align: "right" });

    // ─── SEZIONE DATI ────────────────────────────────────────────────────────
    let y = 105;

    // Data e stato
    doc.fontSize(9).fillColor(GRIGIO_CHIARO).font("Helvetica")
      .text(`Data ordine: ${formatData(data.createdAt)}`, margin, y)
      .text(`Metodo di pagamento: ${formatMetodo(data.metodoPagamento)}`, margin + contentW / 2, y);

    y += 16;

    // Stato badge
    const statoColor = data.stato === "pagato" ? "#22c55e" : data.stato === "annullato" ? "#ef4444" : "#f59e0b";
    doc.roundedRect(margin, y, 80, 18, 4).fill(statoColor);
    doc.fontSize(9).fillColor("white").font("Helvetica-Bold")
      .text(formatStato(data.stato), margin + 4, y + 4, { width: 72, align: "center" });

    y += 38;

    // ─── DIVISORE ────────────────────────────────────────────────────────────
    doc.moveTo(margin, y).lineTo(pageW - margin, y).strokeColor("#e0e0e0").lineWidth(1).stroke();
    y += 20;

    // ─── DATI ACQUIRENTE ─────────────────────────────────────────────────────
    doc.fontSize(10).fillColor(VERDE_SCURO).font("Helvetica-Bold").text("DATI ACQUIRENTE", margin, y);
    y += 16;

    const colW = contentW / 2 - 10;
    const righeAcquirente: [string, string][] = [
      ["Nome / Cognome", data.nomeAcquirente],
      ["Email", data.emailAcquirente],
    ];
    if (data.ragioneSocialeAcquirente) righeAcquirente.push(["Ragione Sociale", data.ragioneSocialeAcquirente]);
    if (data.telefonoAcquirente) righeAcquirente.push(["Telefono", data.telefonoAcquirente]);

    righeAcquirente.forEach(([label, val], i) => {
      const col = i % 2 === 0 ? margin : margin + colW + 20;
      const row = y + Math.floor(i / 2) * 28;
      doc.fontSize(8).fillColor(GRIGIO_CHIARO).font("Helvetica").text(label.toUpperCase(), col, row);
      doc.fontSize(10).fillColor(GRIGIO).font("Helvetica").text(val, col, row + 11);
    });

    y += Math.ceil(righeAcquirente.length / 2) * 28 + 10;

    // Dati installatore (se presenti)
    if (data.installatoreRagioneSociale) {
      doc.moveTo(margin, y).lineTo(pageW - margin, y).strokeColor("#e0e0e0").lineWidth(0.5).stroke();
      y += 14;
      doc.fontSize(10).fillColor(VERDE_SCURO).font("Helvetica-Bold").text("INSTALLATORE", margin, y);
      y += 16;
      doc.fontSize(8).fillColor(GRIGIO_CHIARO).font("Helvetica").text("RAGIONE SOCIALE", margin, y);
      doc.fontSize(10).fillColor(GRIGIO).font("Helvetica").text(data.installatoreRagioneSociale, margin, y + 11);
      if (data.installatorePartitaIva) {
        doc.fontSize(8).fillColor(GRIGIO_CHIARO).font("Helvetica").text("PARTITA IVA", margin + colW + 20, y);
        doc.fontSize(10).fillColor(GRIGIO).font("Helvetica").text(data.installatorePartitaIva, margin + colW + 20, y + 11);
      }
      y += 30;
      if (data.installatoreCitta || data.installatoreProvincia) {
        const sede = [data.installatoreCitta, data.installatoreProvincia].filter(Boolean).join(" (") + (data.installatoreProvincia ? ")" : "");
        doc.fontSize(8).fillColor(GRIGIO_CHIARO).font("Helvetica").text("SEDE", margin, y);
        doc.fontSize(10).fillColor(GRIGIO).font("Helvetica").text(sede, margin, y + 11);
        y += 28;
      }
    }

    y += 10;

    // ─── DIVISORE ────────────────────────────────────────────────────────────
    doc.moveTo(margin, y).lineTo(pageW - margin, y).strokeColor("#e0e0e0").lineWidth(1).stroke();
    y += 20;

    // ─── DETTAGLIO ORDINE ────────────────────────────────────────────────────
    doc.fontSize(10).fillColor(VERDE_SCURO).font("Helvetica-Bold").text("DETTAGLIO ORDINE", margin, y);
    y += 16;

    // Intestazione tabella
    doc.rect(margin, y, contentW, 22).fill("#f5f5f5");
    doc.fontSize(8).fillColor(GRIGIO).font("Helvetica-Bold")
      .text("DESCRIZIONE", margin + 8, y + 7)
      .text("PRATICHE INCLUSE", margin + contentW * 0.45, y + 7)
      .text("IMPORTO", pageW - margin - 80, y + 7, { width: 72, align: "right" });
    y += 22;

    // Riga prodotto
    doc.rect(margin, y, contentW, 40).fill("white").stroke("#e0e0e0");
    const nomePack = NOMI_PACK[data.packId] ?? data.packId;
    doc.fontSize(11).fillColor(VERDE_SCURO).font("Helvetica-Bold")
      .text(nomePack, margin + 8, y + 6);
    doc.fontSize(8).fillColor(GRIGIO_CHIARO).font("Helvetica")
      .text("Pratiche fotovoltaico — Residenziale & Business", margin + 8, y + 22);

    if (data.packId !== "singolo") {
      doc.fontSize(9).fillColor(GRIGIO).font("Helvetica")
        .text(`${data.pratiche_incluse_residenziali} Residenziali + ${data.pratiche_incluse_business} Business`, margin + contentW * 0.45, y + 14);
    } else {
      doc.fontSize(9).fillColor(GRIGIO).font("Helvetica")
        .text("Pratiche singole", margin + contentW * 0.45, y + 14);
    }

    const importoDisplay = data.packId !== "singolo"
      ? PREZZI_PACK[data.packId] ?? `€ ${parseFloat(data.importo).toFixed(2)}`
      : `€ ${parseFloat(data.importo).toFixed(2)}`;

    doc.fontSize(13).fillColor(VERDE_SCURO).font("Helvetica-Bold")
      .text(importoDisplay, pageW - margin - 80, y + 11, { width: 72, align: "right" });
    y += 40;

    // Totale
    doc.rect(margin, y, contentW, 30).fill(VERDE_SCURO);
    doc.fontSize(10).fillColor("white").font("Helvetica-Bold")
      .text("TOTALE", margin + 8, y + 9)
      .text(importoDisplay, pageW - margin - 80, y + 9, { width: 72, align: "right" });
    y += 30;

    // Note IVA
    y += 8;
    doc.fontSize(8).fillColor(GRIGIO_CHIARO).font("Helvetica")
      .text("Importi esenti IVA (Reverse charge Art. 17, c. 6 lett. a), DPR 633/72)", margin, y, { width: contentW });

    // ─── NOTE ────────────────────────────────────────────────────────────────
    if (data.note) {
      y += 24;
      doc.moveTo(margin, y).lineTo(pageW - margin, y).strokeColor("#e0e0e0").lineWidth(0.5).stroke();
      y += 12;
      doc.fontSize(9).fillColor(VERDE_SCURO).font("Helvetica-Bold").text("NOTE", margin, y);
      y += 14;
      doc.fontSize(9).fillColor(GRIGIO).font("Helvetica").text(data.note, margin, y, { width: contentW });
    }

    // ─── FOOTER ──────────────────────────────────────────────────────────────
    const footerY = doc.page.height - 50;
    doc.rect(0, footerY - 10, pageW, 60).fill(VERDE_SCURO);
    doc.fontSize(8).fillColor("white").font("Helvetica")
      .text("Ricaricati di Connessioni — soluzionipratiche.info", margin, footerY, { width: contentW, align: "center" });
    doc.fontSize(7).fillColor(GIALLO).font("Helvetica")
      .text("Questo documento è una ricevuta riepilogativa e non costituisce fattura fiscale.", margin, footerY + 14, { width: contentW, align: "center" });

    doc.end();
  });
}
