const fs = require('fs');
const path = require('path');
const { computeSha256, globalRegistry, saveGlobalRegistry } = require('../bibliotecario_engine/frugal_engine.cjs');

const ROOT = 'H:\\Mi unidad\\Información Ortopedia';
const FOLDER = path.join(ROOT, 'AO Curso Basico', 'Articulos');
const MUSIC_DEST = 'C:\\Users\\ferna\\Music';

// 1. Duplicado a mover a Música
const duplicatesToMove = [
  {
    oldName: 'Antiglade_vs_Lateral_plate_2017.pdf',
    backupName: '2017 - Kilian, Miroslav - Antiglide vs lateral plate fixation Danis-Weber B (Copia Duplicada de AO Articulos).pdf'
  }
];

// 2. Operaciones de renombramiento y copias multi-tópico
const operations = [
  // Húmero
  {
    old: 'Intramedullary_nailing_vs_open_reduction_internal_fixation_for_humeral_shaft_fractures.pdf',
    new: '2024 - Hurley, Eoghan T. - Intramedullary nailing vs open reduction internal fixation for humeral shaft fractures a meta-analysis.pdf',
    copies: ['Humero']
  },
  {
    old: 'Minimally_invasive_plate_osteosynthesis_for_humeral_shaft_fractures.pdf',
    new: '2010 - Concha, Juan M. - Minimally invasive plate osteosynthesis for humeral shaft fractures are results reproducible.pdf',
    copies: ['Humero']
  },
  {
    old: 'Treatment_of_humeral_shaft_fractures_with_different_treatment_methods.pdf',
    new: '2023 - Qiu, Hao - Treatment of humeral shaft fractures with different treatment methods a network meta-analysis.pdf',
    copies: ['Humero']
  },
  {
    old: 'Management_of_Humeral_Shaft_Fracture__A_Network_Meta_Analysis_of_Individual_Treatment_Modalities.pdf',
    new: '2024 - Colasanti, Christopher A. - Management of Humeral Shaft Fracture A Network Meta-Analysis.pdf',
    copies: ['Humero']
  },
  {
    old: 'Open_plate_fixation_versus_nailing_for_humeral_shaft_fractures__a_meta_analysis_and_systematic_review_of_randomised_clinical_trials_and_observational_studies.pdf',
    new: '2022 - Beeres, Frank Joseph Paulus - Open plate fixation versus nailing for humeral shaft fractures a meta-analysis.pdf',
    copies: ['Humero']
  },

  // Rodilla y Tibia
  {
    old: 'Extra_Articular_Technique_for_Semiextended_Tibial_Nailing.pdf',
    new: '2010 - Kubiak, Erik N. - Extra-Articular Technique for Semiextended Tibial Nailing.pdf',
    copies: ['Rodilla y Tibia']
  },
  {
    old: 'Semiextended_Position_for_Intramedullary_Nailing_of_the_Proximal_Tibia__tornetta.pdf',
    new: '1996 - Tornetta III, Paul - Semiextended Position for Intramedullary Nailing of the Proximal Tibia.pdf',
    copies: ['Rodilla y Tibia']
  },
  {
    old: 'Is_there_a_trend_towards_semi_extended_knee_positioning_during_intramedullary_tibial_nailing_in_Latin_America.pdf',
    new: '2023 - Pires, Robinson Esteves - Is there a trend towards semi-extended knee positioning during intramedullary tibial nailing in Latin America.pdf',
    copies: ['Rodilla y Tibia']
  },
  {
    old: 'Semiextended_intramedullary_nailing_of_the_tibia_using_an_infrapatellar_approach_a_retrospective_cohort_study.pdf',
    new: '2021 - Lu, Ke - Semi-extended intramedullary nailing of the tibia using an infrapatellar approach.pdf',
    copies: ['Rodilla y Tibia']
  },

  // Fémur y Cadera / Pelvis (Fracturas trocantéricas)
  {
    old: 'Extramedullary_versus_intramedullary_fixation_of_stable_trochanteric_femoral_fractures_a_systematic_review_and_meta_analysis.pdf',
    new: '2023 - Zeelenberg, Miliaan L. - Extramedullary versus intramedullary fixation of stable trochanteric femoral fractures a systematic review.pdf',
    copies: ['Femur', 'Cadera y Pelvis']
  },
  {
    old: 'Extramedullary_versus_intramedullary_fixation_of_unstable_trochanteric_femoral_fractures__AO_type_31_A2_.pdf',
    new: '2024 - Zeelenberg, Miliaan L. - Extramedullary versus intramedullary fixation of unstable trochanteric femoral fractures AO type 31-A2.pdf',
    copies: ['Femur', 'Cadera y Pelvis']
  },
  {
    old: 'Integrity_of_the_Lateral_Femoral_Wall_in_Intertrochanteric_Hip_Fractures.pdf',
    new: '2007 - Palm, Henrik - Integrity of the Lateral Femoral Wall in Intertrochanteric Hip Fractures.pdf',
    copies: ['Femur', 'Cadera y Pelvis']
  },
  {
    old: 'Mobility_and_living_status_at_discharge_and_after_three_months_for_extramedullary_versus_intramedullary_fixation_of_AO_type_31_A1_trochanteric_fractures__an_analysis_of_Dutch_hip.pdf',
    new: '2025 - Zeelenberg, Miliaan L. - Mobility and living status after extramedullary versus intramedullary fixation of AO type 31-A1 fractures.pdf',
    copies: ['Femur', 'Cadera y Pelvis']
  },
  {
    old: 'Outcomes_of_Name_brand_Versus_Generic_Cephalomedullary_Nail_Fixation_for_Intertrochanteric_and_Subtrochanteric_Fractures.pdf',
    new: '2024 - Kleinsmith, Rebekah M. - Outcomes of Name-brand Versus Generic Cephalomedullary Nail Fixation for Trochanteric Fractures.pdf',
    copies: ['Femur', 'Cadera y Pelvis']
  },
  {
    old: 'Intramedullary_Nailing_vs_Sliding_Hip_Screw_in_Trochanteric_Fracture_Management_The_INSITE_Randomized_Clinical_Trial.pdf',
    new: '2023 - Schemitsch, Emil H. - Intramedullary Nailing vs Sliding Hip Screw in Trochanteric Fracture Management INSITE Trial.pdf',
    copies: ['Femur', 'Cadera y Pelvis']
  },
  {
    old: 'Sliding_hip_screw_vs_intramedullary_nail_for_AO_OTA31A1_A3_a_systematic_review_and_metaanalysis.pdf',
    new: '2022 - Wessels, Johanne Overgaard - Sliding hip screw vs intramedullary nail for AO-OTA 31A1-A3 a systematic review.pdf',
    copies: ['Femur', 'Cadera y Pelvis']
  },
  {
    old: 'The_effect_of_anterior_support_screw_AS2_in_unstable_femoral_trochanteric_fractures_A_multicenter_randomized_controlled_trial.pdf',
    new: '2024 - Maehara, Takashi - The effect of anterior support screw AS2 in unstable femoral trochanteric fractures.pdf',
    copies: ['Femur', 'Cadera y Pelvis']
  },

  // Tobillo y Peroné (Placas antiglide vs laterales)
  {
    old: 'Antiglide_versus_lateral_plate_xation_for_DanisWeber_type_B_malleolar_fractures_caused_by_supination_external_rotation_injury.pdf',
    new: '2017 - Kilian, Miroslav - Antiglide versus lateral plate fixation for Danis-Weber type B malleolar fractures.pdf',
    copies: ['Pie y Tobillo']
  },
  {
    old: 'Antiglide_plating_for_distal_fibula_fractures_caused_by_supination_external_rotation_injury.pdf',
    new: '2021 - Gottipati, Sunil - Antiglide plating for distal fibula fractures caused by supination-external rotation injury.pdf',
    copies: ['Pie y Tobillo']
  },
  {
    old: 'Biomechanical_Study_Resistance_Comparison_of_Posterior_Antiglide_Plate_and_Lateral_Plate_on_Synthetic_Bone_Models_Simulating_DanisWeber_B_Malleolar_Fractures.pdf',
    new: '2013 - Buscharino, Bruna - Comparação da resistência mecânica por placas lateral e posterior em fraturas Danis-Weber B.pdf',
    copies: ['Pie y Tobillo']
  },
  {
    old: 'Comparison_of_Lateral_Locking_Plate_and_Antiglide_Plate_for_Fixation_of_Distal_Fibular_Fractures_in_Osteoporotic_Bone.pdf',
    new: '2006 - Minihane, Keith P. - Comparison of Lateral Locking Plate and Antiglide Plate for Distal Fibular Fractures in Osteoporotic Bone.pdf',
    copies: ['Pie y Tobillo']
  },
  {
    old: 'Lateral_versus_posterior_fibular_plating.pdf',
    new: '2020 - Chowdhary, Siddharth - Comparative study in patients with external rotation ankle injuries Lateral vs posterior fibular plating.pdf',
    copies: ['Pie y Tobillo']
  },
  {
    old: 'Posterior_antiglide_plate_vs_lateral_plate_to_treat_Weber_type_B_ankle_fractures.pdf',
    new: '2004 - Martínez Velez, Noé - Posterior antiglide plate vs lateral plate to treat Weber type B ankle fractures.pdf',
    copies: ['Pie y Tobillo']
  },
  {
    old: 'Posterior_Antiglide_Plating_vs_Lateral_Neutralization_Plating_for_Weber_B_Distal_Fibular_Fractures.pdf',
    new: '2022 - Deng, Yi - Posterior Antiglide Plating vs Lateral Neutralization Plating for Weber B Distal Fibular Fractures.pdf',
    copies: ['Pie y Tobillo']
  },
  {
    old: 'Posterior_versus_Lateral_Plate_Fixation_of_Short_Oblique_Fractures_of_the_Distal_Fibula.pdf',
    new: '2016 - Sanders, Julia S. - Posterior versus Lateral Plate Fixation of Short Oblique Fractures of Distal Fibula.pdf',
    copies: ['Pie y Tobillo']
  },
  {
    old: 'Surgical_Treatment_of_a_Displaced_Lateral_Malleolus_Fracture_The_Antiglide_Technique_Versus_Lateral_Plate_Fixation.pdf',
    new: '2002 - Lamontagne, Jean - Surgical Treatment of Displaced Lateral Malleolus Fracture Antiglide Technique Versus Lateral Plate Fixation.pdf',
    copies: ['Pie y Tobillo']
  },
  {
    old: 'The_antiglide_plate_for_distal_fibular_fixation.pdf',
    new: '1987 - Schaffer, J.J. - The Antiglide Plate for Distal Fibular Fixation.pdf',
    copies: ['Pie y Tobillo']
  },
  {
    old: 'True_antiglide_fixation_of_Danis_Weber_B_fibula_fractures_has_lower_rates_of_removal_of_hardware.pdf',
    new: '2022 - DeKeyser, Graham J. - True antiglide fixation of Danis-Weber B fibula fractures has lower rates of removal of hardware.pdf',
    copies: ['Pie y Tobillo']
  },
  {
    old: 'WeightBearing_and_Mobilization_in_the_Postoperative_Care_of_Ankle_Fractures.pdf',
    new: '2015 - Smeeing, Diederik P. J. - Weight-Bearing and Mobilization in the Postoperative Care of Ankle Fractures a meta-analysis.pdf',
    copies: ['Pie y Tobillo']
  },

  // Pelvis y Fijación Externa
  {
    old: 'An_Alternative_Site_for_Pin_Placement_in_External_Fixation_of_Pelvic_Fractures__Lateral_Posterior_Pelvic_External_Fixator_Surgical_Technique.pdf',
    new: '2021 - Russ, Matthias K. - Alternative Site for Pin Placement in External Fixation of Pelvic Fractures Lateral Posterior Technique.pdf',
    copies: ['Cadera y Pelvis']
  },
  {
    old: 'Comparison_between_external_fixation_and_pelvic_binder_in_patients_with_pelvic_fracture_and_haemodynamic_instability_who_underwent_various_haemostatic_procedures.pdf',
    new: '2022 - Jang, Ji Young - Comparison between external fixation and pelvic binder in pelvic fracture and hemodynamic instability.pdf',
    copies: ['Cadera y Pelvis']
  },
  {
    old: 'Comparison_of_iliac_crest_versus_supraacetabular_external_fixator_in_hemodynamically_unstable_patients_with_a_pelvic_ring_injury.pdf',
    new: '2021 - Chu, Xiangquan - Comparison of iliac crest versus supraacetabular external fixator in hemodynamically unstable pelvic ring injury.pdf',
    copies: ['Cadera y Pelvis']
  },
  {
    old: 'Emergency_Stabilization_of_Pelvic_Instabilities_with_the_Pelvic_C_Clamp.pdf',
    new: '2004 - Gänsslen, Axel - Emergency Stabilization of Pelvic Instabilities with the Pelvic C-Clamp.pdf',
    copies: ['Cadera y Pelvis']
  },
  {
    old: 'External_fixation_for_acute_pelvic_ring_injuries__Decision_making_and_technical_options.pdf',
    new: '2013 - Stahel, Philip F. - External fixation for acute pelvic ring injuries Decision making and technical options.pdf',
    copies: ['Cadera y Pelvis']
  },
  {
    old: 'External_fixation_of_unstable_pelvic_fractures__a_systematic_review_and_meta_analysis.pdf',
    new: '2019 - Stewart, Rebecca G. - External fixation of unstable pelvic fractures a systematic review and meta-analysis.pdf',
    copies: ['Cadera y Pelvis']
  },
  {
    old: 'Osseous_fixation_pathways_in_pelvic_and_acetabular_fracture_surgery__Osteology__radiology__and_clinical_applicationsOsseous_fixation_pathways_in_pelvic_and_acetabular_fracture_su.pdf',
    new: '2012 - Bishop, Julius A. - Osseous fixation pathways in pelvic and acetabular fracture surgery.pdf',
    copies: ['Cadera y Pelvis']
  },
  {
    old: 'Simple_Anterior_Pelvic_External_Fixation.pdf',
    new: '2000 - Tucker, Michael C. - Simple Anterior Pelvic External Fixation.pdf',
    copies: ['Cadera y Pelvis']
  },
  {
    old: 'Special_screw_corridors_and_imaging_in_pelvic_ring_trauma.pdf',
    new: '2025 - Gänsslen, Axel - Special screw corridors and imaging in pelvic ring trauma.pdf',
    copies: ['Cadera y Pelvis']
  },
  {
    old: 'Supraacetabular_external_fixation_MHH.pdf',
    new: '2005 - Gänsslen, Axel - Der einfache supraazetabuläre Fixateur externe für die Behandlung von Beckenfrakturen.pdf',
    copies: ['Cadera y Pelvis']
  },
  {
    old: 'The_iliac_pillar___Definition_of_an_osseous_fixation_pathway_for_internal_and_external_fixation.pdf',
    new: '2020 - von Glinski, Alexander - The iliac pillar Definition of an osseous fixation pathway for internal and external fixation.pdf',
    copies: ['Cadera y Pelvis']
  },
  {
    old: 'The_Subcristal_Pelvic_External_Fixator__Technique__Results__and_Rationale.pdf',
    new: '2009 - Solomon, Lucian B. - The Subcristal Pelvic External Fixator Technique, Results, and Rationale.pdf',
    copies: ['Cadera y Pelvis']
  },
  {
    old: 'The_T_pod_is_as_stable_as_supraacetabular_fxation_using_1_or_2_Schanz_screws_in_partially_unstable_pelvic_fractures__a_biomechanical_study.pdf',
    new: '2020 - Zeckey, Christian - The T-pod is as stable as supraacetabular fixation in partially unstable pelvic fractures.pdf',
    copies: ['Cadera y Pelvis']
  }
];

