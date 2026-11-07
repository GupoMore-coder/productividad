import sqlite3, os, shutil, tempfile

src = os.path.expandvars(r'%LOCALAPPDATA%\Google\DriveFS\104927973287905570181\metadata_sqlite_db')
tmp = os.path.join(tempfile.gettempdir(), 'drive_meta_test.db')
shutil.copy2(src, tmp)

# Also copy wal if exists
wal_src = src + '-wal'
if os.path.exists(wal_src):
    shutil.copy2(wal_src, tmp + '-wal')

conn = sqlite3.connect(tmp)
cur = conn.cursor()

# Query sample items with local_title starting with Ateneo
rows = cur.execute("SELECT id, local_title, file_size, trashed FROM items WHERE local_title LIKE 'Ateneo%' LIMIT 10").fetchall()
print(f"Found {len(rows)} sample Ateneo items:")
for r in rows:
    print(r)

# Count total Ateneo items in SQLite
total_ateneo = cur.execute("SELECT COUNT(*) FROM items WHERE local_title LIKE 'Ateneo%' AND trashed = 0").fetchone()[0]
print(f"Total active Ateneo items in Drive DB: {total_ateneo}")

# Check total non-trashed files
total_files = cur.execute("SELECT COUNT(*) FROM items WHERE is_folder = 0 AND trashed = 0").fetchone()[0]
print(f"Total non-trashed files in Drive DB: {total_files}")

conn.close()
for f in [tmp, tmp + '-wal', tmp + '-shm']:
    if os.path.exists(f):
        try: os.remove(f)
        except: pass
