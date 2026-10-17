/**
 * GOBERNANZA, CONTROL DE ACCESO Y BOLETÍN DOMINICAL (FASE 4)
 * Dirección: Gestor de Contenido
 */

const fs = require('fs');
const path = require('path');

const USERS_PATH = path.join(__dirname, 'knowledge', 'users_directory.json');
const CATALOG_PATH = path.join(__dirname, 'knowledge', 'master_catalog.json');

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
function registerUser({ phone, fullName, university, level }) {
  const users = loadUsers();
  const cleanPhone = phone.replace(/[^\d+]/g, '');

  let existing = users.find(u => u.phone === cleanPhone);
  if (existing) {
    return {
      status: 'ALREADY_REGISTERED',
      user: existing,
      message: existing.status === 'APROBADO' 
        ? 'Su cuenta ya se encuentra activa y autorizada para el uso de la biblioteca.' 
        : 'Su solicitud ya fue enviada previamente y se encuentra a la espera de aprobación por parte de la Dirección Médica.'
    };
  }

  const newUser = {
    phone: cleanPhone,
    name: fullName.trim(),
    university: university.trim(),
    level: level.trim(), // e.g. 'Residente R2', 'Especialista', etc.
    status: 'PENDIENTE_APROBACION',
    registeredAt: new Date().toISOString(),
    approvedAt: null,
    downloadQuota: 50,
    downloadsCount: 0
  };

  users.push(newUser);
  saveUsers(users);

  const alertForGerente = `🩺 *NUEVA SOLICITUD DE ACCESO A LA BIBLIOTECA*\n` +
                          `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                          `👤 *Médico:* ${newUser.name}\n` +
                          `🏛️ *Universidad:* ${newUser.university}\n` +
                          `🎓 *Nivel:* ${newUser.level}\n` +
                          `📱 *WhatsApp:* \`${newUser.phone}\`\n` +
                          `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                          `👉 *¿Desea autorizar el acceso?*\n` +
                          `1. Responder *"APROBAR ${newUser.phone}"*\n` +
                          `2. Responder *"RECHAZAR ${newUser.phone}"*`;

  const welcomeForUser = `👋 *Bienvenido(a) a la Biblioteca Médica Especializada de Ortopedia y Traumatología.*\n\n` +
                         `Hemos recibido sus datos de registro:\n` +
                         `• *Nombre:* ${newUser.name}\n` +
                         `• *Institución:* ${newUser.university}\n` +
                         `• *Nivel:* ${newUser.level}\n\n` +
                         `⚠️ *Estado Actual:* En espera de autorización por la Dirección del Proyecto (Gestor de Contenido).\n\n` +
                         `_Nota: Este es un proyecto de consulta clínica y apoyo académico en desarrollo colaborativo. Le notificaremos por esta misma vía en cuanto su acceso sea habilitado._`;

  return {
    status: 'PENDING_APPROVAL',
    user: newUser,
    alertForGerente,
    welcomeForUser
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

  const messageForUser = `✅ *¡Acceso Autorizado a la Biblioteca Ortopédica!*\n\n` +
                         `Estimado(a) ${user.name}: Su solicitud de acceso ha sido formalmente aprobada por el *Gestor de Contenido*.\n\n` +
                         `📖 *Manual Oficial de Uso y Gobernanza:*\n` +
                         `Adjuntamos el manual del proyecto donde se detallan los protocolos de búsqueda, las reglas de conducta y el código de uso apropiado.\n\n` +
                         `👉 Puede consultar o descargar el manual en cualquier momento escribiendo *"MANUAL"* o *"AYUDA"*.\n\n` +
                         `💡 *Para comenzar:* Escriba la patología, técnica, autor o clasificación AO que desea consultar.`;

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
  return user && user.status === 'APROBADO';
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
  approveUser,
  blockUser,
  unblockUser,
  deleteUser,
  isUserApproved,
  getWeeklyNewTitles,
  formatSundayBulletinPrompt,
  generateWeeklyBulletinReport,
  loadUsers
};
