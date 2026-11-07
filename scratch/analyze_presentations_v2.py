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
    ('Roosvelt', 'Inst. Roosevelt'),
    ('Hospital Universitario', 'Hospital Universitario'),
    ('Hospital San José', 'Hospital San José'),
    ('Hospital de la Misericordia', 'HOMI'),
    ('Fundación Santa Fe', 'Fundación Santa Fe'),
    ('AO Trauma', 'AO Trauma'),
    ('AO Foundation', 'AO Foundation'),
    ('AOSpine', 'AO Spine'),
    ('SCCOT', 'SCCOT'),
    ('Sociedad Colombiana de Cirugía Ortopédica', 'SCCOT')
]

# Palabras prohibidas / PII / Ruido a remover completamente
PII_AND_NOISE_PATTERNS = [
    r'\bfernando\b[^\n,]*',
    r'\bmarulanda\b[^\n,]*',
    r'\blubo\b[^\n,]*',
    r'\bdr\.?\s+[A-Za-zÁÉÍÓÚáéíóúñÑ]+(\s+[A-Za-zÁÉÍÓÚáéíóúñÑ]+)*',
    r'\bdra\.?\s+[A-Za-zÁÉÍÓÚáéíóúñÑ]+(\s+[A-Za-zÁÉÍÓÚáéíóúñÑ]+)*',
    r'\bpresenta(do)?\s+por:?[^\n,]*',
    r'\bexpositor:?[^\n,]*',
    r'\bponente:?[^\n,]*',
    r'\bresidente\s+(nivel\s+[I|V|X]+|r[1-4]|de\s+ortopedia)[^\n,]*',
    r'\bcoordinador:?[^\n,]*',
    r'\btutor:?[^\n,]*',
    r'\bdocente:?[^\n,]*',
    r'\bautor:?[^\n,]*',
    r'\bm\s+aa\b',
    r'\bpolaris\s+office\b',
    r'\bunknown\s+creator\b',
    r'\bpresentaci[oó]n\s+de\s+powerpoint\b',
    r'\buntitled\s+presentation\b',
    r'\bs-a\b',
    r'\bs-f\b',
    r'\bbooksmedicos\.org\b'
]

def clean_str(t):
    t = re.sub(r'<[^>]*>', '', t)
    t = re.sub(r'[:*?"<>|\\/]', ' - ', t)
    t = re.sub(r'\s+', ' ', t)
    t = re.sub(r'\s+-\s+-+', ' - ', t)
    return t.strip(' .-_')

def sanitize_title(raw_title):
    t = raw_title
    for pat in PII_AND_NOISE_PATTERNS:
        t = re.sub(pat, '', t, flags=re.IGNORECASE)
    t = clean_str(t)
    # Quitar años del inicio o final
    t = re.sub(r'^(19|20)\d{2}\s*-\s*', '', t)
    t = re.sub(r'\s*-\s*(19|20)\d{2}$', '', t)
    t = clean_str(t)
    return t

def extract_pptx_data(filepath):
    texts = []
    created_year = None
    core_title = None

    try:
        with zipfile.ZipFile(filepath, 'r') as z:
            # 1. docProps/core.xml
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

            # 2. ppt/slides/slide1.xml
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

def parse_presentation(filepath):
    rel_path = os.path.relpath(filepath, root_dir)
    folder = os.path.dirname(rel_path)
    filename = os.path.basename(filepath)
    ext = os.path.splitext(filename)[1].lower()

    texts, created_year, core_title = ([], None, None)
    if ext in ['.pptx', '.pptm']:
        texts, created_year, core_title = extract_pptx_data(filepath)

    # 1. Extraer Año
    year = None
    # De los textos de portada
    for t in texts:
        m = re.search(r'\b(20\d{2}|19\d{2})\b', t)
        if m:
            yr = int(m.group(1))
            if 1990 <= yr <= 2026:
                year = str(yr)
                break
    # Del nombre de archivo original
    if not year:
        m = re.search(r'\b(20\d{2}|19\d{2})\b', filename)
        if m:
            year = m.group(1)
    # De core.xml
    if not year and created_year:
        year = created_year
    # Fallback
    if not year:
        year = '2022'

    # 2. Extraer Institución
    institution = None
    full_text = ' '.join(texts)
    for inst_raw, inst_norm in KNOWN_INSTITUTIONS:
        if inst_raw.lower() in full_text.lower() or inst_raw.lower() in folder.lower():
            institution = inst_norm
            break

    # 3. Extraer y Sanitizar Título
    # Identificar título del contenido
    candidate_titles = []
    for t in texts:
        s_title = sanitize_title(t)
        # Descartar si es demasiado corto o solo números o fechas
        if len(s_title) < 4 or re.match(r'^\d+$', s_title):
            continue
        # Descartar si es solo una institución
        if any(inst_norm.lower() in s_title.lower() for _, inst_norm in KNOWN_INSTITUTIONS):
            continue
        candidate_titles.append(s_title)

    title = None
    if candidate_titles:
        title = candidate_titles[0]
        # Si el primer título es muy breve (ej: "ABORDAJES") y el segundo añade sustancia
        if len(title.split()) <= 2 and len(candidate_titles) > 1:
            second = candidate_titles[1]
            if len(second.split()) <= 5 and not any(k in second.lower() for k in ['caso', 'clinico', 'masculino', 'femenino']):
                title = f"{title} - {second}"
    elif core_title:
        title = sanitize_title(core_title)
    
    # Si después de limpiar el título quedó vacío o genérico, derivar del nombre del archivo o carpeta
    if not title or len(title) < 4 or any(k in title.lower() for k in ['untitled', 'powerpoint', 'diapositiva']):
        base_name = os.path.splitext(filename)[0]
        title = sanitize_title(base_name)
    
    # Si sigue vacío, usar la subcarpeta
    if not title or len(title) < 4:
        subfolder = folder.split(os.sep)[-1]
        title = sanitize_title(subfolder)

    # Limpieza final del título
    title = clean_str(title)
    # Normalizar mayúsculas/minúsculas excesivas
    if title.isupper() and len(title) > 6:
        # Convertir a Title Case si todo está en mayúsculas
        title = title.title()
    
    # Truncar título a 75 caracteres si es muy extenso
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

print(f"Total presentaciones a procesar: {len(presentations)}")
plan = []
for p in presentations:
    item = parse_presentation(p)
    plan.append(item)

output_json = os.path.join(os.path.dirname(__file__), 'presentations_model3_sanitized_plan.json')
with open(output_json, 'w', encoding='utf-8') as f:
    json.dump(plan, f, indent=2, ensure_ascii=False)

print(f"Plan sanitizado guardado en: {output_json}")

