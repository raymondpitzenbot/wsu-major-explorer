const axios = require('axios');

const RMP_GRAPHQL_URL = 'https://www.ratemyprofessors.com/graphql';
const WSU_SCHOOL_ID = '1214'; // Winona State

async function searchRMP(deptName) {
    console.log(`Searching RMP for "${deptName}" in School ${WSU_SCHOOL_ID}...`);
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
            variables: { text: deptName, schoolID: btoa(`School-${WSU_SCHOOL_ID}`) }
        }, {
            headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' }
        });

        const teachers = response.data?.data?.newSearch?.teachers?.edges || [];
        teachers.forEach(t => {
            const p = t.node;
            console.log(`FOUND: ${p.firstName} ${p.lastName} (${p.department}) - ID: ${p.legacyId}`);
        });
        if (teachers.length === 0) console.log("No results.");
    } catch (e) { console.error(e.message); }
}

(async () => {
    await searchRMP("Physical Education");
    await searchRMP("Kinesiology");
    await searchRMP("Sport Science");
    await searchRMP("Recreation");
})();
