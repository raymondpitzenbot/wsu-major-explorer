/**
 * Manual RMP Overrides Script
 * Use this to manually add RateMyProfessor data for professors that automatic scraping misses.
 * 
 * Instructions:
 * 1. Find the professor's RateMyProfessor page
 * 2. Get their ID from the URL (e.g., ratemyprofessors.com/professor/2205862 -> ID is 2205862)
 * 3. Add their name and ID to the MANUAL_OVERRIDES object below
 * 4. Run this script: node scripts/update_professors_manual.cjs
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const RMP_GRAPHQL_URL = 'https://www.ratemyprofessors.com/graphql';

// Add manual IDs here when search fails
const MANUAL_OVERRIDES = {
    'Larry Schrenk': '2205862',
    // Add more here if you find other missing professors!
    // 'Professor Name': '1234567',
};

async function getRatingById(rmpId) {
    try {
        const query = `
            query TeacherRatingsPageQuery($id: ID!) {
                node(id: $id) {
                    ... on Teacher {
                        id
                        legacyId
                        firstName
                        lastName
                        avgRating
                        numRatings
                        wouldTakeAgainPercent
                    }
                }
            }
        `;

        const response = await axios.post(RMP_GRAPHQL_URL, {
            query,
            variables: { id: btoa(`Teacher-${rmpId}`) }
        }, {
            headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' }
        });

        const data = response.data?.data?.node;
        if (data) {
            return {
                rmp_id: data.legacyId,
                avg_rating: data.avgRating,
                num_ratings: data.numRatings,
                would_take_again_percent: data.wouldTakeAgainPercent,
                rmp_url: `https://www.ratemyprofessors.com/professor/${data.legacyId}`
            };
        }
        return null;
    } catch (error) { return null; }
}

async function applyOverrides() {
    const dataPath = path.join(__dirname, '..', 'data', 'professors_data.json');
    const professorData = require(dataPath);

    console.log('🔧 Appling Manual RMP Overrides...\n');

    for (const [name, rmpId] of Object.entries(MANUAL_OVERRIDES)) {
        // Find professor in data
        let found = false;

        for (const dept in professorData) {
            const profIndex = professorData[dept].findIndex(p => p.name === name || p.name.includes(name.split(' ').pop()));

            if (profIndex >= 0) {
                console.log(`Found ${name} in ${dept}. Updating...`);
                const ratingData = await getRatingById(rmpId);

                if (ratingData) {
                    professorData[dept][profIndex] = {
                        ...professorData[dept][profIndex],
                        ...ratingData
                    };
                    console.log(`✅ Updated ${name}: ${ratingData.avg_rating}/5.0`);
                    found = true;
                }
            }
        }

        if (!found) console.log(`⚠️ Could not find ${name} in current data`);
    }

    fs.writeFileSync(dataPath, JSON.stringify(professorData, null, 2));
    console.log('\n✅ Overrides Applied!');
}

applyOverrides();
