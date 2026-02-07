const axios = require('axios');
const fs = require('fs');
const path = require('path');

const RMP_GRAPHQL_URL = 'https://www.ratemyprofessors.com/graphql';
const WSU_SCHOOL_ID = '1214';
const DATA_PATH = path.join(__dirname, '..', 'data', 'professors_data.json');

const OVERRIDES = {
    "Scott Chiu": "Chiu Che-Wei"
};

async function searchRMP(name) {
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
    try {
        const response = await axios.post(RMP_GRAPHQL_URL, {
            query,
            variables: { text: name, schoolID: btoa(`School-${WSU_SCHOOL_ID}`) }
        }, {
            headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' }
        });
        const teachers = response.data?.data?.newSearch?.teachers?.edges || [];
        return teachers.length > 0 ? teachers[0].node : null;
    } catch (e) { return null; }
}

async function patch() {
    if (!fs.existsSync(DATA_PATH)) return;
    const data = require(DATA_PATH);
    let patched = 0;

    for (const [dept, profs] of Object.entries(data)) {
        for (let i = 0; i < profs.length; i++) {
            const prof = profs[i];
            if (OVERRIDES[prof.name]) {
                console.log(`Patching ${prof.name} (searching alias "${OVERRIDES[prof.name]}")...`);
                const rmpNode = await searchRMP(OVERRIDES[prof.name]);
                if (rmpNode) {
                    profs[i] = {
                        ...prof,
                        rmp_id: rmpNode.legacyId,
                        avg_rating: rmpNode.avgRating,
                        num_ratings: rmpNode.numRatings,
                        would_take_again_percent: rmpNode.wouldTakeAgainPercent,
                        rmp_url: `https://www.ratemyprofessors.com/professor/${rmpNode.legacyId}`
                    };
                    console.log(`✅ Patched ${prof.name} -> ID ${rmpNode.legacyId}`);
                    patched++;
                } else {
                    console.log(`❌ Could not find alias "${OVERRIDES[prof.name]}" in RMP.`);
                }
            }
        }
    }

    if (patched > 0) {
        fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
        console.log(`Saved ${patched} patches.`);
    }
}

patch();
