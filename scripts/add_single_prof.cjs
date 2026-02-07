const axios = require('axios');
const fs = require('fs');
const path = require('path');

const RMP_GRAPHQL_URL = 'https://www.ratemyprofessors.com/graphql';
const DATA_PATH = path.join(__dirname, '..', 'data', 'professors_data.json');

// Configuration
const TARGET_DEPT = 'physical_education_and_sport_science_dept';
const LEGACY_ID = '1587804';

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
                title: "Professor", // Generic default
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
    console.log(`Fetching data for ID ${LEGACY_ID}...`);
    const newProf = await getProfessorData(LEGACY_ID);

    if (newProf) {
        console.log(`✅ Found ${newProf.name}`);

        if (fs.existsSync(DATA_PATH)) {
            const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

            if (!data[TARGET_DEPT]) {
                data[TARGET_DEPT] = [];
            }

            // Check if already exists to avoid duplicates
            const existingIndex = data[TARGET_DEPT].findIndex(p => p.rmp_id === newProf.rmp_id);

            if (existingIndex >= 0) {
                console.log("Update existing entry.");
                data[TARGET_DEPT][existingIndex] = newProf;
            } else {
                console.log("Appending new entry.");
                data[TARGET_DEPT].push(newProf);
            }

            fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
            console.log(`\nSuccess! ${TARGET_DEPT} now has ${data[TARGET_DEPT].length} professors.`);
        } else {
            console.error("Data file not found.");
        }
    } else {
        console.error("❌ Professor not found on RMP.");
    }
})();
