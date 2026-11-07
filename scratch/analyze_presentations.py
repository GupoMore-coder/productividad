import os, zipfile, re
import xml.etree.ElementTree as ET
import json

root_dir = r'H:\Mi unidad\Información Ortopedia'

KNOWN_INSTITUTIONS = [
    'Universidad de Cartagena',
    'Universidad Nacional de Colombia',
    'Universidad Nacional',
    'Universidad de Antioquia',
    'Universidad del Valle',
    'Universidad Javeriana',
    'Universidad del Rosario',
    'Universidad Militar Nueva Granada',
    'Universidad Militar',
    'Universidad El Bosque',
    'Universidad Libre',
    'Universidad del Sinú',
    'Instituto Roosevelt',
    'Hospital Universitario del Caribe',
    'Hospital Universitario',
    'Hospital San José',
    'Hospital de San José',
    'Hospital de la Samaritana',
    'Hospital de la Misericordia',
    'HOMI',
    'Fundación Santa Fe de Bogotá',
    'Fundación Santa Fe',
    'Fundación Cardioinfantil',
    'AO Trauma',
    'AO Foundation',
    'AOSpine',
    'SCCOT',
    'Sociedad Colombiana de Cirugía Ortopédica',
    'Clínica de Fracturas'
]

def clean_title(t):
    t = re.sub(r'<[^>]*>', '', t)
    t = re.sub(r'[:*?"<>|\\/]', ' - ', t)
    t = re.sub(r'\s+', ' ', t)
    t = re.sub(r'\s+-\s+-+', ' - ', t)
    t = t.strip(' .-_')
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
                        core_title = child.text.strip()

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

    # 1. Determinar Año
    year = None
    # Del texto de slide 1
    for t in texts:
        m = re.search(r'\b(20\d{2}|19\d{2})\b', t)
        if m:
            yr = int(m.group(1))
            if 1990 <= yr <= 2026:
                year = str(yr)
                break
    # Del nombre de archivo
    if not year:
        m = re.search(r'\b(20\d{2}|19\d{2})\b', filename)
        if m:
            year = m.group(1)
    # De core.xml
    if not year and created_year:
        year = created_year
    # Fallback razonable si no hay año
    if not year:
        year = '2022'

    # 2. Determinar Institución
    institution = None
    full_text = ' '.join(texts)
    for inst in KNOWN_INSTITUTIONS:
        if inst.lower() in full_text.lower():
            # Mapeo normalizado
            if 'cartagena' in inst.lower():
                institution = 'Univ. de Cartagena'
            elif 'roosevelt' in inst.lower():
                institution = 'Inst. Roosevelt'
            elif 'nacional' in inst.lower():
                institution = 'Univ. Nacional'
            elif 'antioquia' in inst.lower():
                institution = 'Univ. de Antioquia'
            elif 'javeriana' in inst.lower():
                institution = 'Univ. Javeriana'
            elif 'valle' in inst.lower():
                institution = 'Univ. del Valle'
            elif 'santa fe' in inst.lower():
                institution = 'Fundación Santa Fe'
            elif 'ao' in inst.lower():
                institution = 'AO Trauma'
            elif 'sccot' in inst.lower():
                institution = 'SCCOT'
            else:
                institution = inst
            break

    # Si no hay universidad en texto, ver si está en la carpeta o nombre de archivo
    if not institution:
        if 'roosvelt' in folder.lower() or 'roosevelt' in folder.lower():
            institution = 'Inst. Roosevelt'
        elif 'ao' in folder.lower():
            institution = 'AO Trauma'

    # 3. Determinar Título
    title = None
    # Descartar frases de saludo, nombres comunes, encabezados típicos
    noise_patterns = [
        r'universidad', r'hospital', r'instituto', r'facultad', r'departamento',
        r'residente', r'ortopedia', r'traumatolog[ií]a', r'postgrado',
        r'doctor', r'dr\.', r'dra\.', r'presenta', r'expositor', r'ponente',
        r'noviembre', r'octubre', r'diciembre', r'septiembre', r'agosto',
        r'julio', r'junio', r'mayo', r'abril', r'marzo', r'febrero', r'enero',
        r'^\d+$', r'^[a-z]$'
    ]

    candidate_titles = []
    for t in texts:
        t_clean = t.strip()
        low = t_clean.lower()
        if len(t_clean) < 4:
            continue
        # Si coincide exactamente con ruido
        if any(re.search(np, low) for np in noise_patterns) and len(t_clean.split()) <= 4:
            continue
        candidate_titles.append(t_clean)

    if candidate_titles:
        title = candidate_titles[0]
        # Si el título es muy corto y hay un segundo elemento prometedor
        if len(title.split()) <= 2 and len(candidate_titles) > 1 and len(candidate_titles[1].split()) > 2:
            title = candidate_titles[0] + ' ' + candidate_titles[1]
    elif core_title and len(core_title) > 4 and 'powerpoint' not in core_title.lower():
        title = core_title
    else:
        # Fallback al nombre del archivo original
        title = os.path.splitext(filename)[0]

    # Limpiar título
    title = clean_title(title)
    # Quitar prefijos numéricos o residuales
    title = re.sub(r'^\d+\s*[-_.]\s*', '', title)
    # Si el título tiene más de 70 caracteres, truncar con elegancia
    if len(title) > 70:
        title = title[:70].strip(' .-_')

    # 4. Formatear MODELO 3: Ateneo - YYYY - [Título] - [Institución].ext
    if institution:
        new_filename = f"Ateneo - {year} - {title} - {institution}{ext}"
    else:
        new_filename = f"Ateneo - {year} - {title}{ext}"

    new_filename = clean_title(new_filename)
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

output_json = os.path.join(os.path.dirname(__file__), 'presentations_model3_plan.json')
with open(output_json, 'w', encoding='utf-8') as f:
    json.dump(plan, f, indent=2, ensure_ascii=False)

print(f"Plan guardado en: {output_json}")

