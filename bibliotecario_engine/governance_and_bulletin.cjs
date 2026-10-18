/**
 * GOBERNANZA, CONTROL DE ACCESO Y BOLETÍN DOMINICAL (FASE 4)
 * Dirección: Gestor de Contenido
 */

const fs = require('fs');
const path = require('path');

const USERS_PATH = path.join(__dirname, 'knowledge', 'users_directory.json');
const CATALOG_PATH = path.join(__dirname, 'knowledge', 'master_catalog.json');

const COUNTRY_DIAL_MAP = [
  { prefix: '+593', flag: '🇪🇨', name: 'Ecuador', defaultLang: 'ES', greeting: '¡Una calurosa bienvenida a los apreciados colegas de Ecuador 🇪🇨! Reconocidos por su vocación médica y continuo crecimiento académico.' },
  { prefix: '+591', flag: '🇧🇴', name: 'Bolivia', defaultLang: 'ES', greeting: '¡Un fraternal saludo a la comunidad médica de Bolivia 🇧🇴! Ejemplo de dedicación clínica y servicio incondicional.' },
  { prefix: '+506', flag: '🇨🇷', name: 'Costa Rica', defaultLang: 'ES', greeting: '¡Un saludo de pura vida a los distinguidos colegas de Costa Rica 🇨🇷! Referente en salud comunitaria y excelencia médica.' },
  { prefix: '+507', flag: '🇵🇦', name: 'Panamá', defaultLang: 'ES', greeting: '¡Un afectuoso saludo a la comunidad médica de Panamá 🇵🇦! Puente de innovación y dinamismo en la salud regional.' },
  { prefix: '+502', flag: '🇬🇹', name: 'Guatemala', defaultLang: 'ES', greeting: '¡Nuestra más cordial bienvenida a los colegas de Guatemala 🇬🇹! Tierra de nobleza, vocación y esfuerzo médico ejemplar.' },
  { prefix: '+503', flag: '🇸🇻', name: 'El Salvador', defaultLang: 'ES', greeting: '¡Un saludo fraterno a los estimados colegas de El Salvador 🇸🇻! Reconocidos por su espíritu de superación y rigor asistencial.' },
  { prefix: '+504', flag: '🇭🇳', name: 'Honduras', defaultLang: 'ES', greeting: '¡Una calurosa bienvenida a los apreciados médicos de Honduras 🇭🇳! Dedicados con valentía y compromiso a la salud ortopédica.' },
  { prefix: '+505', flag: '🇳🇮', name: 'Nicaragua', defaultLang: 'ES', greeting: '¡Un cordial saludo a los colegas de Nicaragua 🇳🇮! Profesionales de gran entereza y entrega en el cuidado quirúrgico.' },
  { prefix: '+598', flag: '🇺🇾', name: 'Uruguay', defaultLang: 'ES', greeting: '¡Un fuerte abrazo a la respetada comunidad médica de Uruguay 🇺🇾! Tradición de ética, solvencia científica y calidez profesional.' },
  { prefix: '+595', flag: '🇵🇾', name: 'Paraguay', defaultLang: 'ES', greeting: '¡Un saludo muy especial a los estimados colegas de Paraguay 🇵🇾! De corazón generoso y admirable vocación asistencial.' },
  { prefix: '+351', flag: '🇵🇹', name: 'Portugal', defaultLang: 'PT', greeting: 'Uma calorosa saudação aos estimados colegas de Portugal 🇵🇹! Berço de rica história, pioneirismo científico e elevado padrão clínico.' },
  { prefix: '+57', flag: '🇨🇴', name: 'Colombia', defaultLang: 'ES', greeting: '¡Un saludo muy especial a nuestra querida comunidad médica de Colombia 🇨🇴! Tierra de resiliencia, calidez y excelencia en la práctica quirúrgica.' },
  { prefix: '+52', flag: '🇲🇽', name: 'México', defaultLang: 'ES', greeting: '¡Un fraterno saludo a nuestros admirados colegas de México 🇲🇽! Cuna de gran tradición clínica, vocación médica y calidez humana.' },
  { prefix: '+34', flag: '🇪🇸', name: 'España', defaultLang: 'ES', greeting: '¡Una afectuosa bienvenida a nuestros colegas de España 🇪🇸! Referente histórico de rigor científico, formación médica y vanguardia quirúrgica.' },
  { prefix: '+54', flag: '🇦🇷', name: 'Argentina', defaultLang: 'ES', greeting: '¡Un cálido abrazo a la talentosa comunidad médica de Argentina 🇦🇷! Tierra de pasión, pensamiento crítico y destacada escuela ortopédica.' },
  { prefix: '+56', flag: '🇨🇱', name: 'Chile', defaultLang: 'ES', greeting: '¡Un saludo muy especial a nuestros colegas de Chile 🇨🇱! Ejemplo de constancia, rigor formativo y compromiso con la traumatología de calidad.' },
  { prefix: '+51', flag: '🇵🇪', name: 'Perú', defaultLang: 'ES', greeting: '¡Nuestra más cordial bienvenida a los hermanos médicos de Perú 🇵🇪! Tierra de profunda historia milenaria y ejemplar entrega en la atención de salud.' },
  { prefix: '+58', flag: '🇻🇪', name: 'Venezuela', defaultLang: 'ES', greeting: '¡Un entrañable abrazo a los admirados médicos de Venezuela 🇻🇪! Ejemplo permanente de perseverancia, mística y talento clínico.' },
  { prefix: '+55', flag: '🇧🇷', name: 'Brasil', defaultLang: 'PT', greeting: 'Uma calorosa saudação à comunidade médica do Brasil 🇧🇷! Terra de vanguarda cirúrgica, alegria contagiante e notável dedicação clínica.' },
  { prefix: '+44', flag: '🇬🇧', name: 'Reino Unido', defaultLang: 'EN', greeting: 'A warm welcome to our esteemed colleagues from the United Kingdom 🇬🇧! A bedrock of evidence-based medicine and surgical mastery.' },
  { prefix: '+33', flag: '🇫🇷', name: 'Francia', defaultLang: 'FR', greeting: 'Une chaleureuse bienvenue à nos estimés confrères de France 🇫🇷! Berceau de l\'excellence chirurgicale et de la tradition académique.' },
  { prefix: '+49', flag: '🇩🇪', name: 'Alemania', defaultLang: 'DE', greeting: 'Ein herzliches Willkommen an unsere geschätzten Kollegen aus Deutschland 🇩🇪! Vorreiter in chirurgischer Präzision, Biomechanik und Innovation.' },
  { prefix: '+39', flag: '🇮🇹', name: 'Italia', defaultLang: 'IT', greeting: 'Un caloroso benvenuto ai nostri stimati colleghi d\'Italia 🇮🇹! Culla di tradizione anatomica e prestigiosa scuola ortopedica.' },
  { prefix: '+1', flag: '🇺🇸', name: 'Estados Unidos / Canadá', defaultLang: 'EN', greeting: 'A warm welcome to our medical colleagues connecting from the United States and Canada 🇺🇸/🇨🇦! Global leaders in biomedical innovation and clinical excellence.' }
];

