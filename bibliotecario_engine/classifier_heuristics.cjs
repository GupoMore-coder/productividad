/**
 * CLASSIFIER HEURISTICS ENGINE (Motor Heurístico Especializado de Clasificación)
 * Integra:
 * 1. Detección de Catálogos Comerciales, Técnicas Quirúrgicas y Fabricantes Ortopédicos.
 * 2. Extracción de año en colofón / última página / copyright marginal.
 * 3. Formateo de Capítulos y Manuales AO sin año/libro editorial.
 * 4. Gestión de Atlas Multivolumen y consolidación de obras íntegras.
 * 5. Ciclo de Autoaprendizaje Persistente (learned_rules.json).
 */

const fs = require('fs');
const path = require('path');

const KNOWLEDGE_DIR = path.join(__dirname, 'knowledge');
const SURGICAL_RULES_PATH = path.join(KNOWLEDGE_DIR, 'surgical_heuristics.json');
const LEARNED_RULES_PATH = path.join(KNOWLEDGE_DIR, 'learned_rules.json');

function loadRules() {
  let surgical = { rules: {} };
  let learned = { learned_resolutions: [] };

  if (fs.existsSync(SURGICAL_RULES_PATH)) {
    try { surgical = JSON.parse(fs.readFileSync(SURGICAL_RULES_PATH, 'utf8')); } catch(e){}
  }
  if (fs.existsSync(LEARNED_RULES_PATH)) {
    try { learned = JSON.parse(fs.readFileSync(LEARNED_RULES_PATH, 'utf8')); } catch(e){}
  }

  return { surgical: surgical.rules || {}, learned: learned.learned_resolutions || [] };
}

/**
 * Busca si un documento ya fue resuelto previamente por autoaprendizaje
 */
function findLearnedMatch(text, learnedRules) {
  const norm = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const item of learnedRules) {
    const sigWords = item.signature.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/);
    const allMatch = sigWords.every(w => norm.includes(w));
    if (allMatch) {
      return item;
    }
  }
  return null;
}

/**
 * Algoritmo de extracción de año en última página / pie de imprenta / fine print
 */
function extractYearFromColophon(lastPageText, firstPageText) {
  const textToScan = (lastPageText || '') + ' ' + (firstPageText || '');
  
  // 1. Patrones de copyright comunes en técnica quirúrgica: © 2008 Synthes, ©2005, Printed in... 2007
  const copyMatches = textToScan.match(/(?:©|\(c\)|copyright|printed in|impreso en)[^0-9\n]{0,30}\b(19\d\d|20\d\d)\b/i);
  if (copyMatches && copyMatches[1]) {
    const y = parseInt(copyMatches[1], 10);
    if (y >= 1970 && y <= new Date().getFullYear() + 1) return y;
  }

  // 2. Patrones de códigos de catálogo al pie: e.g. 046.000.382 ... 2008, 10077052 © 2007
  const tailMatches = (lastPageText || '').match(/\b(19[89]\d|20[0-2]\d)\b/g);
  if (tailMatches && tailMatches.length > 0) {
    // Tomar el más reciente que no sea un código de artículo
    for (let i = tailMatches.length - 1; i >= 0; i--) {
      const y = parseInt(tailMatches[i], 10);
      if (y >= 1980 && y <= new Date().getFullYear() + 1) return y;
    }
  }

  return null;
}

/**
 * Clasificación y estandarización quirúrgica de alta precisión
 */
