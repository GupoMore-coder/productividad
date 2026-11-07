import sqlite3, os, shutil, tempfile, csv, re, json
from datetime import datetime

# 1. Connect to Drive metadata SQLite
src = os.path.expandvars(r'%LOCALAPPDATA%\Google\DriveFS\104927973287905570181\metadata_sqlite_db')
tmp = os.path.join(tempfile.gettempdir(), 'drive_meta_catalog.db')
shutil.copy2(src, tmp)
if os.path.exists(src + '-wal'):
    shutil.copy2(src + '-wal', tmp + '-wal')

conn = sqlite3.connect(tmp)
cur = conn.cursor()

# Get all non-trashed files
items = cur.execute("SELECT id, local_title, file_size FROM items WHERE is_folder = 0 AND trashed = 0").fetchall()
drive_id_map = {}
for did, title, size in items:
    if title:
        drive_id_map[title.strip()] = did
conn.close()
for f in [tmp, tmp + '-wal', tmp + '-shm']:
    if os.path.exists(f):
        try: os.remove(f)
        except: pass

print(f"Loaded {len(drive_id_map)} titles with Drive IDs from SQLite DB.")

# 2. AO Keywords
AO_RULES = [
    (r"femur proximal|trocant|subtrocant|cuello femoral|cadera|hip fractur", "AO 31 (Fémur Proximal)"),
    (r"diafisis femoral|femoral shaft", "AO 32 (Fémur Diafisario)"),
    (r"femur distal|supracondil|distal femur", "AO 33 (Fémur Distal)"),
    (r"rotula|patella", "AO 34 (Rótula)"),
    (r"platillos tibiales|meseta tibial|tibial plateau", "AO 41 (Tibia Proximal)"),
    (r"diafisis tibial|tibial shaft", "AO 42 (Tibia Diafisaria)"),
    (r"pilon tibial|pilon|distal tibia", "AO 43 (Tibia Distal / Pilón)"),
    (r"maleol|tobillo|ankle|weber", "AO 44 (Tobillo / Maleolar)"),
    (r"humero proximal|proximal humerus|neer", "AO 11 (Húmero Proximal)"),
    (r"diafisis humeral|humeral shaft", "AO 12 (Húmero Diafisario)"),
    (r"humero distal|distal humerus", "AO 13 (Húmero Distal)"),
    (r"radio proximal|olecranon|cupula radial", "AO 21 (Radio/Cúbito Proximal)"),
    (r"radio distal|distal radius|colles|smith", "AO 23 (Radio Distal)"),
    (r"pelvis|acetabul|ring fracture", "AO 61 / 62 (Pelvis y Acetábulo)"),
    (r"columna|spine|cervical|torac|lumbar", "AO Spine (Columna Vertebral)")
]

MESH_RULES = [
    (r"artroplastia|prosthesis|replacement|protesis", "Arthroplasty, Replacement; Joint Prosthesis"),
    (r"artroscopia|arthroscopy", "Arthroscopy; Minimally Invasive Surgical Procedures"),
    (r"osteosintesis|internal fixation|plating|nailing|clavo|placa", "Fracture Fixation, Internal; Bone Plates; Bone Nails"),
    (r"fijacion externa|external fixation|ilizarov", "External Fixators; Fracture Fixation"),
    (r"infeccion|osteomielitis|septic|biofilm|antibiotic", "Osteomyelitis; Surgical Wound Infection; Anti-Bacterial Agents"),
    (r"pseudoartrosis|nonunion|malunion", "Fractures, Ununited; Bone Regeneration"),
    (r"osteotomia|osteotomy|tomofix", "Osteotomy; Bone Realignment"),
    (r"ligamento cruzado|acl|cruciate", "Anterior Cruciate Ligament Injuries; Reconstruction"),
    (r"manguito rotador|rotator cuff", "Rotator Cuff Injuries; Tendon Repair"),
    (r"abordaje|surgical approach", "Orthopedic Procedures; Surgical Exposure")
]