function resolveCountryAndLanguage(phone) {
  const clean = '+' + String(phone || '').replace(/[^\d]/g, '');
  for (const entry of COUNTRY_DIAL_MAP) {
    if (clean.startsWith(entry.prefix)) {
      return entry;
    }
  }
  return {
    prefix: '+',
    flag: '🌎',
    name: 'Internacional',
    defaultLang: 'ES',
    greeting: '¡Una cordial bienvenida a nuestra comunidad médica internacional 🌎! Unidos por la vocación quirúrgica y el rigor científico.'
  };
}

function translateAnnouncement(text, targetLang = 'ES') {
  const lang = (targetLang || 'ES').trim().toUpperCase();
  if (lang === 'ES') return text;

  const dict = {
    EN: [
      [/comunicado oficial/gi, 'Official Announcement'],
      [/comunicado institucional/gi, 'Institutional Announcement'],
      [/comunicado/gi, 'Announcement'],
      [/estimados colegas/gi, 'Dear Colleagues'],
      [/estimada comunidad/gi, 'Dear Community'],
      [/mantenimiento programado/gi, 'scheduled maintenance'],
      [/de la base de datos/gi, 'of the database'],
      [/horas/gi, 'hours'],
      [/gracias por su comprensión/gi, 'thank you for your understanding'],
      [/atentamente/gi, 'Sincerely'],
      [/dirección del proyecto/gi, 'Project Leadership'],
      [/gestor de contenido/gi, 'Content Manager'],
      [/nueva versión/gi, 'new version'],
      [/actualización/gi, 'update']
    ],
    PT: [
      [/comunicado oficial/gi, 'Comunicado Oficial'],
      [/comunicado institucional/gi, 'Comunicado Institucional'],
      [/comunicado/gi, 'Comunicado'],
      [/estimados colegas/gi, 'Prezados colegas'],
      [/estimada comunidad/gi, 'Prezada comunidade'],
      [/mantenimiento programado/gi, 'manutenção programada'],
      [/de la base de datos/gi, 'do banco de dados'],
      [/horas/gi, 'horas'],
      [/gracias por su comprensión/gi, 'obrigado pela compreensão'],
      [/atentamente/gi, 'Atenciosamente'],
      [/dirección del proyecto/gi, 'Direção do Projeto'],
      [/gestor de contenido/gi, 'Gestor de Contenido'],
      [/nueva versión/gi, 'nova versão'],
      [/actualización/gi, 'atualização']
    ],
    FR: [
      [/comunicado oficial/gi, 'Communiqué Officiel'],
      [/comunicado institucional/gi, 'Communiqué Institutionnel'],
      [/comunicado/gi, 'Communiqué'],
      [/estimados colegas/gi, 'Chers confrères'],
      [/mantenimiento programado/gi, 'maintenance programmée'],
      [/de la base de datos/gi, 'de la base de données'],
      [/gracias por su comprensión/gi, 'merci pour votre compréhension'],
      [/dirección del proyecto/gi, 'Direction du Projet']
    ]
  };

  let translated = text;
  if (dict[lang]) {
    for (const [pattern, repl] of dict[lang]) {
      translated = translated.replace(pattern, repl);
    }
  }

  if (lang === 'EN' && !translated.startsWith('🌐 *[English Version]*')) {
    translated = `🌐 *[English Version]*\n${translated}`;
  } else if (lang === 'PT' && !translated.startsWith('🌐 *[Versão em Português]*')) {
    translated = `🌐 *[Versão em Português]*\n${translated}`;
  } else if (lang === 'FR' && !translated.startsWith('🌐 *[Version Française]*')) {
    translated = `🌐 *[Version Française]*\n${translated}`;
  }

  return translated;
}

