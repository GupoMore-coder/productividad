# 🎨 Blender 3D MCP Server Integration

> **Source:** [ahujasid/mcp-for-blender](https://github.com/ahujasid/mcp-for-blender)
> **Domain:** Model Context Protocol bridge connecting LLM agents to Blender via Python socket/RPC, automated 3D mesh processing, procedural anatomical scene generation.

---

## 🎯 Architectural Overview

Allows Antigravity agents to execute Blender Python (`bpy`) commands in real-time, import DICOM-derived STL meshes, apply booleans, contour orthopedic fixators, and render photorealistic surgical simulations.

```
Agent Prompt ──► MCP Client ──► Blender Python Socket (bpy) ──► 3D Viewport / Render
```

### 1. Key Automated Operations
* **Mesh Import & Normalization:** Ingests STL/OBJ from 3D Slicer or MONAI, centers pivot to center of mass, repairs non-manifold geometry.
* **Boolean Intersections:** Carves bone resection cavities or simulated osteotomy cuts (`bpy.ops.object.modifier_add(type='BOOLEAN')`).
* **Surgical Hardware Assembly:** Positions standard screw and plate models along computed landmark curves.
* **Camera & Lighting Setup:** Automates studio lighting setups for orthopedic case presentations and surgical guides.

---

## 💻 Sample MCP Execution Call

```json
{
  "tool": "execute_blender_code",
  "arguments": {
    "code": "import bpy\n# Import segmented femur\nbpy.ops.wm.stl_import(filepath='models/segmented_femur.stl')\nobj = bpy.context.active_object\nobj.name = 'Patient_Femur'\n# Apply cortical bone material\nmat = bpy.data.materials.get('CorticalBone')\nif mat: obj.data.materials.append(mat)"
  }
}
```
