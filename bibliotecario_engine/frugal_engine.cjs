const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const { PDFParse } = require('C:/Users/ferna/Documents/Biblioteca Premium/node_modules/pdf-parse');

const KNOWLEDGE_DIR = path.join(__dirname, 'knowledge');
const SIGNATURES_FILE = path.join(KNOWLEDGE_DIR, 'publisher_signatures.json');
const RULES_FILE = path.join(KNOWLEDGE_DIR, 'cross_topic_rules.json');
const REGISTRY_FILE = path.join(KNOWLEDGE_DIR, 'global_registry.json');

// Cargar bases de conocimiento
function loadJSON(file, defaultVal = {}) {
  if (fs.existsSync(file)) {
    try { return JSON.parse(fs.readFileSync(file, 'utf-8')); } catch (e) {}
  }
  return defaultVal;
}

function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

const signaturesData = loadJSON(SIGNATURES_FILE, { signatures: {}, learned_patterns: [] });
const crossTopicData = loadJSON(RULES_FILE, { rules: [] });
const globalRegistry = loadJSON(REGISTRY_FILE, { hashes: {}, processed_files: [] });

// Nivel 0: Hash SHA-256
function computeSha256(filePath) {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// Nivel 1: Consulta CrossRef (0 tokens)
function fetchCrossRef(doi) {
  return new Promise((resolve) => {
    if (!doi) return resolve(null);
    const cleanDoi = doi.trim().replace(/^https?:\/\/doi\.org\//i, '').replace(/[;.,)]$/, '');
    const url = `https://api.crossref.org/works/${encodeURIComponent(cleanDoi)}`;
    const req = https.get(url, {
      headers: { 'User-Agent': 'AntigravityBibliotecario/2.0 (mailto:fernando@example.com)' },
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.status === 'ok') {
            const item = json.message;
            const title = item.title && item.title.length > 0 ? item.title[0] : null;
            const year = item['published-print']?.['date-parts']?.[0]?.[0] || 
                         item['published-online']?.['date-parts']?.[0]?.[0] || 
                         item['issued']?.['date-parts']?.[0]?.[0] || null;
            let author = null;
            if (item.author && item.author.length > 0) {
              const a = item.author[0];
              author = a.family ? (a.given ? `${a.family}, ${a.given}` : a.family) : (a.name || null);
            }
            const journal = item['container-title'] ? item['container-title'][0] : '';
            resolve({ success: true, title, year, author, journal, source: 'CrossRef' });
          } else {
            resolve(null);
          }
        } catch (e) { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

// Nivel 2: Consulta ISBN (0 tokens)
function fetchGoogleBooksByISBN(isbn) {
  return new Promise((resolve) => {
    if (!isbn) return resolve(null);
    const cleanIsbn = isbn.replace(/[^0-9X]/gi, '');
    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`;
    const req = https.get(url, { timeout: 5000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.totalItems > 0 && json.items && json.items[0]) {
            const vol = json.items[0].volumeInfo;
            const title = vol.title;
            const year = vol.publishedDate ? parseInt(vol.publishedDate.substring(0, 4)) : null;
            let author = null;
            if (vol.authors && vol.authors.length > 0) {
              const rawA = vol.authors[0];
              const parts = rawA.split(' ');
              author = parts.length > 1 ? `${parts[parts.length - 1]}, ${parts.slice(0, -1).join(' ')}` : rawA;
            }
            resolve({ success: true, title, year, author, publisher: vol.publisher, source: 'GoogleBooks' });
          } else {
            resolve(null);
          }
        } catch (e) { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

function sanitizeFileName(str) {
  if (!str) return '';
  let clean = str.replace(/[<>:"/\\|?*]/g, '')
                 .replace(/[\r\n\t]+/g, ' ')
                 .replace(/\s+/g, ' ')
                 .trim();
  // Quitar puntos finales
  clean = clean.replace(/\.+$/, '');
  return clean;
}

// Extractor de Edición
function extractEdition(text) {
  const match = text.match(/\b([1-9]|10)(?:st|nd|rd|th|ª|a)?\s*(?:edition|edición|ed\.?)\b/i) ||
                text.match(/\b(?:edition|edición|ed\.?)\s*([1-9]|10)\b/i);
  if (match) {
    return `Ed. ${match[1]}`;
  }
  return null;
}

module.exports = {
  computeSha256,
  fetchCrossRef,
  fetchGoogleBooksByISBN,
  sanitizeFileName,
  extractEdition,
  signaturesData,
  crossTopicData,
  globalRegistry,
  saveGlobalRegistry: (data) => saveJSON(REGISTRY_FILE, data)
};
