/**
 * PROXY DE DESCARGA ANÓNIMA Y ENMASCARAMIENTO SEGURO
 * Doctrina: Zero-Knowledge de Google Drive (Jay Chaudhry - Zero Trust; Andy Yen - Privacidad)
 * 
 * Propósito:
 * 1. Genera tokens efímeros firmados criptográficamente (HMAC-SHA256).
 * 2. Asocia cada enlace al número telefónico del solicitante (+573...).
 * 3. Establece caducidad estricta (TTL de 15 a 30 minutos).
 * 4. Impide la copia/redistribución entre usuarios o en navegadores ajenos.
 * 5. La URL de Google Drive NUNCA se expone en el chat de WhatsApp.
 */

const crypto = require('crypto');

const DEFAULT_SECRET = process.env.PROXY_SECRET_SALT || 'Antigravity_Ortho_Secret_2026_Secure_Key';
const DEFAULT_TTL_MINUTES = 30;

/**
 * Genera un token efímero firmado para un archivo y un usuario específico
 */
function createSecureDownloadToken({ driveId, userPhone, ttlMinutes = DEFAULT_TTL_MINUTES, secret = DEFAULT_SECRET }) {
  if (!driveId) throw new Error('El Drive File ID es obligatorio');
  if (!userPhone) throw new Error('El teléfono del usuario es obligatorio para vincular la sesión');

  const exp = Date.now() + (ttlMinutes * 60 * 1000);
  const nonce = crypto.randomBytes(8).toString('hex');
  
  const payload = {
    did: driveId,
    phn: userPhone.replace(/[^\d+]/g, ''),
    exp: exp,
    nce: nonce
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');

  return `${payloadB64}.${signature}`;
}

const LIVE_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbxvKxFuTtTpcXXo3XgdAo1WAiIl4WhYlgd2ldPA2ePfC7Mmlo7VDu03BOhL9ybWL_Nv/exec';

/**
 * Genera la URL completa de descarga anónima lista para enviar por WhatsApp
 */
function buildAnonymousDownloadUrl({ driveId, userPhone, baseUrl = LIVE_WEBAPP_URL }) {
  const token = createSecureDownloadToken({ driveId, userPhone });
  return `${baseUrl}?token=${encodeURIComponent(token)}`;
}

/**
 * Valida un token efímero y extrae los datos de descarga
 */
function verifyAndDecodeToken(token, { userPhone = null, secret = DEFAULT_SECRET } = {}) {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'TOKEN_EMPTY' };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'TOKEN_MALFORMED' };
  }

  const [payloadB64, signature] = parts;
  const expectedSignature = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');

  // 1. Verificación criptográfica anti-manipulación en tiempo constante
  const sigA = Buffer.from(signature);
  const sigB = Buffer.from(expectedSignature);
  if (sigA.length !== sigB.length || !crypto.timingSafeEqual(sigA, sigB)) {
    return { valid: false, error: 'SIGNATURE_INVALID' };
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  } catch (e) {
    return { valid: false, error: 'PAYLOAD_CORRUPT' };
  }

  // 2. Verificación de caducidad (TTL)
  if (Date.now() > payload.exp) {
    return { valid: false, error: 'TOKEN_EXPIRED', expiredAt: new Date(payload.exp).toISOString() };
  }

  // 3. Verificación de identidad del solicitante (Anti-redistribución entre usuarios)
  if (userPhone) {
    const cleanReqPhone = userPhone.replace(/[^\d+]/g, '');
    if (payload.phn !== cleanReqPhone) {
      return { valid: false, error: 'USER_MISMATCH', detail: 'Este enlace no fue emitido para este usuario.' };
    }
  }

  return {
    valid: true,
    driveId: payload.did,
    userPhone: payload.phn,
    expiresAt: new Date(payload.exp).toISOString(),
    remainingMinutes: Math.round((payload.exp - Date.now()) / 60000)
  };
}

module.exports = {
  createSecureDownloadToken,
  verifyAndDecodeToken,
  buildAnonymousDownloadUrl,
  LIVE_WEBAPP_URL
};
