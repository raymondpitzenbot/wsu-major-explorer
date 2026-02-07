const fs = require('fs');
const path = require('path');

const SOURCE_PATH = path.join(__dirname, '..', 'data', 'professor_courses_full.json');
const DEST_PATH = path.join(__dirname, '..', 'data', 'professors_data.json');

// Department Mapping: RMP String -> WSU Key
const DEPT_MAP = {
    "Accounting": "accounting_dept",
    "Advertising": "mass_communication_dept",
    "Art": "art_and_design_dept",
    "Art History": "art_and_design_dept",
    "Design": "art_and_design_dept",
    "Fine Arts": "art_and_design_dept",
    "Graphic Arts": "art_and_design_dept",
    "Biology": "biology_dept",
    "Business": "business_administration_dept",
    "Management": "business_administration_dept",
    "Managerial Science": "business_administration_dept",
    "Marketing": "marketing_dept",
    "Finance": "finance_dept",
    "Chemistry": "chemistry_dept",
    "Child & Adolescent Studies": "child_advocacy_studies_dept",
    "Child  Adolescent Studies": "child_advocacy_studies_dept",
    "Communication": "communication_studies_dept",
    "COMMUNICATION": "communication_studies_dept",
    "Mass Communication": "mass_communication_dept",
    "Journalism": "mass_communication_dept",
    "Film": "mass_communication_dept",
    "Computer Science": "computer_science_dept",
    "Information Science": "computer_science_dept",
    "Criminal Justice": "sociology_and_criminal_justice_dept",
    "Sociology": "sociology_and_criminal_justice_dept",
    "Economics": "economics_dept",
    "Education": "education_studies_dept",
    "Special Education": "special_education_dept",
    "English": "english_dept",
    "Literature": "english_dept",
    "Humanities": "english_dept",
    "Geoscience": "geoscience_dept",
    "Geosciences": "geoscience_dept",
    "Geology": "geoscience_dept",
    "Geography": "geoscience_dept",
    "Global Studies": "global_studies_and_world_languages_dept",
    "International Studies": "global_studies_and_world_languages_dept",
    "Languages": "global_studies_and_world_languages_dept",
    "Foreign Languages": "global_studies_and_world_languages_dept",
    "World Languages": "global_studies_and_world_languages_dept",
    "History": "history_and_legal_studies_dept",
    "Legal Studies": "history_and_legal_studies_dept",
    "Political Science": "political_science_public_administration_and_ethnic_studies_dept",
    "Ethnic Studies": "political_science_public_administration_and_ethnic_studies_dept",
    "Social Science": "political_science_public_administration_and_ethnic_studies_dept",
    "Psychology": "psychology_dept",
    "Recreation": "recreation_tourism_and_therapeutic_recreation_dept",
    "Tourism": "recreation_tourism_and_therapeutic_recreation_dept",
    "Recreation  Tourism": "recreation_tourism_and_therapeutic_recreation_dept",
    "Recreation & Tourism": "recreation_tourism_and_therapeutic_recreation_dept",
    "Physical Education": "physical_education_and_sport_science_dept",
    "Physical Ed": "physical_education_and_sport_science_dept",
    "Kinesiology": "physical_education_and_sport_science_dept",
    "Sport Science": "physical_education_and_sport_science_dept",
    "Physics": "physics_dept",
    "Mathematics": "mathematics_and_statistics_dept",
    "Statistics": "mathematics_and_statistics_dept",
    "Music": "music_dept",
    "Nursing": "nursing_dept",
    "Health Science": "nursing_dept",
    "Philosophy": "philosophy_dept",
    "Theatre": "theatre_and_dance_dept",
    "Theater": "theatre_and_dance_dept",
    "Dance": "theatre_and_dance_dept",
    "Social Work": "social_work_dept",
    "Science": "biology_dept",
    "Engineering": "composite_materials_engineering_dept",
};

// Professor Aliases (Correcting RMP data in flight)
const PROF_ALIASES = {
    "1922449": "Chiu Che-Wei" // Correct name for Scott Chiu in RMP
};