def infer_meta(filename, rel_folder):
    ext = os.path.splitext(filename)[1].lower()
    base = os.path.splitext(filename)[0]
    
    year = ""
    author = ""
    title = base
    doc_type = "Artículo Original"
    ao_class = "N/A"
    mesh_terms = "Orthopedics; Traumatology"
    
    # 1. Ateneo format: Ateneo - YYYY - [Título] - [Institución]
    if base.startswith("Ateneo - "):
        doc_type = "Presentación de Ateneo Clínico"
        parts = [p.strip() for p in base.split(" - ")]
        if len(parts) >= 3 and re.match(r'^(?:19|20)\d{2}$', parts[1]):
            year = parts[1]
            title = parts[2]
            author = parts[3] if len(parts) >= 4 else "Servicio Ortopedia"
        elif len(parts) == 2:
            title = parts[1]
            author = "Servicio Ortopedia"
    # 2. Standard YYYY - Autor - Titulo
    else:
        m = re.match(r'^((?:19|20)\d{2})\s*-\s*([^-]+)\s*-\s*(.+)$', base)
        if m:
            year = m.group(1)
            author = m.group(2).strip()
            title = m.group(3).strip()
        elif base.startswith("EMC - "):
            doc_type = "Fascículo EMC (Elsevier)"
            m2 = re.match(r'^EMC\s*-\s*((?:19|20)\d{2})\s*-\s*(.+)$', base)
            if m2:
                year = m2.group(1)
                author = "Encyclopédie Médico-Chirurgicale"
                title = m2.group(2).strip()
            else:
                author = "Encyclopédie Médico-Chirurgicale"
                title = base
        elif base.startswith("Capitulo AO"):
            doc_type = "Capítulo de Tratado AO"
            author = "AO Foundation"
        elif base.startswith("Manual AO"):
            doc_type = "Manual Quirúrgico AO"
            author = "AO Foundation"
        elif "libro" in rel_folder.lower() or "atlas" in base.lower():
            doc_type = "Tratado / Atlas Quirúrgico"
    
    # Infer category
    category = "Temas generales"
    if rel_folder:
        parts = rel_folder.split(os.sep)
        if parts and parts[0]:
            category = parts[0]
            if category.lower() == "zpresentaciones":
                category = "Ateneos y Conferencias"
    
    norm = (filename + " " + rel_folder).lower()
    for pat, ao in AO_RULES:
        if re.search(pat, norm):
            ao_class = ao
            break
            
    found_mesh = []
    for pat, m in MESH_RULES:
        if re.search(pat, norm):
            found_mesh.append(m)
    if found_mesh:
        mesh_terms = " | ".join(found_mesh)
        
    return year, author, title, category, doc_type, ao_class, mesh_terms

# 3. Scan H:\Mi unidad\Información Ortopedia
ROOT = r'H:\Mi unidad\Información Ortopedia'
records = []
today = datetime.now().strftime("%Y-%m-%d")

def get_long_path(p):
    if not p.startswith('\\\\?\\'):
        return '\\\\?\\' + os.path.abspath(p)
    return p

for r, d, files in os.walk(ROOT):
    rel = os.path.relpath(r, ROOT)
    if rel == ".": rel = ""
    for f in sorted(files):
        ext = os.path.splitext(f)[1].lower()
        if ext in ['.pdf', '.pptx', '.ppt', '.pptm']:
            full_path = os.path.join(r, f)
            try:
                size = os.path.getsize(get_long_path(full_path))
            except Exception:
                size = 0
            drive_id = drive_id_map.get(f.strip(), "PENDIENTE_SYNC")
            status_drive = "CLOUD_ACTIVO" if drive_id != "PENDIENTE_SYNC" else "LOCAL_SOLO"
            
            year, author, title, category, doc_type, ao_class, mesh = infer_meta(f, rel)
            
            records.append({
                "filename": f,
                "full_path": full_path,
                "drive_id": drive_id,
                "year": year,
                "author": author,
                "title": title,
                "category": category,
                "doc_type": doc_type,
                "ao_class": ao_class,
                "mesh": mesh,
                "size": size,
                "status_drive": status_drive
            })

print(f"Total records processed: {len(records)}")
with_drive_id = sum(1 for r in records if r['drive_id'] != 'PENDIENTE_SYNC')
print(f"With Drive ID: {with_drive_id} ({with_drive_id*100/len(records):.2f}%)")

# Sort records: Year descending, then Category, then Title
def sort_key(r):
    y = int(r['year']) if r['year'].isdigit() else 0
    return (-y, r['category'], r['title'])

records.sort(key=sort_key)

# Assign DOC-00001 to DOC-XXXXX
for i, r in enumerate(records):
    r['id_unico'] = f"DOC-{i+1:05d}"

# Write CSV
csv_out = r'c:\Users\ferna\Documents\Antigravity Project\bibliotecario_engine\knowledge\inventario_maestro_expandido.csv'
headers = [
    'ID_Unico', 'Drive_File_ID', 'Año', 'Autor_Principal', 'Titulo_Completo',
    'Categoria_Anatomica', 'Tipo_Documento', 'Clasificacion_AO', 'Terminos_MeSH',
    'Tamaño_Bytes', 'Hash_SHA256', 'Estado_Drive', 'Fecha_Ingreso'
]

with open(csv_out, 'w', newline='', encoding='utf-8') as cf:
    writer = csv.writer(cf, quoting=csv.QUOTE_ALL)
    writer.writerow(headers)
    for r in records:
        writer.writerow([
            r['id_unico'],
            r['drive_id'],
            r['year'],
            r['author'],
            r['title'],
            r['category'],
            r['doc_type'],
            r['ao_class'],
            r['mesh'],
            r['size'],
            '', # hash empty to save weight
            r['status_drive'],
            today
        ])

print(f"Generated {csv_out} with {len(records)} rows!")

# Also overwrite inventario_maestro.csv so the user can import it directly!
shutil.copy2(csv_out, r'c:\Users\ferna\Documents\Antigravity Project\bibliotecario_engine\knowledge\inventario_maestro.csv')
print("Overwritten inventario_maestro.csv with expanded data!")
