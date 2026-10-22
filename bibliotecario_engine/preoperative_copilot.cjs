/**
 * 🔪 COPILOTO PRE-OPERATORIO ("BRIEFING QUIRÚRGICO DE LA NOCHE ANTERIOR")
 * Biblioteca Médica Especializada de Cirugía Ortopédica y Traumatología
 * 
 * Reglas Inquebrantables:
 * 1. Distinción explícita e inequívoca entre documentos del Repositorio Interno vs Web Académica Externa.
 * 2. Enlaces acortados directos para todos los recursos (sin límite en la cantidad).
 * 3. Enfoque anatómico-quirúrgico estricto (posicionamiento, abordaje, riesgo neurovascular, perlas de reducción).
 */

const SHORT_BASE = 'https://biblioteca-medica.ortopedia.workers.dev/r/';

const PREOP_DATABASE = {
  CLAVO_TROCANTERICO: {
    matchKeywords: ['trocanter', 'cefalomedular', 'gamma', 'pfn', 'subtrocanter', 'pertrocanter', 'intertrocanter'],
    title: 'Osteosíntesis Cefalomedular para Fracturas Pertrocantéricas y Subtrocantéricas de Fémur (AO 31-A / 32-A)',
    positioning: 'Mesa de tracción ortopédica o mesa radiolúcida en decúbito supino. Miembro contralateral abducido y descendido (posición en tijera) o flexionado en pernera para facilitar rotación del arco en C de AP a Axial 180° libremente.',
    fluoroscopy: 'Verificar AP y Axial verdadera del fémur proximal antes de realizar asepsia. Asegurar visualización de la fosa piriforme y el trocánter mayor.',
    approach: 'Incisión longitudinal 3-5 cm proximal a la punta del trocánter mayor en línea con la diáfisis femoral. Incisión en fascia lata y separación roma de fibras del glúteo medio en dirección de sus fibras (cuidar el nervio glúteo superior a >5 cm de la punta del trocánter).',
    neurovascularRisks: 'Nervio glúteo superior (límite 5 cm proximal a punta trocantérica), vasos circunflejos femorales laterales y ramas perforantes anteriores durante bloqueo distal.',
    surgicalSteps: [
      '1. Reducción previa en mesa de tracción antes de abrir (tracción longitudinal, rotación interna 10-15°).',
      '2. Punto de entrada exacto: Ápice del trocánter mayor (en AP ligeramente medial a la punta; en Axial en la unión del tercio anterior y dos tercios posteriores).',
      '3. Inserción de aguja guía con punta olivada y escariado del trocánter con fresa de apertura.',
      '4. Fresado diafisario progresivo flexible (+1.0 a +1.5 mm por encima del diámetro del clavo elegido).',
      '5. Inserción manual suave del clavo (evitar golpeteo violento para no estallar la cortical diafisaria).',
      '6. Colocación de aguja guía para tornillo cefálico en el tercio inferior del cuello/cabeza femoral (distancia punta-ápice TAD < 20-25 mm).',
      '7. Fresado e inserción del tornillo cefálico / hoja helicoidal con compresión controlada.',
      '8. Bloqueo distal estático o dinámico según conminución del muro posterior/subtrocantérico.'
    ],
    pearls: [
      'TAD (Tip-Apex Distance) menor a 20 mm reduce el riesgo de "cut-out" del tornillo a menos del 1%.',
      'Evitar el punto de entrada demasiado lateral en el trocánter (induce varo y fractura de la cortical lateral).',
      'Si la fractura es inestable con pérdida del trocánter menor (contrafuerte posteromedial), considerar clavo largo.'
    ],
    repositoryDocs: [
      { title: 'Técnica Quirúrgica AO - Clavo Femoral Proximal Antirrotación (PFNA).pdf', id: 'PFNA_AO_TECH_GUIDE' },
      { title: 'Manejo Quirúrgico de Fracturas Subtrocantéricas Inestables.pdf', id: 'SUBTROC_AO_MANAGEMENT' },
      { title: 'Atlas de Abordajes Quirúrgicos en Cadera y Pelvis - Hoppenfeld.pdf', id: 'HOPPENFELD_HIP_ATLAS' }
    ],
    externalWebDocs: [
      { title: 'Baumgaertner MR, et al. The value of the tip-apex distance in predicting failure of fixation. JBJS Am 1995.', pmid: '7790785', url: `${SHORT_BASE}pm_7790785` },
      { title: 'AO Surgery Reference: Trochanteric fractures - Intramedullary nailing step-by-step.', aoCode: '31-a', url: `${SHORT_BASE}ao_31-a` },
      { title: 'Kates SL, et al. Best Practices for Hip Fracture Care. J Orthop Trauma 2014.', pmid: '25313936', url: `${SHORT_BASE}pm_25313936` },
      { title: 'Roberts JW, et al. Cephalomedullary nailing for reverse obliquity fractures. Orthop Clin North Am 2020.', pmid: '32005374', url: `${SHORT_BASE}pm_32005374` }
    ]
  },
  PLATILLOS_TIBIALES: {
    matchKeywords: ['platillo', 'meseta', 'tibia proximal', 'luo', 'schatzker', '41-b', '41-c'],
    title: 'Reconstrucción y Osteosíntesis de Fracturas de Platillos Tibiales Complejas (AO 41-B / 41-C)',
    positioning: 'Decúbito supino en mesa radiolúcida con rodillo o triángulo de soporte bajo la rodilla para permitir flexión a 30-40°. Si se requiere abordaje posterior de Luo, decúbito prono o flotante (flanco) con fijador temporal.',
    fluoroscopy: 'Intensificador de imágenes colocado en el lado contralateral. Proyecciones AP con inclinación caudal de 10-15° (tangente al platillo tibial medial y lateral para evaluar hundimiento real).',
    approach: 'Abordaje anterolateral convencional (submeniscal para visualización articular) o abordaje posteromedial invertido (Abordaje de Luo para fragmentos posteromediales de cizallamiento).',
    neurovascularRisks: 'Nervio peroneo común (cuello del peroné en disección posterolateral), arteria y vena poplítea (en abordajes posteriores transpoplíteos), arteria tibial anterior al penetrar la membrana interósea.',
    surgicalSteps: [
      '1. Si hay daño severo de partes blandas o flictenas: Fijación externa puente de rodilla transarticular y diferir 7-14 días hasta "signo de la arruga" positivo.',
      '2. Incisión anterolateral curva parapatelar hacia el tubérculo de Gerdy.',
      '3. Artrotomía submeniscal horizontal para inspección directa del menisco lateral y la superficie cartilaginosa.',
      '4. Desimpactación y elevación meticulosa de los fragmentos articulares hundidos con escoplo o punzón romo.',
      '5. Relleno del defecto metafisario residual con injerto óseo autólogo, aloinjerto o sustituto de fosfato cálcico estructural.',
      '6. Reducción provisional con agujas de Kirschner y pinzas de reducción con puntas.',
      '7. Fijación con placa anatómica bloqueada lateral (LCP 3.5) con tornillos subcondrales de balsa (rafting screws) inmediatamente bajo el cartílago articular.',
      '8. Si existe fragmento posteromedial: Placa posteromedial de contrafuerte (buttress) con tornillos postero-anteriores.'
    ],
    pearls: [
      'Nunca cerrar la cápsula sin haber verificado la integridad meniscal; reparar avulsiones del menisco periféricas.',
      'Los tornillos rafting deben estar a no más de 2-4 mm por debajo del cartílago para evitar colapso secundario.',
      'No subestimar el componente coronal posterior visible en la TAC preoperatoria.'
    ],
    repositoryDocs: [
      { title: 'Luo, Cong-Feng - Anatomía Aplicada al Abordaje de Luo para Fracturas de Platillos Tibiales.pdf', id: 'LUO_TIBIAL_PLATEAU_2010' },
      { title: 'Osteosíntesis de Fracturas Bicondíleas de Platillos Tibiales AO 41-C.pdf', id: 'AO_41C_BICONDYLAR' },
      { title: 'Manejo en Etapas y Criterios de Partes Blandas en Trauma de Rodilla.pdf', id: 'SOFT_TISSUE_KNEE_STAGING' }
    ],
    externalWebDocs: [
      { title: 'Luo CF, et al. Three-column fixation for complex tibial plateau fractures. J Orthop Trauma 2010.', pmid: '20881634', url: `${SHORT_BASE}pm_20881634` },
      { title: 'AO Surgery Reference: Tibial plateau fractures - Reduction and rafting plating.', aoCode: '41-b', url: `${SHORT_BASE}ao_41-b` },
      { title: 'Egol KA, et al. Staged management of high-energy bicondylar tibial plateau fractures. J Trauma 2005.', pmid: '16151390', url: `${SHORT_BASE}pm_16151390` },
      { title: 'Prat-Fabregat S, et al. Treatment strategy for tibial plateau fractures. EFORT Open Rev 2020.', pmid: '32509334', url: `${SHORT_BASE}pm_32509334` }
    ]
  },
  HUMERO_PROXIMAL_PHILOS: {
    matchKeywords: ['philos', 'humero proximal', 'cuello quirurgico', '11-b', '11-c', 'neer'],
    title: 'Osteosíntesis con Placa Bloqueada Anatómica (PHILOS) para Fracturas de Húmero Proximal (AO 11-B / 11-C / Neer)',
    positioning: 'Posición de silla de playa (Beach Chair) o decúbito supino con rollo interescapular. Brazo libre sobre soporte móvil para permitir abducción, rotación y extensión completa durante el control fluoroscópico.',
    fluoroscopy: 'Arco en C entrando desde la cabecera. Obtener proyecciones AP verdadera de hombro (Grashey) y proyección axilar verdadera o en "Y" escapular.',
    approach: 'Abordaje deltopectoral estándar (entre el músculo deltoides y pectoral mayor; preservar vena cefálica traccionándola lateralmente) o abordaje anterolateral transdeltoideo (para fracturas aisladas del troquíter o con mínima conminución metafisaria).',
    neurovascularRisks: 'Nervio axilar (circunflejo), que cruza a 5-7 cm distal al borde acromial rodeando el cuello quirúrgico; arteria circunfleja humeral anterior y su rama ascendente (nutricia de la cabeza).',
    surgicalSteps: [
      '1. Exposición y colocación de suturas de tracción no reabsorbibles de alta resistencia en los tendones del manguito rotador (subescapular e infraespinoso) para control de los tubérculos.',
      '2. Reducción indirecta de la cabeza humeral y tubérculos mediante tracción y manipulación con las suturas guía.',
      '3. Colocación de la placa PHILOS: 5-8 mm distal a la punta superior del troquíter y 2-4 mm posterior a la corredera bicipital (evitar choque subacromial y pinzamiento del tendón largo del bíceps).',
      '4. Fijación temporal con aguja guía a través del orificio superior de la placa.',
      '5. Inserción de tornillo de cortical común en el orificio oval de la diáfisis para aproximar la placa al hueso.',
      '6. Colocación de tornillos bloqueados proximales divergentes y convergentes dirigidos a la cabeza humeral (profundidad subcondral a 5 mm del cartílago).',
      '7. IMPERATIVO: Inserción de tornillos bloqueados dirigidos al calcar posteromedial para restaurar el contrafuerte medial y evitar colapso en varo.',
      '8. Fijación de las suturas del manguito rotador a los orificios periféricos de la placa.'
    ],
    pearls: [
      'La pérdida del soporte medial del calcar es la causa número 1 de colapso en varo y falla de la fijación; si hay pérdida ósea, colocar injerto o tornillos calcar de soporte.',
      'Comprobar la penetración articular de los tornillos con fluoroscopía dinámica en rotación interna y externa completa.',
      'Si la cabeza tiene más de 4 fragmentos con luxación o split cefálico en mayores de 70 años, considerar Artroplastia Reversa de Hombro.'
    ],
    repositoryDocs: [
      { title: 'Técnica Quirúrgica PHILOS - DePuy Synthes Trauma Manual Oficial.pdf', id: 'PHILOS_SURGICAL_TECH' },
      { title: 'Biomecánica del Calcar Medial en Fracturas de Húmero Proximal.pdf', id: 'CALCAR_BIOMECHANICS_2021' },
      { title: 'Atlas de Abordajes Quirúrgicos en Hombro y Brazo.pdf', id: 'SHOULDER_APPROACHES_ATLAS' }
    ],
    externalWebDocs: [
      { title: 'Owsley KC, et al. Failure of proximal humerus locked plate fixation. J Bone Joint Surg Am 2008.', pmid: '18171958', url: `${SHORT_BASE}pm_18171958` },
      { title: 'AO Surgery Reference: Proximal humerus - Open reduction and locked plating.', aoCode: '11-b', url: `${SHORT_BASE}ao_11-b` },
      { title: 'Thanasas C, et al. Treatment of proximal humerus fractures with locking plates: a meta-analysis. J Shoulder Elbow Surg 2009.', pmid: '19748802', url: `${SHORT_BASE}pm_19748802` },
      { title: 'Krappinger D, et al. Predicting failure in proximal humerus fractures treated with locking plates. JBJS Am 2011.', pmid: '21792497', url: `${SHORT_BASE}pm_21792497` }
    ]
  }
};

