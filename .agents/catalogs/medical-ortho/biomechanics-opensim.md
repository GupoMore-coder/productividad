# 🦴 Biomechanics & Musculoskeletal Simulation (OpenSim Core)

> **Source:** Based on [opensim-org/opensim-core](https://github.com/opensim-org/opensim-core)
> **Domain:** Musculoskeletal modeling, computational biomechanics, dynamic simulation, and movement analysis.

---

## 🎯 Core Capabilities & Architecture

OpenSim is the scientific gold standard for modeling human neuromusculoskeletal systems and simulating the dynamics of movement.

### 1. The Core Simulation Pipeline
1. **Model Scaling (`ScaleTool`):** Adjusts generic model dimensions (e.g., Rajagopal, Gait2392) to match patient-specific anthropometry measured from motion capture marker sets or 3D CT/MRI scans.
2. **Inverse Kinematics (`InverseKinematicsTool`):** Solves for generalized joint coordinates (angles and translations) at each time step by minimizing the distance error between virtual model markers and experimental tracking markers.
3. **Inverse Dynamics (`InverseDynamicsTool`):** Calculates net joint reaction forces and moments responsible for observed kinematics using equations of motion (Newton-Euler / Kane's methods).
4. **Muscle Force Estimation (Static Optimization & CMC):**
   - **Static Optimization (SO):** Resolves muscle redundancy problem frame-by-frame by minimizing muscle activation squared $\sum (a_m)^2$.
   - **Computed Muscle Control (CMC):** Drives forward dynamic simulation using proportional-derivative controllers to track desired kinematics while accounting for muscle-tendon contraction dynamics.
5. **Joint Reaction Analysis (`JointReaction`):** Computes internal contact forces and compressive loads on articular cartilage (e.g., tibiofemoral joint contact forces).

---

## 💻 Python & C++ API Integration Patterns

```python
import opensim as osim

def run_inverse_kinematics(model_path, trc_marker_file, output_mot_file):
    """
    Automates patient-specific Inverse Kinematics for joint angle computation.
    """
    # Load calibrated musculoskeletal model
    model = osim.Model(model_path)
    model.initSystem()
    
    # Configure IK Tool
    ik_tool = osim.InverseKinematicsTool()
    ik_tool.setModel(model)
    ik_tool.setMarkerDataFileName(trc_marker_file)
    ik_tool.setOutputMotionFileName(output_mot_file)
    ik_tool.setStartTime(0.0)
    ik_tool.setEndTime(2.5)
    
    # Execute solver
    ik_tool.run()
    print(f"[OpenSim] IK completed. Joint kinematics saved to: {output_mot_file}")
```

---

## 🏥 Clinical & Orthopedic Applications

* **Pre-/Post-Surgical Gait Analysis:** Evaluating compensatory gait mechanisms following hip arthroplasty or total knee replacement.
* **Prosthetics & Orthotics Design:** Simulating load redistribution and shear stress on residual limbs.
* **Tendon Transfer Planning:** Simulating functional outcomes (e.g., rectus femoris transfer in cerebral palsy) before executing surgical cuts.
