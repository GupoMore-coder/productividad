const fs = require('fs');
const path = require('path');
const { ROOT_DIR } = require('./renaming_master_v2.cjs');

console.log('=== ETAPA 2: CURACIÓN DE S-A EN EMC ORTOPEDIA ===');

const emcDir = path.join(ROOT_DIR, 'EMC Ortopedia');

const renames = [
  {
    old: '2021 - S - A - Estudio de rodilla.pdf',
    new: '2021 - Funck-Brentano, T. - Complicaciones osteoarticulares de los trasplantes de órganos sólidos.pdf'
  },
  {
    old: '2021 - S - A - Patologia periarticular de la cadera.pdf',
    new: '2021 - Bard, H. - Patología periarticular de la cadera.pdf'
  },
  {
    old: '2022 - S - A - Síndrome de compresión nerviosa y de los estrechos.pdf',
    new: '2022 - Roulot, E. - Síndromes de compresión nerviosa y de los estrechos.pdf'
  },
  {
    old: '2015 - S - A - Malformaciones de la pared toráctica.pdf',
    new: '2015 - Wurtz, A. - Malformaciones de la pared torácica.pdf'
  },
  {
    old: '2016 - S - A - Fracturas extracotiloideas del anillo pélvico en adultos.pdf',
    new: '2016 - Bernard de Dompsure, R. - Fracturas extracotiloideas del anillo pélvico en adultos.pdf'
  },
  {
    old: '2004 - S-A - Fracturas del anillo pélvico.pdf',
    new: '2004 - Muñoz Vives, J.M. - Fracturas del anillo pélvico.pdf'
  },
  {
    old: '2020 - S - A - Hipermovilidad articular.pdf',
    new: '2020 - Ottaviani, S. - Síndromes de hipermovilidad articular.pdf'
  },
  {
    old: '2020 - S - A - Estudio de treponematosis.pdf',
    new: '2020 - Bialé, L. - Afectaciones osteoarticulares de las treponematosis.pdf'
  },
  {
    old: '2010 - S - A - Cirugía de la gonartrosis.pdf',
    new: '2010 - Bellier, G. - Cirugía de la gonartrosis.pdf'
  },
  {
    old: '2023 - S-A - Dermatosis neutrofílicas.pdf',
    new: '2023 - Descamps, V. - Dermatosis neutrofílicas.pdf'
  },
  {
    old: '2006 - S - A - Enfermedad de Crohn; Rectocolitis hemorrágica.pdf',
    new: '2006 - Puéchal, X. - Manifestaciones articulares de las enfermedades intestinales.pdf'
  },
  {
    old: '2023 - S-A - Biopsia vertebral, cementoplastia, vertebroplastia.pdf',
    new: '2023 - Roul, A. - Biopsia vertebral, cementoplastia, vertebroplastia.pdf'
  },
  {
    old: '2011 - S - A - Tratamiento quirùrgico de las lesiones del ligamento cruzado anterior.pdf',
    new: '2011 - Hulet, C. - Tratamiento quirúrgico de las lesiones del ligamento cruzado anterior.pdf'
  },
  {
    old: '2021 - S - A - Estudio de seudoartrosis.pdf',
    new: '2021 - Bastard, C. - Tratamiento quirúrgico de la seudoartrosis diafisaria aséptica.pdf'
  }
];

let renamedCount = 0;
renames.forEach(r => {
  const oldPath = path.join(emcDir, r.old);
  const newPath = path.join(emcDir, r.new);
  if (fs.existsSync(oldPath)) {
    if (!fs.existsSync(newPath) || oldPath === newPath) {
      fs.renameSync(oldPath, newPath);
      console.log(`✅ Renombrado: "${r.old}" -> "${r.new}"`);
      renamedCount++;
    } else {
      console.log(`⚠️ Ya existe destino: "${r.new}"`);
    }
  } else {
    console.log(`ℹ️ Archivo no encontrado (quizá ya renombrado): "${r.old}"`);
  }
});

console.log(`Etapa 2 completada exitosamente. Total curados en EMC: ${renamedCount}/14`);

