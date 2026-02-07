/**
 * Test Rate My Professor GraphQL API
 * This script tests if we can successfully query RMP's GraphQL endpoint
 */

const axios = require('axios');

async function testRMPSearch() {
    console.log('🧪 Testing Rate My Professor API...\n');

    const query = `
        query NewSearchTeachersQuery($text: String!, $schoolID: ID!) {
            newSearch {
                teachers(query: {text: $text, schoolID: $schoolID}) {
                    edges {
                        node {
                            id
                            legacyId
                            firstName
                            lastName
                            school {
                                name
                                id
                            }
                            avgRating
                            avgDifficulty
                            numRatings
                            wouldTakeAgainPercent
                            department
                        }
                    }
                }
            }
        }
    `;

    // Test with a known professor name
    const testName = "Kim"; // Test with accounting professor from WSU

    try {
        // WSU School ID on RMP is 1214
        const schoolId = '1214';

        const response = await axios.post(
            'https://www.ratemyprofessors.com/graphql',
            {
                query: query,
                variables: {
                    text: testName,
                    schoolID: btoa(`School-${schoolId}`) // Base64 encode
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                }
            }
        );

        console.log('Response status:', response.status);
        console.log('\nFound professors:');

        const teachers = response.data?.data?.newSearch?.teachers?.edges || [];

        if (teachers.length > 0) {
            teachers.forEach((teacher, i) => {
                const p = teacher.node;
                console.log(`\n${i + 1}. ${p.firstName} ${p.lastName}`);
                console.log(`   Department: ${p.department}`);
                console.log(`   Rating: ${p.avgRating}/5.0 (${p.numRatings} ratings)`);
                console.log(`   Difficulty: ${p.avgDifficulty}/5.0`);
                console.log(`   Would Take Again: ${p.wouldTakeAgainPercent}%`);
                console.log(`   URL: https://www.ratemyprofessors.com/professor/${p.legacyId}`);
            });
            console.log(`\n✅ API test successful! Found ${teachers.length} professors.`);
        } else {
            console.log('\n⚠️  No professors found. API might have changed or requires authentication.');
        }

    } catch (error) {
        console.error('\n❌ Error testing RMP API:');
        console.error('Message:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testRMPSearch();
