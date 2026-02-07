const axios = require('axios');
const fs = require('fs');
const path = require('path');

const RMP_GRAPHQL_URL = 'https://www.ratemyprofessors.com/graphql';
const WSU_SCHOOL_ID = '1214'; // Winona State
const DATA_PATH = path.join(__dirname, '..', 'data', 'professors_data.json');
const PROF_NAME = "Dillon Martinez";
const PROF_TITLE = "Assistant Professor"; // Assuming title, or just "Faculty" if unsure
const DEPT_ID = "physical_education_and_sport_science_dept";

async function searchRMP(name) {
    console.log(`Searching RMP for "${name}" in School ${WSU_SCHOOL_ID}...`);
    const query = `
        query NewSearchTeachersQuery($text: String!, $schoolID: ID!) {
            newSearch {
                teachers(query: {text: $text, schoolID: $schoolID}) {
                    edges {
                        node {
                            legacyId
                            firstName
                            lastName
                            department
                            avgRating
                            numRatings
                            wouldTakeAgainPercent
                        }
                    }
                }
            }
        }
    `;
    try {
        const response = await axios.post(RMP_GRAPHQL_URL, {
            query,
            variables: { text: name, schoolID: btoa(`School-${WSU_SCHOOL_ID}`) }
        }, {
            headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' }
        });

        const edges = response.data?.data?.newSearch?.teachers?.edges || [];
        if (edges.length > 0) return edges[0].node;
        return null;
    } catch (e) {
        console.error(e.message);
        return null;
    }
}

(async () => {
    // 1. Fetch RMP Data
    const rmpData = await searchRMP(PROF_NAME);

    // 2. Construct Professor Object
    const newProf = {
        name: PROF_NAME,
        title: PROF_TITLE,
    };

    if (rmpData) {
        console.log(`Found RMP data: ID ${rmpData.legacyId}, Rating ${rmpData.avgRating}`);
        newProf.rmp_id = rmpData.legacyId;
        newProf.avg_rating = rmpData.avgRating;
        newProf.num_ratings = rmpData.numRatings;
        newProf.would_take_again_percent = rmpData.wouldTakeAgainPercent;
        newProf.rmp_url = `https://www.ratemyprofessors.com/professor/${rmpData.legacyId}`;
    } else {
        console.log("No RMP data found. Adding without ratings.");
    }

    // 3. Update File
    if (fs.existsSync(DATA_PATH)) {
        const data = require(DATA_PATH);
        if (!data[DEPT_ID]) data[DEPT_ID] = [];

        // Remove duplicate if exists
        data[DEPT_ID] = data[DEPT_ID].filter(p => p.name !== PROF_NAME);

        // Add new
        data[DEPT_ID].push(newProf);

        fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
        console.log(`✅ Added ${PROF_NAME} to ${DEPT_ID}`);
    } else {
        console.error("Data file not found.");
    }

})();
