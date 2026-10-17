# 🏥 Clinical EHR Infrastructure & FHIR R4 Standards (Medplum)

> **Sources:** [medplum/medplum](https://github.com/medplum/medplum), [maziyarpanahi/openmed](https://github.com/maziyarpanahi/openmed)
> **Domain:** Fast Healthcare Interoperability Resources (HL7 FHIR R4), EHR/EMR platforms, healthcare APIs, HIPAA-compliant patient data structures.

---

## 🎯 Architectural Patterns for FHIR Systems

Medplum provides an enterprise-grade, headless, developer-centric healthcare backend with full support for FHIR R4 resources.

### 1. Essential FHIR Resource Hierarchy
* **Administrative & Identity:**
  - `Patient`: Demographics, identifiers (MRN, SSN), emergency contacts, active status.
  - `Practitioner` / `Organization`: Healthcare providers, NPI numbers, clinical specialties, clinic locations.
* **Clinical Encounters & Conditions:**
  - `Encounter`: Hospital admission, ambulatory visit, emergency intake details.
  - `Condition`: Diagnoses mapped to ICD-10 / SNOMED CT terminology.
* **Diagnostic & Observational Data:**
  - `Observation`: Vital signs, laboratory values (LOINC), clinical scores, imaging findings.
  - `DiagnosticReport`: Radiology reports, CT/X-ray study interpretations, attached DICOM references (`ImagingStudy`).

---

## 💻 TypeScript / Node.js Medplum Client Integration

```typescript
import { MedplumClient } from '@medplum/core';

const medplum = new MedplumClient({
  baseUrl: 'https://api.medplum.com/',
  clientId: process.env.MEDPLUM_CLIENT_ID,
  clientSecret: process.env.MEDPLUM_CLIENT_SECRET,
});

export async function createOrthopedicEncounter(
  patientId: string, 
  practitionerId: string, 
  diagnosisIcd10: string
) {
  // Create clinical encounter
  const encounter = await medplum.createResource({
    resourceType: 'Encounter',
    status: 'in-progress',
    class: {
      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
      code: 'AMB',
      display: 'Ambulatory'
    },
    subject: { reference: `Patient/${patientId}` },
    participant: [{ individual: { reference: `Practitioner/${practitionerId}` } }]
  });

  // Record orthopedic condition (e.g. S72.0 - Fracture of neck of femur)
  const condition = await medplum.createResource({
    resourceType: 'Condition',
    clinicalStatus: {
      coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }]
    },
    verificationStatus: {
      coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status', code: 'confirmed' }]
    },
    code: {
      coding: [{ system: 'http://hl7.org/fhir/sid/icd-10-cm', code: diagnosisIcd10, display: 'Femur Fracture' }]
    },
    subject: { reference: `Patient/${patientId}` },
    encounter: { reference: `Encounter/${encounter.id}` }
  });

  return { encounter, condition };
}
```

---

## 🔒 Security & HIPAA Privacy Safeguards

* **SMART on FHIR & OAuth 2.0 Scopes:** Restrict access with fine-grained scopes (e.g. `patient/Observation.read`, `user/Encounter.write`).
* **AuditEvent Tracking:** Every read, create, update, and search on patient resources must emit an immutable `AuditEvent` recording timestamp, actor, and client IP.