function loadUsers() {
  if (fs.existsSync(USERS_PATH)) {
    try { return JSON.parse(fs.readFileSync(USERS_PATH, 'utf8')); } catch(e){}
  }
  return [];
}

function saveUsers(users) {
  fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2), 'utf8');
}

/**
 * 1. REGISTRO DE PRIMER INGRESO (ONBOARDING)
 */
function registerUser({ phone, fullName, university, level, email, preferredLanguage }) {
  const users = loadUsers();
  const cleanPhone = phone.replace(/[^\d+]/g, '');

  let existing = users.find(u => u.phone === cleanPhone);
  if (existing) {
    return {
      status: 'ALREADY_REGISTERED',
      user: existing,
      message: (existing.status === 'APROBADO' || existing.status === 'ACTIVO')
        ? 'Su cuenta ya se encuentra activa y autorizada para el uso de la biblioteca.' 
        : 'Su solicitud ya fue enviada previamente y se encuentra a la espera de aprobación por parte de la Dirección Médica.'
    };
  }

  const countryInfo = resolveCountryAndLanguage(cleanPhone);
  const selectedLang = (preferredLanguage || countryInfo.defaultLang || 'ES').trim().toUpperCase();

  const newUser = {
    phone: cleanPhone,
    name: fullName.trim(),
    email: (email || '').trim(),
    university: university.trim(),
    level: level.trim(), // e.g. 'Residente R2', 'Especialista', etc.
    countryFlag: countryInfo.flag,
    countryName: countryInfo.name,
    preferredLanguage: selectedLang,
    status: 'PENDIENTE_APROBACION',
    registeredAt: new Date().toISOString(),
    approvedAt: null,
    downloadQuota: 50,
    downloadsCount: 0,
    updateHistory: []
  };

  users.push(newUser);
  saveUsers(users);

  const alertForGerente = `🩺 *NUEVA SOLICITUD DE ACCESO A LA BIBLIOTECA*\n` +
                          `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                          `👤 *Médico:* ${newUser.name}\n` +
                          (newUser.email ? `📧 *Correo:* ${newUser.email}\n` : '') +
                          `🌎 *País:* ${newUser.countryFlag} ${newUser.countryName}\n` +
                          `🌐 *Idioma:* ${newUser.preferredLanguage}\n` +
                          `🏛️ *Universidad:* ${newUser.university}\n` +
                          `🎓 *Nivel:* ${newUser.level}\n` +
                          `📱 *WhatsApp:* \`${newUser.phone}\`\n` +
                          `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                          `👉 *¿Desea autorizar el acceso?*\n` +
                          `1. Responder *"APROBAR ${newUser.phone}"*\n` +
                          `2. Responder *"RECHAZAR ${newUser.phone}"*`;

  let welcomeForUser = '';
  if (selectedLang === 'PT') {
    welcomeForUser = `👋 *Bem-vindo(a) à Biblioteca Médica de Cirurgia Ortopédica e Traumatologia!*\n\n` +
                     `${countryInfo.greeting}\n\n` +
                     `Recebemos seus dados de registro:\n` +
                     `• *Nome:* ${newUser.name}\n` +
                     (newUser.email ? `• *E-mail:* ${newUser.email}\n` : '') +
                     `• *Instituição:* ${newUser.university}\n` +
                     `• *Nível:* ${newUser.level}\n` +
                     `• *Idioma escolhido:* Português (PT)\n\n` +
                     `⚠️ *Status Atual:* Aguardando autorização da Direção do Projeto (Gestor de Contenido).\n\n` +
                     `_Nota: Você pode alterar seu idioma a qualquer momento enviando "IDIOMA: PT / ES / EN / FR". Le notificaremos assim que seu acesso for liberado._`;
  } else if (selectedLang === 'EN') {
    welcomeForUser = `👋 *Welcome to the Orthopaedic Surgery & Traumatology Medical Library!*\n\n` +
                     `${countryInfo.greeting}\n\n` +
                     `We have received your registration details:\n` +
                     `• *Name:* ${newUser.name}\n` +
                     (newUser.email ? `• *Email:* ${newUser.email}\n` : '') +
                     `• *Institution:* ${newUser.university}\n` +
                     `• *Level:* ${newUser.level}\n` +
                     `• *Selected Language:* English (EN)\n\n` +
                     `⚠️ *Current Status:* Pending authorization by Project Leadership (Gestor de Contenido).\n\n` +
                     `_Note: You can switch your language anytime by typing "LANGUAGE: EN / ES / PT / FR". We will notify you here once access is enabled._`;
  } else if (selectedLang === 'FR') {
    welcomeForUser = `👋 *Bienvenue à la Bibliothèque Médicale de Chirurgie Orthopédique et Traumatologie!*\n\n` +
                     `${countryInfo.greeting}\n\n` +
                     `Nous avons bien reçu vos données d'inscription:\n` +
                     `• *Nom:* ${newUser.name}\n` +
                     (newUser.email ? `• *E-mail:* ${newUser.email}\n` : '') +
                     `• *Établissement:* ${newUser.university}\n` +
                     `• *Niveau:* ${newUser.level}\n` +
                     `• *Langue choisie:* Français (FR)\n\n` +
                     `⚠️ *Statut actuel:* En attente d'approbation par la Direction du Projet (Gestor de Contenido).\n\n` +
                     `_Note: Vous pouvez changer de langue à tout moment en envoyant "IDIOMA: FR / ES / EN / PT". Nous vous informerons dès que votre accès sera activé._`;
  } else {
    welcomeForUser = `👋 *Bienvenido(a) a la Biblioteca Médica Especializada de Ortopedia y Traumatología.*\n\n` +
                     `${countryInfo.greeting}\n\n` +
                     `Hemos recibido sus datos de registro:\n` +
                     `• *Nombre:* ${newUser.name}\n` +
                     (newUser.email ? `• *Correo:* ${newUser.email}\n` : '') +
                     `• *Institución:* ${newUser.university}\n` +
                     `• *Nivel:* ${newUser.level}\n` +
                     `• *Idioma elegido:* Español (ES)\n\n` +
                     `⚠️ *Estado Actual:* En espera de autorización por la Dirección del Proyecto (Gestor de Contenido).\n\n` +
                     `_Nota: Puede cambiar su idioma de comunicación en cualquier momento escribiendo "IDIOMA: ES / EN / PT / FR". Le notificaremos por esta misma vía en cuanto su acceso sea habilitado._`;
  }

  return {
    status: 'PENDING_APPROVAL',
    user: newUser,
    alertForGerente,
    welcomeForUser
  };
}

