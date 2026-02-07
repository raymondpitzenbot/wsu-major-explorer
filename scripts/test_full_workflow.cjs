/**
 * Quick test: Run scraper on just 2 departments to verify everything works
 */

const axios = require('axios');
const cheerio = require('cheerio');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testFullWorkflow() {
    console.log('🧪 Testing full workflow on 2 departments...\n');

    const departments = {
        'accounting_dept': 'https://www.winona.edu/accounting/faculty-staff.asp',
        'computer_science_dept': 'https://www.winona.edu/computerscience/faculty-staff.asp',
    };

    for (const [deptId, url] of Object.entries(departments)) {
        console.log(`\n📖 ${deptId}`);
        console.log(`   Scraping ${url}...`);

        try {
            // Scrape faculty
            const response = await axios.get(url, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            const $ = cheerio.load(response.data);
            const faculty = [];

            $('.contact-card').each((i, elem) => {
                const $card = $(elem);
                const name = $card.find('.contact-card__title').text().trim();
                const title = $card.find('.contact-card__subtitle').text().trim();

                if (name && title && title.match(/Professor|Instructor|Lecturer/i)) {
                    faculty.push({ name, title });
                }
            });

            console.log(`   Found ${faculty.length} professors\n`);

            // Search RMP for first 2
            for (const prof of faculty.slice(0, 2)) {
                console.log(`   🔍 ${prof.name}`);

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

                const rmpResponse = await axios.post('https://www.ratemyprofessors.com/graphql', {
                    query,
                    variables: {
                        text: prof.name,
                        schoolID: btoa('School-1214')
                    }
                }, {
                    headers: { 'Content-Type': 'application/json' }
                });

                const teachers = rmpResponse.data?.data?.newSearch?.teachers?.edges || [];
                if (teachers.length > 0) {
                    const p = teachers[0].node;
                    console.log(`      ⭐ ${p.avgRating}/5.0 · ${p.numRatings} reviews · ${p.wouldTakeAgainPercent}% would take again`);
                } else {
                    console.log(`      ❌ Not found on RMP`);
                }

                await delay(1500);
            }

        } catch (error) {
            console.error(`   ❌ Error: ${error.message}`);
        }

        await delay(2000);
    }

    console.log('\n✅ Test complete! Ready to run full scraper.\n');
}

testFullWorkflow();
