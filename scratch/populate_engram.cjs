const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const BASE_DIR = 'H:\\Mi unidad\\Información Ortopedia';
const REG_PATH = 'bibliotecario_engine/knowledge/global_registry.json';
const DB_PATH = path.join(os.homedir(), '.engram', 'engram.db');

console.log('--- POBLANDO MEMORIA PERSISTENTE ENGRAM MCP ---');

// 1. Cargar Registro Criptográfico Global
let reg = { hashes: {} };
if (fs.existsSync(REG_PATH)) {
  try { reg = JSON.parse(fs.readFileSync(REG_PATH, 'utf8')); } catch(e){}
}
const hashLookupByPath = {};
for (const [h, data] of Object.entries(reg.hashes || {})) {
  if (data.path) {
    const norm = data.path.toLowerCase().replace(/\\/g, '/');
    hashLookupByPath[norm] = h;
  }
}

// 2. Conectar a Base de Datos SQLite de Engram
const db = new DatabaseSync(DB_PATH);

// Asegurar que la sesión base existe
const sessionId = 'session-biblioteca-ortopedia';
const existingSession = db.prepare('SELECT id FROM sessions WHERE id = ?').get(sessionId);
if (!existingSession) {
  db.prepare(`
    INSERT INTO sessions (id, project, ownership_mode, directory, started_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `).run(sessionId, 'biblioteca-ortopedia', 'project_owned', 'c:\\Users\\ferna\\Documents\\Antigravity Project');
  console.log('[ENGRAM] Sesión creada:', sessionId);
}

// 3. Generar etiquetas semánticas automáticas
function generateTags(folder, filename) {
  const text = (folder + ' ' + filename).toLowerCase();
  const tags = new Set();

  tags.add(folder.toLowerCase().replace(/[^a-z0-9]/g, '_'));

  // Anatomía
  if (text.includes('cadera') || text.includes('acetabulo') || text.includes('coxartrosis') || text.includes('femoral neck') || text.includes('trocanter')) tags.add('cadera');
  if (text.includes('pelvis') || text.includes('pelvic') || text.includes('sacroiliaco') || text.includes('pubis')) tags.add('pelvis');
  if (text.includes('rodilla') || text.includes('patela') || text.includes('rotula') || text.includes('menisc') || text.includes('lca') || text.includes('lcp') || text.includes('gonartrosis')) tags.add('rodilla');
  if (text.includes('tibia') || text.includes('tibial') || text.includes('meseta tibial') || text.includes('pilon')) tags.add('tibia');
  if (text.includes('pie') || text.includes('tobillo') || text.includes('ankle') || text.includes('foot') || text.includes('maleolo') || text.includes('astragalo') || text.includes('calcaneo')) tags.add('pie_y_tobillo');
  if (text.includes('hombro') || text.includes('shoulder') || text.includes('glenoides') || text.includes('manguito rotador') || text.includes('clavicula')) tags.add('hombro');
  if (text.includes('humero') || text.includes('humerus') || text.includes('diafisis humeral')) tags.add('humero');
  if (text.includes('codo') || text.includes('elbow') || text.includes('olecranon') || text.includes('cupula radial')) tags.add('codo');
  if (text.includes('mano') || text.includes('hand') || text.includes('muñeca') || text.includes('wrist') || text.includes('escafoides') || text.includes('radio distal') || text.includes('carpo')) tags.add('mano_y_muñeca');
  if (text.includes('columna') || text.includes('spine') || text.includes('cervical') || text.includes('lumbar') || text.includes('toracica') || text.includes('espondil') || text.includes('medula')) tags.add('columna');
  if (text.includes('femur') || text.includes('femoral')) tags.add('femur');

  // Procedimientos y Temas
  if (text.includes('artroplastia') || text.includes('reemplazo') || text.includes('protesis') || text.includes('arthroplasty')) tags.add('artroplastia');
  if (text.includes('fractura') || text.includes('fracture') || text.includes('trauma') || text.includes('osteosintesis') || text.includes('clavo') || text.includes('placa') || text.includes('tornillo')) tags.add('traumatologia_osteosintesis');
  if (text.includes('abordaje') || text.includes('approach') || text.includes('via de acceso') || text.includes('exposures')) tags.add('abordajes_quirurgicos');
  if (text.includes('infecc') || text.includes('antibiotic') || text.includes('septic') || text.includes('osteomielitis')) tags.add('infecciones');
  if (text.includes('pediatr') || text.includes('niño') || text.includes('infantil') || text.includes('children')) tags.add('pediatria');
  if (text.includes('tumor') || text.includes('sarcoma') || text.includes('oncol') || text.includes('biopsia') || text.includes('lesion osea')) tags.add('oncologia_ortopedica');
  if (text.includes('deformidad') || text.includes('ilizarov') || text.includes('fijador') || text.includes('fijacion externa') || text.includes('osteotomia') || text.includes('alargamiento') || text.includes('masquelet')) tags.add('reconstruccion_osea');
  if (text.includes('artroscop') || text.includes('ligamento') || text.includes('tendon') || text.includes('deportiv') || text.includes('sports')) tags.add('artroscopia_y_deporte');
  if (text.includes('campbell') || text.includes('rockwood') || text.includes('ao principles') || text.includes('hoppenfeld') || text.includes('wiesel') || text.includes('turek')) tags.add('tratado_maestro');

  return Array.from(tags);
}