/**
 * 1.1 ACTUALIZACIÓN DE IDIOMA PREFERIDO (SIN LÍMITES DE FRECUENCIA)
 * Permite cambiar el idioma en cualquier momento cuantas veces sea necesario
 */
function updateUserLanguage(phone, newLang) {
  const users = loadUsers();
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  const user = users.find(u => u.phone === cleanPhone);

  if (!user) {
    return { success: false, error: 'USER_NOT_FOUND' };
  }

  let norm = (newLang || 'ES').trim().toUpperCase();
  if (norm.includes('ENG') || norm.includes('INGLES') || norm.includes('INGLÊS') || norm === 'EN') norm = 'EN';
  else if (norm.includes('PORT') || norm === 'PT') norm = 'PT';
  else if (norm.includes('FRAN') || norm === 'FR') norm = 'FR';
  else if (norm.includes('ALEM') || norm.includes('DEUT') || norm === 'DE') norm = 'DE';
  else norm = 'ES';

  const previousLanguage = user.preferredLanguage || 'ES';
  user.preferredLanguage = norm;
  user.languageUpdatedAt = new Date().toISOString();
  saveUsers(users);

  return {
    success: true,
    user,
    previousLanguage,
    newLanguage: norm
  };
}

/**
 * 1.2 ACTUALIZACIÓN DE DATOS PERSONALES A SOLICITUD DEL USUARIO
 * Enforza un límite de máx 3 actualizaciones en 6 meses o 6 en 12 meses
 */
