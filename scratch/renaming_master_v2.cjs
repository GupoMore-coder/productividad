/**
 * ============================================================================
 * 📚 RENAMING MASTER ENGINE V2 - BIBLIOTECA MÉDICA DE CIRUGÍA ORTOPÉDICA
 * Estandarización Inteligente, Desacople de Dominios y Resolución Heurística
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const { PDFParse } = require('C:/Users/ferna/Documents/Biblioteca Premium/node_modules/pdf-parse');

const ROOT_DIR = 'H:\\Mi unidad\\Información Ortopedia';

// Diccionario Canónico de Tratados y Autores de Ortopedia
const CANONICAL_BOOKS = [
  {
    regex: /surgical exposures in orthopaedics|v[ií]as de abordaje en cirug[ií]a ortop[eé]dica|abordajes en cirugia ortopedica/i,
    author: 'Hoppenfeld, Stanley',
    title: 'Vías de Abordaje en Cirugía Ortopédica - Enfoque Anatómico',
    defaultYear: 2016
  },
  {
    regex: /physical examination of the spine and extremities|exploraci[oó]n f[ií]sica de la columna vertebral y las extremidades/i,
    author: 'Hoppenfeld, Stanley',
    title: 'Exploración Física de la Columna Vertebral y las Extremidades',
    defaultYear: 2011
  },
  {
    regex: /skeletal trauma|trauma del esqueleto/i,
    author: 'Browner, Bruce D.',
    title: 'Skeletal Trauma: Basic Science, Management, and Reconstruction',
    defaultYear: 2020
  },
  {
    regex: /campbell'?s operative orthopaedics|cirug[ií]a ortop[eé]dica de campbell/i,
    author: 'Canale, S. Terry',
    title: "Campbell's Operative Orthopaedics",
    defaultYear: 2021
  },
  {
    regex: /rockwood and green'?s fractures in adults|fracturas en el adulto/i,
    author: 'Bucholz, Robert W.',
    title: "Rockwood and Green's Fractures in Adults",
    defaultYear: 2019
  },
  {
    regex: /rockwood and wilkins'? fractures in children|fracturas en el ni[ñn]o/i,
    author: 'Waters, Peter M.',
    title: "Rockwood and Wilkins' Fractures in Children",
    defaultYear: 2020
  },
  {
    regex: /fractures of the pelvis and acetabulum/i,
    author: 'Tile, Marvin & Helfet, David L.',
    title: 'Fractures of the Pelvis and Acetabulum',
    defaultYear: 2015
  },
  {
    regex: /surgery of the hip/i,
    author: 'Berry, Daniel J. & Lieberman, Jay R.',
    title: 'Surgery of the Hip',
    defaultYear: 2020
  },
  {
    regex: /insall & scott surgery of the knee|surgery of the knee/i,
    author: 'Scott, W. Norman',
    title: 'Insall & Scott Surgery of the Knee',
    defaultYear: 2018
  },
  {
    regex: /the elbow and its disorders/i,
    author: 'Morrey, Bernard F.',
    title: 'The Elbow and Its Disorders',
    defaultYear: 2017
  },
  {
    regex: /master techniques in orthopaedic surgery.*exposures/i,
    author: 'Morrey, Bernard F.',
    title: 'Master Techniques in Orthopaedic Surgery: Relevant Surgical Exposures',
    defaultYear: 2018
  },
  {
    regex: /who'?s who in orthopedics/i,
    author: 'Mostofi, Seyed Behrooz',
    title: "Who's Who in Orthopedics",
    defaultYear: 2005
  },
  {
    regex: /atlas of human anatomy|atlas de anatom[ií]a humana/i,
    author: 'Netter, Frank H.',
    title: 'Atlas de Anatomía Humana',
    defaultYear: 2019
  },
  {
    regex: /review of orthopaedics/i,
    author: 'Miller, Mark D.',
    title: 'Review of Orthopaedics',
    defaultYear: 2020
  },
  {
    regex: /orthopaedic surgical approaches/i,
    author: 'Miller, Mark D.',
    title: 'Orthopaedic Surgical Approaches',
    defaultYear: 2015
  },
  {
    regex: /operative techniques in orthopaedic surgery/i,
    author: 'Wiesel, Sam W.',
    title: 'Operative Techniques in Orthopaedic Surgery',
    defaultYear: 2016
  },
  {
    regex: /ao principles of fracture management/i,
    author: 'AO Foundation',
    title: 'AO Principles of Fracture Management',
    defaultYear: 2018
  },
  {
    regex: /handbook orthopaedic trauma care/i,
    author: 'AO Foundation',
    title: 'AO Handbook of Orthopaedic Trauma Care',
    defaultYear: 2014
  },
  {
    regex: /manual of fracture management.*elbow/i,
    author: 'AO Foundation',
    title: 'AO Manual of Fracture Management: Elbow & Forearm',
    defaultYear: 2009
  },
  {
    regex: /manual of fracture management.*hand/i,
    author: 'AO Foundation',
    title: 'AO Manual of Fracture Management: Hand and Wrist',
    defaultYear: 2018
  },
  {
    regex: /manual of internal fixation/i,
    author: 'Müller, Maurice E. & Allgöwer, Martin',
    title: 'Manual of Internal Fixation: Techniques Recommended by the AO-ASIF Group',
    defaultYear: 1991
  },
  {
    regex: /pocket atlas of spine surgery/i,
    author: 'Singh, Kern & Vaccaro, Alexander R.',
    title: 'Pocket Atlas of Spine Surgery',
    defaultYear: 2012
  },
  {
    regex: /textbook of the cervical spine/i,
    author: 'Shen, Francis H.',
    title: 'Textbook of the Cervical Spine',
    defaultYear: 2015
  },
  {
    regex: /fundamentos de biomec[aá]nica/i,
    author: 'Nordin, Margareta & Frankel, Victor H.',
    title: 'Bases Biomecánicas del Sistema Musculoesquelético',
    defaultYear: 2013
  },
  {
    regex: /fisiolog[ií]a humana/i,
    author: 'Guyton, Arthur C. & Hall, John E.',
    title: 'Tratado de Fisiología Médica',
    defaultYear: 2016
  }
];

function sanitizeFileName(str) {
  if (!str) return '';
  return str.replace(/[<>:"/\\|?*]/g, '')
            .replace(/[\r\n\t]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/\.+$/, '');
}

async function extractPdfMetadata(filePath) {
  let text = '';
  try {
    const buf = fs.readFileSync(filePath);
    const parser = new PDFParse({ data: buf });
    const res = await parser.getText({ first: 4 });
    text = (res.text || '').replace(/\s+/g, ' ');
    await parser.destroy();
  } catch (err) {
    return { text: '', error: err.message };
  }
  return { text };
}

module.exports = {
  ROOT_DIR,
  CANONICAL_BOOKS,
  sanitizeFileName,
  extractPdfMetadata
};