const PROF_DEPT_OVERRIDES = {
    "2329952": "counselor_education_dept",
    "2880698": "counselor_education_dept",
    "2707243": "counselor_education_dept",
};

// Filter Lists
const EXCLUDE_PROFS = [
    "893426", // Kristin Holtan (Admin Assistant)
    "197657", // Michael Brennan
    "2054107", // Joe Allar
];

const EXCLUDE_TITLES = [
    "Administrative Assistant",
];

function run() {
    if (!fs.existsSync(SOURCE_PATH)) {
        console.error("Source file missing.");
        return;
    }

    const allProfs = JSON.parse(fs.readFileSync(SOURCE_PATH, 'utf8'));
    const newData = {};

    // Initialize departments with empty arrays to keep structure?
    // Or just populate dynamically.
    // Better to keep structure if possible, but we overwrite departmental lists.

    let count = 0;
    let excluded = 0;
    let unmapped = 0;

    allProfs.forEach(p => {
        const idStr = String(p.legacyId);

        // Filter by ID
        if (EXCLUDE_PROFS.includes(idStr)) {
            excluded++;
            return;
        }

        // Apply Aliases (e.g. Scott Chiu -> Chiu Che-Wei)
        let profName = p.name;
        if (PROF_ALIASES[idStr]) {
            profName = PROF_ALIASES[idStr];
        }

        // Map Department
        let mappedDept = PROF_DEPT_OVERRIDES[idStr] || DEPT_MAP[p.department];
        if (!mappedDept) {
            unmapped++;
            return;
        }

        if (!newData[mappedDept]) {
            newData[mappedDept] = [];
        }

        // Transform to Application Format
        const newEntry = {
            name: profName,
            title: "Professor", // Default
            rmp_id: p.legacyId,
            avg_rating: p.avg_rating || p.avgRating || 0,
            num_ratings: p.num_ratings || p.numRatings || 0,
            would_take_again_percent: -1,
            rmp_url: `https://www.ratemyprofessors.com/professor/${p.legacyId}`,
            courses_taught: p.courses || []
        };

        // Check `professor_courses_full.json` structure from Step 1574 view.
        // It has: name, legacyId, avgRating, numRatings, department, courses.
        // It DOES NOT HAVE `wouldTakeAgainPercent`?
        // Step 1574 view shows lines 1-800.
        // Lines 3-10: name, legacyId, avgRating, numRatings, department.
        // `wouldTakeAgainPercent` IS MISSING in `professor_courses_full.json`!!!

        // However, `rmp_wsu_master_list.json` HAD IT (Step 1516).
        // My `build_course_graph` script (Step 1519) constructing `entry`:
        // const entry = { name, legacyId, avgRating, numRatings, department, courses }.
        // I FORGOT TO INCLUDE `wouldTakeAgainPercent` in `build_course_graph.cjs`!!!

        // CRITICAL OVERSIGHT.
        // But I can recover it from `rmp_wsu_master_list.json` by matching legacyId!

        newData[mappedDept].push(newEntry);
        count++;
    });

    // Summary of Unmapped
    const unmappedSet = new Set();
    allProfs.forEach(p => {
        if (!DEPT_MAP[p.department]) unmappedSet.add(p.department);
    });
    console.log("Unmapped Departments:", [...unmappedSet].sort());

    // Now Restore `wouldTakeAgainPercent` from Master List
    const masterList = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'rmp_wsu_master_list.json'), 'utf8'));
    const wtaMap = new Map();
    masterList.forEach(m => wtaMap.set(m.legacyId, m.wouldTakeAgainPercent));

    for (const dept in newData) {
        newData[dept].forEach(p => {
            const wta = wtaMap.get(p.rmp_id);
            if (wta !== undefined) p.would_take_again_percent = wta;
        });
    }

    // Save
    fs.writeFileSync(DEST_PATH, JSON.stringify(newData, null, 2));
    console.log(`\n✅ Repopulated professors_data.json with ${count} professors.`);
    console.log(`Excluded: ${excluded}`);
    console.log(`Unmapped Departments: ${unmapped}`);
}

run();
