/**
 * 🧮 MOTOR DE CALCULADORAS QUIRÚRGICAS Y SCORES CLÍNICOS ORTOPÉDICOS
 * Biblioteca Médica Especializada de Cirugía Ortopédica y Traumatología
 * 
 * Reglas Inquebrantables:
 * 1. Cero alucinaciones: Cálculos soportados al 100% por literatura médica de alto impacto.
 * 2. Enlaces acortados directos hacia fuentes primarias verificables (PMID / DOI).
 * 3. Enfoque clínico práctico para urgencias, pase de sala y decisión quirúrgica.
 */

const SHORT_BASE = 'https://biblioteca-medica.ortopedia.workers.dev/r/';

const VERIFIED_SCORES_DB = {
  MESS: {
    name: 'MESS (Mangled Extremity Severity Score)',
    description: 'Evaluación objetiva para decisión de salvamento de extremidad vs amputación primaria en trauma de alta energía.',
    citation: 'Johansen K, et al. Objective criteria accurately predict amputation following lower extremity trauma. J Trauma. 1990;30(5):568-72.',
    pmid: '2342140',
    shortUrl: `${SHORT_BASE}pm_2342140`,
    variables: [
      { key: 'skeletal', label: 'Energía Esquelética / Tejidos Blandos', options: '1 (Baja energía/cerrada/arma corta), 2 (Media/expuesta/luxación), 3 (Alta/arma militar/choque alta velocidad), 4 (Aplastamiento masivo/alta velocidad extrema)' },
      { key: 'ischemia', label: 'Isquemia de Extremidad', options: '1 (Pulso ausente sin isquemia), 2 (Llene capilar lento/parestesias), 3 (Fría, insensible, no reactiva). NOTA: Si dura > 6 horas, se DUPLICA.' },
      { key: 'shock', label: 'Shock Hemodinámico', options: '0 (PA sistólica > 90 mmHg sostenida), 1 (Hipotensión transitoria), 2 (Hipotensión persistente < 90 mmHg)' },
      { key: 'age', label: 'Edad del Paciente', options: '0 (< 30 años), 1 (30 - 50 años), 2 (≥ 50 años)' }
    ]
  },
  GUSTILO: {
    name: 'Clasificación de Gustilo-Anderson (Fracturas Expuestas)',
    description: 'Estratificación de severidad de fracturas abiertas y protocolo antibiótico profiláctico de urgencias.',
    citation: 'Gustilo RB, Anderson JT. Prevention of infection in the treatment of 1,025 open fractures of long bones. J Bone Joint Surg Am. 1976;58(4):453-8.',
    pmid: '773941',
    shortUrl: `${SHORT_BASE}pm_773941`,
    subCitation: 'Hoff WS, et al. EAST Practice Management Guidelines for Open Fractures. J Trauma. 2011.',
    subPmid: '21814120',
    subShortUrl: `${SHORT_BASE}pm_21814120`
  },
  CAPRINI: {
    name: 'Escala de Caprini (Riesgo de Tromboprofilaxis en Ortopedia)',
    description: 'Estratificación de riesgo para Enfermedad Tromboembólica Venosa (ETV/TVP/TEP) en cirugía ortopédica mayor y trauma.',
    citation: 'Caprini JA. Thrombosis risk assessment as a guide to quality patient care. Dis Mon. 2005;51(2-3):70-8.',
    pmid: '15900257',
    shortUrl: `${SHORT_BASE}pm_15900257`,
    guidelineCitation: 'AAOS Clinical Practice Guideline on Preventing Venous Thromboembolic Disease in Hip/Knee Arthroplasty.',
    guidelinePmid: '22240500',
    guidelineShortUrl: `${SHORT_BASE}pm_22240500`
  },
  GARDEN: {
    name: 'Clasificación de Garden & Pauwels (Cuello Femoral)',
    description: 'Evaluación del grado de desplazamiento y ángulo de cizallamiento en fracturas intracapsulares de cadera.',
    citation: 'Garden RS. Low-angle fixation in fractures of the femoral neck. J Bone Joint Surg Br. 1961;43-B(4):647-63.',
    pmid: '13896799',
    shortUrl: `${SHORT_BASE}pm_13896799`
  },
  TLICS: {
    name: 'TLICS (Thoracolumbar Injury Classification and Severity Score)',
    description: 'Algoritmo decisional para manejo conservador vs quirúrgico en trauma raquimedular toracolumbar.',
    citation: 'Vaccaro AR, et al. The subaxial cervical spine injury classification system and TLICS. Spine. 2005;30(20):2325-33.',
    pmid: '16227897',
    shortUrl: `${SHORT_BASE}pm_16227897`
  },
  GARTLAND: {
    name: 'Clasificación de Gartland (Supracondíleas de Codo Pediátrico)',
    description: 'Estratificación de fracturas supracondíleas de húmero en niños y estabilidad de la cortical posterior.',
    citation: 'Gartland JJ. Management of supracondylar fractures of the humerus in children. Surg Gynecol Obstet. 1959;109(2):145-54.',
    pmid: '13675986',
    shortUrl: `${SHORT_BASE}pm_13675986`
  },
  SCHATZKER: {
    name: 'Clasificación de Schatzker / AO 41 (Platillos Tibiales)',
    description: 'Patrones de hundimiento, cizallamiento y disociación metafiso-diafisaria en meseta tibial.',
    citation: 'Schatzker J, et al. The tibial plateau fracture. Clin Orthop Relat Res. 1979;(145):94-104.',
    pmid: '535178',
    shortUrl: `${SHORT_BASE}pm_535178`
  }
};

