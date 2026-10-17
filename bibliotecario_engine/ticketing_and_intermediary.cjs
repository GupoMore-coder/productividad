/**
 * PROTOCOLO DE INTERMEDIACIÓN, TICKETING Y ATENCIÓN CLÍNICA (FASE 3)
 * Gerente General: Dr. Fernando Marulanda
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { createSecureDownloadToken } = require('./anonymous_proxy.cjs');

const CATALOG_PATH = path.join(__dirname, 'knowledge', 'master_catalog.json');
const TICKETS_PATH = path.join(__dirname, 'knowledge', 'pending_tickets.json');

function loadCatalog() {
  if (fs.existsSync(CATALOG_PATH)) {
    try { return JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8')); } catch(e){}
  }
  return [];
}

function loadTickets() {
  if (fs.existsSync(TICKETS_PATH)) {
    try { return JSON.parse(fs.readFileSync(TICKETS_PATH, 'utf8')); } catch(e){}
  }
  return [];
}

function saveTickets(tickets) {
  fs.writeFileSync(TICKETS_PATH, JSON.stringify(tickets, null, 2), 'utf8');
}

const STOPWORDS = new Set([
  'por', 'para', 'con', 'este', 'esta', 'estos', 'estas', 'favor', 'ayuda', 'ayudan', 'ayudame',
  'hola', 'buenas', 'dias', 'tardes', 'noches', 'como', 'cual', 'que', 'los', 'las', 'del', 'una', 'uno',
  'articulo', 'articulos', 'paper', 'papers', 'documento', 'documentos', 'sobre', 'busco', 'necesito', 'doi'
]);

/**
 * POSIBILIDAD 1: Búsqueda Ultrarrápida a Costo Cero de Tokens
 */
