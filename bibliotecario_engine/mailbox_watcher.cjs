/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires, no-undef, no-empty */
/**
 * BIBLIOTECARIO WATCHER DAEMON (Vigilante Permanente de Buzón)
 * Monitorea continuamente 'H:\Mi unidad\Información Ortopedia\_BIBLIOTECARIO'
 * Cada vez que se deposita un archivo:
 *  1. Espera a que termine la sincronización/escritura (estabilidad de tamaño).
 *  2. Calcula SHA-256 criptográfico.
 *  3. Si ya existe en global_registry.json -> Evacúa a C:\Users\ferna\Music (Regla 10).
 *  4. Si es nuevo -> Extrae texto/DOI, consulta CrossRef, estandariza nombre,
 *     traslada a la carpeta anatómica canónica, genera copias multi-tópicas (Regla 3)
 *     y actualiza el registro global.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const { PDFParse } = require('C:/Users/ferna/Documents/Biblioteca Premium/node_modules/pdf-parse');
const { analyzeSpecializedDocument } = require('./classifier_heuristics.cjs');
const { sendToRecycleBin } = require('./trash_util.cjs');

const BASE_DIR = 'H:\\Mi unidad\\Información Ortopedia';
const MAILBOX_DIR = path.join(BASE_DIR, '_BIBLIOTECARIO');
const MUSIC_DIR = 'C:\\Users\\ferna\\Music';
const REGISTRY_PATH = 'C:\\Users\\ferna\\Documents\\Antigravity Project\\bibliotecario_engine\\knowledge\\global_registry.json';
const LOG_FILE = path.join(__dirname, 'mailbox_activity.log');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n', 'utf8');
}

function computeSha256(filePath) {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function safeMoveToMusic(srcPath, filename) {
  if (!fs.existsSync(MUSIC_DIR)) fs.mkdirSync(MUSIC_DIR, { recursive: true });
  const destPath = path.join(MUSIC_DIR, filename);
  fs.copyFileSync(srcPath, destPath);
  fs.unlinkSync(srcPath);
  log(`[DEDUPLICACIÓN REGLA 10] Duplicado evacuado a Music: "${filename}"`);
}

function safeCopy(srcPath, targetFolder, targetName) {
  const targetDir = path.join(BASE_DIR, targetFolder);
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
  
  try {
    const stat = fs.statSync(srcPath);
    // Para archivos mayores a 5 MB, política de Espacio Cero: puntero .url de 1 KB
    if (stat.size > 5 * 1024 * 1024) {
      const linkName = targetName.replace(/\.[^.]+$/, '') + ' [Acceso Canónico].url';
      const linkPath = path.join(targetDir, linkName);
      const urlContent = `[InternetShortcut]\r\nURL=file:///${srcPath.replace(/\\/g, '/')}\r\n`;
      fs.writeFileSync(linkPath, urlContent, 'utf8');
      log(`  [MULTI-TÓPICO ESPACIO CERO] Puntero de 1 KB creado en "${targetFolder}/${linkName}"`);
      return;
    }
  } catch(e){}

  const destPath = path.join(targetDir, targetName);
  if (!fs.existsSync(destPath)) {
    fs.copyFileSync(srcPath, destPath);
    log(`  [MULTI-TÓPICO REGLA 3] Copia secundaria creada en: "${targetFolder}/${targetName}"`);
  }
}

function fetchCrossRef(doi) {
  return new Promise((resolve) => {
    if (!doi) return resolve(null);
    const cleanDoi = doi.trim().replace(/^https?:\/\/doi\.org\//i, '').replace(/[;.,)]$/, '');
    const url = `https://api.crossref.org/works/${encodeURIComponent(cleanDoi)}`;
    const req = https.get(url, {
      headers: { 'User-Agent': 'AntigravityBibliotecarioWatcher/2.0' },
      timeout: 8000
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
            resolve({ success: true, title, year, author });
          } else { resolve(null); }
        } catch (e) { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

function determineDestination(text) {
  const t = text.toLowerCase();

  // Polytrauma & Shock & Scoring & Trauma general -> Temas generales
  if (t.includes('polytrauma') || t.includes('politrauma') || t.includes('resuscitation') || 
      t.includes('injury scoring') || t.includes('mangled extremity') || t.includes('damage control') ||
      t.includes('early appropriate care') || t.includes('definitive care')) {
    let multi = [];
    if (t.includes('femur') || t.includes('femoral')) multi.push('Femur');
    if (t.includes('pelvi') || t.includes('pelvic packing')) multi.push('Cadera y Pelvis');
    if (t.includes('amputation') || t.includes('limb salvage')) multi.push('Reconstructiva');
    return { primary: 'Temas generales', multi };
  }

  // Pelvic packing -> Cadera y Pelvis
  if (t.includes('pelvic packing') || (t.includes('pelvic') && t.includes('fractur'))) {
    return { primary: 'Cadera y Pelvis', multi: ['Temas generales', 'Abordajes'] };
  }

  // 1. Mano & Muñeca (prioridad sobre huesos largos para radio distal)
  if (t.includes('hand') || t.includes('wrist') || t.includes('carpal') || t.includes('carpo') || 
      t.includes('muñeca') || t.includes('mano') || t.includes('metacarp') || t.includes('thumb') || 
      t.includes('scaphoid') || t.includes('volar') || t.includes('soong') || t.includes('distal radius') || 
      t.includes('radio distal') || t.includes('flexor tendon') || t.includes('extensor tendon') ||
      t.includes('dupuytren') || t.includes('de quervain') || t.includes('dedo en gatillo')) {
    return { primary: 'Mano', multi: (t.includes('approach') || t.includes('abordaje')) ? ['Abordajes'] : (t.includes('plate') ? ['Materiales Osteosintesis'] : []) };
  }

  // 2. Metabolismo Óseo
  if (t.includes('heterotopic ossification') || t.includes('osificación heterotópica') || 
      t.includes('osteoporosis') || t.includes('metabolismo óseo') || t.includes('bone turnover') || 
      t.includes('rickets') || t.includes('osteomalacia') || t.includes('paget') || t.includes('densitomet')) {
    return { primary: 'Metabolismo Óseo', multi: t.includes('hip') || t.includes('cadera') ? ['Cadera y Pelvis'] : ['Temas generales'] };
  }

  // 3. Columna
  if (t.includes('synmesh') || t.includes('columna') || t.includes('cervical spine') || 
      t.includes('lumbar') || t.includes('scoliosis') || t.includes('espondilo') || 
      t.includes('discectomy') || t.includes('hernia discal') || 
      (t.includes('spine') && !t.includes('scapular spine') && !t.includes('iliac spine'))) {
    return { primary: 'Columna', multi: t.includes('synmesh') ? ['Catálogos de Materiales ortopédicos'] : [] };
  }

  // 4. Hombro
  if (t.includes('shoulder') || t.includes('hombro') || t.includes('scapular') || 
      t.includes('acromial') || t.includes('clavicle') || t.includes('clavícula') || t.includes('rotator cuff')) {
    return { primary: 'Hombro', multi: (t.includes('book') || t.includes('the-shoulder')) ? ['Libros'] : [] };
  }

  // 5. Codo
  if (t.includes('elbow') || t.includes('codo') || t.includes('olecranon') || t.includes('distal humerus')) {
    return { primary: 'Codo', multi: [] };
  }

  // 6. Cadera y Pelvis
  if (t.includes('hip') || t.includes('cadera') || t.includes('acetabul') || t.includes('pelvis') || t.includes('bombelli')) {
    let multi = [];
    if (t.includes('approach') || t.includes('incision') || t.includes('osteotomy')) multi.push('Abordajes');
    if (t.includes('book') || t.includes('bombelli')) multi.push('Libros');
    return { primary: 'Cadera y Pelvis', multi };
  }

  // 7. Pie y Tobillo
  if (t.includes('foot') || t.includes('ankle') || t.includes('pie') || t.includes('tobillo') || 
      t.includes('calcane') || t.includes('talus') || t.includes('sindesmosis') || t.includes('pilon') ||
      t.includes('hallux') || t.includes('malleol') || t.includes('maleol') || t.includes('lisfranc') || 
      t.includes('chopart') || t.includes('metatars') || t.includes('achilles') || t.includes('aquiles')) {
    let multi = [];
    if (t.includes('book') || t.includes('atlas')) multi.push('Libros');
    if (t.includes('arthroscop')) multi.push('Ortopedia Deportiva y artroscopia');
    return { primary: 'Pie y Tobillo', multi };
  }

  // 8. Rodilla y Tibia
  if (t.includes('knee') || t.includes('rodilla') || t.includes('tibia') || t.includes('patell') || 
      t.includes('rotula') || t.includes('menisc') || t.includes('cruciate')) {
    let multi = [];
    if (t.includes('approach') || t.includes('incision')) multi.push('Abordajes');
    if (t.includes('arthroscop')) multi.push('Ortopedia Deportiva y artroscopia');
    return { primary: 'Rodilla y Tibia', multi };
  }

  // 9. Fémur
  if (t.includes('femur') || t.includes('fémur') || t.includes('femoral')) {
    return { primary: 'Femur', multi: [] };
  }

  // 10. Húmero
  if (t.includes('humerus') || t.includes('húmero') || t.includes('humeral')) {
    return { primary: 'Humero', multi: [] };
  }

  // 11. Reconstructiva
  if (t.includes('reconstruct') || t.includes('flaps') || t.includes('colgajo') || 
      t.includes('limb reconstruction') || t.includes('masquelet') || t.includes('external fixation') ||
      t.includes('ilizarov') || t.includes('fijador externo')) {
    return { primary: 'Reconstructiva', multi: ['Tejidos blandos'] };
  }

  // 12. Pediatría
  if (t.includes('pediatric') || t.includes('pediatría') || t.includes('cerebral palsy') || t.includes('niños')) {
    return { primary: 'Ortopedia Pediatrica', multi: [] };
  }

  // 13. Infeccioso
  if (t.includes('infect') || t.includes('osteomyelitis') || t.includes('antimicrobial') || t.includes('biofilm') || t.includes('gunshot')) {
    return { primary: 'Infeccioso', multi: ['Temas generales'] };
  }

  // 14. Materiales Osteosíntesis
  if (t.includes('cerclage') || t.includes('biomechanic') || t.includes('plate') || t.includes('screw') || t.includes('ortobiologicos')) {
    return { primary: 'Materiales Osteosintesis', multi: [] };
  }

  return { primary: 'Temas generales', multi: [] };
}

function sanitizeAndShorten(name, defaultExt = '.pdf') {
  const extMatch = name.match(/\.(pdf|pptx|ppt|docx|doc|pub|epub|odt)$/i);
  const ext = extMatch ? extMatch[0].toLowerCase() : (defaultExt.startsWith('.') ? defaultExt.toLowerCase() : '.' + defaultExt.toLowerCase());
  let clean = name.replace(/[\u2010\u2011\u2012\u2013\u2014\u2015]/g, '-')
                  .replace(/[<>:"/\\|?*]/g, '')
                  .replace(/\s+/g, ' ')
                  .trim()
                  .replace(/\.+$/, '');
  clean = clean.replace(/\.(pdf|pptx|ppt|docx|doc|pub|epub|odt)$/i, '').trim();
  if (clean.length > 130) clean = clean.substring(0, 130).trim();
  return clean + ext;
}

function extractOfficeMetadataAndText(filePath) {
  try {
    const { execFileSync } = require('child_process');
    const pyScript = `
import sys, zipfile, xml.etree.ElementTree as ET, json, re
path = sys.argv[1]
res = {"title": "", "author": "", "year": None, "text": ""}
try:
    with zipfile.ZipFile(path, 'r') as z:
        names = z.namelist()
        if 'docProps/core.xml' in names:
            root = ET.fromstring(z.read('docProps/core.xml'))
            for el in root.iter():
                tag = el.tag.split('}')[-1].lower()
                if tag == 'title' and el.text: res['title'] = el.text.strip()
                elif tag == 'creator' and el.text: res['author'] = el.text.strip()
                elif tag in ('created', 'modified') and el.text and not res['year']:
                    m = re.search(r'(19\\d\\d|20\\d\\d)', el.text)
                    if m: res['year'] = int(m.group(1))
        opf_files = [n for n in names if n.lower().endswith('.opf')]
        if opf_files:
            try:
                root = ET.fromstring(z.read(opf_files[0]))
                for el in root.iter():
                    tag = el.tag.split('}')[-1].lower()
                    if tag == 'title' and el.text and not res['title']: res['title'] = el.text.strip()
                    elif tag == 'creator' and el.text and not res['author']: res['author'] = el.text.strip()
                    elif tag == 'date' and el.text and not res['year']:
                        m = re.search(r'(19\\d\\d|20\\d\\d)', el.text)
                        if m: res['year'] = int(m.group(1))
            except Exception:
                pass
        texts = []
        target_xmls = [n for n in names if n.startswith('word/document') or n.startswith('ppt/slides/slide')][:5]
        for tx in target_xmls:
            root = ET.fromstring(z.read(tx))
            texts.append(' '.join(t.strip() for t in root.itertext() if t.strip()))
        html_files = [n for n in names if re.search(r'\\.(?:x?html|htm)$', n, re.I)][:5]
        for hf in html_files:
            try:
                root = ET.fromstring(z.read(hf))
                texts.append(' '.join(t.strip() for t in root.itertext() if t.strip()))
            except Exception:
                pass
        res['text'] = ' '.join(texts)[:6000]
except Exception as e:
    res['error'] = str(e)
print(json.dumps(res, ensure_ascii=False))
`;
    const out = execFileSync('python', ['-c', pyScript, filePath], { encoding: 'utf8', timeout: 8000 });
    return JSON.parse(out.trim());
  } catch (e) {
    return null;
  }
}

async function processFile(filename) {
  const filePath = path.join(MAILBOX_DIR, filename);
  if (!fs.existsSync(filePath)) return;

  log(`[NUEVO ARCHIVO DETECTADO EN _BIBLIOTECARIO] "${filename}"`);

  // 1. Cargar registro
  let registry = { hashes: {} };
  if (fs.existsSync(REGISTRY_PATH)) {
    try { registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8')); } catch (e) {}
  }

  // 2. Hash
  const sha = computeSha256(filePath);
  if (registry.hashes[sha]) {
    const existing = registry.hashes[sha];
    log(`[DUPLICADO CONFIRMADO] El archivo ya existe canónicamente en "${existing.folder || existing.path}/${existing.canonicalName || existing.name}".`);
    sendToRecycleBin(filePath);
    log(`[DESCARTE A PAPELERA] Archivo duplicado "${filename}" eliminado de Google Drive y enviado a papelera.`);
    return;
  }

  // 3. Inspeccionar documento (.pdf, .pptx, .docx, .pub, .epub)
  const originalExt = path.extname(filename).toLowerCase() || '.pdf';
  let year = new Date().getFullYear();
  let author = 'S-A';
  let title = filename.replace(/\.(pdf|pptx|ppt|docx|doc|pub|epub|odt)$/i, '');
  let fullText = filename;
  let firstPageText = '';
  let lastPageText = '';

  if (originalExt === '.pdf') {
    try {
      const buf = fs.readFileSync(filePath);
      const parser = new PDFParse({ data: buf });
      
      // Extraer primeras páginas
      const resFirst = await parser.getText({ first: 2 });
      firstPageText = resFirst.text || '';
      fullText += ' ' + firstPageText;

      // Extraer última página para colofón/copyright
      try {
        const resLast = await parser.getText({ last: 1 });
        lastPageText = resLast.text || '';
        fullText += ' ' + lastPageText;
      } catch(e){}

      const doiMatch = fullText.match(/10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+/);
      if (doiMatch) {
        const cr = await fetchCrossRef(doiMatch[0]);
        if (cr && cr.success) {
          if (cr.year) year = cr.year;
          if (cr.author) author = cr.author;
          if (cr.title) title = cr.title;
        }
      }
      await parser.destroy();
    } catch (err) {
      log(`[WARN PARSE] No se pudo extraer texto profundo: ${err.message}`);
    }
  } else if (originalExt === '.pptx' || originalExt === '.docx' || originalExt === '.epub') {
    const officeMeta = extractOfficeMetadataAndText(filePath);
    if (officeMeta) {
      if (officeMeta.year) year = officeMeta.year;
      if (officeMeta.author && officeMeta.author.length > 1) author = officeMeta.author;
      if (officeMeta.title && officeMeta.title.length > 3) title = officeMeta.title;
      if (officeMeta.text) {
        firstPageText = officeMeta.text;
        fullText += ' ' + officeMeta.text;
      }
    }
  }

  // 4. Determinar destino y clasificación especializada
  let dest = null;
  let standardName = null;

  const spec = analyzeSpecializedDocument({
    filename,
    firstPageText,
    lastPageText,
    fullText
  });

  if (spec.matched) {
    dest = { primary: spec.targetFolder, multi: [] };
    standardName = sanitizeAndShorten(spec.standardName || spec.suggestedName, originalExt);
    log(`[HEURÍSTICA ESPECIALIZADA ACTIVADA] Regla: ${spec.strategy || spec.ruleId} -> Destino: ${dest.primary}`);
  } else {
    dest = determineDestination(fullText);
    if ((originalExt === '.pptx' || originalExt === '.ppt') && dest.primary === 'Temas generales') {
      dest.primary = 'zPresentaciones';
    } else if ((originalExt === '.pptx' || originalExt === '.ppt') && !dest.multi.includes('zPresentaciones')) {
      dest.multi.push('zPresentaciones');
    }
    standardName = sanitizeAndShorten(`${year} - ${author} - ${title}`, originalExt);
  }

  const targetDir = path.join(BASE_DIR, dest.primary);
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
  const destPath = path.join(targetDir, standardName);

  // Mover archivo
  fs.copyFileSync(filePath, destPath);
  fs.unlinkSync(filePath);
  log(`[CLASIFICACIÓN EXITOSA] Trasladado a "${dest.primary}/${standardName}"`);

  // Registrar en Registro Criptográfico
  registry.hashes[sha] = {
    folder: dest.primary,
    canonicalName: standardName,
    path: path.relative(BASE_DIR, destPath)
  };
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2), 'utf8');

  // Indexar en Memoria Persistente Engram MCP (SQLite + FTS5)
  try {
    const { DatabaseSync } = require('node:sqlite');
    const os = require('os');
    const dbPath = path.join(os.homedir(), '.engram', 'engram.db');
    if (fs.existsSync(dbPath)) {
      const engramDb = new DatabaseSync(dbPath);
      const syncId = 'obs-' + crypto.randomBytes(8).toString('hex');
      const topicKey = `ortopedia/${dest.primary.toLowerCase().replace(/[^a-z0-9]/g, '_')}/${author.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20)}`;
      const content = `# ${standardName}\n- **Especialidad:** ${dest.primary}\n- **Año:** ${year}\n- **Autor:** ${author}\n- **Título:** ${title}\n- **Ruta Canónica:** ${destPath}\n- **SHA-256:** ${sha}\n- **Palabras Clave:** ortopedia, ${dest.primary.toLowerCase()}`;
      
      engramDb.prepare(`
        INSERT INTO observations (
          sync_id, session_id, type, title, content, project, scope, topic_key,
          normalized_hash, pinned, created_at, updated_at
        ) VALUES (?, 'session-biblioteca-ortopedia', 'literature', ?, ?, 'biblioteca-ortopedia', 'project', ?, ?, 1, datetime('now'), datetime('now'))
      `).run(syncId, standardName.replace(/\.[^.]+$/, ''), content, topicKey, sha);
      log(`  [ENGRAM MEMORIA] Indexado automáticamente en FTS5: "${standardName}"`);
    }
  } catch(err) {
    log(`  [ENGRAM WARN] No se pudo indexar en Engram: ${err.message}`);
  }

  // Copias multi-tópicas de Espacio Cero
  for (const mf of dest.multi) {
    safeCopy(destPath, mf, standardName);
  }
}

// Bucle de monitoreo cada 10 segundos
let isRunning = false;
async function monitorLoop() {
  log('Iniciando Bibliotecario Watcher Daemon en segundo plano...');
  setInterval(async () => {
    if (isRunning) return;
    isRunning = true;
    try {
      if (!fs.existsSync(MAILBOX_DIR)) return;
      const files = fs.readdirSync(MAILBOX_DIR).filter(f => f.toLowerCase() !== 'desktop.ini');
      for (const f of files) {
        if (!fs.existsSync(path.join(MAILBOX_DIR, f))) continue;
        await processFile(f);
      }
    } catch (err) {
      log(`[ERROR EN LOOP DE VIGILANCIA] ${err.message}`);
    } finally {
      isRunning = false;
    }
  }, 10000);
}

monitorLoop();
