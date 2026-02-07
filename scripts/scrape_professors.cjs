/**
 * Scrape WSU Faculty and Rate My Professor Data
 * 
 * This script:
 * 1. Scrapes WSU faculty pages for each department
 * 2. Searches Rate My Professor for each faculty member
 * 3. Fetches their ratings and reviews
 * 4. Generates professors.json with the data
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Rate My Professor GraphQL endpoint (reverse-engineered)
const RMP_GRAPHQL_URL = 'https://www.ratemyprofessors.com/graphql';
const RMP_SEARCH_URL = 'https://www.ratemyprofessors.com/search/professors/1214'; // WSU school ID

// WSU department URLs mapped to department IDs
const DEPARTMENT_URLS = {
    'accounting_dept': 'https://www.winona.edu/accounting/faculty-staff.asp',
    'business_administration_dept': 'https://www.winona.edu/business/faculty-staff.asp',
    'economics_dept': 'https://www.winona.edu/economics/faculty-staff.asp',
    'finance_dept': 'https://www.winona.edu/finance/faculty-staff.asp',
    'marketing_dept': 'https://www.winona.edu/marketing/faculty-staff.asp',
    'art_and_design_dept': 'https://www.winona.edu/art/faculty-staff.asp',
    'communication_studies_dept': 'https://www.winona.edu/communicationstudies/faculty-staff.asp',
    'english_dept': 'https://www.winona.edu/english/faculty-staff.asp',
    'history_and_legal_studies_dept': 'https://www.winona.edu/history/faculty-staff.asp',
    'mass_communication_dept': 'https://www.winona.edu/masscomm/faculty-staff.asp',
    'psychology_dept': 'https://www.winona.edu/psychology/faculty-staff.asp',
    'computer_science_dept': 'https://www.winona.edu/computerscience/faculty-staff.asp',
    'mathematics_and_statistics_dept': 'https://www.winona.edu/mathematics/faculty-staff.asp',
    'nursing_dept': 'https://www.winona.edu/nursing/faculty-staff.asp',
};

// Delay helper to avoid rate limiting
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Search for a professor on Rate My Professor
 */
async function searchRateMyProfessor(professorName, schoolId = '1214') {
    try {
        console.log(`  Searching RMP for: ${professorName}...`);

        // Use the GraphQL API to search
        const query = {
            query: `query NewSearchTeachersQuery($text: String!, $schoolID: ID!) {
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
            }`,
            variables: {
                text: professorName,
                schoolID: btoa(`School-${schoolId}`) // Base64 encode school ID
            }
        };

        const response = await axios.post(RMP_GRAPHQL_URL, query, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic dGVzdDp0ZXN0', // Common public auth
            }
        });

        const teachers = response.data?.data?.newSearch?.teachers?.edges || [];

        if (teachers.length > 0) {
            const bestMatch = teachers[0].node; // Take the first result
            console.log(`    ✓ Found: ${bestMatch.firstName} ${bestMatch.lastName} (Rating: ${bestMatch.avgRating})`);
            return {
                rmp_id: bestMatch.legacyId,
                avg_rating: bestMatch.avgRating,
                avg_difficulty: bestMatch.avgDifficulty,
                num_ratings: bestMatch.numRatings,
                would_take_again_percent: bestMatch.wouldTakeAgainPercent,
                department: bestMatch.department,
                rmp_url: `https://www.ratemyprofessors.com/professor/${bestMatch.legacyId}`
            };
        } else {
            console.log(`    ✗ Not found on RMP`);
            return null;
        }
    } catch (error) {
        console.error(`    Error searching RMP for ${professorName}:`, error.message);
        return null;
    }
}

/**
 * Scrape faculty from a WSU department page
 */
async function scrapeDepartmentFaculty(departmentId, url) {
    try {
        console.log(`\nScraping ${departmentId} from ${url}...`);

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        const faculty = [];

        // WSU uses contact-card structure for faculty
        $('.contact-card').each((i, elem) => {
            const $card = $(elem);
            const name = $card.find('.contact-card__title').text().trim();
            const title = $card.find('.contact-card__subtitle').text().trim();
            const email = $card.find('.contact-card__link').attr('href') || '';

            // STRICT filter: Only include people with professor/instructor/lecturer titles
            // This excludes administrative assistants, staff, etc.
            if (name && title && title.match(/Professor|Instructor|Lecturer/i)) {
                faculty.push({
                    name: name,
                    title: title,
                    email: email.replace('mailto:', ''),
                    department_id: departmentId
                });
            }
        });

        // Fallback: Look for alternative structures if no contact cards found
        if (faculty.length === 0) {
            $('table tr').each((i, elem) => {
                const $row = $(elem);
                const name = $row.find('td').first().text().trim();
                const title = $row.find('td').eq(1).text().trim();

                if (name && title && title.match(/Professor|Instructor/i)) {
                    faculty.push({
                        name: name,
                        title: title,
                        department_id: departmentId
                    });
                }
            });
        }

        console.log(`  Found ${faculty.length} faculty members`);
        return faculty;

    } catch (error) {
        console.error(`Error scraping ${departmentId}:`, error.message);
        return [];
    }
}

/**
 * Main scraping function
 */
async function scrapeAllProfessors() {
    console.log('🎓 Starting WSU Professor Scraper...\n');

    const allProfessors = [];

    // Step 1: Scrape faculty from each department
    for (const [deptId, url] of Object.entries(DEPARTMENT_URLS)) {
        const faculty = await scrapeDepartmentFaculty(deptId, url);

        // Step 2: Search Rate My Professor for each faculty member
        for (const member of faculty) {
            await delay(1000); // 1 second delay to avoid rate limiting

            const rmpData = await searchRateMyProfessor(member.name);

            allProfessors.push({
                ...member,
                ...rmpData
            });
        }

        await delay(2000); // 2 second delay between departments
    }

    // Step 3: Save to JSON file
    const outputPath = path.join(__dirname, '..', 'data', 'professors.json');
    fs.writeFileSync(outputPath, JSON.stringify(allProfessors, null, 2));

    console.log(`\n✅ Scraping complete! Saved ${allProfessors.length} professors to ${outputPath}`);

    // Print summary
    const withRatings = allProfessors.filter(p => p.avg_rating).length;
    console.log(`   - ${withRatings} professors found on Rate My Professor`);
    console.log(`   - ${allProfessors.length - withRatings} professors not found on RMP`);
}

// Run the scraper
if (require.main === module) {
    scrapeAllProfessors().catch(console.error);
}

module.exports = { scrapeAllProfessors };