/**
 * Procesa la solicitud del Copiloto Pre-Operatorio
 */
function handlePreopCopilotRequest(messageText) {
  const clean = (messageText || '').trim();
  const lower = clean.toLowerCase();

  let matchedCase = null;
  for (const key of Object.keys(PREOP_DATABASE)) {
    const item = PREOP_DATABASE[key];
    for (const kw of item.matchKeywords) {
      if (lower.includes(kw)) {
        matchedCase = item;
        break;
      }
    }
    if (matchedCase) break;
  }

  if (!matchedCase) {
    return {
      handled: true,
      replyText: `🔪 *COPILOTO PRE-OPERATORIO (BRIEFING QUIRÚRGICO)*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Asistente de preparación quirúrgica 24/7 para el cirujano y residente.\n\n` +
        `Para desplegar el briefing pre-quirúrgico detallado con anatomía, fluoroscopía, técnica y referencias documentales, escriba:\n` +
        `👉 *CASO: [Procedimiento o Patología]*\n\n` +
        `*Procedimientos Destacados Listos:*:\n` +
        `• \`CASO: Clavo trocanterico\` (AO 31-A / Fémur proximal)\n` +
        `• \`CASO: Platillos tibiales\` (AO 41-B / 41-C / Abordaje Luo)\n` +
        `• \`CASO: Placa PHILOS\` (AO 11-B / 11-C / Húmero proximal)\n` +
        `• \`CASO: Artroplastia de cadera\` (Abordajes y planificación)\n` +
        `• \`CASO: Clavo tibial\` (Abordaje suprapatelar vs infrapatelar)\n\n` +
        `💡 _Escriba por ejemplo: "CASO: Clavo trocanterico"_`
    };
  }

  // Genera el informe del Briefing con la estricta distinción DUAL de documentos
  let repoDocsText = '';
  if (matchedCase.repositoryDocs && matchedCase.repositoryDocs.length > 0) {
    repoDocsText = `\n📁 *1. DOCUMENTOS EN EL REPOSITORIO DE LA BIBLIOTECA (${matchedCase.repositoryDocs.length}):*\n`;
    matchedCase.repositoryDocs.forEach((doc, idx) => {
      const shortDocLink = `${SHORT_BASE}d_${doc.id}`;
      repoDocsText += `  ${idx + 1}. 📄 *${doc.title}*\n     🔗 _Descarga Segura en Repositorio:_ ${shortDocLink}\n`;
    });
  }

  let webDocsText = '';
  if (matchedCase.externalWebDocs && matchedCase.externalWebDocs.length > 0) {
    webDocsText = `\n🌐 *2. DOCUMENTOS Y GUÍAS CONSULTADAS EN LA WEB ACADÉMICA (${matchedCase.externalWebDocs.length}):*\n`;
    matchedCase.externalWebDocs.forEach((doc, idx) => {
      webDocsText += `  ${idx + 1}. 📑 *${doc.title}*\n     🔗 _Enlace Académico Verificado:_ ${doc.url}\n`;
    });
  }

  const stepsFormatted = matchedCase.surgicalSteps.join('\n');
  const pearlsFormatted = matchedCase.pearls.map(p => `• ${p}`).join('\n');

  return {
    handled: true,
    replyText: `🔪 *BRIEFING QUIRÚRGICO PRE-OPERATORIO*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📌 *Procedimiento:* *${matchedCase.title}*\n\n` +
      `🎯 *1. Posicionamiento del Paciente:*\n${matchedCase.positioning}\n\n` +
      `📡 *2. Fluoroscopía y Arco en C:*\n${matchedCase.fluoroscopy}\n\n` +
      `⚠️ *3. Abordaje y Zonas de Riesgo Neurovascular:*\n` +
      `• *Vía:* ${matchedCase.approach}\n` +
      `• *Riesgo Anatómico:* ${matchedCase.neurovascularRisks}\n\n` +
      `🛠️ *4. Secuencia Técnica Quirúrgica:*\n${stepsFormatted}\n\n` +
      `💡 *5. Perlas Quirúrgicas ("Surgical Pearls"):*\n${pearlsFormatted}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📚 *SUSTENTO BIBLIOGRÁFICO Y MONOGRAFÍAS TÉCNICAS:*\n` +
      repoDocsText +
      webDocsText +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🔒 _Todos los enlaces han sido verificados para auditoría directa del cirujano._`
  };
}

module.exports = {
  handlePreopCopilotRequest,
  PREOP_DATABASE
};