function updateUserProfile(phone, updates = {}) {
  const users = loadUsers();
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  const user = users.find(u => u.phone === cleanPhone);

  if (!user) {
    return { success: false, error: 'USER_NOT_FOUND' };
  }

  const now = Date.now();
  const ms6m = 180 * 24 * 60 * 60 * 1000;
  const ms12m = 365 * 24 * 60 * 60 * 1000;

  if (!Array.isArray(user.updateHistory)) {
    user.updateHistory = [];
  }

  const count6m = user.updateHistory.filter(ts => (now - ts) < ms6m).length;
  const count12m = user.updateHistory.filter(ts => (now - ts) < ms12m).length;

  if (count6m >= 3) {
    return { success: false, error: 'LIMIT_6M_EXCEEDED', count6m, count12m };
  }
  if (count12m >= 6) {
    return { success: false, error: 'LIMIT_12M_EXCEEDED', count6m, count12m };
  }

  if (updates.name && updates.name.trim()) user.name = updates.name.trim();
  if (updates.email && updates.email.trim()) user.email = updates.email.trim();
  if (updates.university && updates.university.trim()) user.university = updates.university.trim();
  if (updates.level && updates.level.trim()) user.level = updates.level.trim();
  if (updates.preferredLanguage && updates.preferredLanguage.trim()) {
    let norm = updates.preferredLanguage.trim().toUpperCase();
    if (norm.includes('ENG') || norm === 'EN') norm = 'EN';
    else if (norm.includes('PORT') || norm === 'PT') norm = 'PT';
    else if (norm.includes('FRAN') || norm === 'FR') norm = 'FR';
    else norm = 'ES';
    user.preferredLanguage = norm;
  }

  user.updateHistory.push(now);
  user.updatedAt = new Date().toISOString();

  saveUsers(users);

  return {
    success: true,
    user,
    count6m: count6m + 1,
    count12m: count12m + 1
  };
}

