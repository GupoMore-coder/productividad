---
description: Orthopedic surgery planning, pelvic and long-bone fracture classification, OpenSim biomechanics, and 3D implant CAD modeling.
---

# 🦴 Orthopedic Surgery & Biomechanics Workflow (`/ortho`)

Provides specialist-grade guidance for trauma reduction, AO/OTA fracture classification, 3D pre-operative planning, joint kinematics, and patient-specific implant design.

## 🚀 Usage

```bash
/ortho fracture [description or scan]   # AO/OTA classification, pelvic stability, fixation recommendation
/ortho biomechanics [task]              # OpenSim musculoskeletal modeling, gait kinematics, joint reaction forces
/ortho slicer [planning operation]      # 3D Slicer / SlicerIGT surgical guide generation and coordinate transforms
/ortho implant [spec]                   # CadQuery / Blender parametric implant generation and boolean osteotomies
```

### Examples
```bash
/ortho fracture 65yo female, high-energy impact, vertical shear pelvic fracture with sacral dysmorphism
/ortho biomechanics calculate hip contact force during squatting with 15-degree femoral retroversion
/ortho slicer plan distal radius osteotomy guide using OpenIGTLink tracking markers
/ortho implant generate contoured locking compression plate for distal humerus shaft
```

---

## 📋 Instructions for the Assistant

When the user runs `/ortho [arguments]`:

### 1. Trauma & Biomechanics Assessment Protocol
* Adhere strictly to AO/ASIF and AO/OTA fracture principles (Anatomic reduction, stable internal fixation, preservation of blood supply, early mobilization).
* For fractures, establish:
  * Fracture classification code (e.g., 61-B2, 33-C3).
  * Mechanism of injury and displacement vectors.
  * Stability assessment (rotationally vs. vertically unstable).
  * Surgical approach considerations (e.g., Stoppa, Kocher-Langenbeck, Ilioinguinal).

### 2. Specialized Knowledge Injection
* For **Fracture Analysis & Classification**: Read `.agents/catalogs/medical-ortho/fracture-detection-atlas.md`.
* For **Musculoskeletal Simulation & Kinematics**: Read `.agents/catalogs/medical-ortho/biomechanics-opensim.md`.
* For **Pre-op 3D Slicer / Computer-Assisted Surgery**: Read `.agents/catalogs/medical-ortho/surgical-slicer-planning.md`.
* For **Parametric Implants & CadQuery**: Read `.agents/catalogs/medical-ortho/anatomy-cad-modeling.md`.
* For **Blender 3D Mesh / Boolean Cuts**: Read `.agents/catalogs/mcp-registry/blender-3d-mcp.md`.

### 3. Delivery Template
1. **Clinical / Biomechanical Problem Statement**: Anatomical landmarks, bone quality, and mechanical axes.
2. **Surgical Strategy & Hardware Configuration**: Plate profiles, screw trajectories, trajectory angles, and torque limits.
3. **Parametric Code or Simulation Pipeline**: Ready-to-run CadQuery, OpenSim XML/Python, or Blender `bpy` script.
4. **Post-Operative Biomechanical Risk Analysis**: Stress shielding risk, non-union risk, hardware fatigue, and weight-bearing schedule.
