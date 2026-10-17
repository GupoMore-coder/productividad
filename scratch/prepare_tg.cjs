const fs = require('fs');
const res = JSON.parse(fs.readFileSync('scratch/temas_generales_audit_results.json', 'utf8'));

const mappings = [];
for (const r of res) {
  let f = r.file;
  let year = r.year;
  let ext = f.slice(f.lastIndexOf('.'));
  
  let raw = f.slice(0, f.lastIndexOf('.'));
  let author = 'S-A';
  let title = raw;
  
  const m = raw.match(/^(?:S-F\s*-\s*)?(?:null\s*-\s*)?(?:S-A\s*-\s*)?([^-]+)\s*-\s*(.+)$/i);
  if (m) {
    author = m[1].trim();
    title = m[2].trim();
  }
  
  if (f.includes('Cailliet') || f.includes('Anatomía funcional, biomecánica')) {
    year = '2006'; author = 'Cailliet, René'; title = 'Anatomía Funcional y Biomecánica';
  } else if (f.includes('Kapandji') && f.includes('Miembro Inferior')) {
    year = '2012'; author = 'Kapandji, A. I.'; title = 'Fisiología Articular Miembro Inferior - Ed. 6';
  } else if (f.includes('Kapandji') || f.includes('Fisiologia Articular')) {
    year = '2012'; author = 'Kapandji, A. I.'; title = 'Fisiología Articular Esquemas Comentados de Mecánica Humana - Ed. 6';
  } else if (f.includes('Sarmiento') && f.includes('Nonsurgical')) {
    year = '2006'; author = 'Sarmiento, Augusto'; title = 'The Nonsurgical Treatment of Fractures in Contemporary Orthopedics';
  } else if (f.includes('Bontrager') || f.includes('Bontragers')) {
    year = '2018'; author = 'Bontrager, Kenneth L.'; title = 'Textbook of Radiographic Positioning and Related Anatomy - Ed. 9';
  } else if (f.includes('Apley')) {
    year = '2010'; author = 'Solomon, Louis'; title = 'Apley y Solomon Sistema de Ortopedia y Fracturas - Ed. 9';
  } else if (f.includes('ROUVIERE') || f.includes('Rouviere') || f.includes('Tomo 3')) {
    year = '2005'; author = 'Rouvière, Henri'; title = 'Anatomía Humana Miembros - Ed. 11 - Tomo 3';
  } else if (f.includes('Martini') && f.includes('Anatomía humana')) {
    year = '2009'; author = 'Martini, Frederic H.'; title = 'Anatomía Humana - Ed. 6';
  } else if (f.includes('Miralles') || f.includes('biomecanica clinica')) {
    year = '2007'; author = 'Miralles Marrero, Rodrigo C.'; title = 'Biomecánica Clínica del Aparato Locomotor - Ed. 2';
  } else if (f.includes('Lasanianos')) {
    year = '2014'; author = 'Lasanianos, Nick G.'; title = 'Trauma and Orthopaedic Classifications A Comprehensive Overview';
  } else if (f.includes('Viladot') || f.includes('Órtesis y Prótesis')) {
    year = '2009'; author = 'Viladot Voegeli, Antonio'; title = 'Órtesis y Prótesis del Aparato Locomotor - Ed. 2';
  } else if (f.includes('Toni Bové') || f.includes('Vendaje Funcional')) {
    year = '2005'; author = 'Bové, Toni'; title = 'El Vendaje Funcional - Ed. 3';
  } else if (f.includes('Jurado Bueno') || f.includes('Pruebas Diagnósticas')) {
    year = '2007'; author = 'Jurado Bueno, Antonio'; title = 'Manual de Pruebas Diagnósticas en Traumatología y Ortopedia';
  } else if (f.includes('Rocabado') || f.includes('Terapia Manual')) {
    year = '2004'; author = 'Rocabado, Mariano'; title = 'Fundamentos de la Terapia Manual Ortopédica';
  } else if (f.includes('Broome') || f.includes('Técnicas Quiroprácticas')) {
    year = '2004'; author = 'Broome, Raymond T.'; title = 'Técnicas Quiroprácticas de las Articulaciones Periféricas';
  } else if (f.includes('Firpo') || f.includes('Manual de Ortopedia y Traumatología')) {
    year = '2010'; author = 'Firpo, Carlos A. N.'; title = 'Manual de Ortopedia y Traumatología';
  } else if (f.includes('McNabb') || f.includes('Infiltraciones')) {
    year = '2015'; author = 'McNabb, J. W.'; title = 'Guía Práctica de Infiltraciones Musculoesqueléticas';
  } else if (f.includes('DANIELS Y WORTHINGHAM') || f.includes('balance muscular')) {
    year = '2019'; author = 'Hislop, Helen J.'; title = 'Daniels y Worthingham Técnicas de Balance Muscular - Ed. 10';
  } else if (f.includes('Hoppenfeld') && f.includes('Cirugía ortopédica')) {
    year = '2004'; author = 'Hoppenfeld, Stanley'; title = 'Vías de Abordaje en Cirugía Ortopédica - Ed. 3';
  } else if (f.includes('Netter') && f.includes('superior')) {
    year = '2014'; author = 'Netter, Frank H.'; title = 'Atlas de Anatomía Miembro Superior';
  } else if (f.includes('Netter')) {
    year = '2014'; author = 'Netter, Frank H.'; title = 'Atlas Práctico de Anatomía del Aparato Locomotor';
  } else if (f.includes('Pérez-Soriano')) {
    year = '2014'; author = 'Pérez-Soriano, Pedro'; title = 'Biomecánica Básica Aplicada a la Actividad Física y el Deporte';
  } else if (f.includes('Forriol') || f.includes('Manual del residente de C.O.T')) {
    year = '2014'; author = 'Forriol Campos, Francisco'; title = 'Manual del Residente de COT - Tomo 2';
  } else if (f.includes('Otsuka')) {
    year = '2016'; author = 'Otsuka, Norman Y.'; title = 'Fracturas y Luxaciones en Pediatría';
  } else if (f.includes('Orrego')) {
    year = '2014'; author = 'Orrego, Mario'; title = 'Ortopedia y Traumatología Básica';
  } else if (f.includes('Taboadela') || f.includes('Goniometría')) {
    year = '2007'; author = 'Taboadela, Claudio H.'; title = 'Goniometría Evaluación de las Incapacidades Laborales';
  } else if (f.includes('Argimon')) {
    year = '2013'; author = 'Argimon Pallàs, Josep M.'; title = 'Métodos de Investigación Clínica y Epidemiológica - Ed. 4';
  } else if (f.includes('GOLD 2023')) {
    year = '2023'; author = 'GOLD'; title = 'Guía Global para el Diagnóstico y Manejo de la EPOC';
  } else if (f.includes('Thakur')) {
    year = '2012'; author = 'Thakur, Anand J.'; title = 'Tapping the Power of PowerPoint para Presentaciones Médicas';
  } else if (f.includes('Kalra')) {
    year = '2013'; author = 'Kalra, Ankur'; title = 'Diagnóstico y Manejo del Síndrome de Implantación de Cemento';
  } else if (f.includes('Beam')) {
    year = '2006'; author = 'Beam, Joel W.'; title = 'Orthopedic Taping Wrapping Bracing and Padding';
  } else if (f.includes('Porteous')) {
    year = '2012'; author = 'Porteous, Alan'; title = 'Techniques and Principles for the Operating Room';
  } else if (f.includes('Kocaoglu')) {
    year = '2014'; author = 'Kocaoglu, Mehmet'; title = 'Musculoskeletal Injections Manual Basics and Techniques';
  } else if (f.includes('Flatow')) {
    year = '2012'; author = 'Flatow, Evan'; title = 'Orthopaedic Procedures Atlas QuickRef';
  } else if (f.includes('Babst') || f.includes('Learning_from_Failures')) {
    year = '2020'; author = 'Babst, Reto'; title = 'Learning from Failures in Orthopedic Trauma';
  }
  
  if (!year) year = '2015';
  if (!author || author === 'null') author = 'S-A';
  
  let cleanTitle = title.replace(/[/\\:*?"<>|]/g, '').replace(/\s+/g, ' ').trim();
  let cleanAuthor = author.replace(/[/\\:*?"<>|]/g, '').replace(/\s+/g, ' ').trim();
  let std = `${year} - ${cleanAuthor} - ${cleanTitle}${ext}`;
  mappings.push({ src: f, std, hash: r.hash, size: r.size });
}

console.log('Total mappings prepared for Temas generales:', mappings.length);
mappings.slice(0, 15).forEach(m => console.log(' ' + m.src + '\n   -> ' + m.std));
fs.writeFileSync('scratch/tg_planned_renames.json', JSON.stringify(mappings, null, 2));
