/**
 * SMART MERGE & ENRICHMENT SCRIPT
 * 1. Checks current scraped data
 * 2. Identifies missing/low-count departments
 * 3. Uses manual professor list for those departments
 * 4. Fetches RMP data for those manual professors
 * 5. Merges everything into a complete dataset
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const RMP_GRAPHQL_URL = 'https://www.ratemyprofessors.com/graphql';
const WSU_SCHOOL_ID = '1214';
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: RMP Search
async function searchRateMyProfessor(professorName) {
    try {
        const query = `
            query NewSearchTeachersQuery($text: String!, $schoolID: ID!) {
                newSearch {
                    teachers(query: {text: $text, schoolID: $schoolID}) {
                        edges {
                            node {
                                legacyId
                                firstName
                                lastName
                                avgRating
                                numRatings
                                wouldTakeAgainPercent
                            }
                        }
                    }
                }
            }
        `;
        const response = await axios.post(RMP_GRAPHQL_URL, {
            query,
            variables: { text: professorName, schoolID: btoa(`School-${WSU_SCHOOL_ID}`) }
        }, {
            headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' }
        });

        const teachers = response.data?.data?.newSearch?.teachers?.edges || [];
        if (teachers.length > 0) {
            const p = teachers[0].node;
            return {
                rmp_id: p.legacyId,
                avg_rating: p.avgRating,
                num_ratings: p.numRatings,
                would_take_again_percent: p.wouldTakeAgainPercent,
                rmp_url: `https://www.ratemyprofessors.com/professor/${p.legacyId}`
            };
        }
        return null;
    } catch (error) { return null; }
}

// Manual backup list for departments that failed scraping
const MANUAL_BACKUP = {
    // Critical (from earlier steps)
    'computer_science_dept': [
        { name: 'Mingrui Zhang', title: 'Department Chair, Professor' },
        { name: 'Gerald Cichanowski', title: 'Professor' },
        { name: 'Chi-Cheng Lin', title: 'Professor' },
    ],
    'nursing_dept': [
        { name: 'Kimberly Langer', title: 'Professor' },
        { name: 'Sandra Paddock', title: 'Professor' },
        { name: 'Amy Reitmaier', title: 'Department Chair, Professor' },
    ],
    'mathematics_and_statistics_dept': [
        { name: 'Christopher Malone', title: 'Department Chair, Professor' },
        { name: 'Silas Bergen', title: 'Professor' },
        { name: 'April Kerby-Helm', title: 'Professor' },
    ],
    'history_and_legal_studies_dept': [
        { name: 'Matthew Lungerhausen', title: 'Department Chair, Professor' },
        { name: 'Juandrea Bates', title: 'Professor' },
        { name: 'Matthew Lindaman', title: 'Professor' },
    ],
    'business_administration_dept': [
        { name: 'Kubilay Gok', title: 'Department Chair, Professor' },
        { name: 'Jing Han', title: 'Professor' },
        { name: 'Hamid Yeganeh', title: 'Professor' },
    ],
    'music_dept': [
        { name: 'Daniel Sheridan', title: 'Department Chair' },
        { name: 'Alan Dunbar', title: 'Professor' },
        { name: 'Gregory Neidhart', title: 'Professor' },
    ],
    'early_childhood_and_elementary_education_dept': [
        { name: 'Danielle Schock', title: 'Department Chair' },
        { name: 'Mary Anderson', title: 'Professor' },
        { name: 'Joan Sax-Bendix', title: 'Professor' },
    ],
    // Departments that might have scraped poorly (1 prof)
    'chemistry_dept': [
        { name: 'Sara M. Hein', title: 'Department Chair' },
        { name: 'Mark A. Engen', title: 'Professor' },
        { name: 'Jeanne L. Franz', title: 'Professor' },
    ],
    'education_studies_dept': [
        { name: 'Charissa Threat', title: 'Director' },
        { name: 'Tania Allen', title: 'Faculty' },
    ],
    'leadership_education_dept': [
        { name: 'Barbara Holmes', title: 'Faculty' },
        { name: 'Denise McDowell', title: 'Faculty' },
    ],
    'child_advocacy_studies_dept': [
        { name: 'Emily Neubauer', title: 'Program Director' },
        { name: 'Ruth Charles', title: 'Faculty' },
    ],
    'political_science_public_administration_and_ethnic_studies_dept': [
        { name: 'Joseph Anderson', title: 'Department Chair' },
        { name: 'Diane Schaubman', title: 'Professor' },
    ],
    'geoscience_dept': [
        { name: 'Brent Dalzell', title: 'Department Chair' },
        { name: 'Colleen Stockwell', title: 'Professor' },
    ],
    'composite_materials_engineering_dept': [
        { name: 'Joe Fedie', title: 'Program Director' },
        { name: 'Craig Bowman', title: 'Faculty' },
    ],
    // 'physical_education_and_sport_science_dept': [
    //    { name: 'Michael Brennan', title: 'Department Chair' },
    //    { name: 'Joe Allar', title: 'Faculty' },
    // ],
    'recreation_tourism_and_therapeutic_recreation_dept': [
        { name: 'Lynn Jahnke', title: 'Program Director' },
        { name: 'Susan Prudhomme', title: 'Faculty' },
    ]
};

async function enrichAndMerge() {
    const currentPath = path.join(__dirname, '..', 'data', 'professors_data.json');
    let currentData = {};

    if (fs.existsSync(currentPath)) {
        currentData = require(currentPath);
    }

    console.log('🚀 Enriching missing departments with RMP data...\n');

    // Check coverage
    for (const [deptId, manualProfs] of Object.entries(MANUAL_BACKUP)) {
        // If we already have 2+ scraped professors, skip
        // if (currentData[deptId] && currentData[deptId].length >= 2) {
        //     console.log(`✅ ${deptId}: Already has ${currentData[deptId].length} professors. Skipping.`);
        //     continue;
        // }

        console.log(`🔄 Enriching ${deptId} (${manualProfs.length} professors)...`);

        const enrichedProfs = [];

        // Search RMP for each manual professor
        for (const prof of manualProfs) {
            await delay(300); // Rate limit
            process.stdout.write(`   Searching ${prof.name}... `);

            const rmpData = await searchRateMyProfessor(prof.name);

            if (rmpData) {
                console.log(`FOUND ⭐ ${rmpData.avg_rating}`);
                enrichedProfs.push({ ...prof, ...rmpData });
            } else {
                console.log('No RMP data');
                enrichedProfs.push(prof); // Keep even if no RMP
            }
        }

        // Sort by rating
        enrichedProfs.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));

        // Save to data
        currentData[deptId] = enrichedProfs;
    }

    // Save updated file
    fs.writeFileSync(currentPath, JSON.stringify(currentData, null, 2));

    console.log('\n✅ MERGE COMPLETE!');
    console.log(`Total Departments: ${Object.keys(currentData).length}`);
    console.log(`Saved to ${currentPath}`);
}

enrichAndMerge();
