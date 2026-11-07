import json

with open('scratch/presentations_model3_master_plan.json', 'r', encoding='utf-8') as f:
    plan = json.load(f)

print(f"Total presentations: {len(plan)}")
for i, p in enumerate(plan[25:55]):
    old_f = p.get('oldFilename', '')
    new_f = p.get('newFilename', '')
    f = p.get('folder', '')
    print(f"{i+26:02d}. [{f[:20]}]")
    print(f"    OLD: {old_f}")
    print(f"    NEW: {new_f}")
