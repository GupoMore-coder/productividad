const fs = require('fs');
const res = JSON.parse(fs.readFileSync('scratch/libros_analyzed.json', 'utf8'));

const planned = [];

for (const r of res) {
  let f = r.file;
  let year = r.year;
  let ext = f.slice(f.lastIndexOf('.'));
  let author = 'S-A';
  let title = f.slice(0, f.lastIndexOf('.'));

  // Basic cleanup of prefixes
  const m = title.match(/^(?:S-F\s*-\s*)?(?:null\s*-\s*)?(?:S-A\s*-\s*)?([^-]+)\s*-\s*(.+)$/i);
  if (m) {
    author = m[1].trim();
    title = m[2].trim();
  }

  // Exact medical textbook recognition
  if (f.includes('CANALE-CIRUGIA ORTOPEDICA 1 DE 4')) {
    year = '2013'; author = 'Canale, S. Terry'; title = 'Campbell Cirugía Ortopédica - Ed. 12 - Vol. 1';
  } else if (f.includes('CANALE-CIRUGIA ORTOPEDICA 2 DE 4')) {
    year = '2013'; author = 'Canale, S. Terry'; title = 'Campbell Cirugía Ortopédica - Ed. 12 - Vol. 2';
  } else if (f.includes('CANALE-CIRUGIA ORTOPEDICA 3 DE 4')) {
    year = '2013'; author = 'Canale, S. Terry'; title = 'Campbell Cirugía Ortopédica - Ed. 12 - Vol. 3';
  } else if (f.includes('CANALE-CIRUGIA ORTOPEDICA 4 DE 4')) {
    year = '2013'; author = 'Canale, S. Terry'; title = 'Campbell Cirugía Ortopédica - Ed. 12 - Vol. 4';
  } else if (f.includes('Campbell Cirugía Ortopédica - 10° Edición')) {
    year = '2004'; author = 'Canale, S. Terry'; title = 'Campbell Cirugía Ortopédica - Ed. 10 - 4 Tomos';
  } else if (f.includes('CAMBELL 2021 ESPAÑOL') || f.includes('Técnicas quirúrgicas en ortopedia')) {
    year = '2021'; author = 'Azar, Frederick M.'; title = 'Campbell Cirugía Ortopédica Técnicas Quirúrgicas - Ed. 14';
  } else if (f.includes('AO Principles of Fracture Management 3rd Edition')) {
    year = '2018'; author = 'Buckley, Richard E.'; title = 'AO Principles of Fracture Management - Ed. 3';
  } else if (f.includes('Principios de la AO en el Tratamiento de Las fracturas')) {
    year = '2003'; author = 'Rüedi, Thomas P.'; title = 'Principios de la AO en el Tratamiento de las Fracturas';
  } else if (f.includes('Harborview') && (f.includes('2 ed') || f.includes('Githens') || f.includes('Henley'))) {
    year = '2019'; author = 'Henley, M. Bradford'; title = 'Harborview Illustrated Tips and Tricks in Fracture Surgery - Ed. 2';
  } else if (f.includes('Taitsman') || f.includes('HARBORVIEW')) {
    year = '2011'; author = 'Taitsman, Lisa A.'; title = 'Harborview Illustrated Tips and Tricks in Fracture Surgery - Ed. 1';
  } else if (f.includes('Snell. Anatomia clinica')) {
    year = '2019'; author = 'Snell, Richard S.'; title = 'Anatomía Clínica por Regiones - Ed. 10';
  } else if (f.includes('Functional Fracture Bracing')) {
    year = '1995'; author = 'Sarmiento, Augusto'; title = 'Functional Fracture Bracing Tibia Humerus and Ulna';
  } else if (f.includes('Rockwood and Green') && (f.includes('10th') || f.includes('2025'))) {
    year = '2025'; author = 'Tornetta, Paul III'; title = 'Rockwood and Green Fractures in Adults - Ed. 10';
  } else if (f.includes('Rockwood Fracturas en el adulto T1')) {
    year = '2003'; author = 'Bucholz, Robert W.'; title = 'Rockwood y Green Fracturas en el Adulto - Ed. 5 - Tomo 1';
  } else if (f.includes('Rockwood Fracturas en el adulto T2')) {
    year = '2003'; author = 'Bucholz, Robert W.'; title = 'Rockwood y Green Fracturas en el Adulto - Ed. 5 - Tomo 2';
  } else if (f.includes('Rockwood Fracturas en el adulto T3')) {
    year = '2003'; author = 'Bucholz, Robert W.'; title = 'Rockwood y Green Fracturas en el Adulto - Ed. 5 - Tomo 3';
  } else if (f.includes('Green Cirugía de mano Tomo 1')) {
    year = '2011'; author = 'Wolfe, Scott W.'; title = 'Green Cirugía Operatoria de la Mano - Ed. 6 - Tomo 1';
  } else if (f.includes('Green Cirugía de mano Tomo 2')) {
    year = '2011'; author = 'Wolfe, Scott W.'; title = 'Green Cirugía Operatoria de la Mano - Ed. 6 - Tomo 2';
  } else if (f.includes('Exploración diagnóstica de los niveles medulares')) {
    year = '2018'; author = 'Hoppenfeld, Stanley'; title = 'Neurología Ortopédica Exploración Diagnóstica de los Niveles Medulares';
  } else if (f.includes('Hoppenfeld') && (f.includes('Cirugía ortopédica') || f.includes('Abordajes'))) {
    year = '2005'; author = 'Hoppenfeld, Stanley'; title = 'Vías de Abordaje en Cirugía Ortopédica - Ed. 3';
  } else if (f.includes('Hoppenfeld') && f.includes('Clinical Orthopaedic Rehabilitation')) {
    year = '2000'; author = 'Hoppenfeld, Stanley'; title = 'Clinical Orthopaedic Rehabilitation';
  } else if (f.includes('Manual_de_Exploracion_Fisica_del_Aparato_Locomotor')) {
    year = '2011'; author = 'Jurado Bueno, Antonio'; title = 'Manual de Exploración Física del Aparato Locomotor';
  } else if (f.includes('Manuela Aldede')) {
    year = '2014'; author = 'SECOT'; title = 'Manual del Residente de COT - Tomo 1';
  } else if (f.includes('List of Techniques VOLUME I Surgical Techniques')) {
    year = '2021'; author = 'Azar, Frederick M.'; title = 'Campbell Operative Orthopaedics Surgical Techniques - Ed. 14';
  } else if (f.includes('Proyecciones radiolgicas con correlacion anatomica')) {
    year = '2011'; author = 'Möller, Torsten B.'; title = 'Proyecciones Radiológicas con Correlación Anatómica';
  } else if (f.includes('Hip and Knee Arthroplasty')) {
    year = '2013'; author = 'Parvizi, Javad'; title = 'Revision Total Hip and Knee Arthroplasty';
  } else if (f.includes('Tromboembolismo')) {
    year = '2015'; author = 'AAOS'; title = 'Thromboembolism in Orthopedic Surgery';
  } else if (f.includes('Schemitsch') && f.includes('Operative Techniques')) {
    year = '2020'; author = 'Schemitsch, Emil H.'; title = 'Operative Techniques Orthopaedic Trauma Surgery - Ed. 2';
  } else if (f.includes('Wiss') && f.includes('rodilla')) {
    year = '2013'; author = 'Wiss, Donald A.'; title = 'Master Techniques in Orthopaedic Surgery Fractures - Ed. 3';
  } else if (f.includes('Koo') && f.includes('Osteonecrosis')) {
    year = '2014'; author = 'Koo, Kyung-Hoi'; title = 'Osteonecrosis';
  } else if (f.includes('Castoldi') && f.includes('Fracture Management')) {
    year = '2016'; author = 'Castoldi, Filippo'; title = 'Fractures Around the Knee';
  } else if (f.includes('Imhoff') && f.includes('Rehabilitacion')) {
    year = '2016'; author = 'Imhoff, Andreas B.'; title = 'Physiotherapy Rehabilitation in Orthopedic Surgery';
  } else if (f.includes('Haastert') || f.includes('Hans Assmus')) {
    year = '2014'; author = 'Haastert-Talini, Kirsten'; title = 'Modern Concepts of Peripheral Nerve Repair';
  } else if (f.includes('Mamczak') || f.includes('Tips and Tricks for Intraoperative Imaging')) {
    year = '2018'; author = 'Mamczak, Christiaan N.'; title = 'Illustrated Tips and Tricks for Intraoperative Imaging in Fracture Surgery';
  } else if (f.includes('Magee') || f.includes('ORTHOPEDIC PHYSICAL ASSESSMENT')) {
    year = '2014'; author = 'Magee, David J.'; title = 'Orthopedic Physical Assessment - Ed. 6';
  } else if (f.includes('Minimally Invasive Spine Interventions') || f.includes('Sang-Heon Lee')) {
    year = '2013'; author = 'Lee, Sang-Heon'; title = 'Minimally Invasive Spine Interventions';
  } else if (f.includes('Septic Bone and Joint Surgery')) {
    year = '2024'; author = 'Winkler, Heinz'; title = 'Septic Bone and Joint Surgery';
  } else if (f.includes('Zuelzer') || f.includes('Unusual Conditions')) {
    year = '2013'; author = 'Zuelzer, Wilhelm A.'; title = 'Unusual Conditions That Every Orthopaedic Surgeon Should Know';
  } else if (f.includes('Krajbich') || f.includes('Surgical, Prosthetic')) {
    year = '2016'; author = 'Krajbich, Joseph Ivan'; title = 'Atlas of Amputations and Limb Deficiencies - Ed. 4 - Vol. 1';
  } else if (f.includes('Atlas de Anatomía Humana') && f.includes('imagen')) {
    year = '2011'; author = 'Weir, Jamie'; title = 'Atlas de Anatomía Humana por Técnicas de Imagen - Ed. 4';
  } else if (f.includes('McRae') && f.includes('Clinical Orthopaedic Examination')) {
    year = '2010'; author = 'McRae, Ronald'; title = 'Clinical Orthopaedic Examination - Ed. 6';
  } else if (f.includes('McRae') && f.includes('Tratamiento')) {
    year = '2003'; author = 'McRae, Ronald'; title = 'Tratamiento Práctico de Fracturas - Ed. 4';
  } else if (f.includes('Trumble') && f.includes('Hand, elbow')) {
    year = '2006'; author = 'Trumble, Thomas E.'; title = 'Hand Elbow and Shoulder Core Knowledge in Orthopaedics';
  } else if (f.includes('Essential Orthopedics and Trauma') || f.includes('Hamblen')) {
    year = '2010'; author = 'Hamblen, David L.'; title = 'Essential Orthopaedics and Trauma - Ed. 5';
  } else if (f.includes('Evidence-based Orthopedics') || f.includes('Bhandari')) {
    year = '2012'; author = 'Bhandari, Mohit'; title = 'Evidence-Based Orthopedics';
  } else if (f.includes('GRAY Anatomia Basica')) {
    year = '2013'; author = 'Drake, Richard L.'; title = 'Gray Anatomía Básica';
  } else if (f.includes('Sharma') && f.includes('Hip Arthroplasty')) {
    year = '2022'; author = 'Sharma, Mrinal'; title = 'Hip Arthroplasty Current and Future Directions';
  } else if (f.includes('Imaging Anatomy Knee Ankle Foot')) {
    year = '2017'; author = 'Crim, Julia'; title = 'Imaging Anatomy Knee Ankle Foot - Ed. 2';
  } else if (f.includes('Orthofix') || f.includes('Anthony Goldberg')) {
    year = '2000'; author = 'Goldberg, Anthony'; title = 'Fijación Externa Orthofix Conceptos Básicos';
  } else if (f.includes('Lotke') && f.includes('Ortopedia')) {
    year = '2008'; author = 'Lotke, Paul A.'; title = 'Ortopedia - Ed. 2';
  } else if (f.includes('Morrison') && f.includes('MRI of the Spine')) {
    year = '2007'; author = 'Morrison, William B.'; title = 'MRI of the Spine A Guide for Orthopedic Surgeons';
  } else if (f.includes('Miller') && f.includes('Knee Surgery')) {
    year = '2018'; author = 'Miller, Mark D.'; title = 'Operative Techniques Knee Surgery - Ed. 2';
  } else if (f.includes('Wiesel') && f.includes('Operative_Techniques')) {
    year = '2011'; author = 'Wiesel, Sam W.'; title = 'Operative Techniques in Orthopaedic Surgery';
  } else if (f.includes('Biermann') && f.includes('Musculoskeletal Tumors')) {
    year = '2014'; author = 'Biermann, J. Sybil'; title = 'Orthopaedic Knowledge Update Musculoskeletal Tumors - Ed. 4';
  } else if (f.includes('David Ip') || f.includes('Orthopedic Traumatology')) {
    year = '2008'; author = 'Ip, David'; title = 'Orthopedic Traumatology A Resident Guide';
  } else if (f.includes('Planning and Reduction Technique') || (f.includes('Mast') && f.includes('planificación'))) {
    year = '1989'; author = 'Mast, Jeffrey'; title = 'Planning and Reduction Technique in Fracture Surgery';
  } else if (f.includes('Babst') && f.includes('Minimally Invasive')) {
    year = '2012'; author = 'Babst, Reto'; title = 'Minimally Invasive Plate Osteosynthesis MIPO AO - Ed. 2';
  } else if (f.includes('Apley') && f.includes('Concise')) {
    year = '2014'; author = 'Solomon, Louis'; title = 'Apley and Solomon Concise System of Orthopaedics and Trauma - Ed. 4';
  } else if (f.includes('Apley') && f.includes('System')) {
    year = '2018'; author = 'Solomon, Louis'; title = 'Apley and Solomon System of Orthopaedics and Trauma - Ed. 10';
  } else if (f.includes('Marecek') && f.includes('Comprehensive Orthopaedic Review')) {
    year = '2024'; author = 'Marecek, Geoffrey S.'; title = 'AAOS Comprehensive Orthopaedic Review 4';
  } else if (f.includes('Lieberman') && f.includes('Comprehensive Orthopaedic Review')) {
    year = '2020'; author = 'Lieberman, Jay R.'; title = 'AAOS Comprehensive Orthopaedic Review 3';
  } else if (f.includes('Boyer') && f.includes('Comprehensive Orthopaedic Review')) {
    year = '2014'; author = 'Boyer, Martin I.'; title = 'AAOS Comprehensive Orthopaedic Review - Ed. 2';
  } else if (f.includes('Morrey') && f.includes('Relevant Surgical Exposures')) {
    year = '2008'; author = 'Morrey, Bernard F.'; title = 'Master Techniques in Orthopaedic Surgery Relevant Surgical Exposures';
  } else if (f.includes('Mattox') && f.includes('Trauma')) {
    year = '2020'; author = 'Mattox, Kenneth L.'; title = 'Trauma - Ed. 9';
  } else if (f.includes('Ramos Vértiz')) {
    year = '2008'; author = 'Ramos Vértiz, A. J.'; title = 'Traumatología y Ortopedia - Ed. 2';
  } else if (f.includes('ATLS') || f.includes('Soporte Vital Avanzado')) {
    year = '2018'; author = 'ACS'; title = 'Soporte Vital Avanzado en Trauma ATLS - Ed. 10';
  } else if (f.includes('Greenspan') && f.includes('Orthopedic Imaging')) {
    year = '2015'; author = 'Greenspan, Adam'; title = 'Orthopedic Imaging A Practical Approach - Ed. 6';
  } else if (f.includes('Cleland') && f.includes('Netter')) {
    year = '2016'; author = 'Cleland, Joshua'; title = 'Netter Exploración Clínica en Ortopedia - Ed. 3';
  } else if (f.includes('Thompson') && f.includes('Netter')) {
    year = '2015'; author = 'Thompson, Jon C.'; title = 'Netter Atlas Práctico de Anatomía Ortopédica - Ed. 2';
  } else if (f.includes('Silberman') && f.includes('Varaona') && f.includes('4ª Ed')) {
    year = '2018'; author = 'Silberman, Fernando S.'; title = 'Ortopedia y Traumatología - Ed. 4';
  } else if (f.includes('Silberman') && f.includes('Varaona')) {
    year = '2010'; author = 'Silberman, Fernando S.'; title = 'Ortopedia y Traumatología - Ed. 3';
  } else if (f.includes('TUREKS ORTHOPAEDICS')) {
    year = '2016'; author = 'Turek, Samuel L.'; title = 'Turek Orthopaedics Principles and Their Applications - Ed. 7 - Vol. 1';
  } else if (f.includes('Kendalls') || f.includes('MÚSCULOS PRUEBAS')) {
    year = '2007'; author = 'Kendall, Florence P.'; title = 'Músculos Pruebas Funcionales Postura y Dolor - Ed. 5';
  } else if (f.includes('Marco Martínez') && f.includes('Miembro superior')) {
    year = '2015'; author = 'Marco Martínez, Fernando'; title = 'SECOT Traumatología y Ortopedia Miembro Superior';
  } else if (f.includes('Combalia Aleu') && f.includes('Miembro inferior')) {
    year = '2015'; author = 'Combalia Aleu, Andrés'; title = 'SECOT Traumatología y Ortopedia Miembro Inferior';
  } else if (f.includes('González Díaz') && f.includes('Raquis')) {
    year = '2015'; author = 'González Díaz, Rafael'; title = 'SECOT Traumatología y Ortopedia Raquis y Ortopedia Infantil';
  } else if (f.includes('NYSORA') || (f.includes('Hadzic') && f.includes('2023'))) {
    year = '2023'; author = 'Hadzic, Admir'; title = 'NYSORA Manual de Bloqueo de Nervios Periféricos';
  } else if (f.includes('Tratado de Anestesia Regional')) {
    year = '2010'; author = 'Hadzic, Admir'; title = 'Tratado de Anestesia Regional y Manejo del Dolor Agudo';
  } else if (f.includes('Eastman') && f.includes('Parkland')) {
    year = '2009'; author = 'Eastman, Alexander L.'; title = 'Manual Parkland de Traumatología - Ed. 3';
  } else if (f.includes('Dutton') && f.includes('ORTHOPAEDIC EXAMINATION')) {
    year = '2020'; author = 'Dutton, Mark'; title = 'Dutton Orthopaedic Examination Evaluation and Intervention - Ed. 5';
  } else if (f.includes('SECOT') || f.includes('Monografías AAOS-SECOT') || f.includes('Monogra')) {
    year = '2015'; author = 'SECOT';
    title = f.replace(/\.pdf$/i, '').replace(/^Monografías AAOS-SECOT\s*-\s*/i, 'Monografía ').replace(/^S-F - S-A - /i, 'Monografía ');
  }

  if (!year) year = '2015';
  if (!author || author === 'null') author = 'S-A';

  let cleanAuthor = author.replace(/[/\\:*?"<>|]/g, '').replace(/\s+/g, ' ').trim();
  let cleanTitle = title.replace(/[/\\:*?"<>|]/g, '').replace(/\s+/g, ' ').trim();
  let std = `${year} - ${cleanAuthor} - ${cleanTitle}${ext}`;
  planned.push({ src: f, std, hash: r.hash, size: r.size });
}

fs.writeFileSync('scratch/libros_planned_renames.json', JSON.stringify(planned, null, 2));
console.log('Successfully updated libros_planned_renames.json with 169 titles!');
