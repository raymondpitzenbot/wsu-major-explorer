const axios = require('axios');
const fs = require('fs');
const path = require('path');

const RMP_GRAPHQL_URL = 'https://www.ratemyprofessors.com/graphql';
const DATA_PATH = path.join(__dirname, '..', 'data', 'professors_data.json');
const TARGET_DEPT = 'counselor_education_dept';
const LEGACY_IDS = ['2329952', '2880698', '2707243'];

async function getProfessorData(legacyId) {
    const globalId = Buffer.from(`Teacher-${legacyId}`).toString('base64');
    const query = `
        query TeacherInfo($id: ID!) {
            node(id: $id) {
                ... on Teacher {
                    firstName
                    lastName
                    avgRating
                    numRatings
                    wouldTakeAgainPercent
                    department
                }
            }
        }
    `;

    try {
        const response = await axios.post(RMP_GRAPHQL_URL, {
            query,
            variables: { id: globalId }
        }, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0',
                'Authorization': 'Basic dGVzdDp0ZXN0'
            }
        });

        const teacher = response.data?.data?.node;
        if (teacher) {
            return {
                name: `${teacher.firstName} ${teacher.lastName}`,
                // Generic title if unknown, or maybe parse department?
                title: "Professor", // Default
                rmp_id: parseInt(legacyId),
                avg_rating: teacher.avgRating || 0,
                num_ratings: teacher.numRatings || 0,
                would_take_again_percent: teacher.wouldTakeAgainPercent ?? -1,
                rmp_url: `https://www.ratemyprofessors.com/professor/${legacyId}`
            };
        }
    } catch (e) {
        console.error(`Failed to fetch ${legacyId}: ${e.message}`);
    }
    return null;
}

(async () => {
    console.log(`Fetching data for ${TARGET_DEPT}...`);
    const newProfs = [];

    for (const id of LEGACY_IDS) {
        process.stdout.write(`   Fetching ID ${id}... `);
        const prof = await getProfessorData(id);
        if (prof) {
            console.log(`✅ Found ${prof.name} (${prof.numRatings} ratings)`);
            newProfs.push(prof);
        } else {
            console.log(`❌ Not found`);
        }
        // small delay
        await new Promise(r => setTimeout(r, 200));
    }

    if (newProfs.length > 0) {
        // Read file
        if (fs.existsSync(DATA_PATH)) {
            const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

            // Replace department data
            data[TARGET_DEPT] = newProfs;

            fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
            console.log(`\nUpdated ${TARGET_DEPT} with ${newProfs.length} professors.`);
        } else {
            console.error("Data file not found.");
        }
    }
})();
