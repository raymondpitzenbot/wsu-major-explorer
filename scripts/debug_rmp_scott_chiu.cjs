const axios = require('axios');

const RMP_GRAPHQL_URL = 'https://www.ratemyprofessors.com/graphql';

async function searchRMP(name, schoolId) {
    console.log(`Searching for "${name}" in School ID ${schoolId}...`);
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
                        }
                    }
                }
            }
        }
    `;
    try {
        const response = await axios.post(RMP_GRAPHQL_URL, {
            query,
            variables: { text: name, schoolID: btoa(`School-${schoolId}`) }
        }, {
            headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' }
        });

        const edges = response.data?.data?.newSearch?.teachers?.edges || [];
        edges.forEach(edge => {
            const p = edge.node;
            console.log(` - Found: ${p.firstName} ${p.lastName} (ID: ${p.legacyId}) - Dept: ${p.department} - Rating: ${p.avgRating} (${p.numRatings} reviews)`);
            console.log(`   URL: https://www.ratemyprofessors.com/professor/${p.legacyId}`);
        });

        if (edges.length === 0) console.log(" - No results found.");

    } catch (err) {
        console.error("Error:", err.message);
    }
}

(async () => {
    await searchRMP("Scott Chiu", "1214"); // New Correct ID
    console.log("---");
    await searchRMP("Scott Chiu", "1515"); // Old Incorrect ID
})();
