const fs = require('fs');
const path = require('path');

const ROOT_DIR = 'H:\\Mi unidad\\Información Ortopedia';
const OUTPUT_JSON = path.join(__dirname, 'ortho_audit_report.json');

const IGNORED_FILES = new Set(['desktop.ini', '.ds_store', 'thumbs.db', '.gitkeep']);

function isSystemFile(filename) {
  const lower = filename.toLowerCase();
  return IGNORED_FILES.has(lower) || lower.startsWith('~$') || lower.startsWith('._');
}

function classifyFile(filename, folderPath) {
  if (isSystemFile(filename)) return { status: 'IGNORED', reason: 'System File' };

  const ext = path.extname(filename).toLowerCase();
  const nameWithoutExt = path.basename(filename, ext);

  // Check for error values in name
  if (/\b(null|undefined|nan)\b/i.test(nameWithoutExt)) {
    return { status: 'FAILED', category: 'METADATA_NULL', reason: 'Contiene valores nulos de extracción (null/undefined)' };
  }

  // Check for S-F / S-A markers
  if (/^S-F\s*-\s*S-A/i.test(filename)) {
    return { status: 'FAILED', category: 'SF_SA_MARKER', reason: 'Marcador explícito Sin Fecha y Sin Autor (S-F - S-A)' };
  }
  if (/^S-F\s*-/i.test(filename)) {
    return { status: 'FAILED', category: 'SF_MARKER', reason: 'Marcador explícito Sin Fecha (S-F)' };
  }
  if (/^S-A\s*-/i.test(filename)) {
    return { status: 'FAILED', category: 'SA_MARKER', reason: 'Marcador explícito Sin Autor (S-A)' };
  }

  // Check for standard format: YYYY - Autor - Titulo...
  // Year must be realistic (1900-2026), separator with surrounding spaces: YYYY - Autor - Titulo
  const stdYearMatch = filename.match(/^((?:19|20)\d{2})\s+-\s+([^\n]+?)\s+-\s+([^\n]+)/i);
  if (stdYearMatch) {
    const year = parseInt(stdYearMatch[1], 10);
    const author = stdYearMatch[2].trim();
    const title = stdYearMatch[3].trim();
    if (year >= 1900 && year <= 2026 && author.length >= 2 && title.length >= 2) {
      return { status: 'STANDARD', category: 'STANDARD_YEAR_AUTHOR_TITLE', details: { year, author, title } };
    }
  }

  // Fallback for single hyphen without strict spaces
  const stdFallbackMatch = filename.match(/^((?:19|20)\d{2})\s*-\s*([^-\n]+)\s*-\s*(.+)/i);
  if (stdFallbackMatch) {
    const year = parseInt(stdFallbackMatch[1], 10);
    const author = stdFallbackMatch[2].trim();
    const title = stdFallbackMatch[3].trim();
    if (year >= 1900 && year <= 2026 && author.length >= 2 && title.length >= 2) {
      return { status: 'STANDARD', category: 'STANDARD_YEAR_AUTHOR_TITLE', details: { year, author, title } };
    }
  }

  // Check for AO Chapter or Manual format: Capitulo AO... / Manual AO...
  if (/^(Capitulo\s+AO|Manual\s+AO|AO\s+Foundation|AO\s+Principles|AO\s+Spine)/i.test(filename)) {
    return { status: 'STANDARD', category: 'STANDARD_AO_SPECIAL', details: { type: 'AO Chapter/Manual' } };
  }

  // Check for EMC format: EMC - YYYY... o EMC - ...
  if (/^EMC\s*-\s*/i.test(filename)) {
    return { status: 'STANDARD', category: 'STANDARD_EMC', details: { type: 'EMC Fascicle' } };
  }

  // Check for Institutional format: Roosevelt - ... / Ateneo - ... / Curso IA - ...
  if (/^(Roosevelt|Ateneo|Curso\s+IA)\s*-\s*/i.test(filename)) {
    return { status: 'STANDARD', category: 'STANDARD_INSTITUTIONAL', details: { type: 'Documento Institucional / Ateneo' } };
  }

  // Check for Clinical Surgical Note / Planning format: Nota Quirúrgica - ... / Planeamiento Quirúrgico - ...
  if (/^(Nota\s*Quir[úu]rgica|NQ|Planeamiento\s*Quir[úu]rgico)\s*-\s*/i.test(filename)) {
    return { status: 'STANDARD', category: 'STANDARD_CLINICAL_NOTE', details: { type: 'Nota Quirúrgica / Planeamiento Asistencial' } };
  }

  // Non-standard patterns
  // Check if it has a year anywhere
  const hasYearAnywhere = /\b((?:19|20)\d{2})\b/.test(filename);
  
  // Raw download code/ID like 1-s2.0..., PMC..., 10.1016...
  if (/^(1-s2\.0|pmc\d+|10\.\d{4}|nihms|biorxiv)/i.test(filename)) {
    return { status: 'FAILED', category: 'RAW_PUBLISHER_ID', reason: 'Nombre de código en bruto de editorial (DOI / ScienceDirect / PMC)' };
  }

  // Generic download name like download.pdf, document.pdf, fulltext.pdf, article.pdf
  if (/^(download|document|fulltext|article|paper|text|archivo|scan|preview|untitled)/i.test(filename)) {
    return { status: 'FAILED', category: 'GENERIC_DOWNLOAD_NAME', reason: 'Nombre genérico de descarga web (document, download, fulltext)' };
  }

  // Starts with date format instead of year (e.g. 01-10-2023, 2023_05_12)
  if (/^\d{2}[-_.]\d{2}[-_.]\d{4}/.test(filename) || /^\d{4}[-_.]\d{2}[-_.]\d{2}/.test(filename)) {
    return { status: 'FAILED', category: 'DATE_STAMP_NAME', reason: 'Marca de tiempo o fecha diaria en lugar de año y autor' };
  }

  // Other non-standard
  return { 
    status: 'FAILED', 
    category: 'RAW_UNSTANDARDIZED', 
    reason: hasYearAnywhere ? 'Estructura no estándar (Año fuera de posición o separadores no oficiales)' : 'Nombre en bruto original sin año ni autor estandarizado' 
  };
}

