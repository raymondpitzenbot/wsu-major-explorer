/**
 * Complete Professor Scraper
 * 
 * This script:
 * 1. Scrapes WSU faculty pages for each department
 * 2. Searches Rate My Professor for each professor
 * 3. Maps professors to programs based on department
 * 4. Selects top 3-5 professors per program based on RMP ratings
 * 5. Generates professors_data.json
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Rate My Professor GraphQL endpoint
const RMP_GRAPHQL_URL = 'https://www.ratemyprofessors.com/graphql';
const WSU_SCHOOL_ID = '1214'; // Winona State University on RMP

// Delay helper to avoid rate limiting
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// WSU department URLs - mapped to department IDs from wsuData.ts
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
    'music_dept': 'https://www.winona.edu/music/faculty-staff.asp',
    'psychology_dept': 'https://www.winona.edu/psychology/faculty-staff.asp',
    'computer_science_dept': 'https://www.winona.edu/computerscience/faculty-staff.asp',
    'mathematics_and_statistics_dept': 'https://www.winona.edu/mathematics/faculty-staff.asp',
    'nursing_dept': 'https://www.winona.edu/nursing/faculty-staff.asp',
    'biology_dept': 'https://www.winona.edu/biology/faculty-staff.asp',
    'chemistry_dept': 'https://www.winona.edu/chemistry/faculty-staff.asp',
};

/**
 * Search for a professor on Rate My Professor using GraphQL API
 */
async function searchRateMyProfessor(professorName) {
    try {
        console.log(`    Searching RMP for: ${professorName}...`);

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

        const response = await axios.post(RMP_GRAPHQL_URL, {
            query: query,
            variables: {
                text: professorName,
                schoolID: btoa(`School-${WSU_SCHOOL_ID}`)
            }
        }, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
        });

        const teachers = response.data?.data?.newSearch?.teachers?.edges || [];

        if (teachers.length > 0) {
            const bestMatch = teachers[0].node;
            console.log(`      ✓ Found! Rating: ${bestMatch.avgRating}/5.0 (${bestMatch.numRatings} reviews)`);
            return {
                rmp_id: bestMatch.legacyId,
                avg_rating: bestMatch.avgRating,
                avg_difficulty: bestMatch.avgDifficulty,
                num_ratings: bestMatch.numRatings,
                would_take_again_percent: bestMatch.wouldTakeAgainPercent,
                rmp_department: bestMatch.department,
                rmp_url: `https://www.ratemyprofessors.com/professor/${bestMatch.legacyId}`
            };
        } else {
            console.log(`      ✗ Not found on RMP`);
            return null;
        }
    } catch (error) {
        console.error(`      Error searching RMP:`, error.message);
        return null;
    }
}

/**
 * Scrape faculty from a WSU department page
 */
async function scrapeDepartmentFaculty(departmentId, url) {
    try {
        console.log(`\n  Scraping ${departmentId}...`);

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

            // STRICT filter: Only professors/instructors/lecturers
            if (name && title && title.match(/Professor|Instructor|Lecturer/i)) {
                faculty.push({
                    name: name,
                    title: title,
                    email: email.replace('mailto:', ''),
                    department_id: departmentId
                });
            }
        });

        // Fallback for older page structures
        if (faculty.length === 0) {
            $('table tr').each((i, elem) => {
                const $row = $(elem);
                const name = $row.find('td').first().text().trim();
                const title = $row.find('td').eq(1).text().trim();

                if (name && title && title.match(/Professor|Instructor|Lecturer/i)) {
                    faculty.push({
                        name: name,
                        title: title,
                        department_id: departmentId
                    });
                }
            });
        }

        console.log(`    Found ${faculty.length} professors`);
        return faculty;

    } catch (error) {
        console.error(`    Error scraping ${departmentId}:`, error.message);
        return [];
    }
}

/**
 * Main scraping function
 */
async function scrapeAllProfessors() {
    console.log('🎓 Starting Complete WSU Professor Scraper...\n');
    console.log('This will scrape WSU faculty pages and Rate My Professor data.\n');

    const professorsByDepartment = {};
    let totalProfessors = 0;
    let professorsWithRatings = 0;

    // Step 1: Scrape all departments
    for (const [deptId, url] of Object.entries(DEPARTMENT_URLS)) {
        const faculty = await scrapeDepartmentFaculty(deptId, url);

        // Step 2: Search RMP for each professor
        const facultyWithRatings = [];
        for (const professor of faculty) {
            await delay(1500); // 1.5 second delay to avoid rate limiting

            const rmpData = await searchRateMyProfessor(professor.name);

            const professorData = {
                id: `${deptId}_${professor.name.toLowerCase().replace(/\s+/g, '_')}`,
                ...professor,
                ...rmpData
            };

            facultyWithRatings.push(professorData);
            totalProfessors++;

            if (rmpData) {
                professorsWithRatings++;
            }
        }

        // Sort by rating (highest first), then by number of ratings
        facultyWithRatings.sort((a, b) => {
            if (a.avg_rating && b.avg_rating) {
                if (b.avg_rating !== a.avg_rating) {
                    return b.avg_rating - a.avg_rating;
                }
                return (b.num_ratings || 0) - (a.num_ratings || 0);
            }
            if (a.avg_rating) return -1;
            if (b.avg_rating) return 1;
            return 0;
        });

        professorsByDepartment[deptId] = facultyWithRatings;

        await delay(2000); // 2 second delay between departments
    }

    // Step 3: Save to JSON file
    const outputPath = path.join(__dirname, '..', 'data', 'professors_data.json');
    fs.writeFileSync(outputPath, JSON.stringify(professorsByDepartment, null, 2));

    console.log(`\n✅ Scraping complete!`);
    console.log(`   Total professors: ${totalProfessors}`);
    console.log(`   With RMP ratings: ${professorsWithRatings} (${Math.round(professorsWithRatings / totalProfessors * 100)}%)`);
    console.log(`   Saved to: ${outputPath}\n`);

    return professorsByDepartment;
}

// Run the scraper
if (require.main === module) {
    scrapeAllProfessors().catch(console.error);
}

module.exports = { scrapeAllProfessors };
