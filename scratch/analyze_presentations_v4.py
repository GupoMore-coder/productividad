import os, zipfile, re
import xml.etree.ElementTree as ET
import json

root_dir = r'H:\Mi unidad\Información Ortopedia'

KNOWN_INSTITUTIONS = [
    ('Universidad de Cartagena', 'Univ. de Cartagena'),
    ('Universidad Nacional', 'Univ. Nacional'),
    ('Universidad de Antioquia', 'Univ. de Antioquia'),
    ('Universidad del Valle', 'Univ. del Valle'),
    ('Universidad Javeriana', 'Univ. Javeriana'),
    ('Universidad del Rosario', 'Univ. del Rosario'),
    ('Universidad Militar', 'Univ. Militar'),
    ('Universidad El Bosque', 'Univ. El Bosque'),
    ('Universidad Libre', 'Univ. Libre'),
    ('Universidad del Sinú', 'Univ. del Sinú'),
    ('Instituto Roosevelt', 'Inst. Roosevelt'),
    ('Roosevelt', 'Inst. Roosevelt'),
    ('Roosvelt', 'Inst. Roosevelt'),
    ('Hospital Universitario', 'Hospital Universitario'),
    ('Hospital San José', 'Hospital San José'),
    ('Hospital de la Misericordia', 'HOMI'),
    ('Fundación Santa Fe', 'Fundación Santa Fe'),
    ('AO Trauma', 'AO Trauma'),
    ('AO Foundation', 'AO Foundation'),
    ('AOSpine', 'AO Spine'),
    ('SCCOT', 'SCCOT'),
    ('Sociedad Colombiana', 'SCCOT')
]

ORTHO_TERMS = {
    'fractura', 'fracturas', 'fx', 'luxacion', 'luxaciones', 'cadera', 'pelvis', 'acetabulo',
    'femur', 'tibia', 'perone', 'humero', 'radio', 'cubito', 'escapula', 'clavicula', 'columna',
    'cervical', 'toracica', 'lumbar', 'sacro', 'mano', 'pie', 'tobillo', 'rodilla', 'hombro',
    'codo', 'artroplastia', 'protesis', 'osteosintesis', 'clavo', 'placa', 'tornillo', 'fijador',
    'infeccion', 'infecciones', 'osteomielitis', 'artritis', 'tumor', 'tumores', 'sarcoma',
    'abordaje', 'abordajes', 'anatomia', 'quirurgico', 'quirurgica', 'osteotomia', 'pediatrica',
    'pediatrico', 'epifisiolisis', 'supracondilea', 'diafisis', 'condilo', 'cupula', 'monteggia',
    'galeazzi', 'espondilodiscitis', 'hemofilia', 'artropatia', 'marcha', 'amputacion', 'dismetria',
    'perfil', 'torsional', 'alineamiento', 'deformidad', 'reduccion', 'enclavijado', 'taller', 'caso',
    'generalidades', 'clasificacion', 'diagnostico', 'tratamiento', 'revision', 'principios',
    'artrogriposis', 'hallux', 'perthes', 'talo', 'maltrato', 'valgo', 'varo', 'inmovilizacion'
}

DISCARD_TITLE_KEYWORDS = [
    'caso clinico', 'masculino', 'femenino', 'anos', 'años', 'paciente',
    'residente', 'nivel', 'presentado', 'expositor', 'ponente', 'tutor', 'docente',
    'powerpoint', 'untitled', 'diapositiva', 'presentacion', 'sesion', 'junta', 'reunion',
    'polaris office', 'unknown creator', 'm aa', 's-a', 's-f', 'push pull method',
    'es un ', 'es una ', 'se define', 'caracterizado', 'rocker', 'junio 20', 'enero 20', 'julio 20'
]

MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

def clean_str(t):
    t = re.sub(r'<[^>]*>', '', t)
    t = re.sub(r'[:*?"<>|\\/]', ' - ', t)
    t = re.sub(r'\s+', ' ', t)
    t = re.sub(r'\s+-\s+-+', ' - ', t)
    return t.strip(' .-_')

def is_personal_name(text):
    words = text.strip().split()
    if 2 <= len(words) <= 4:
        low_words = [w.lower() for w in words]
        if not any(w in ORTHO_TERMS for w in low_words):
            if all(w[0].isupper() for w in words if len(w) > 1):
                return True
    return False

def extract_pptx_data(filepath):
    texts = []
    created_year = None
    core_title = None

    try:
        with zipfile.ZipFile(filepath, 'r') as z:
            if 'docProps/core.xml' in z.namelist():
                tree = ET.fromstring(z.read('docProps/core.xml'))
                for child in tree:
                    tag = child.tag.split('}')[-1]
                    if tag == 'created' and child.text:
                        m = re.search(r'\b(20\d{2}|19\d{2})\b', child.text)
                        if m:
                            created_year = m.group(1)
                    elif tag == 'title' and child.text:
                        ct = child.text.strip()
                        if not any(k in ct.lower() for k in ['powerpoint', 'untitled', 'diapositiva']):
                            core_title = ct

            if 'ppt/slides/slide1.xml' in z.namelist():
                stree = ET.fromstring(z.read('ppt/slides/slide1.xml'))
                for elem in stree.iter():
                    if elem.tag.endswith('}t') and elem.text:
                        txt = elem.text.strip()
                        if txt and len(txt) > 1:
                            texts.append(txt)
    except Exception as e:
        pass

    return texts, created_year, core_title