/**
 * 2. APROBACIÓN POR EL GESTOR DE CONTENIDO
 */
function approveUser(phone) {
  const users = loadUsers();
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  const user = users.find(u => u.phone === cleanPhone);

  if (!user) return { success: false, error: 'USER_NOT_FOUND' };

  user.status = 'APROBADO';
  user.approvedAt = new Date().toISOString();
  saveUsers(users);

  let messageForUser = '';
  if (user.preferredLanguage === 'PT') {
    messageForUser = `✅ *Acesso Autorizado à Biblioteca Ortopédica!*\n\n` +
                     `Prezado(a) ${user.name}: Sua solicitação de acesso foi formalmente aprovada pelo *Gestor de Contenido*.\n\n` +
                     `📖 *Manual Oficial de Uso e Governança:*\n` +
                     `Anexamos o manual com os protocolos de busca, regras de conduta e diretrizes do serviço.\n\n` +
                     `👉 Você pode consultar o manual a qualquer momento digitando *"MANUAL"* ou *"AJUDA"*.\n\n` +
                     `💡 *Para começar:* Digite a patologia, técnica cirúrgica, autor ou classificação AO que deseja consultar.`;
  } else if (user.preferredLanguage === 'EN') {
    messageForUser = `✅ *Authorized Access to the Orthopaedic Library!*\n\n` +
                     `Dear ${user.name}: Your access request has been formally approved by the *Content Manager*.\n\n` +
                     `📖 *Official User & Governance Manual:*\n` +
                     `We attach the project manual detailing search protocols, code of conduct, and service guidelines.\n\n` +
                     `👉 You can consult or download the manual anytime by typing *"MANUAL"* or *"HELP"*.\n\n` +
                     `💡 *To start:* Type the pathology, surgical technique, author, or AO classification you wish to consult.`;
  } else {
    messageForUser = `✅ *¡Acceso Autorizado a la Biblioteca Ortopédica!*\n\n` +
                     `Estimado(a) ${user.name}: Su solicitud de acceso ha sido formalmente aprobada por el *Gestor de Contenido*.\n\n` +
                     `📖 *Manual Oficial de Uso y Gobernanza:*\n` +
                     `Adjuntamos el manual del proyecto donde se detallan los protocolos de búsqueda, las reglas de conducta y el código de uso apropiado.\n\n` +
                     `👉 Puede consultar o descargar el manual en cualquier momento escribiendo *"MANUAL"* o *"AYUDA"*.\n\n` +
                     `💡 *Para comenzar:* Escriba la patología, técnica, autor o clasificación AO que desea consultar.`;
  }

  return { success: true, user, messageForUser };
}

/**
 * 2.1 RECHAZO DE SOLICITUD POR EL GESTOR DE CONTENIDO
 */
function rejectUser(phone, reason = 'No cumple con los criterios de admisión institucional en esta oportunidad.') {
  const users = loadUsers();
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  const user = users.find(u => u.phone === cleanPhone);

  if (!user) return { success: false, error: 'USER_NOT_FOUND' };

  user.status = 'RECHAZADO';
  user.rejectedAt = new Date().toISOString();
  user.rejectionReason = reason;
  saveUsers(users);

  let messageForUser = `📋 *ESTADO DE SOLICITUD DE ACCESO*\n` +
                       `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                       `Estimado(a) ${user.name}:\n` +
                       `La Dirección del Proyecto informa que su solicitud de acceso a la Biblioteca Médica no ha sido aprobada en esta oportunidad.\n\n` +
                       `📋 *Detalle:* ${reason}\n` +
                       `━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  return { success: true, user, messageForUser };
}

/**
 * 3. BLOQUEO DISCIPLINARIO DE USUARIO
 */
