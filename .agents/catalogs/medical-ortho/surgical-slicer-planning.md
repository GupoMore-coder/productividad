# 🩺 Surgical Planning & Image-Guided Therapy (3D Slicer Agent & SlicerIGT)

> **Sources:** [puxuntu/Slicer_agent_for_surgical_planning](https://github.com/puxuntu/Slicer_agent_for_surgical_planning), [SlicerIGT/SlicerIGT](https://github.com/SlicerIGT/SlicerIGT)
> **Domain:** Computer-assisted surgery (CAS), 3D medical visualization, surgical trajectory planning, real-time navigation.

---

## 🎯 Architecture & Workflow

Integrating LLM agents with 3D Slicer turns complex radiological data into actionable surgical roadmaps through automated Python scripting and OpenIGTLink.

```
CT / MRI (DICOM) ──► 3D Segmentation (MRML) ──► Trajectory Planning ──► Navigation / 3D Print
```

### 1. The Surgical Planning Pipeline
1. **DICOM Ingestion & Volume Rendering:**
   - Ingests cross-sectional CT/CBCT slices.
   - Builds volumetric representations with transfer functions highlighting cortical bone vs. soft tissue.
2. **Automated Anatomical Segmentation:**
   - Segment Editor modules isolate target bones (femur, pelvis, tibia) and critical structures (nerves, blood vessels).
   - Generates watertight surface models (STL/OBJ).
3. **Implant Alignment & Trajectory Planning:**
   - Calculates anatomical landmarks (e.g., transepicondylar axis, mechanical axis).
   - Simulates screw trajectories, osteotomy cut planes, and implant placement angles to maximize bone-screw purchase while avoiding neurovascular bundles.
4. **Intraoperative Navigation (OpenIGTLink & SlicerIGT):**
   - Transmits real-time tracking transforms between optical/electromagnetic tracking systems (e.g., NDI Polaris) and Slicer viewports.

---

## 💻 Python Scripting for 3D Slicer CLI & Agent Automation

```python
import slicer

def setup_surgical_trajectory(entry_point, target_point, trajectory_name="SurgicalTrajectory"):
    """
    Creates a surgical trajectory markups line between planned entry point and anatomical target.
    """
    # Create or retrieve markups curve/line node
    markups_node = slicer.mrmlScene.AddNewNodeByClass("vtkMRMLMarkupsLineNode", trajectory_name)
    markups_node.AddControlPoint(entry_point)
    markups_node.AddControlPoint(target_point)
    
    # Calculate trajectory length and vector
    import numpy as np
    vec = np.array(target_point) - np.array(entry_point)
    length = np.linalg.norm(vec)
    
    print(f"[Slicer] Trajectory '{trajectory_name}' planned: Length={length:.2f}mm")
    return markups_node
```

---

## 🛡️ Clinical Quality & Safety Constraints

* **Collision Avoidance:** Ensure all simulated cutting planes preserve at least 5mm margin from annotated neurovascular structures.
* **Coordinate System Verification:** Always confirm transform direction between patient coordinates (LPS/RAS) and tracker coordinates.
