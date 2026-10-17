const fs = require('fs');
const { spawnSync } = require('child_process');

/**
 * Envía un archivo a la Papelera de Reciclaje de Windows de forma segura
 * Si falla o el disco no tiene papelera (ej. red/Google Drive virtual),
 * ejecuta eliminación definitiva con fs.unlinkSync.
 */
function sendToRecycleBin(filePath) {
  if (!fs.existsSync(filePath)) return true;
  
  try {
    const psCmd = `Add-Type -AssemblyName Microsoft.VisualBasic; [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile('${filePath.replace(/'/g, "''")}', 'OnlyErrorDialogs', 'SendToRecycleBin')`;
    const res = spawnSync('powershell.exe', ['-NoProfile', '-Command', psCmd]);
    if (res.status === 0 && !fs.existsSync(filePath)) {
      return true;
    }
  } catch (err) {}

  // Fallback seguro: eliminación directa para liberar espacio en Google Drive
  try {
    fs.unlinkSync(filePath);
    return true;
  } catch (err) {
    return false;
  }
}

module.exports = { sendToRecycleBin };