function blockUser(phone, reason = 'Incumplimiento de las reglas de uso apropiado', defaultName = 'Usuario No Registrado') {
  const users = loadUsers();
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  let user = users.find(u => u.phone === cleanPhone);

  if (!user) {
    user = {
      phone: cleanPhone,
      name: defaultName,
      university: 'Desconocida',
      level: 'Desconocido',
      status: 'BLOQUEADO',
      registeredAt: new Date().toISOString(),
      approvedAt: null,
      blockedAt: new Date().toISOString(),
      blockReason: reason,
      downloadQuota: 0,
      downloadsCount: 0
    };
    users.push(user);
  } else {
    user.status = 'BLOQUEADO';
    user.blockedAt = new Date().toISOString();
    user.blockReason = reason;
  }
  saveUsers(users);

  const messageForUser = `⛔ *Aviso de Suspensión de Acceso*\n\n` +
                         `Su acceso a la Biblioteca Médica ha sido suspendido por decisión de la Dirección (*Gestor de Contenido*).\n` +
                         `Motivo: ${reason}.`;

  return { success: true, user, messageForUser };
}

/**
 * 4. DESBLOQUEO DE USUARIO
 */
function unblockUser(phone) {
  const users = loadUsers();
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  const user = users.find(u => u.phone === cleanPhone);

  if (!user) return { success: false, error: 'USER_NOT_FOUND' };

  user.status = 'APROBADO';
  user.unblockedAt = new Date().toISOString();
  saveUsers(users);

  const messageForUser = `✅ *Acceso Restablecido*\n\n` +
                         `Su acceso a la Biblioteca Médica ha sido reactivado por el *Gestor de Contenido*. Le invitamos a consultar el código de conducta escribiendo *"MANUAL"*.`;

  return { success: true, user, messageForUser };
}

/**
 * SUSPENSIÓN TEMPORAL DE USUARIO (24h, 48h, 72h)
 */
function suspendUser(phone, hours = 24, reason = 'Suspensión temporal preventiva') {
  const users = loadUsers();
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  let user = users.find(u => u.phone === cleanPhone);

  const numHours = parseInt(hours, 10) || 24;
  const suspensionEnd = new Date(Date.now() + (numHours * 60 * 60 * 1000)).toISOString();

  if (!user) {
    user = {
      phone: cleanPhone,
      name: 'Usuario',
      university: 'N/A',
      level: 'N/A',
      status: `SUSPENDIDO_${numHours}H`,
      registeredAt: new Date().toISOString(),
      suspendedAt: new Date().toISOString(),
      suspensionEnd: suspensionEnd,
      blockReason: reason,
      downloadQuota: 0,
      downloadsCount: 0
    };
    users.push(user);
  } else {
    user.status = `SUSPENDIDO_${numHours}H`;
    user.suspendedAt = new Date().toISOString();
    user.suspensionEnd = suspensionEnd;
    user.blockReason = reason;
  }
  saveUsers(users);

  const messageForUser = `⏳ *NOTIFICACIÓN DE CONDICIÓN DISCIPLINARIA*\n━━━━━━━━━━━━━━━━━━━━━━━━━━\nEstimado(a) ${user.name}:\nLa Dirección del Proyecto informa que su acceso a la Biblioteca Médica ha sido *SUSPENDIDO TEMPORALMENTE* por un término de *${numHours} horas*.\n\n📋 *Motivo:* ${reason}\n🕒 *Fecha de reactivación automática:* ${new Date(suspensionEnd).toLocaleString('es-CO')}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n_Su servicio se restablecerá de manera autónoma al finalizar el término estipulado._`;

  return { success: true, user, messageForUser, suspensionEnd, hours: numHours };
}

/**
 * EXPULSIÓN DEFINITIVA DE USUARIO (IRREVOCABLE)
 */