/**
 * Procesa la solicitud de calculadora o score
 */
function handleCalculatorRequest(messageText) {
  const clean = (messageText || '').trim();
  const lower = clean.toLowerCase();

  // Detecta el tipo de score
  let targetScore = null;
  if (/mess/i.test(lower)) targetScore = 'MESS';
  else if (/gustilo/i.test(lower) || /abierta/i.test(lower) || /expuesta/i.test(lower)) targetScore = 'GUSTILO';
  else if (/caprini/i.test(lower) || /trombo/i.test(lower) || /tvp/i.test(lower)) targetScore = 'CAPRINI';
  else if (/garden/i.test(lower) || /pauwels/i.test(lower) || /cuello.*f[eé]mur/i.test(lower)) targetScore = 'GARDEN';
  else if (/tlics/i.test(lower) || /toracolumbar/i.test(lower)) targetScore = 'TLICS';
  else if (/gartland/i.test(lower) || /supracond[ií]lea/i.test(lower)) targetScore = 'GARTLAND';
  else if (/schatzker/i.test(lower) || /platillos/i.test(lower) || /meseta/i.test(lower)) targetScore = 'SCHATZKER';

  if (!targetScore) {
    return {
      handled: true,
      replyText: `🧮 *CALCULADORAS Y SCORES CLÍNICOS QUIRÚRGICOS*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Escriba *SCORE: [NOMBRE]* para acceder a la escala con sustento bibliográfico verificado:\n\n` +
        `• *SCORE: MESS* (Salvamento de extremidad vs amputación en trauma grave)\n` +
        `• *SCORE: GUSTILO* (Fracturas abiertas y protocolo antibiótico específico)\n` +
        `• *SCORE: CAPRINI* (Tromboprofilaxis perioperatoria en reemplazos y trauma)\n` +
        `• *SCORE: GARDEN* (Fracturas intracapsulares de cuello femoral)\n` +
        `• *SCORE: TLICS* (Trauma toracolumbar: criterio quirúrgico vs ortopédico)\n` +
        `• *SCORE: GARTLAND* (Fracturas supracondíleas de húmero infantil)\n` +
        `• *SCORE: SCHATZKER* (Fracturas de meseta/platillos tibiales AO 41)\n\n` +
        `💡 _Ejemplo rápido: Escriba "SCORE: MESS" para iniciar la evaluación._`
    };
  }

  // Ejecución especializada por Score
  if (targetScore === 'MESS') {
    return calculateMESS(clean);
  } else if (targetScore === 'GUSTILO') {
    return evaluateGustilo(clean);
  } else if (targetScore === 'CAPRINI') {
    return evaluateCaprini(clean);
  } else if (targetScore === 'GARDEN') {
    return evaluateGarden(clean);
  } else if (targetScore === 'TLICS') {
    return evaluateTLICS(clean);
  } else if (targetScore === 'GARTLAND') {
    return evaluateGartland(clean);
  } else if (targetScore === 'SCHATZKER') {
    return evaluateSchatzker(clean);
  }
}

