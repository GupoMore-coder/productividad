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
    ('AO Foundation', 'AO Trauma'),
    ('AOSpine', 'AO Spine'),
    ('SCCOT', 'SCCOT'),
    ('Sociedad Colombiana', 'SCCOT')
]

RESIDENT_PII_PATTERNS = [
    r'[-_]\s*david\s+mu[ñn]oz.*',
    r'[-_]\s*jenny\s+murillo.*',
    r'[-_]\s*julian\s+rincon.*',
    r'[-_]\s*ruben.*',
    r'[-_]\s*fernando.*',
    r'[-_]\s*marulanda.*',
    r'[-_]\s*lubo.*',
    r'[-_]\s*reyes\s+altamar.*',
    r'\[.*?\]',
    r'\(.*?\)',
    r'\br[1-4]\b',
    r'\br1\b|\br2\b|\br3\b|\br4\b',
    r'\bresidente\b.*',
    r'\bwebinar\b',
    r'[-_]\s*final\b.*',
    r'\bbooksmedicos\.org\b',
    r'\bpresentaci[oó]n\s+de\s+powerpoint\b',
    r'\buntitled\s+presentation\b'
]

ORTHO_EXPANSIONS = {
    r'\batb\b': 'Antibióticos',
    r'\bfx\b': 'Fracturas',
    r'\bqx\b': 'Quirúrgicos',
    r'\bcx\b': 'Cirugía',
    r'\bpop\b': 'Postoperatorio',
    r'\bcdn\b': 'CdN',
    r'\bomat\b': 'Osteomielitis',
    r'\bom\b': 'Osteomielitis',
    r'\btad\b': 'Tip-Apex Distance',
    r'\bdhs\b': 'DHS',
    r'\blcp\b': 'LCP',
    r'\bphilos\b': 'PHILOS'
}

def clean_str(t):
    t = re.sub(r'<[^>]*>', '', t)
    t = re.sub(r'[:*?"<>|\\/]', ' - ', t)
    t = re.sub(r'\s+', ' ', t)
    t = re.sub(r'\s+-\s+-+', ' - ', t)
    return t.strip(' .-_')

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

def derive_clean_title(filename, texts, core_title, folder):
    base = os.path.splitext(filename)[0]
    # Limpiar prefijos de sistema
    base = re.sub(r'^(19|20)\d{2}\s*-\s*', '', base)
    base = re.sub(r'^(S-A|S-F|Usuario|Unknown Creator|Polaris Office|Tecnica Quirurgica|m aa)\s*-\s*', '', base, flags=re.IGNORECASE)
    base = re.sub(r'^Roosevelt\s*-\s*', '', base, flags=re.IGNORECASE)

    # Remover patrones PII y nombres de residentes
    for pat in RESIDENT_PII_PATTERNS:
        base = re.sub(pat, '', base, flags=re.IGNORECASE)
    base = clean_str(base)

    # Si el nombre de archivo es genérico (ej. "Presentación 3", "Diapos", "Untitled", "final", o muy corto)
    is_generic = len(base) < 4 or any(k in base.lower() for k in ['presentacion', 'diapos', 'untitled', 'powerpoint', 'modulo', 'clase'])

    title = None
    if not is_generic:
        title = base
    else:
        # Intentar extraer de slide 1
        valid_slide_titles = []
        for t in texts:
            ct = clean_str(t)
            low = ct.lower()
            if len(ct) < 4 or len(ct) > 75:
                continue
            if any(k in low for k in ['estudiante', 'residente', 'universidad', 'hospital', 'facultad', 'presentado', 'docente', 'tutor', 'diapositiva']):
                continue
            if any(k in low for k in ['caso clinico', 'masculino', 'femenino', 'anos', 'años', 'push pull']):
                continue
            valid_slide_titles.append(ct)
        
        if valid_slide_titles:
            title = valid_slide_titles[0]
        elif core_title and len(core_title) > 4:
            title = core_title
        elif len(base) >= 3:
            title = base
        else:
            sub = folder.split(os.sep)[-1].replace('zPresentaciones', 'Temas Generales')
            title = sub

    # Aplicar expansiones médicas útiles
    for pat, rep in ORTHO_EXPANSIONS.items():
        title = re.sub(pat, rep, title, flags=re.IGNORECASE)

    title = clean_str(title)
    if title.isupper() and len(title) > 6:
        title = title.title()
    if len(title) > 75:
        title = title[:75].strip(' .-_')

    return title

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
    elif 'ao 2018' in folder.lower() or 'ao curso' in folder.lower():
        institution = 'AO Trauma'
    else:
        full_text = ' '.join(texts)
        for inst_raw, inst_norm in KNOWN_INSTITUTIONS:
            if inst_raw.lower() in full_text.lower() or inst_raw.lower() in folder.lower():
                institution = inst_norm
                break

    # 3. Determinar Título Limpio y Anonimizado
    title = derive_clean_title(filename, texts, core_title, folder)

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

output_json = os.path.join(os.path.dirname(__file__), 'presentations_model3_master_plan.json')
with open(output_json, 'w', encoding='utf-8') as f:
    json.dump(plan, f, indent=2, ensure_ascii=False)

print(f"Plan maestro v5 guardado en: {output_json}")