function expelUser(phone, reason = 'Expulsión definitiva e irrevocable') {
  const users = loadUsers();
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  let user = users.find(u => u.phone === cleanPhone);

  if (!user) {
    user = {
      phone: cleanPhone,
      name: 'Usuario Expulsado',
      university: 'N/A',
      level: 'N/A',
      status: 'EXPULSADO',
      registeredAt: new Date().toISOString(),
      expelledAt: new Date().toISOString(),
      blockReason: reason,
      downloadQuota: 0,
      downloadsCount: 0
    };
    users.push(user);
  } else {
    user.status = 'EXPULSADO';
    user.expelledAt = new Date().toISOString();
    user.blockReason = reason;
  }
  saveUsers(users);

  const messageForUser = `🚫 *NOTIFICACIÓN DE EXPULSIÓN DEFINITIVA*\n━━━━━━━━━━━━━━━━━━━━━━━━━━\nEstimado(a) ${user.name}:\nLa Dirección del Proyecto informa que su cuenta y número de contacto han sido *EXPULSADOS DE FORMA PERMANENTE E IRREVOCABLE* del acervo institucional.\n\n📋 *Motivo:* ${reason}\n\n⚠️ *Resolución:* Este número telefónico y registro quedan inhabilitados definitivamente. No se admitirán futuras solicitudes de incorporación al acervo.\n━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  return { success: true, user, messageForUser };
}

/**
 * 5. ELIMINACIÓN DE USUARIO
 */
function deleteUser(phone) {
  let users = loadUsers();
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  const initialLen = users.length;
  users = users.filter(u => u.phone !== cleanPhone);

  if (users.length === initialLen) return { success: false, error: 'USER_NOT_FOUND' };

  saveUsers(users);
  return { success: true, deletedPhone: cleanPhone };
}

/**
 * 3. VERIFICACIÓN DE PERMISOS DE USUARIO
 */
function isUserApproved(phone) {
  const users = loadUsers();
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  const user = users.find(u => u.phone === cleanPhone);
  return user && (user.status === 'APROBADO' || user.status === 'ACTIVO');
}

/**
 * 4. BOLETÍN DOMINICAL (NOVEDADES DE LOS ÚLTIMOS 7 DÍAS)
 */
function getWeeklyNewTitles(days = 7) {
  let catalog = [];
  if (fs.existsSync(CATALOG_PATH)) {
    try { catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8')); } catch(e){}
  }

  // Si estamos en demo/prueba, tomamos los 10 primeros como muestra de novedades
  return catalog.slice(0, 10).map(d => ({
    id: d.id,
    year: d.year,
    author: d.author,
    title: d.title,
    category: d.category,
    ao: d.aoClass !== 'N/A' ? d.aoClass : null
  }));
}

function formatSundayBulletinPrompt(newCount = 10) {
  return `📚 *Boletín Dominical de Novedades — Biblioteca Ortopédica*\n\n` +
         `Estimado colega: Durante los últimos 7 días se han incorporado *${newCount} nuevos documentos y técnicas quirúrgicas* a la colección.\n\n` +
         `¿Desea conocer la lista detallada y recibir el resumen en PDF?\n\n` +
         `👉 *Responda "SÍ" para recibirlo de inmediato.*`;
}

function generateWeeklyBulletinReport(docs) {
  let report = `📋 *CATÁLOGO DE NOVEDADES SEMANALES — BIBLIOTECA ORTOPÉDICA*\n`;
  report += `📅 *Fecha de Emisión:* ${new Date().toLocaleDateString('es-CO')}\n`;
  report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  const byCategory = {};
  for (const doc of docs) {
    if (!byCategory[doc.category]) byCategory[doc.category] = [];
    byCategory[doc.category].push(doc);
  }

  for (const [cat, list] of Object.entries(byCategory)) {
    report += `📁 *CATEGORÍA: ${cat.toUpperCase()}*\n`;
    for (const d of list) {
      report += `  • *${d.year}* | ${d.author} — _"${d.title}"_\n`;
      if (d.ao) report += `    ↳ Clasificación: ${d.ao}\n`;
    }
    report += `\n`;
  }

  report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  report += `💡 *Para descargar cualquier documento, simplemente copie y envíe el título o ID al chat.*`;

  return report;
}

module.exports = {
  registerUser,
  updateUserProfile,
  updateUserLanguage,
  resolveCountryAndLanguage,
  COUNTRY_DIAL_MAP,
  translateAnnouncement,
  approveUser,
  rejectUser,
  blockUser,
  unblockUser,
  suspendUser,
  expelUser,
  deleteUser,
  isUserApproved,
  getWeeklyNewTitles,
  formatSundayBulletinPrompt,
  generateWeeklyBulletinReport,
  loadUsers,
  saveUsers
};
