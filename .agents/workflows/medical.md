---
description: Clinical decision support, validated medical risk calculators, FHIR R4 interoperability, and evidence-based medicine.
---

# 🩺 Medical AI & Clinical Informatics Workflow (`/medical`)

Provides guided execution for clinical decision support, deterministic medical calculators, FHIR R4 health record operations, and evidence-based literature synthesis.

## 🚀 Usage

```bash
/medical calc [formula]       # Deterministic calculator (e.g., crcl, wells, meld, cha2ds2-vasc)
/medical fhir [operation]     # FHIR R4 resource generation, query, or schema validation
/medical ebm [query]          # Evidence-based medicine search formatted according to PICO framework
/medical imaging [task]       # 3D imaging pipeline, segmentation transforms, or DICOM de-identification
```

### Examples
```bash
/medical calc crcl age=68 weight=74 cr=1.4 female=false
/medical fhir create-encounter patient=123 class=AMB reason="Osteoarthritis follow-up"
/medical ebm In elderly patients with subcapital femoral fractures, does total hip arthroplasty improve mobility compared to hemiarthroplasty?
/medical imaging segment-ct input=scan.nii.gz model=UNETR
```

---

## 📋 Instructions for the Assistant

When the user runs `/medical [arguments]`:

### 1. Mandatory HIPAA & Safety Pre-Check
* Verify that user input does not contain unmasked direct identifiers (Names, SSNs, MRNs, exact dates of birth, phone numbers).
* If raw identifiers exist, alert the user and apply Safe Harbor de-identification before generating artifacts or making API calls.

### 2. Specialized Knowledge Injection
* For **Calculators**: Read `.agents/catalogs/mcp-registry/medical-calc.md` to retrieve exact mathematical formulas and bounding validations. Calculate deterministically with zero hallucination.
* For **FHIR / EHR Operations**: Read `.agents/catalogs/medical-ortho/medplum-fhir-ehr.md` to enforce FHIR R4 resource structures, codings (LOINC, SNOMED-CT, ICD-10), and client authentication patterns.
* For **Evidence & Clinical Trials**: Read `.agents/catalogs/medical-ortho/clinical-research-deepmind.md` to structure queries in PICO format and appraise evidence using the Oxford CEBM hierarchy.
* For **Imaging & DICOM**: Read `.agents/catalogs/medical-ortho/monai-imaging-pipeline.md` for MONAI preprocessing pipelines and 3D sliding window inference.

### 3. Output Delivery Template
Present results with:
1. **Clinical Findings / Calculated Score** (with units and reference ranges).
2. **Clinical Interpretation & Evidence Level** (e.g., Level I RCT / Level II Systematic Review).
3. **Actionable Next Steps / Standard of Care Considerations**.
4. **Safety Disclaimer:** Explicit reminder that outputs are for clinical decision support and require independent physician validation.
