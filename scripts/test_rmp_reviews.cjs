const axios = require('axios');

const RMP_GRAPHQL_URL = 'https://www.ratemyprofessors.com/graphql';
const LEGACY_ID = '3048580'; // Dillon Martinez

async function getReviews(legacyId) {
    // Use Buffer for base64 (reliable in Node)
    const globalId = Buffer.from(`Teacher-${legacyId}`).toString('base64');
    console.log(`Global ID: ${globalId} (from Teacher-${legacyId})`);

    const query = `
        query TeacherReviews($id: ID!) {
            node(id: $id) {
                ... on Teacher {
                    id
                    firstName
                    lastName
                    ratings(first: 20) {
                        edges {
                            node {
                                class
                                comment
                                difficultyRating
                                qualityRating
                            }
                        }
                    }
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
                'Authorization': 'Basic dGVzdDp0ZXN0' // Sometimes needed? Or check new headers
            }
        });

        // Log deep structure to debug
        // console.log(JSON.stringify(response.data, null, 2));

        const teacher = response.data?.data?.node;
        if (teacher) {
            console.log(`Teacher: ${teacher.firstName} ${teacher.lastName}`);
            const courses = new Set();
            teacher.ratings.edges.forEach(e => {
                if (e.node.class) courses.add(e.node.class);
            });
            console.log("Courses:", [...courses]);
        } else {
            console.log("Teacher node not found.");
            if (response.data.errors) console.error("GraphQL Errors:", response.data.errors);
        }
    } catch (e) {
        console.error("AXIOS ERROR:", e.message);
        if (e.response) console.error(e.response.data);
    }
}

getReviews(LEGACY_ID);
