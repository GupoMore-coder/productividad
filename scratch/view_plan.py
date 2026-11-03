import json

with open('scratch/plan_final_136_resolution.json', 'r', encoding='utf-8') as f:
    plan = json.load(f)

print(f"Total in plan: {len(plan)}")
for i, p in enumerate(plan[:20]):
    f = p.get('folder', '')
    old_f = p.get('oldFilename', '')
    new_f = p.get('newFilename', '')
    print(f"{i+1:02d}. [{f}]\n    OLD: {old_f[:65]}\n    NEW: {new_f[:65]}")

