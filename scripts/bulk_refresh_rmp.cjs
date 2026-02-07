/**
 * BULK REFRESH SCRIPT
 * Iterates through ALL professors in data/professors_data.json
 * re-fetches RMP data using School ID 1214 (Winona State University)
 * to ensure accuracy of ratings and review counts.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const RMP_GRAPHQL_URL = 'https://www.ratemyprofessors.com/graphql';
const WSU_SCHOOL_ID = '1214'; // The correct WSU ID
const DATA_PATH = path.join(__dirname, '..', 'data', 'professors_data.json');
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
            // Helper to clean name: remove titles, punctuation, single letters
            const cleanName = (str) => str.toLowerCase()
                .replace(/\b(dr|prof|professor|ph\.d|phd)\.?\b/g, '')
                .replace(/[.,]/g, '')
                .split(/\s+/)
                .filter(p => p.length > 1); // Remove initials

            const searchNameParts = cleanName(professorName);

            // Find best match
            const bestMatch = teachers.find(t => {
                const node = t.node;
                const rmpParts = cleanName(`${node.firstName} ${node.lastName}`);
                // Check if search parts are subset of RMP parts OR RMP parts are subset of search parts
                // Usually enough if Last Name matches and First Name (or nickname) matches
                // For safety: Last Name MUST match. At least one other part must match (if available)

                // Simple approach: Check if overlapping parts are sufficient
                const common = searchNameParts.filter(p => rmpParts.includes(p));
                return common.length >= Math.min(searchNameParts.length, rmpParts.length);
            });

            if (bestMatch) {
                const p = bestMatch.node;
                return {
                    rmp_id: p.legacyId,
                    avg_rating: p.avgRating,
                    num_ratings: p.numRatings,
                    would_take_again_percent: p.wouldTakeAgainPercent,
                    rmp_url: `https://www.ratemyprofessors.com/professor/${p.legacyId}`
                };
            }
        }
        return null; // Not found or no good match
    } catch (error) { return null; }
}

async function bulkRefresh() {
    if (!fs.existsSync(DATA_PATH)) {
        console.error('❌ Data file not found!');
        return;
    }

    const data = require(DATA_PATH);
    const updates = {};
    let updatedCount = 0;
    let totalCount = 0;

    console.log(`🚀 Starting Bulk Refresh for School ID ${WSU_SCHOOL_ID}...\n`);

    for (const [deptId, profs] of Object.entries(data)) {
        console.log(`📂 Processing ${deptId}...`);
        const updatedProfs = [];

        for (const prof of profs) {
            totalCount++;
            process.stdout.write(`   Refetching ${prof.name}... `);
            await delay(300); // Rate limit

            const newData = await searchRateMyProfessor(prof.name);

            if (newData) {
                // If found in 1214, use new data
                // Check if it's different
                if (newData.num_ratings !== prof.num_ratings || newData.avg_rating !== prof.avg_rating) {
                    process.stdout.write(`UPDATED! (⭐ ${prof.avg_rating} -> ${newData.avg_rating})\n`);
                    updatedProfs.push({ ...prof, ...newData });
                    updatedCount++;
                } else {
                    process.stdout.write(`Verified (Same)\n`);
                    updatedProfs.push(prof);
                }
            } else {
                // Not found in 1214? Keep old data or mark as not found?
                // If old data was from 1515 and valid, maybe keep it?
                // But user says "way off". If 1515 data is bad, maybe better to have NO data?
                // Let's Keep OLD data for now but log it.
                process.stdout.write(`Not found in 1214 (Keeping old)\n`);
                updatedProfs.push(prof);
            }
        }
        updates[deptId] = updatedProfs;
    }

    fs.writeFileSync(DATA_PATH, JSON.stringify(updates, null, 2));

    console.log('\n✅ BULK REFRESH COMPLETE!');
    console.log(`Processed: ${totalCount}`);
    console.log(`Updated: ${updatedCount}`);
}

bulkRefresh();