def clean_filename_title(fn):
    base = os.path.splitext(fn)[0]
    base = re.sub(r'^(19|20)\d{2}\s*-\s*', '', base)
    base = re.sub(r'^(S-A|S-F|Usuario|Unknown Creator|Polaris Office|Tecnica Quirurgica|m aa)\s*-\s*', '', base, flags=re.IGNORECASE)
    base = re.sub(r'^Roosevelt\s*-\s*', '', base, flags=re.IGNORECASE)
    base = re.sub(r'\[.*?\]', '', base)
    base = re.sub(r'\(.*?\)', '', base)
    base = re.sub(r'\b\d{2}\.\d{2}\.\d{4}\b', '', base)
    base = clean_str(base)
    return base

def parse_presentation(filepath):
    rel_path = os.path.relpath(filepath, root_dir)
    folder = os.path.dirname(rel_path)
    filename = os.path.basename(filepath)
    ext = os.path.splitext(filename)[1].lower()

    texts, created_year, core_title = ([], None, None)
    if ext in ['.pptx', '.pptm']:
        texts, created_year, core_title = extract_pptx_data(filepath)

    # 1. Determinar Año
    year = None
    for t in texts:
        m = re.search(r'\b(20\d{2}|19\d{2})\b', t)
        if m:
            yr = int(m.group(1))
            if 1990 <= yr <= 2026:
                year = str(yr)
                break
    if not year:
        m = re.search(r'\b(20\d{2}|19\d{2})\b', filename)
        if m:
            year = m.group(1)
    if not year and created_year:
        year = created_year
    if not year:
        year = '2022'

    # 2. Determinar Institución
    institution = None
    if 'roosevelt' in filename.lower() or 'roosvelt' in folder.lower() or 'roosevelt' in folder.lower():
        institution = 'Inst. Roosevelt'
    else:
        full_text = ' '.join(texts)
        for inst_raw, inst_norm in KNOWN_INSTITUTIONS:
            if inst_raw.lower() in full_text.lower() or inst_raw.lower() in folder.lower():
                institution = inst_norm
                break

    # 3. Determinar Título Clínico
    fn_title = clean_filename_title(filename)

    # Especial caso Roosevelt: el nombre de archivo ya es el título clínico curado
    if filename.lower().startswith('roosevelt'):
        title = fn_title
    else:
        # Evaluar textos de slide 1
        valid_slide_titles = []
        for t in texts:
            ct = clean_str(t)
            low = ct.lower()
            if len(ct) < 4:
                continue
            if any(dk in low for dk in DISCARD_TITLE_KEYWORDS):
                continue
            if any(inst_raw.lower() in low for inst_raw, _ in KNOWN_INSTITUTIONS):
                continue
            if is_personal_name(ct):
                continue
            if len(ct.split()) == 2 and any(m in low for m in MONTHS):
                continue
            valid_slide_titles.append(ct)

        title = None
        # Prioridad a título en slide 1 si tiene término ortopédico
        for st in valid_slide_titles:
            if any(term in st.lower() for term in ORTHO_TERMS):
                title = st
                break

        # Si el nombre de archivo tenía término ortopédico bueno
        if not title and fn_title and any(term in fn_title.lower() for term in ORTHO_TERMS):
            title = fn_title

        if not title and valid_slide_titles:
            title = valid_slide_titles[0]

        if not title and fn_title and len(fn_title) > 3 and not any(k in fn_title.lower() for k in ['presentacion', 'untitled', 'diapos']):
            title = fn_title

        if not title or len(title) < 3:
            sub = folder.split(os.sep)[-1].replace('Fx ', 'Fracturas de ').replace('zPresentaciones', 'Temas Generales')
            title = sub

    # Formateo y limpieza final
    title = clean_str(title)
    if title.isupper() and len(title) > 6:
        title = title.title()
    title = re.sub(r'\bFx\b', 'Fracturas de', title)
    title = re.sub(r'\bfx\b', 'Fracturas de', title)
    title = clean_str(title)
    if len(title) > 75:
        title = title[:75].strip(' .-_')

    # 4. Formatear MODELO 3: Ateneo - YYYY - [Título] - [Institución].ext
    if institution:
        new_filename = f"Ateneo - {year} - {title} - {institution}{ext}"
    else:
        new_filename = f"Ateneo - {year} - {title}{ext}"

    new_filename = clean_str(new_filename)
    if not new_filename.lower().endswith(ext):
        new_filename += ext

    return {
        'folder': folder,
        'oldFilename': filename,
        'newFilename': new_filename,
        'oldPath': filepath,
        'newPath': os.path.join(os.path.dirname(filepath), new_filename),
        'year': year,
        'institution': institution,
        'title': title
    }

presentations = []
for root, dirs, files in os.walk(root_dir):
    for f in files:
        ext = os.path.splitext(f)[1].lower()
        if ext in ['.pptx', '.ppt', '.pptm']:
            presentations.append(os.path.join(root, f))

print(f"Total presentaciones analizadas: {len(presentations)}")
plan = []
for p in presentations:
    item = parse_presentation(p)
    plan.append(item)

output_json = os.path.join(os.path.dirname(__file__), 'presentations_model3_final_plan.json')
with open(output_json, 'w', encoding='utf-8') as f:
    json.dump(plan, f, indent=2, ensure_ascii=False)

print(f"Plan final guardado en: {output_json}")

