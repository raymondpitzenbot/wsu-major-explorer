/**
 * Final Professor Scraper - Top 3 Per Department
 * 
 * Scrapes WSU faculty pages and RMP data, selects top 3 professors per department  
 * based on highest RMP ratings.
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const RMP_GRAPHQL_URL = 'https://www.ratemyprofessors.com/graphql';
const WSU_SCHOOL_ID = '1214';
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Department URLs - these may need to be updated/discovered
const DEPARTMENT_URLS = {
    'accounting_dept': 'https://www.winona.edu/accounting/faculty-staff.asp',
    'business_administration_dept': 'https://www.winona.edu/business/faculty-staff.asp',
    'economics_dept': 'https://www.winona.edu/economics/faculty-staff.asp',
    'finance_dept': 'https://www.winona.edu/finance/faculty-staff.asp',
    'marketing_dept': 'https://www.winona.edu/marketing/faculty-staff.asp',
    'psychology_dept': 'https://www.winona.edu/psychology/faculty-staff.asp',
    'computer_science_dept': 'https://www.winona.edu/computer-science/faculty-staff.asp',
    'nursing_dept': 'https://www.winona.edu/nursing/faculty-staff.asp',
    'english_dept': 'https://www.winona.edu/english/faculty-staff.asp',
    'history_and_legal_studies_dept': 'https://www.winona.edu/history/faculty-staff.asp',
    'mass_communication_dept': 'https://www.winona.edu/mass-communication/faculty-staff.asp',
    'art_and_design_dept': 'https://www.winona.edu/art/faculty-staff.asp',
    'communication_studies_dept': 'https://www.winona.edu/communication-studies/faculty-staff.asp',
    'music_dept': 'https://www.winona.edu/music/faculty-staff.asp',
    'biology_dept': 'https://www.winona.edu/biology/faculty-staff.asp',
    'chemistry_dept': 'https://www.winona.edu/chemistry/faculty-staff.asp',
    'mathematics_and_statistics_dept': 'https://www.winona.edu/mathematics/faculty-staff.asp',
};

/**
 * Search RMP for a professor
 */
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
            variables: {
                text: professorName,
                schoolID: btoa(`School-${WSU_SCHOOL_ID}`)
            }
        }, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0'
            }
        });

        const teachers = response.data?.data?.newSearch?.teachers?.edges || [];

        if (teachers.length > 0) {
            const p = teachers[0].node;
            return {
                rmp_id: p.legacyId,
                avg_rating: p.avgRating,
                num_ratings: p.numRatings,
                would_take_again_percent: p.wouldTakeAgainPercent,
                rmp_url: `https://www.ratemyprofessors.com/professor/${p.legacyId}`
            };
        }
        return null;
    } catch (error) {
        return null;
    }
}

/**
 * Scrape faculty from a department page
 */
async function scrapeDepartmentFaculty(departmentId, url) {
    try {
        console.log(`  📖 ${departmentId}...`);

        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const $ = cheerio.load(response.data);
        const faculty = [];

        $('.contact-card').each((i, elem) => {
            const $card = $(elem);
            const name = $card.find('.contact-card__title').text().trim();
            const title = $card.find('.contact-card__subtitle').text().trim();

            // STRICT: Only professors/instructors/lecturers
            if (name && title && title.match(/Professor|Instructor|Lecturer/i)) {
                faculty.push({ name, title, department_id: departmentId });
            }
        });

        console.log(`     Found ${faculty.length} professors`);
        return faculty;

    } catch (error) {
        console.error(`     ❌ Error: ${error.message}`);
        return [];
    }
}

/**
 * Main scraper - returns top 3 professors per department
 */
async function scrapeTopProfessors() {
    console.log('🎓 Scraping Top Professors for Each Department\n');

    const professorsByDepartment = {};
    let totalScraped = 0;
    let totalWithRatings = 0;

    for (const [deptId, url] of Object.entries(DEPARTMENT_URLS)) {
        const faculty = await scrapeDepartmentFaculty(deptId, url);

        if (faculty.length === 0) {
            continue; // Skip if URL is wrong or no faculty
        }

        // Search RMP for each professor
        const facultyWithRatings = [];
        for (const prof of faculty) {
            await delay(300); // Reduced delay - 300ms instead of 1500ms

            const rmpData = await searchRateMyProfessor(prof.name);

            facultyWithRatings.push({
                name: prof.name,
                title: prof.title,
                ...rmpData
            });

            totalScraped++;
            if (rmpData) {
                totalWithRatings++;
                console.log(`     ⭐ ${prof.name}: ${rmpData.avg_rating}/5.0`);
            } else {
                console.log(`     ❌ ${prof.name}: Not on RMP`);
            }
        }

        // Sort by rating (highest first), prioritize those with ratings
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

        // Select top 3
        professorsByDepartment[deptId] = facultyWithRatings.slice(0, 3);

        console.log(`     ✅ Selected top 3 for ${deptId}\n`);
        await delay(500); // Reduced from 2000ms
    }

    // Save to file
    const outputPath = path.join(__dirname, '..', 'data', 'professors_data.json');
    fs.writeFileSync(outputPath, JSON.stringify(professorsByDepartment, null, 2));

    console.log(`\n✅ Complete!`);
    console.log(`   Professors scraped: ${totalScraped}`);
    console.log(`   With RMP ratings: ${totalWithRatings} (${Math.round(totalWithRatings / totalScraped * 100)}%)`);
    console.log(`   Saved to: ${outputPath}\n`);

    return professorsByDepartment;
}

if (require.main === module) {
    scrapeTopProfessors().catch(console.error);
}

module.exports = { scrapeTopProfessors };
