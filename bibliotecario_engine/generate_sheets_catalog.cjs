/**
 * GENERADOR DE CATÁLOGO MAESTRO PARA GOOGLE SHEETS
 * Procesa enriched_drive_registry.json, infiere metadatos clínicos profundos:
 * (Año, Autor, Título, Categoría Anatómica, Tipo de Publicación, Clasificación AO, Términos MeSH)
 * y genera inventario_maestro.csv + GoogleAppsScript_SheetsManager.js
 */

const fs = require('fs');
const path = require('path');

const REGISTRY_PATH = path.join(__dirname, 'knowledge', 'enriched_drive_registry.json');
const CSV_OUT = path.join(__dirname, 'knowledge', 'inventario_maestro.csv');
const JSON_OUT = path.join(__dirname, 'knowledge', 'master_catalog.json');

const reg = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));

// Clasificaciones AO conocidas por segmento anatómico
const AO_KEYWORDS = [
  { match: /femur proximal|trocant|subtrocant|cuello femoral|cadera|hip fractur/i, ao: 'AO 31 (Fémur Proximal)' },
  { match: /diafisis femoral|femoral shaft/i, ao: 'AO 32 (Fémur Diafisario)' },
  { match: /femur distal|supracondil|distal femur/i, ao: 'AO 33 (Fémur Distal)' },
  { match: /rotula|patella/i, ao: 'AO 34 (Rótula)' },
  { match: /platillos tibiales|meseta tibial|tibial plateau/i, ao: 'AO 41 (Tibia Proximal)' },
  { match: /diafisis tibial|tibial shaft/i, ao: 'AO 42 (Tibia Diafisaria)' },
  { match: /pilon tibial|pilon|distal tibia/i, ao: 'AO 43 (Tibia Distal / Pilón)' },
  { match: /maleol|tobillo|ankle|weber/i, ao: 'AO 44 (Tobillo / Maleolar)' },
  { match: /humero proximal|proximal humerus|neer/i, ao: 'AO 11 (Húmero Proximal)' },
  { match: /diafisis humeral|humeral shaft/i, ao: 'AO 12 (Húmero Diafisario)' },
  { match: /humero distal|distal humerus/i, ao: 'AO 13 (Húmero Distal)' },
  { match: /radio proximal|olecranon|cupula radial/i, ao: 'AO 21 (Radio/Cúbito Proximal)' },
  { match: /radio distal|distal radius|colles|smith/i, ao: 'AO 23 (Radio Distal)' },
  { match: /pelvis|acetabul|ring fracture/i, ao: 'AO 61 / 62 (Pelvis y Acetábulo)' },
  { match: /columna|spine|cervical|torac|lumbar/i, ao: 'AO Spine (Columna Vertebral)' }
];

// Mapeo MeSH clínico común
const MESH_KEYWORDS = [
  { match: /artroplastia|prosthesis|replacement|protesis/i, mesh: 'Arthroplasty, Replacement; Joint Prosthesis' },
  { match: /artroscopia|arthroscopy/i, mesh: 'Arthroscopy; Minimally Invasive Surgical Procedures' },
  { match: /osteosintesis|internal fixation|plating|nailing|clavo|placa/i, mesh: 'Fracture Fixation, Internal; Bone Plates; Bone Nails' },
  { match: /fijacion externa|external fixation|ilizarov/i, mesh: 'External Fixators; Fracture Fixation' },
  { match: /infeccion|osteomielitis|septic|biofilm|antibiotic/i, mesh: 'Osteomyelitis; Surgical Wound Infection; Anti-Bacterial Agents' },
  { match: /pseudoartrosis|nonunion|malunion/i, mesh: 'Fractures, Ununited; Bone Regeneration' },
  { match: /osteotomia|osteotomy|tomofix/i, mesh: 'Osteotomy; Bone Realignment' },
  { match: /ligamento cruzado|acl|cruciate/i, mesh: 'Anterior Cruciate Ligament Injuries; Reconstruction' },
  { match: /manguito rotador|rotator cuff/i, mesh: 'Rotator Cuff Injuries; Tendon Repair' },
  { match: /abordaje|surgical approach/i, mesh: 'Orthopedic Procedures; Surgical Exposure' }
];