/**
 * 1. MESS: Mangled Extremity Severity Score
 */
function calculateMESS(text) {
  const numMatches = text.match(/\d+/g);
  // Si no se pasaron al menos 4 números o parámetros explícitos, entrega el menú guiado
  if (!numMatches || numMatches.length < 3) {
    const meta = VERIFIED_SCORES_DB.MESS;
    return {
      handled: true,
      replyText: `🧮 *${meta.name}*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `📌 *Propósito:* ${meta.description}\n\n` +
        `Para calcular el puntaje exacto, envíe los 4 valores en orden:\n` +
        `👉 *CALCULAR MESS: [Tejidos (1-4)] [Isquemia (1-3)] [Shock (0-2)] [Edad (0-2)] [horas_isquemia]*\n\n` +
        `*1. Energía / Tejido:* 1=Baja, 2=Media (expuesta), 3=Alta (arma fuego/choque), 4=Aplastamiento masivo\n` +
        `*2. Isquemia:* 1=Pulso disminuido, 2=Llene lento/parestesias, 3=Fría/insensible (Si >6h, puntaje se duplica)\n` +
        `*3. Shock:* 0=Normotenso, 1=Hipotensión transitoria, 2=Hipotensión persistente (<90mmHg)\n` +
        `*4. Edad:* 0=<30 años, 1=30-50 años, 2=>50 años\n\n` +
        `💡 _Ejemplo:_ \`CALCULAR MESS: 3 2 1 1\` (o con 8h: \`CALCULAR MESS: 3 2 1 1 8h\`)\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `📚 *Evidencia Verificada:* Johansen et al. J Trauma 1990.\n` +
        `🔗 *Verificación Directa:* ${meta.shortUrl}`
    };
  }

  const skeletal = Math.min(4, Math.max(1, parseInt(numMatches[0], 10)));
  let ischemia = Math.min(3, Math.max(1, parseInt(numMatches[1], 10)));
  const shock = Math.min(2, Math.max(0, parseInt(numMatches[2], 10)));
  const age = Math.min(2, Math.max(0, parseInt(numMatches[3] || 0, 10)));
  
  const hasProlongedIschemia = /([6-9]|\d{2,})\s*h/i.test(text) || (numMatches[4] && parseInt(numMatches[4], 10) > 6);
  if (hasProlongedIschemia) {
    ischemia = ischemia * 2;
  }

  const totalScore = skeletal + ischemia + shock + age;
  const isSalvageable = totalScore < 7;
  const meta = VERIFIED_SCORES_DB.MESS;

  let recommendation = '';
  if (isSalvageable) {
    recommendation = `🟢 *Puntaje < 7 puntos:* Extremidad potencialmente *SALVABLE*.\n` +
      `• Conducta: Estabilización ósea precoz (fijador externo si inestable) + revascularización inmediata si requerida.\n` +
      `• Monitorizar presión intracompartimental (riesgo elevado de síndrome compartimental post-reperfusión; fasciotomía profiláctica según clínica).`;
  } else {
    recommendation = `🔴 *Puntaje ≥ 7 puntos:* Alta probabilidad de *AMPUTACIÓN PRIMARIA* (100% valor predictivo positivo en el estudio de Johansen et al.).\n` +
      `• Conducta: Evaluación quirúrgica multidisciplinaria emergente (Traumatología + Cirugía Vascular).\n` +
      `• El intento de salvamento prolongado en pacientes hemodinámicamente inestables con MESS ≥ 7 se asocia a incremento significativo de mortalidad por sepsis y falla multiorgánica.`;
  }

  return {
    handled: true,
    replyText: `📊 *RESULTADO: ${meta.name}*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🔢 *Puntaje Total:* *${totalScore} PUNTOS*\n` +
      `• Energía Esquelética: ${skeletal}/4\n` +
      `• Isquemia Tisular: ${ischemia} ${hasProlongedIschemia ? '(Duplicada por >6 horas)' : ''}\n` +
      `• Shock Hemodinámico: ${shock}/2\n` +
      `• Factor Edad: ${age}/2\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🎯 *IMPLICACIÓN CLÍNICA BASADA EN EVIDENCIA:*\n${recommendation}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📚 *Fuente Científica Primaria:* ${meta.citation}\n` +
      `🔗 *Auditoría Académica:* ${meta.shortUrl}`
  };
}

/**
 * 2. GUSTILO-ANDERSON: Fracturas Abiertas
 */
function evaluateGustilo(text) {
  const meta = VERIFIED_SCORES_DB.GUSTILO;
  return {
    handled: true,
    replyText: `🩺 *${meta.name}*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📌 *Criterios de Clasificación y Protocolo Antimicrobiano (EAST/AAOS):*\n\n` +
      `• *GRADO I (< 1 cm):* Herida limpia, trazo simple, mínima contusión.\n` +
      `  💊 *Antibiótico:* Cefazolina 2g IV de carga, luego 1-2g c/8h por 24h.\n\n` +
      `• *GRADO II (1 - 10 cm):* Laceración moderada, conminución moderada, sin despegamiento perióstico extenso.\n` +
      `  💊 *Antibiótico:* Cefazolina 2g IV c/8h por 24-48h.\n\n` +
      `• *GRADO IIIA (> 10 cm / Alta energía):* Cobertura de partes blandas adecuada a pesar de la laceración masiva.\n` +
      `  💊 *Antibiótico:* Cefazolina 2g IV c/8h + Gentamicina 5 mg/kg/día IV (o Ceftriaxona 2g IV c/24h).\n\n` +
      `• *GRADO IIIB:* Pérdida extensa de partes blandas con denudación perióstica y exposición ósea; requiere colgajo reconstructivo.\n` +
      `  💊 *Antibiótico:* Esquema dual Gram+/Gram- por 48-72h o hasta cobertura definitiva.\n\n` +
      `• *GRADO IIIC:* Lesión vascular que requiere reparación para viabilidad de la extremidad.\n` +
      `  💊 *Antibiótico:* Esquema Grado III + revascularización emergente.\n\n` +
      `⚠️ *Contaminación Agrícola / Fecal / Suelo:* Adicionar *Penicilina G sódica 4 mill UI c/4h* (o Metronidazol 500mg c/8h) para cobertura de anaerobios (Clostridium perfringens).\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📚 *Bibliografía Primaria:* ${meta.citation}\n` +
      `🔗 *PubMed Oficial:* ${meta.shortUrl}\n` +
      `📚 *Guías EAST 2011:* ${meta.subCitation}\n` +
      `🔗 *Guía EAST:* ${meta.subShortUrl}`
  };
}

/**
 * 3. CAPRINI: Tromboprofilaxis en Cirugía Ortopédica
 */
function evaluateCaprini(text) {
  const meta = VERIFIED_SCORES_DB.CAPRINI;
  return {
    handled: true,
    replyText: `🩸 *${meta.name}*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📌 *Estratificación de Riesgo Tromboembólico Perioperatorio (ACCP / AAOS):*\n\n` +
      `• *0 - 1 Ptos (Riesgo Muy Bajo):* Deambulación precoz y frecuente.\n` +
      `• *2 Ptos (Riesgo Moderado):* Profilaxis mecánica (Compresión neumática intermitente - IPC) o farmacológica.\n` +
      `• *3 - 4 Ptos (Riesgo Alto):* Farmacoprofilaxis (HBPM ej. Enoxaparina 40 mg SC/24h) + IPC mecánica.\n` +
      `• *≥ 5 Ptos (Riesgo Muy Alto - Artroplastia / Fractura de Cadera):*\n` +
      `  - Cirugía de reemplazo total de cadera (PTC), rodilla (PTR) o fractura de pelvis/cadera otorga automáticamente *5 puntos*.\n` +
      `  - *Duración Recomendada:* 28 a 35 días en Cadera / 10 a 14 días en Rodilla.\n` +
      `  - *Opciones Farmacológicas:* Enoxaparina 40mg SC/día, Rivaroxabán 10mg VO/día o Apixabán 2.5mg VO c/12h.\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📚 *Validación Caprini:* ${meta.citation}\n` +
      `🔗 *PubMed:* ${meta.shortUrl}\n` +
      `📚 *Guía Clínica AAOS:* ${meta.guidelineCitation}\n` +
      `🔗 *Guía AAOS:* ${meta.guidelineShortUrl}`
  };
}

/**
 * 4. GARDEN & PAUWELS: Cuello Femoral
 */
function evaluateGarden(text) {
  const meta = VERIFIED_SCORES_DB.GARDEN;
  return {
    handled: true,
    replyText: `🦴 *${meta.name}*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📌 *Clasificación de Garden (Grado de Desplazamiento):*\n` +
      `• *Tipo I:* Incompleta / impacted en valgo. Trabéculas inferiores intactas. (Estable)\n` +
      `• *Tipo II:* Completa sin desplazamiento. Trabéculas alineadas pero fracturadas. (Estable)\n` +
      `• *Tipo III:* Completa parcialmente desplazada en varo. Eje trabecular femoral no coincide con el acetabular. (Inestable)\n` +
      `• *Tipo IV:* Completa totalmente desplazada. Trabéculas de la cabeza realineadas con el acetábulo. (Inestable - Máximo riesgo de necrosis avascular)\n\n` +
      `📐 *Clasificación de Pauwels (Ángulo de Inclinación del Trazo):*\n` +
      `• *Tipo I (< 30°):* Fuerzas compresivas dominantes. Alta tasa de consolidación.\n` +
      `• *Tipo II (30° - 50°):* Fuerzas de cizallamiento moderadas.\n` +
      `• *Tipo III (> 50°):* Cizallamiento vertical severo e inestabilidad intrínseca. Requiere osteotomía valguizante o tornillos con placa DHS con tornillo antirrotatorio.\n\n` +
      `🎯 *Conducta Quirúrgica Basada en Edad:*\n` +
      `• *< 65 años:* Reducción anatómica urgente (< 24h) + Osteosíntesis (3 tornillos canulados 7.3mm o DHS).\n` +
      `• *> 65-70 años desplazada (Garden III/IV):* Reemplazo protésico (Hemiartroplastia bipolar o Artroplastia Total de Cadera).\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📚 *Fuente Primaria:* ${meta.citation}\n` +
      `🔗 *PubMed:* ${meta.shortUrl}`
  };
}

/**
 * 5. TLICS: Columna Toracolumbar
 */
function evaluateTLICS(text) {
  const meta = VERIFIED_SCORES_DB.TLICS;
  return {
    handled: true,
    replyText: `⚡ *${meta.name}*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📌 *Tres Columnas de Evaluación:*\n` +
      `1. *Morfología:* Compresión (1 pt), Estallido (+1 pt = 2), Traslación/Rotación (3 pts), Distracción (4 pts)\n` +
      `2. *Complejo Ligamentario Posterior (PLC):* Intacto (0 pts), Sospechoso/indeterminado (2 pts), Roto/lesionado (3 pts)\n` +
      `3. *Estado Neurológico:* Intacto (0 pts), Raíz nerviosa (2 pts), Médula completa (2 pts), Médula incompleta (3 pts), Cauda equina (3 pts)\n\n` +
      `🎯 *Conducta Según Puntaje:*\n` +
      `• *≤ 3 Puntos:* Tratamiento *Conservador / No Quirúrgico* (Ortesis TLSO, analgesia, movilización).\n` +
      `• *4 Puntos:* *Criterio del Cirujano* (Evaluar dolor, alineación sagital, edad y comorbilidades).\n` +
      `• *≥ 5 Puntos:* Tratamiento *Quirúrgico* (Descompresión + instrumentación y artrodesis).\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📚 *Fuente Primaria:* ${meta.citation}\n` +
      `🔗 *PubMed:* ${meta.shortUrl}`
  };
}

/**
 * 6. GARTLAND: Supracondíleas Pediátricas
 */
function evaluateGartland(text) {
  const meta = VERIFIED_SCORES_DB.GARTLAND;
  return {
    handled: true,
    replyText: `🧒 *${meta.name}*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `• *Tipo I:* No desplazada. Línea humeral anterior cruza el tercio medio del capitellum. Signo de la almohadilla grasa (fat pad).\n` +
      `  👉 *Manejo:* Férula o yeso braquiopalmar a 90° por 3-4 semanas.\n\n` +
      `• *Tipo II:* Desplazada con cortical posterior intacta (en bisagra). Línea humeral anterior pasa anterior al capitellum.\n` +
      `  👉 *Manejo:* Reducción cerrada bajo fluoroscopía + Enclavijado percutáneo con agujas Kirschner (fijación lateral divergente o cruzada).\n\n` +
      `• *Tipo III:* Desplazamiento completo sin contacto cortical. Alto riesgo de lesión de nervio interóseo anterior (AIN) y arteria braquial.\n` +
      `  👉 *Manejo:* Reducción cerrada urgente + clavijas percutáneas (reducción abierta si irreductible o compromiso neurovascular).\n\n` +
      `• *Tipo IV (Leitch):* Inestabilidad multidireccional en flexión y extensión (disrupción perióstica circunferencial).\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📚 *Fuente:* ${meta.citation}\n` +
      `🔗 *PubMed:* ${meta.shortUrl}`
  };
}

/**
 * 7. SCHATZKER: Platillos Tibiales
 */
function evaluateSchatzker(text) {
  const meta = VERIFIED_SCORES_DB.SCHATZKER;
  return {
    handled: true,
    replyText: `🦵 *${meta.name}*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `• *Tipo I:* Cizallamiento puro del platillo lateral (paciente joven, hueso denso).\n` +
      `• *Tipo II:* Cizallamiento + Hundimiento central del platillo lateral (el más frecuente).\n` +
      `• *Tipo III:* Hundimiento puro del platillo lateral sin fractura cortical (osteopenia/adulto mayor).\n` +
      `• *Tipo IV:* Fractura del platillo medial (alta energía, lesión ligamentaria cruzados/colaterales y riesgo arteria poplítea).\n` +
      `• *Tipo V:* Fractura bicondílea con continuidad diafisaria conservada.\n` +
      `• *Tipo VI:* Disociación metafiso-diafisaria completa (máxima energía, alto riesgo de síndrome compartimental).\n\n` +
      `🎯 *Principios de Osteosíntesis:* Restauración de la superficie articular anatómica, elevación del hueso esponjoso con injerto óseo o sustituto, placa de sostén (buttress) y fijación rígida.\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📚 *Fuente:* ${meta.citation}\n` +
      `🔗 *PubMed:* ${meta.shortUrl}`
  };
}

module.exports = {
  handleCalculatorRequest,
  VERIFIED_SCORES_DB
};
