# 🦴 Bone Fracture Detection, Classification & Pelvic Reduction Planning

> **Sources:** [Bolun-Z/PelvicFracturePlanning](https://github.com/Bolun-Z/PelvicFracturePlanning), [Sutuk/FracFormer](https://github.com/Sutuk/FracFormer), [vlbthambawita/FracAtlas](https://github.com/vlbthambawita/FracAtlas), [KingRaver/OrthoAI](https://github.com/KingRaver/OrthoAI), [aditano/OsteoVigil](https://github.com/aditano/OsteoVigil)
> **Domain:** Traumatology, bone fracture AI, AO/OTA classification, pelvic ring reduction, osteoporosis surveillance.

---

## 🎯 Technical & Clinical Architecture

### 1. Fracture Detection & Segmentation Pipelines
* **FracFormer & FracAtlas:** Vision Transformer (ViT) and CNN architectures tailored for subtle cortical disruptions, micro-fractures, and non-displaced fissures in plain radiographs (X-rays) and multi-slice CT.
* **AO/OTA Fracture Classification:** Automated categorization of fractures into standard clinical taxonomies:
  - Bone identifier (e.g., 33 = Distal Femur, 42 = Tibial Diaphysis).
  - Type (A = Extra-articular, B = Partial articular, C = Complete articular).

### 2. Pelvic Fracture Reduction Planning (`PelvicFracturePlanning`)
Pelvic ring fractures (Tile / Young-Burgess classifications) carry high morbidity and complex displacement vectors:
1. **Multi-Fragment Decomposition:** Graph-cut and connected component analysis to isolate independent bony fragments from 3D CT reconstructions.
2. **Symmetry Matching & Mirroring:** Uses the uninjured contralateral hemipelvis as a geometric ground-truth reference template.
3. **Rigid Registration & Transformation:** Computes optimal 6-DoF transformation matrices ($R, t$) to reduce displaced iliac/acetabular fragments back into anatomical alignment:
   $$\min_{R, t} \sum \| R \cdot p_i + t - q_i \|^2$$
4. **Fixation Plate Contouring:** Computes pre-bent reconstruction plate shapes and optimal screw placement corridors (e.g., anterior column screw, sacroiliac screw) avoiding the hip joint.

### 3. Bone Health & Osteoporosis Monitoring (`OsteoVigil`)
* Automated opportunistic screening on abdominal/pelvic CT scans.
* Computes Hounsfield Unit (HU) attenuation values across lumbar vertebrae (L1-L4) to detect osteopenia ($HU < 135$) and osteoporosis ($HU < 100$) before pathologic fragility fractures occur.
