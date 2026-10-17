# 🧪 Biomedical Research & Clinical Reasoning (DeepMind Science Skills & Open-Medica)

> **Sources:** [google-deepmind/science-skills](https://github.com/google-deepmind/science-skills), [aipoch/medical-research-skills](https://github.com/aipoch/medical-research-skills), [JuneYaooo/awesome-medical-ai-skills](https://github.com/JuneYaooo/awesome-medical-ai-skills), [Open-Medica/open-medical-skills](https://github.com/Open-Medica/open-medical-skills), [K-Dense-AI/scientific-agent-skills](https://github.com/K-Dense-AI/scientific-agent-skills)
> **Domain:** Evidence-based medicine (EBM), biomedical literature appraisal, meta-analyses, clinical trial design, pharmacovigilance.

---

## 🎯 Clinical Reasoning & Research Methodology

### 1. PICO Structured Query Formulation
When evaluating clinical efficacy or therapeutic alternatives:
* **P (Population/Patient):** Demographic, pathology stage, exclusion criteria.
* **I (Intervention):** Novel surgical technique, drug regimen, device implant.
* **C (Comparison):** Standard of care, placebo, conservative management.
* **O (Outcome):** Primary endpoints (mortality, functional score, revision rate) and secondary safety metrics.

### 2. Evidence Hierarchy & Risk of Bias Assessment
Classifies medical evidence according to Oxford Centre for Evidence-Based Medicine (CEBM):
* **Level 1:** Systematic reviews and meta-analyses of randomized controlled trials (RCTs).
* **Level 2:** Individual RCTs with narrow confidence intervals.
* **Level 3:** Cohort studies with concurrent controls.
* **Level 4:** Case-control studies and retrospective case series.
* **Level 5:** Expert opinion, physiological bench testing, narrative reviews.

### 3. DeepMind Scientific Protocol Extraction
* **PubMed & BioRxiv Semantic Mining:** Automated extraction of sample sizes ($n$), hazard ratios ($HR$), odds ratios ($OR$), $p$-values, and confidence intervals ($95\% CI$).
* **Contradiction Detection:** Cross-referencing disparate clinical trial results to highlight protocol heterogeneity, dosage discrepancies, or patient selection bias.