const report = {
  scanTimestamp: new Date().toISOString(),
  rootDir: ROOT_DIR,
  summary: {
    totalFiles: 0,
    totalIgnored: 0,
    totalAnalyzed: 0,
    totalStandard: 0,
    totalFailed: 0,
    standardPercentage: 0
  },
  byCategory: {},
  byFolder: {},
  failedInventory: []
};

function walkDir(dir) {
  let relativeFolder = path.relative(ROOT_DIR, dir);
  if (!relativeFolder) relativeFolder = '(Raíz)';

  const folderStat = {
    folder: relativeFolder,
    fullPath: dir,
    total: 0,
    standard: 0,
    failed: 0,
    ignored: 0,
    failedDetails: []
  };

  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        walkDir(fullPath);
      } else if (item.isFile()) {
        report.summary.totalFiles++;
        const classification = classifyFile(item.name, dir);

        if (classification.status === 'IGNORED') {
          report.summary.totalIgnored++;
          folderStat.ignored++;
          continue;
        }

        report.summary.totalAnalyzed++;
        folderStat.total++;

        // Track category counts
        report.byCategory[classification.category] = (report.byCategory[classification.category] || 0) + 1;

        if (classification.status === 'STANDARD') {
          report.summary.totalStandard++;
          folderStat.standard++;
        } else {
          report.summary.totalFailed++;
          folderStat.failed++;
          const failedEntry = {
            folder: relativeFolder,
            filename: item.name,
            ext: path.extname(item.name).toLowerCase(),
            sizeBytes: 0,
            category: classification.category,
            reason: classification.reason
          };
          try {
            failedEntry.sizeBytes = fs.statSync(fullPath).size;
          } catch(e) {}

          folderStat.failedDetails.push(failedEntry);
          report.failedInventory.push(failedEntry);
        }
      }
    }
  } catch (err) {
    console.error(`Error leyendo directorio ${dir}:`, err.message);
  }

  if (folderStat.total > 0 || folderStat.ignored > 0) {
    report.byFolder[relativeFolder] = {
      total: folderStat.total,
      standard: folderStat.standard,
      failed: folderStat.failed,
      standardRate: folderStat.total > 0 ? ((folderStat.standard / folderStat.total) * 100).toFixed(1) + '%' : '0%',
      failedCount: folderStat.failed
    };
  }
}

console.log('Iniciando barrido exhaustivo en:', ROOT_DIR);
walkDir(ROOT_DIR);

report.summary.standardPercentage = report.summary.totalAnalyzed > 0 
  ? ((report.summary.totalStandard / report.summary.totalAnalyzed) * 100).toFixed(2) + '%' 
  : '0%';

fs.writeFileSync(OUTPUT_JSON, JSON.stringify(report, null, 2), 'utf8');
console.log('=== BARRIDO COMPLETADO CON ÉXITO ===');
console.log(`Total Archivos Analizados: ${report.summary.totalAnalyzed}`);
console.log(`Archivos Estándar (Exitosos): ${report.summary.totalStandard} (${report.summary.standardPercentage})`);
console.log(`Archivos Fallidos / No Renombrados: ${report.summary.totalFailed}`);
console.log(`Reporte guardado en: ${OUTPUT_JSON}`);