function analyzeSpecializedDocument({ filename, firstPageText, lastPageText, fullText }) {
  const combinedText = `${filename} ${firstPageText || ''} ${lastPageText || ''} ${fullText || ''}`;
  const norm = combinedText.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const { surgical, learned } = loadRules();

  // 1. Verificar si existe resolución previa aprendida
  const learnedMatch = findLearnedMatch(combinedText, learned);
  if (learnedMatch) {
    return {
      matched: true,
      strategy: 'AUTOLEARNING_MEMORY',
      ruleId: learnedMatch.id,
      targetFolder: learnedMatch.target_folder,
      standardName: learnedMatch.naming_format,
      notes: `Resuelto vía autoaprendizaje previo (${learnedMatch.learned_from})`
    };
  }

  // 2. Catálogos Comerciales y Técnicas Quirúrgicas de Fabricantes
  const commRule = surgical.commercial_catalogs;
  if (commRule) {
    const foundManufacturer = commRule.known_manufacturers.find(m => 
      norm.includes(m.toLowerCase())
    );
    const isCommercialDoc = commRule.triggers.some(tr => norm.includes(tr));

    if (foundManufacturer && isCommercialDoc) {
      const year = extractYearFromColophon(lastPageText, firstPageText) || new Date().getFullYear();
      let docType = 'Técnica quirúrgica';
      if (norm.includes('technique guide')) docType = 'Technique Guide';
      else if (norm.includes('catalogo') || norm.includes('catálogo')) docType = 'Catálogo';

      // Limpieza de nombre
      let cleanTitle = filename.replace(/\.pdf$/i, '').trim();
      return {
        matched: true,
        strategy: 'COMMERCIAL_SURGICAL_CATALOG',
        ruleId: commRule.id,
        manufacturer: foundManufacturer,
        year: year,
        targetFolder: commRule.target_folder,
        docType: docType,
        suggestedName: `${year} - ${foundManufacturer} - ${cleanTitle} [${docType}].pdf`
      };
    }
  }

  // 3. Extractos de Capítulos AO
  const aoChapRule = surgical.ao_chapter_extract;
  if (aoChapRule && aoChapRule.triggers.some(tr => norm.includes(tr))) {
    if (norm.includes('evaluation/classification of closed and open injuries') || norm.includes('soft-tissue injury')) {
      return {
        matched: true,
        strategy: 'AO_CHAPTER_EXTRACT',
        ruleId: aoChapRule.id,
        targetFolder: aoChapRule.target_folder,
        author: 'Norbert P. Südkamp',
        topic: 'Soft-tissue injury pathophysiology and its influence on fracture management',
        suggestedName: 'Capitulo AO, Norbert P. Südkamp, Soft-tissue injury pathophysiology and its influence on fracture management.pdf'
      };
    }
  }

  // 4. Extractos de Manuales AO Foundation
  const aoManRule = surgical.ao_manual_extract;
  if (aoManRule && aoManRule.triggers.some(tr => norm.includes(tr))) {
    return {
      matched: true,
      strategy: 'AO_MANUAL_EXTRACT',
      ruleId: aoManRule.id,
      targetFolder: aoManRule.target_folder,
      author: 'Emanuel Gautier',
      topic: 'Laboratorio de habilidades AO',
      suggestedName: 'Manual AO Foundation, Emanuel Gautier, Laboratorio de habilidades AO.pdf'
    };
  }

  // 5. Atlas y Obras Multivolumen Clásicas
  const atlasRule = surgical.multi_volume_atlas;
  if (atlasRule && atlasRule.triggers.some(tr => norm.includes(tr))) {
    const isVol2 = norm.includes('volumen 2') || norm.includes('extremidad inferior');
    const isConsolidated = norm.includes('667072418') || (norm.includes('volumen 1') && norm.includes('volumen 2'));
    
    if (isConsolidated) {
      return {
        matched: true,
        strategy: 'CONSOLIDATED_MASTER_ATLAS',
        ruleId: atlasRule.id,
        targetFolder: atlasRule.target_folder,
        author: 'J. Miquel Sales',
        title: 'Atlas de Osteosíntesis',
        volume: 'Obra Completa (Vol 1 y 2)',
        suggestedName: 'J. Miquel Sales, Atlas de Osteosíntesis, Obra Completa Extremidad Superior e Inferior.pdf',
        isMasterConsolidated: true
      };
    }

    if (isVol2) {
      return {
        matched: true,
        strategy: 'MULTI_VOLUME_PARTIAL',
        ruleId: atlasRule.id,
        targetFolder: atlasRule.target_folder,
        author: 'J. Miquel Sales',
        title: 'Atlas de Osteosíntesis',
        volume: 'Volumen 2 Extremidad Inferior',
        suggestedName: 'J. Miquel Sales, Atlas de Osteosíntesis, Volumen 2 Extremidad Inferior.pdf',
        consolidationCheckNeeded: true
      };
    }
  }

  return { matched: false };
}

/**
 * Método de autoaprendizaje dinámico: registra una nueva resolución en learned_rules.json
 */
function recordLearnedRule(ruleData) {
  const { surgical, learned } = loadRules();
  const newId = `LEARNED-${String(learned.length + 1).padStart(3, '0')}`;
  
  const entry = {
    id: newId,
    signature: ruleData.signature,
    manufacturer: ruleData.manufacturer || null,
    doc_type: ruleData.doc_type || null,
    author: ruleData.author || null,
    target_folder: ruleData.target_folder,
    naming_format: ruleData.naming_format,
    learned_from: ruleData.learned_from || 'Resolución asistida por Gerente General',
    date_learned: new Date().toISOString()
  };

  learned.push(entry);
  fs.writeFileSync(LEARNED_RULES_PATH, JSON.stringify({ version: '1.0.0', learned_resolutions: learned }, null, 2), 'utf8');
  return entry;
}

module.exports = {
  analyzeSpecializedDocument,
  extractYearFromColophon,
  recordLearnedRule,
  loadRules
};
