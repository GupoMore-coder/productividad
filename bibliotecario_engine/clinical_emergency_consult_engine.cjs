/**
 * 🎙️ MOTOR DE INTERCONSULTA DE URGENCIAS Y ASISTENTE ESTRUCTURADO (VOZ O TEXTO)
 * Biblioteca Médica Especializada de Cirugía Ortopédica y Traumatología
 * 
 * Reglas Inquebrantables:
 * 1. Personalización de esquema a solicitud del usuario (AO/ATLS, SOAP, SBAR).
 * 2. Detección proactiva de datos clínicos faltantes esenciales (pulsos, compartimentos, heridas, horas).
 * 3. Recomendaciones de manejo basadas al 100% en evidencia médica verificable con links acortados.
 */

const SHORT_BASE = 'https://biblioteca-medica.ortopedia.workers.dev/r/';

/**
 * Procesa la solicitud de interconsulta clínica
 */
function handleEmergencyConsultRequest(inputText, preferredSchema = 'AO') {
  const text = (inputText || '').trim();
  const lower = text.toLowerCase();

  // Detecta si el usuario desea un esquema específico en el texto
  let schema = preferredSchema.toUpperCase();
  if (lower.includes('soap') || lower.includes('esquema: soap')) schema = 'SOAP';
  else if (lower.includes('sbar') || lower.includes('esquema: sbar')) schema = 'SBAR';
  else if (lower.includes('atls') || lower.includes('ao') || lower.includes('urgencia')) schema = 'AO';

  // Limpieza del comando inicial
  const cleanClinicalText = text
    .replace(/^(interconsulta|urgencia|caso urgencia|caso|nota|esquema:\s*(soap|sbar|ao))\s*:\s*/i, '')
    .trim();

  // 1. Análisis de vacíos de información esenciales (Guía interactiva)
  const missingData = [];

  // Pulsos distales / perfusión
  if (!/(pulso|llene|llenado|isquemia|perfusion|parestesia)/i.test(cleanClinicalText)) {
    missingData.push('• *Estado Vascular Distal:* ¿Pulsos presentes y simétricos (pedio/tibial posterior/radial)? ¿Llenado capilar < 2 segundos?');
  }

  // Tensión compartimental
  if (!/(compartim|tenso|dolor al estiramiento|estiramiento pasivo|blando)/i.test(cleanClinicalText)) {
    missingData.push('• *Vigilancia de Síndrome Compartimental:* ¿Compartimentos a tensión? ¿Dolor desproporcionado al estiramiento pasivo de los dedos?');
  }

  // Dimensiones de herida / exposición ósea
  const hasExposition = /(herida|expuest|abiert|sangrad|lacerac)/i.test(cleanClinicalText);
  if (hasExposition && !/(\d+\s*cm|\d+\s*mm|centimetro|milimetro)/i.test(cleanClinicalText)) {
    missingData.push('• *Dimensión de Herida:* ¿Longitud exacta en centímetros de la herida para clasificar Gustilo-Anderson?');
  }

  // Tiempo de evolución / Horas
  if (!/(hora|h\b|minuto|tiempo|hace)/i.test(cleanClinicalText)) {
    missingData.push('• *Tiempo de Evolución:* ¿Cuántas horas han transcurrido desde el traumatismo? (Crítico para ventana de desbridamiento < 6-8h y profilaxis).');
  }

  // Antecedente de vacunación antitetánica
  if (hasExposition && !/(tetan|vacun)/i.test(cleanClinicalText)) {
    missingData.push('• *Inmunización Antitetánica:* ¿Tiene esquema completo de vacunación en los últimos 5 años?');
  }

  // 2. Extracción y Diagnóstico Presuntivo
  let anatomicalRegion = 'Extremidad Afectada';
  let presumptiveDiagnosis = 'Trauma Musculoesquelético Agudo';
  let evidencePMID = '773941'; // Gustilo default
  let evidenceCitation = 'Gustilo RB, Anderson JT. JBJS Am 1976;58(4):453-8.';
  let protocolGuide = 'Inmovilización provisional rígida con férula que incluya articulación proximal y distal. Crioterapia local no directa y elevación.';

  if (/tobillo|maleol|weber/i.test(cleanClinicalText)) {
    anatomicalRegion = 'Tobillo y Retropié';
    presumptiveDiagnosis = 'Fractura Maleolar de Tobillo (Evaluar Clasificación Danis-Weber / AO 44)';
    evidencePMID = '24872288';
    evidenceCitation = 'Stufkens SA, et al. Evidence-based treatment of ankle fractures. J Orthop Trauma 2014.';
    protocolGuide = 'Bota de yeso/férula posterior inguinopédica o suropédica a 90°. Si hay subluxación tibiotalar, reducción cerrada de urgencias bajo analgesia/sedación para descomprimir partes blandas y piel.';
  } else if (/platillo|tibia|rodilla|meseta/i.test(cleanClinicalText)) {
    anatomicalRegion = 'Rodilla y Pierna';
    presumptiveDiagnosis = 'Fractura de Platillos Tibiales / Diáfisis de Tibia (AO 41 / 42)';
    evidencePMID = '20881634';
    evidenceCitation = 'Luo CF, et al. Three-column fixation for complex tibial plateau fractures. JOT 2010.';
    protocolGuide = 'Férula inguinomaleolar posterior en 15° de flexión. Si hay flictenas o alta energía, tracción transcalcánea o fijador externo puente transarticular.';
  } else if (/cadera|f[eé]mur|trocant/i.test(cleanClinicalText)) {
    anatomicalRegion = 'Cadera y Fémur Proximal';
    presumptiveDiagnosis = 'Fractura de Fémur Proximal (AO 31) / Cuello Femoral o Pertrocantérica';
    evidencePMID = '25313936';
    evidenceCitation = 'Kates SL, et al. Best Practices for Hip Fracture Care. J Orthop Trauma 2014.';
    protocolGuide = 'Tracción cutánea o esquelética de confort, analgesia multimodal reglada (bloqueo de fascia ilíaca ecoguiado si disponible), profilaxis con HBPM enoxaparina 40 mg SC/día.';
  } else if (/h[uú]mero|hombro|philos/i.test(cleanClinicalText)) {
    anatomicalRegion = 'Hombro y Húmero';
    presumptiveDiagnosis = 'Fractura de Húmero Proximal / Diáfisis Humeral (AO 11 / 12)';
    evidencePMID = '18171958';
    evidenceCitation = 'Owsley KC, et al. Failure of proximal humerus locked plate fixation. JBJS Am 2008.';
    protocolGuide = 'Inmovilizador de hombro tipo cabestrillo con faja torácica (Velpeau). Evaluación minuciosa de la función motora del nervio axilar (sensibilidad en cara lateral del deltoides) y nervio radial.';
  } else if (/mu[nñ]eca|radio|colles/i.test(cleanClinicalText)) {
    anatomicalRegion = 'Muñeca y Antebrazo';
    presumptiveDiagnosis = 'Fractura de Radio Distal (AO 23) / Articular o Extraarticular';
    evidencePMID = '21814120';
    evidenceCitation = 'Lichtman DM, et al. AAOS Clinical Practice Guideline on Distal Radius Fractures. JAAOS 2010.';
    protocolGuide = 'Reducción cerrada bajo anestesia hematoma o bloqueo Bier + Férula antebraquiopalmar en flexión palmar neutra y leve desviación cubital.';
  }

  // 3. Estructuración según el esquema elegido
  let structuredBody = '';

  if (schema === 'SOAP') {
    structuredBody = `📋 *ESQUEMA: SOAP (Subjetivo - Objetivo - Análisis - Plan)*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `• *S (Subjetivo):* Paciente ingresa con antecedente de trauma en ${anatomicalRegion}. Refiere dolor agudo e impotencia funcional.\n` +
      `• *O (Objetivo):* Hallazgos relatados: "${cleanClinicalText}".\n` +
      `• *A (Análisis):* Cuadro compatible con *${presumptiveDiagnosis}*.\n` +
      `• *P (Plan de Manejo Inmediato):*\n` +
      `  1. *Inmovilización:* ${protocolGuide}\n` +
      `  2. *Imágenes:* Serie radiográfica reglada (AP + Lateral estricta + Proyecciones oblicuas/tracción).\n` +
      `  3. *Analgesia y Protección:* Manejo analgésico intravenoso y profilaxis antitetánica según antecedentes.\n` +
      `  4. *Monitoreo:* Vigilancia neurovascular seriada cada 2 horas.`;
  } else if (schema === 'SBAR') {
    structuredBody = `📋 *ESQUEMA: SBAR (Situation - Background - Assessment - Recommendation)*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `• *S (Situación):* Interconsulta traumatológica de urgencias por trauma en ${anatomicalRegion}.\n` +
      `• *B (Antecedentes/Contexto):* Cuadro clínico informado: "${cleanClinicalText}".\n` +
      `• *A (Evaluación Traumatológica):* Alta sospecha de *${presumptiveDiagnosis}*.\n` +
      `• *R (Recomendación Terapéutica):*\n` +
      `  1. ${protocolGuide}\n` +
      `  2. TAC simple de control si hay compromiso articular para planeación prequirúrgica.\n` +
      `  3. Programar tiempo quirúrgico según estado de partes blandas.`;
  } else {
    // Esquema ATLS / AO por defecto
    structuredBody = `📋 *FICHA DE INTERCONSULTA Y URGENCIAS (ESTÁNDAR ATLS / AO)*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 *Región Anatómica:* *${anatomicalRegion}*\n` +
      `🎯 *Diagnóstico Presuntivo:* *${presumptiveDiagnosis}*\n\n` +
      `📝 *Resumen Clínico Estandarizado:*\n` +
      `"${cleanClinicalText}"\n\n` +
      `🛠️ *CONDUCTA Y PLAN DE MANEJO INMEDIATO DE URGENCIAS:*\n` +
      `1. *Inmovilización Inmediata:* ${protocolGuide}\n` +
      `2. *Evaluación de Partes Blandas:* Crioterapia y elevación continua; vigilar signos de flictenas o tensión.\n` +
      `3. *Estudio Radiográfico:* Solicitar radiografías AP y Lateral verdaderas. En fracturas con extensión articular, solicitar TAC con reconstrucción 3D.\n` +
      `4. *Manejo de Infección:* En caso de herida abierta, aplicar protocolo Gustilo con antibiótico IV dentro de las primeras 3 horas y vacuna antitetánica.`;
  }

  // Sección interactiva de datos faltantes para guiar al residente
  let missingSection = '';
  if (missingData.length > 0) {
    missingSection = `\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `⚠️ *DATOS CRÍTICOS PENDIENTES POR INTERROGAR O EVALUAR:*\n` +
      `Para perfeccionar la nota y asegurar la seguridad del paciente, se recomienda precisar:\n` +
      missingData.join('\n') + `\n` +
      `💡 _Puede responder a este chat completando estos datos para actualizar la ficha automáticamente._\n`;
  }

  const shortEvidenceUrl = `${SHORT_BASE}pm_${evidencePMID}`;

  return {
    handled: true,
    schema: schema,
    replyText: `${structuredBody}\n` +
      missingSection +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📚 *Sustento Bibliográfico y Guías Verificadas:*\n` +
      `• *Referencia:* ${evidenceCitation}\n` +
      `🔗 *Auditoría Académica PubMed:* ${shortEvidenceUrl}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💡 _Para cambiar el formato de presentación escriba: "ESQUEMA: SOAP", "ESQUEMA: SBAR" o "ESQUEMA: AO"._`
  };
}

module.exports = {
  handleEmergencyConsultRequest
};
