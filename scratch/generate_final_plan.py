import json, re, os, fitz

with open('scratch/pending_136_detailed_inspection.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

root = r'H:\Mi unidad\Información Ortopedia'

# Helper de sanitización
def clean_str(s):
    s = re.sub(r'<[^>]*>', '', s)
    s = re.sub(r'[:*?"<>|\\/]', ' - ', s)
    s = re.sub(r'\s+', ' ', s)
    s = re.sub(r'\s+-\s+-+', ' - ', s)
    return s.strip(' .-')

plan = []

for idx, it in enumerate(items):
    folder = it['folder']
    old_fname = it['filename']
    full_path = os.path.join(root, folder, old_fname)
    meta = it.get('metadata', {})
    lines = it.get('first_lines', [])
    first_text = ' '.join(lines)
    m_title = meta.get('title', '').strip()
    m_author = meta.get('author', '').strip()

    year = None
    author = None
    title = None

    # 1. Regex de año
    y_match = re.search(r'\b(19\d{2}|20\d{2})\b', old_fname + ' ' + m_title + ' ' + first_text)
    if y_match:
        year = y_match.group(1)

    # 2. Casos específicos conocidos de alta precisión
    if 'Luiz_Roberto' in old_fname:
        year, author, title = '2014', 'Vialle, Luiz Roberto', 'AOSpine Masters Series Vol 3 - Cervical Degenerative Conditions'
    elif 'Mast' in old_fname or 'planificación y reducción' in old_fname.lower():
        year, author, title = '1990', 'Mast, Jeffrey', 'Técnica de Planificación y Reducción en Cirugía de Fracturas'
    elif 'C-REX' in old_fname:
        year, author, title = '2018', 'C-REX', 'K-Wiring Surgical Technique and Principles'
    elif 'HOPPENFELD 1' in old_fname:
        year, author, title = '2009', 'Hoppenfeld, Stanley', 'Surgical Exposures in Orthopaedics (4th Ed)'
    elif 'Key-Techniques' in old_fname:
        year, author, title = '2001', 'Stern, Steven H.', 'Key Techniques in Orthopaedic Surgery'
    elif 'Rehab Science' in old_fname:
        year, author, title = '2023', 'Walters, Tom', 'Rehab Science'
    elif '48 leyes' in old_fname:
        year, author, title = '2000', 'Greene, Robert', 'Las 48 Leyes del Poder'
    elif 'Ferrari' in old_fname:
        year, author, title = '1997', 'Sharma, Robin S.', 'El Monje que Vendió su Ferrari'
    elif 'MILLER Review' in old_fname:
        year, author, title = '2016', 'Miller, Mark D.', 'Review of Orthopaedics - Review Questions'
    elif 'Cassar-Pullicino' in first_text or 'Measurements in Musculoskeletal' in old_fname:
        year, author, title = '2020', 'Cassar-Pullicino, Victor', 'Measurements in Musculoskeletal Radiology'
    elif 'Douglas Murphy' in old_fname or 'Fundamentals of Amputation' in old_fname:
        year, author, title = '2014', 'Murphy, Douglas', 'Fundamentals of Amputation Care and Prosthetics'
    elif 'Agarwal' in first_text or 'Essentials_of_Prosthetics' in old_fname:
        year, author, title = '2013', 'Agarwal, A.K.', 'Essentials of Prosthetics and Orthotics'
    elif 'CAC.Co_2022' in old_fname or 'Libro_hemofilia' in old_fname:
        year, author, title = '2022', 'Cuenta de Alto Costo', 'Guía y Consenso de Hemofilia en Colombia'
    elif 'Federación Mundial de Hemofilia' in old_fname:
        year, author, title = '2021', 'WFH', 'Informe de la Federación Mundial de Hemofilia - Sondeo Anual'
    elif 'Tesis artropatía' in old_fname:
        year, author, title = '2014', 'García Barrado, Ana Isabel', 'Tesis - Valoración de la Artropatía Hemofílica por Rx y RM'
    elif 'Burnei' in m_author or 'Double X' in old_fname:
        year, author, title = '2020', 'Burnei, Gheorghe', 'Double X Cross Fixation in Paediatric Supracondylar Humerus Fractures'
    elif 'Dickens' in m_author or 'Management of Pediatric Femur' in old_fname:
        year, author, title = '2019', 'Dickens, Aaron', 'Management of Pediatric Femur Shaft Fractures'
    elif 'Reyes-Hernández' in m_author or 'Fracturas diafisarias radiocubitales' in old_fname:
        year, author, title = '2018', 'Reyes-Hernández, L.A.', 'Fracturas Diafisarias Radiocubitales en Pacientes Pediátricos'
    elif 'Biomechanics and Gait Analysis' in old_fname:
        year, author, title = '2020', 'Stergiou, Nicholas', 'Biomechanics and Gait Analysis'
    elif 'Voggenreiter' in first_text or 'soa8110' in old_fname:
        year, author, title = '1999', 'Voggenreiter, Gregor', 'Tikhoff-Linberg Procedure for Shoulder Girdle Tumors'
    elif 'Enneking' in first_text or 'enneking1985' in old_fname:
        year, author, title = '1985', 'Enneking, William F.', 'Staging of Musculoskeletal Neoplasms'
    elif 'Carpintero' in first_text or '13044129' in old_fname:
        year, author, title = '2003', 'Carpintero, P.', 'Tumores Benignos de los Huesos'
    elif 'Greenberg' in first_text or 'Giant Cell Tumor of Bone.pdf' == old_fname:
        year, author, title = '2017', 'Greenberg, David D.', 'Giant Cell Tumor of Bone'
    elif 'gpc-profesionales-personas-amputada' in old_fname:
        year, author, title = '2015', 'Ministerio de Salud', 'GPC No 55 Manejo del Paciente Amputado y Rehabilitación'
    elif 'Massoud' in old_fname or 'Dr Massoud' in first_text:
        sub_title = clean_str(old_fname.replace('.pdf', '').replace('Dr Massoud', '').replace('Dr. Massoud', '').replace('dr massoud', ''))
        year, author, title = '2021', 'Massoud, Mahmoud', sub_title if len(sub_title) > 3 else 'Orthopaedic Review Notes'
    elif 'Bajammal' in m_author or 'Orals Last Second' in old_fname:
        year, author, title = '2017', 'Bajammal, Sohail', 'Oral Exams Last Second Factoids'
    elif 'Megahed' in m_author or 'orthobullet MCQs' in old_fname:
        year, author, title = '2022', 'Megahed, Ahmed', 'Orthobullets Anatomy Review MCQs'
    elif 'Patwardhan' in first_text and 'Fellowship' in old_fname:
        year, author, title = '2024', 'Patwardhan, Sandeep', 'Paediatric Orthopaedic Fellowship Curriculum'
    elif 'Planeamiento Quirúrgico' in old_fname or folder == 'zPlaneamientos Quirurgicos':
        # Mantener Planeamiento Quirúrgico estandarizado
        sub = clean_str(old_fname.replace('Planeamiento Quirúrgico - ', '').replace('.pdf', ''))
        year, author, title = '2022', 'Planeamiento Quirúrgico', sub
    elif 'Tareas CdN' in folder:
        sub = clean_str(old_fname.replace('.pdf', ''))
        year, author, title = '2023', 'Ateneo CdN', sub
    elif 'CAPITULO 52' in old_fname:
        year, author, title = '2015', 'SECOT', 'Principios de Inmovilización Rígida en COT - Enyesados (Cap 52)'
    elif 'S0120884517300731' in old_fname:
        year, author, title = '2017', 'Rev Col Ortop', 'Fracturas de Cóndilo Lateral Humeral en Niños'

    # 3. Heurística General para el resto
    if not (year and author and title):
        if not year:
            year = '2020'
        
        # Autor desde metadata o texto
        if m_author and len(m_author) > 2 and not any(k in m_author.lower() for k in ['microsoft', 'word', 'powerpoint', 'adobe', 'user', 'pc']):
            author = clean_str(m_author.split(';')[0].split(',')[0])
        elif lines and len(lines) > 1 and re.match(r'^[A-Z][a-záéíóúñ]+(\s+[A-Z][a-záéíóúñ]+)+', lines[0]):
            author = clean_str(lines[0])
        else:
            # Autor derivado del nombre de carpeta
            folder_clean = folder.split('\\')[-1].replace('Fx ', '').replace('Tumores ', '')
            author = clean_str(folder_clean)
        
        # Título desde metadata o nombre de archivo
        if m_title and len(m_title) > 4 and not any(k in m_title.lower() for k in ['microsoft', 'untitled', 'diapositiva']):
            title = clean_str(m_title)
        else:
            title = clean_str(old_fname.replace('.pdf', ''))

    # Limpiar y acortar título si excede 80 caracteres
    title = clean_str(title)
    if len(title) > 80:
        title = title[:80].strip(' .-')

    new_fname = f"{year} - {author} - {title}.pdf"
    
    # Validar que sea diferente
    if old_fname != new_fname:
        plan.append({
            'folder': folder,
            'oldFilename': old_fname,
            'newFilename': new_fname,
            'oldPath': full_path,
            'newPath': os.path.join(root, folder, new_fname)
        })

print(f"Plan generado con éxito: {len(plan)} de {len(items)} archivos a renombrar.")
with open('scratch/plan_final_136_resolution.json', 'w', encoding='utf-8') as f:
    json.dump(plan, f, indent=2, ensure_ascii=False)