function inferClinicalMetadata(filename, folderPath) {
  let year = '';
  let author = '';
  let title = filename.replace(/\.pdf$/i, '');
  let docType = 'Artículo Original';
  let aoClass = 'N/A';
  let meshTerms = 'Orthopedics; Traumatology';

  // 1. Extraer del patrón YYYY - Autor - Título
  const match = filename.match(/^(\d{4})\s*-\s*([^-]+)\s*-\s*(.+?)(?:\.pdf)?$/i);
  if (match) {
    year = match[1];
    author = match[2].trim();
    title = match[3].trim();
  } else {
    // Patrón alternativo (Capítulo AO, Manual AO, S-F, etc.)
    if (filename.startsWith('Capitulo AO')) {
      docType = 'Extracto Capítulo Libro';
      author = 'AO Foundation / Südkamp';
    } else if (filename.startsWith('Manual AO')) {
      docType = 'Manual Práctico AO';
      author = 'AO Foundation';
    } else if (filename.includes('Atlas')) {
      docType = 'Atlas Quirúrgico / Libro';
    }
  }

  // 2. Inferir tipo de documento
  const norm = (filename + ' ' + (folderPath || '')).toLowerCase();
  if (norm.includes('tecnica quirurgica') || norm.includes('technique guide')) {
    docType = 'Técnica Quirúrgica de Fabricante';
  } else if (norm.includes('catalogo') || norm.includes('catálogo')) {
    docType = 'Catálogo de Implantes / Instrumental';
  } else if (norm.includes('guia') || norm.includes('guidelines') || norm.includes('protocolo')) {
    docType = 'Guía de Práctica Clínica / Protocolo';
  } else if (norm.includes('review') || norm.includes('revision') || norm.includes('revisión')) {
    docType = 'Revisión Sistemática';
  } else if (folderPath && folderPath.includes('Libros')) {
    docType = 'Tratado / Libro de Referencia';
  }

  // 3. Inferir clasificación AO
  for (const aoItem of AO_KEYWORDS) {
    if (aoItem.match.test(norm)) {
      aoClass = aoItem.ao;
      break;
    }
  }

  // 4. Inferir términos MeSH
  const foundMesh = [];
  for (const m of MESH_KEYWORDS) {
    if (m.match.test(norm)) {
      foundMesh.push(m.mesh);
    }
  }
  if (foundMesh.length > 0) {
    meshTerms = foundMesh.join(' | ');
  }

  // 5. Categoría Anatómica
  let category = 'Temas generales';
  if (folderPath) {
    const parts = folderPath.replace('H:\\Mi unidad\\Información Ortopedia\\', '').split('\\');
    if (parts.length > 0 && parts[0]) category = parts[0];
  }

  return { year, author, title, docType, aoClass, meshTerms, category };
}

function escapeCsv(str) {
  if (!str) return '""';
  const clean = String(str).replace(/"/g, '""');
  return `"${clean}"`;
}

console.log('Generando Catálogo Maestro enriquecido para Google Sheets...');

const headers = [
  'ID_Unico',
  'Drive_File_ID',
  'Año',
  'Autor_Principal',
  'Titulo_Completo',
  'Categoria_Anatomica',
  'Tipo_Documento',
  'Clasificacion_AO',
  'Terminos_MeSH',
  'Tamaño_Bytes',
  'Hash_SHA256',
  'Estado_Drive',
  'Fecha_Ingreso'
];

const csvRows = [headers.join(',')];
const jsonCatalog = [];
let index = 1;

for (const [sha, item] of Object.entries(reg)) {
  const filename = item.name || item.canonicalName || path.basename(item.path || '');
  const meta = inferClinicalMetadata(filename, item.path || item.folder);
  const idUnico = `DOC-${String(index).padStart(5, '0')}`;
  const driveId = item.driveId || 'PENDIENTE_SYNC';
  const estadoDrive = item.driveId ? 'CLOUD_ACTIVO' : 'LOCAL_SOLO';
  const fechaIngreso = new Date().toISOString().split('T')[0];

  const row = [
    escapeCsv(idUnico),
    escapeCsv(driveId),
    escapeCsv(meta.year),
    escapeCsv(meta.author),
    escapeCsv(meta.title),
    escapeCsv(meta.category),
    escapeCsv(meta.docType),
    escapeCsv(meta.aoClass),
    escapeCsv(meta.meshTerms),
    escapeCsv(item.fileSize || item.size || 0),
    escapeCsv(sha),
    escapeCsv(estadoDrive),
    escapeCsv(fechaIngreso)
  ];

  csvRows.push(row.join(','));
  jsonCatalog.push({
    id: idUnico,
    driveId: driveId,
    year: meta.year,
    author: meta.author,
    title: meta.title,
    category: meta.category,
    docType: meta.docType,
    aoClass: meta.aoClass,
    meshTerms: meta.meshTerms,
    size: item.fileSize || item.size || 0,
    sha256: sha,
    status: estadoDrive,
    filename: filename
  });

  index++;
}

fs.writeFileSync(CSV_OUT, csvRows.join('\r\n'), 'utf8');
fs.writeFileSync(JSON_OUT, JSON.stringify(jsonCatalog, null, 2), 'utf8');

console.log(`✅ CSV generado con éxito: ${CSV_OUT} (${csvRows.length - 1} filas)`);
console.log(`✅ JSON maestro generado: ${JSON_OUT} (${jsonCatalog.length} documentos indexados)`);
