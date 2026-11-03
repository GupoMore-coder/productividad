import json

with open('scratch/pending_136_detailed_inspection.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

print(f"Total items: {len(items)}")
for i, it in enumerate(items):
    lines = it.get('first_lines', [])
    l_str = ' // '.join(lines[:3]) if lines else '[NO TEXT]'
    title = it.get('metadata', {}).get('title', '')
    author = it.get('metadata', {}).get('author', '')
    m_str = f"META: {author} - {title}" if (title or author) else ""
    folder = it.get('folder', '')
    fname = it.get('filename', '')
    print(f"[{i+1:03d}] [{folder}] {fname}\n      TEXT: {l_str[:110]}\n      {m_str[:90]}")

