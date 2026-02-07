/**
 * Remap professor data to match wsuData.ts department IDs
 */

const fs = require('fs');
const path = require('path');

const profData = require('../data/professors_data.json');

// Mapping from catalog department names to wsuData.ts department IDs
const DEPT_ID_MAPPING = {
    // Direct matches (these 4 already work)
    'marketing_dept': 'marketing_dept',
    'physical_education_and_sport_science_dept': 'physical_education_and_sport_science_dept',
    'special_education_dept': 'special_education_dept',
    'theatre_and_dance_dept': 'theatre_and_dance_dept',

    // Remappings needed
    'accounting_dept': 'accounting_dept',
    'art_and_design_dept': 'art_and_design_dept',
    'biology_dept': 'biology_dept',
    'business_administration_dept': 'business_administration_dept',
    'chemistry_dept': 'chemistry_dept',
    'communication_studies_dept': 'communication_studies_dept',
    'computer_science_dept': 'computer_science_dept',
    'counselor_education_dept': 'counselor_education_dept',
    'early_childhood_and_elementary_education_dept': 'early_childhood_and_elementary_education_dept',
    'economics_dept': 'economics_dept',
    'education_studies_dept': 'education_studies_dept',
    'english_dept': 'english_dept',
    'finance_dept': 'finance_dept',
    'global_studies_and_world_languages_dept': 'global_studies_and_world_languages_dept',
    'health_exercise_and_rehabilitative_sciences_dept': 'health_exercise_and_rehabilitative_sciences_dept',
    'leadership_education_dept': 'leadership_education_dept',
    'mass_communication_dept': 'mass_communication_dept',
    'mathematics_and_statistics_dept': 'mathematics_and_statistics_dept',
    'music_dept': 'music_dept',
    'nursing_dept': 'nursing_dept',
    'philosophy_dept': 'philosophy_dept',
    'physics_dept': 'physics_dept',
    'psychology_dept': 'psychology_dept',
    'recreation_tourism_and_therapeutic_recreation_dept': 'recreation_tourism_and_therapeutic_recreation_dept',
    'social_work_dept': 'social_work_dept',

    // Catalog has separate, but wsuData has combined
    'history_dept': 'history_and_legal_studies_dept',
    'legal_studies_dept': 'history_and_legal_studies_dept',
    'sociology_dept': 'sociology_and_criminal_justice_dept',
    'criminal_justice_dept': 'sociology_and_criminal_justice_dept',
    'geoscience_dept': 'geoscience_dept',

    // Catalog-only departments (not in wsuData - skip these)
    'library_science_dept': null,
    'arts_administration_dept': null,
    'business_education_dept': null,
    'rochester_education_dept': null,
    'ethnic_studies_dept': null,
    'geography_dept': null,
    'sustainability_dept': null,
    'womens_gender_and_sexuality_studies_dept': null,
    'social_sciencehistory_secondary_social_studies_teaching_dept': null,
    'composite_materials_engineering_dept': 'composite_materials_engineering_dept',
    'political_science_public_administration_and_ethnic_studies_dept': 'political_science_public_administration_and_ethnic_studies_dept',
};

// Remap
const remappedData = {};

for (const [oldId, newId] of Object.entries(DEPT_ID_MAPPING)) {
    if (newId && profData[oldId]) {
        if (!remappedData[newId]) {
            remappedData[newId] = profData[oldId];
        } else {
            // Merge if department already exists (e.g., history + legal studies)
            remappedData[newId] = [...remappedData[newId], ...profData[oldId]];
        }
    }
}

// Save
const outputPath = path.join(__dirname, '..', 'data', 'professors_data.json');
fs.writeFileSync(outputPath, JSON.stringify(remappedData, null, 2));

console.log(`✅ Remapped professor data!`);
console.log(`   Original: ${Object.keys(profData).length} departments`);
console.log(`   Remapped to match wsuData: ${Object.keys(remappedData).length} departments`);
console.log(`   Saved to: ${outputPath}`);