function searchClinicalLiterature(query) {
  const catalog = loadCatalog();
  const q = (query || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const rawTokens = q.split(/[\s,.;:!?()]+/).filter(t => t.length > 2);
  const tokens = rawTokens.filter(t => !STOPWORDS.has(t));

  if (tokens.length === 0) return [];

  const scored = [];
  for (const doc of catalog) {
    const hay = ` ${doc.title} ${doc.author} ${doc.category} ${doc.aoClass} ${doc.meshTerms} ${doc.year} `
      .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    let score = 0;
    for (const t of tokens) {
      if (hay.includes(` ${t} `) || hay.includes(t)) {
        score += (hay.includes(` ${t} `) ? 20 : 10);
      }
    }
    if (score >= 20 || (tokens.length === 1 && score >= 10)) {
      scored.push({ doc, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 5).map(s => s.doc);
}

/**
 * Consulta a la API pública de NCBI / PubMed para enriquecer metadatos de documentos solicitados
 */
function fetchPubMedMetadata(query) {
  return new Promise((resolve) => {
    const cleanQ = encodeURIComponent(query.trim());
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${cleanQ}&retmode=json&retmax=1`;

    https.get(searchUrl, { timeout: 6000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const idList = json.esearchresult?.idlist || [];
          if (idList.length === 0) return resolve(null);

          const pmid = idList[0];
          const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmid}&retmode=json`;
          https.get(summaryUrl, { timeout: 6000 }, (res2) => {
            let sumData = '';
            res2.on('data', c => sumData += c);
            res2.on('end', () => {
              try {
                const sumJson = JSON.parse(sumData);
                const item = sumJson.result?.[pmid];
                if (!item) return resolve(null);
                resolve({
                  pmid: pmid,
                  title: item.title,
                  author: item.authors?.[0]?.name || 'Autor no registrado',
                  journal: item.source,
                  pubdate: item.pubdate,
                  doi: (item.articleids || []).find(a => a.idtype === 'doi')?.value || null
                });
              } catch(e) { resolve(null); }
            });
          }).on('error', () => resolve(null));
        } catch(e) { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

/**
 * POSIBILIDAD 2: Creación de Ticket de Solicitud Pendiente
 */
function createLiteratureTicket({ requestedTitle, doiOrIsbn, requesterPhone, requesterName, requesterUniversity }) {
  const tickets = loadTickets();
  const ticketId = `TCK-${String(tickets.length + 1).padStart(4, '0')}`;

  const newTicket = {
    id: ticketId,
    title: requestedTitle,
    doiOrIsbn: doiOrIsbn || 'No aportado',
    requester: {
      phone: requesterPhone,
      name: requesterName,
      university: requesterUniversity
    },
    status: 'PENDIENTE',
    createdAt: new Date().toISOString(),
    resolvedAt: null,
    resolvedByDocId: null
  };

  tickets.push(newTicket);
  saveTickets(tickets);
  return newTicket;
}

/**
 * Genera el mensaje formateado de alerta para el WhatsApp del Gerente General
 */
function formatGerenteAlertMessage(ticket, pubMedMeta = null) {
  return `🔔 *ALERTA DE SOLICITUD BIBLIOGRÁFICA PENDIENTE*\n` +
         `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
         `📋 *Ticket:* \`${ticket.id}\`\n` +
         `📖 *Documento:* ${pubMedMeta?.title || ticket.title}\n` +
         `✍️ *Autor/Revista:* ${pubMedMeta ? `${pubMedMeta.author} (${pubMedMeta.journal})` : 'Pendiente'}\n` +
         `🔗 *DOI / Identificador:* \`${pubMedMeta?.doi || ticket.doiOrIsbn}\`\n` +
         `👤 *Médico Solicitante:* ${ticket.requester.name} (${ticket.requester.university})\n` +
         `📱 *Teléfono:* \`${ticket.requester.phone}\`\n` +
         `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
         `💡 *Acción Requerida:* Una vez disponga del PDF, deposítelo en la carpeta \`_BIBLIOTECARIO\` de Google Drive. El sistema lo clasificará y despachará al usuario automáticamente.`;
}

/**
 * POSIBILIDAD 2: Cierre de Ciclo Automático al Ingresar Documento en _BIBLIOTECARIO
 */
function resolvePendingTicketsByDocument({ filename, docId, uploader = null }) {
  const tickets = loadTickets();
  const normFile = filename.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const resolutions = [];

  for (const t of tickets) {
    if (t.status === 'PENDIENTE') {
      const normTicketTitle = t.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const words = normTicketTitle.split(/\s+/).filter(w => w.length > 3);
      const match = words.filter(w => normFile.includes(w)).length >= Math.min(words.length, 3);

      if (match) {
        t.status = 'DISPONIBLE';
        t.resolvedAt = new Date().toISOString();
        t.resolvedByDocId = docId;

        // Generar token anónimo para el solicitante
        const downloadToken = createSecureDownloadToken({
          driveId: docId,
          userPhone: t.requester.phone
        });

        resolutions.push({
          ticket: t,
          downloadToken,
          messageForRequester: `🎉 *¡Tu documento solicitado ya está disponible!*\n\n` +
                               `Estimado(a) ${t.requester.name}: El artículo *"${t.title}"* ha sido incorporado a la biblioteca.\n\n` +
                               (uploader ? `Agradecimiento especial al Dr.(a) ${uploader.name} (${uploader.university}) por facilitar este aporte.\n\n` : '') +
                               `👉 Ya puedes descargarlo de forma segura desde este chat.`,
          messageForUploader: uploader ? `❤️ *¡Tu aporte ha sido de gran ayuda!*\n\n` +
                                         `El documento que compartiste ayudó a resolver la solicitud del Dr.(a) ${t.requester.name} de la ${t.requester.university}. ¡Gracias por apoyar la formación médica!` : null
        });
      }
    }
  }

  if (resolutions.length > 0) {
    saveTickets(tickets);
  }

  return resolutions;
}

/**
 * POSIBILIDAD 3: Generación de Resumen de Catálogo por Temas
 */
function generateCategorySummary(category) {
  const catalog = loadCatalog();
  const normCat = category.toLowerCase().trim();
  const filtered = catalog.filter(d => (d.category || '').toLowerCase().includes(normCat));

  return {
    category: category,
    totalTitles: filtered.length,
    titles: filtered.slice(0, 15).map(d => ({
      year: d.year,
      author: d.author,
      title: d.title,
      ao: d.aoClass !== 'N/A' ? d.aoClass : null,
      id: d.id
    }))
  };
}

module.exports = {
  searchClinicalLiterature,
  fetchPubMedMetadata,
  createLiteratureTicket,
  formatGerenteAlertMessage,
  resolvePendingTicketsByDocument,
  generateCategorySummary
};
