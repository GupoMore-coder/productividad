const fs = require('fs');
const path = require('path');
const { ROOT_DIR, sanitizeFileName } = require('./renaming_master_v2.cjs');

console.log('=== ETAPA 1: ESTANDARIZACIÓN DE TRATADOS CAPITULARES ===');

let totalRenamed = 0;

// 1. Libros\BC STAT (Skeletal Trauma 2020, Browner)
const bcDir = path.join(ROOT_DIR, 'Libros', 'BC STAT');
if (fs.existsSync(bcDir)) {
  const files = fs.readdirSync(bcDir).filter(f => f.endsWith('.pdf'));
  console.log(`Procesando ${files.length} capítulos en Libros\\BC STAT...`);
  
  files.forEach(f => {
    // Patrón: BC STA20 01 The History of Trauma Care.pdf
    const match = f.match(/^BC STA20\s*(\d{1,2})\s*(.+)\.pdf$/i);
    if (match) {
      const capNum = match[1].padStart(2, '0');
      let title = match[2].replace(/_/g, ' ').trim();
      title = sanitizeFileName(title);
      const newName = `2020 - Browner, Bruce D. - Skeletal Trauma - Cap. ${capNum} ${title}.pdf`;
      const oldPath = path.join(bcDir, f);
      const newPath = path.join(bcDir, newName);
      if (oldPath !== newPath && !fs.existsSync(newPath)) {
        fs.renameSync(oldPath, newPath);
        totalRenamed++;
      }
    }
  });
}

// 2. Libros\Surgery of the hip (Berry, Daniel J. & Lieberman, Jay R.)
const hipDir = path.join(ROOT_DIR, 'Libros', 'Surgery of the hip');
if (fs.existsSync(hipDir)) {
  const files = fs.readdirSync(hipDir).filter(f => f.endsWith('.pdf'));
  console.log(`Procesando ${files.length} capítulos en Libros\\Surgery of the hip...`);

  files.forEach(f => {
    // Patrón: chapter 1 biomechanics of the natural hip joint.pdf
    const match = f.match(/^chapter\s*(\d{1,2})\s*(.+)\.pdf$/i);
    if (match) {
      const capNum = match[1].padStart(2, '0');
      let title = match[2].replace(/_/g, ' ').trim();
      // Capitalize first letters of words in title
      title = title.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      title = sanitizeFileName(title);
      const newName = `2020 - Berry, Daniel J. - Surgery of the Hip - Cap. ${capNum} ${title}.pdf`;
      const oldPath = path.join(hipDir, f);
      const newPath = path.join(hipDir, newName);
      if (oldPath !== newPath && !fs.existsSync(newPath)) {
        fs.renameSync(oldPath, newPath);
        totalRenamed++;
      }
    }
  });
}

// 3. Libros\AO MASTERS
const aoDir = path.join(ROOT_DIR, 'Libros', 'AO MASTERS');
if (fs.existsSync(aoDir)) {
  const files = fs.readdirSync(aoDir).filter(f => f.endsWith('.pdf') || f.endsWith('.PDF'));
  console.log(`Procesando ${files.length} volúmenes en Libros\\AO MASTERS...`);

  files.forEach(f => {
    let newName = null;
    const lower = f.toLowerCase();

    // AO Spine Masters Series
    const spineMatch = f.match(/ao[\s_]*spine[\s_]*masters?[\s_]*series[,\s_]*volume[\s_]*(\d{1,2})[_\s]*(.+?)(?:-thieme|\.pdf)/i);
    if (spineMatch) {
      const volNum = spineMatch[1].padStart(2, '0');
      let volTitle = spineMatch[2].replace(/_/g, ' ').replace(/-/g, ' ').trim();
      volTitle = sanitizeFileName(volTitle);
      newName = `2016 - AO Spine - Masters Series - Vol. ${volNum} ${volTitle}.pdf`;
    } else if (lower.includes('ao principles of fracture management')) {
      if (lower.includes('1ed') || lower.includes('2000')) {
        newName = '2000 - Rüedi, Thomas P. - AO Principles of Fracture Management - Ed. 1.pdf';
      } else if (lower.includes('2ed') || lower.includes('2007')) {
        newName = '2007 - Rüedi, Thomas P. - AO Principles of Fracture Management - Ed. 2.pdf';
      } else if (lower.includes('3ed') || lower.includes('2018')) {
        newName = '2018 - Buckley, Richard E. - AO Principles of Fracture Management - Ed. 3.pdf';
      }
    } else if (lower.includes('pelvis and acetabulum')) {
      newName = '2015 - Tile, Marvin - Fractures of the Pelvis and Acetabulum - Ed. 4.pdf';
    } else if (lower.includes('handbook orthopaedic trauma care')) {
      newName = '2014 - AO Foundation - Handbook Orthopaedic Trauma Care.pdf';
    } else if (lower.includes('internal_fixation_techniques') || lower.includes('manual_of_internal_fixation')) {
      newName = '1991 - Müller, Maurice E. - Manual of Internal Fixation - Ed. 3.pdf';
    } else if (lower.includes('osteotomies around the knee')) {
      newName = '2008 - Lobenhoffer, Philipp - AO Osteotomies around the Knee.pdf';
    } else if (lower.includes('elbow & forearm')) {
      newName = '2009 - Jupiter, Jesse B. - AO Manual of Fracture Management Elbow and Forearm.pdf';
    } else if (lower.includes('hand and wrist')) {
      newName = '2018 - Jupiter, Jesse B. - AO Manual of Fracture Management Hand and Wrist.pdf';
    }

    if (newName) {
      const oldPath = path.join(aoDir, f);
      const newPath = path.join(aoDir, newName);
      if (oldPath !== newPath && !fs.existsSync(newPath)) {
        fs.renameSync(oldPath, newPath);
        totalRenamed++;
      }
    }
  });
}

console.log(`Etapa 1 completada exitosamente. Total tratados capitulares renombrados: ${totalRenamed}`);