async function execute() {
  console.log('=== INICIANDO EJECUCIÓN AO CURSO BASICO / ARTICULOS ===');

  // Mover duplicados a Música
  for (const dup of duplicatesToMove) {
    const srcPath = path.join(FOLDER, dup.oldName);
    const destPath = path.join(MUSIC_DEST, dup.backupName);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      fs.unlinkSync(srcPath);
      console.log(`[DUPLICADO MOVIDO A MÚSICA] ${dup.oldName} -> ${destPath}`);
    } else {
      console.log(`[DUPLICADO YA MOVIDO/NO ENCONTRADO] ${dup.oldName}`);
    }
  }

  let renamed = 0;
  let copied = 0;

  for (const op of operations) {
    const srcPath = path.join(FOLDER, op.old);
    const destPath = path.join(FOLDER, op.new);

    if (!fs.existsSync(srcPath)) {
      if (fs.existsSync(destPath)) {
        console.log(`[YA RENOMBRADO] ${op.new}`);
      } else {
        console.error(`[NO ENCONTRADO] ${op.old}`);
        continue;
      }
    } else {
      if (srcPath !== destPath) {
        fs.renameSync(srcPath, destPath);
        console.log(`[RENOMBRADO] ${op.old} -> ${op.new}`);
        renamed++;
      }
    }

    const hash = computeSha256(destPath);
    globalRegistry.hashes[hash] = {
      path: path.relative(ROOT, destPath),
      canonicalName: op.new,
      folder: 'AO Curso Basico/Articulos'
    };

    if (op.copies && op.copies.length > 0) {
      for (const targetFolder of op.copies) {
        const targetDir = path.join(ROOT, targetFolder);
        if (fs.existsSync(targetDir)) {
          const copyPath = path.join(targetDir, op.new);
          if (!fs.existsSync(copyPath)) {
            fs.copyFileSync(destPath, copyPath);
            console.log(`  -> [COPIA MULTI-TÓPICO] Creada en ${targetFolder}/${op.new}`);
            copied++;
          } else {
            console.log(`  -> [COPIA MULTI-TÓPICO YA EXISTE] en ${targetFolder}`);
          }
        } else {
          console.warn(`  -> [ALERTA] Carpeta destino ${targetFolder} no existe`);
        }
      }
    }
  }

  saveGlobalRegistry(globalRegistry);
  console.log(`=== AO CURSO BÁSICO / ARTÍCULOS FINALIZADO: ${renamed} renombrados, 1 duplicado movido a Música, ${copied} copias multi-tópico creadas ===`);
}

execute();