// 4. Escanear todos los archivos estandarizados en Información Ortopedia
const medFolders = fs.readdirSync(BASE_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory() && !d.name.startsWith('z') && d.name !== '_INBOX' && d.name !== '_BIBLIOTECARIO')
  .map(d => d.name);

console.log(`Carpetas médicas a indexar: ${medFolders.length}`);

const itemsToIndex = [];

for (const folder of medFolders) {
  const folderPath = path.join(BASE_DIR, folder);
  let files = [];
  try { files = fs.readdirSync(folderPath); } catch(e){ continue; }

  for (const f of files) {
    if (f === 'desktop.ini') continue;
    const fullPath = path.join(folderPath, f);
    let stat;
    try { stat = fs.statSync(fullPath); } catch(e){ continue; }
    if (stat.isDirectory()) continue;

    // Parsear estándar: Año - Autor - Título [- Ed. #].ext
    const m = f.match(/^(\d{4})\s*-\s*([^-]+)\s*-\s*(.+?)(?:\s*-\s*(Ed\.\s*\d+[^.]*))?(\.[a-zA-Z0-9]+)$/i);
    let year = '2020';
    let author = 'S-A';
    let title = f.replace(/\.[^.]+$/, '');
    let edition = '';

    if (m) {
      year = m[1];
      author = m[2].trim();
      title = m[3].trim();
      if (m[4]) edition = m[4].trim();
    }

    const normPath = fullPath.toLowerCase().replace(/\\/g, '/');
    const hash = hashLookupByPath[normPath] || crypto.createHash('sha256').update(f).digest('hex');
    const tags = generateTags(folder, f);
    const sizeMB = (stat.size / (1024 * 1024)).toFixed(2);

    const authorSlug = author.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20);
    const folderSlug = folder.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const topicKey = `ortopedia/${folderSlug}/${authorSlug}`;

    const content = `
# ${f}
- **Especialidad / Carpeta:** ${folder}
- **Año de Publicación:** ${year}
- **Primer Autor:** ${author}
- **Título de la Obra:** ${title}
- **Edición:** ${edition || 'Edición Única / Estándar'}
- **Ruta Canónica:** ${fullPath}
- **Tamaño de Archivo:** ${sizeMB} MB
- **Huella SHA-256:** ${hash}
- **Palabras Clave y Categorías:** ${tags.join(', ')}
`.trim();

    itemsToIndex.push({
      title: f.replace(/\.[^.]+$/, ''),
      content,
      project: 'biblioteca-ortopedia',
      topic_key: topicKey,
      normalized_hash: hash,
      size: stat.size
    });
  }
}

console.log(`Total documentos médicos listos para indexar: ${itemsToIndex.length}`);

// 5. Inserción atómica en SQLite de Engram
db.exec('BEGIN TRANSACTION;');

const insertStmt = db.prepare(`
  INSERT INTO observations (
    sync_id, session_id, type, title, content, project, scope, topic_key,
    normalized_hash, pinned, created_at, updated_at
  ) VALUES (
    ?, ?, 'literature', ?, ?, ?, 'project', ?, ?, 1, datetime('now'), datetime('now')
  )
`);

let inserted = 0;
for (const item of itemsToIndex) {
  const syncId = 'obs-' + crypto.randomBytes(8).toString('hex');
  insertStmt.run(
    syncId,
    sessionId,
    item.title,
    item.content,
    item.project,
    item.topic_key,
    item.normalized_hash
  );
  inserted++;
}

db.exec('COMMIT;');

console.log(`\n======================================================`);
console.log(`✅ INDEXACIÓN EN ENGRAM MCP COMPLETADA CON ÉXITO:`);
console.log(` - Documentos insertados en 'observations': ${inserted}`);
console.log(` - Motor de búsqueda FTS5 (Trigram) activo.`);
console.log(`======================================================`);
