/**
 * FINAL Professor Scraper - Using WSU College Faculty Pages
 * 
 * This is the most comprehensive approach:
 * 1. Scrapes faculty from official WSU department faculty pages
 * 2. Searches Rate My Professor for each one
 * 3. Selects top 3 per department based on RMP ratings
 * 4. Generates professors_data.json
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const RMP_GRAPHQL_URL = 'https://www.ratemyprofessors.com/graphql';
const WSU_SCHOOL_ID = '1214';
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Department faculty page URLs - organized by college
const FACULTY_PAGES = {
    // College of Business
    'accounting_dept': 'https://www.winona.edu/academics/colleges/business/accounting-department/faculty/',
    'business_administration_dept': 'https://www.winona.edu/academics/colleges/business/business-administration-department/faculty/',
    'economics_dept': 'https://www.winona.edu/academics/colleges/business/economics-department/faculty/',
    'finance_dept': 'https://www.winona.edu/academics/colleges/business/finance-department/faculty/',
    'marketing_dept': 'https://www.winona.edu/academics/colleges/business/marketing-department/faculty/',

    // College of Liberal Arts
    'art_and_design_dept': 'https://www.winona.edu/academics/colleges/liberal-arts/art-design-department/faculty/',
    'communication_studies_dept': 'https://www.winona.edu/academics/colleges/liberal-arts/communication-studies-department/faculty/',
    'english_dept': 'https://www.winona.edu/academics/colleges/liberal-arts/english-department/faculty/',
    'history_and_legal_studies_dept': 'https://www.winona.edu/academics/colleges/liberal-arts/history-legal-studies-department/faculty/',
    'mass_communication_dept': 'https://www.winona.edu/academics/colleges/liberal-arts/mass-communication-department/faculty/',
    'music_dept': 'https://www.winona.edu/academics/colleges/liberal-arts/music-department/faculty/',
    'psychology_dept': 'https://www.winona.edu/academics/colleges/liberal-arts/psychology-department/faculty/',

    // College of Science & Engineering  
    'biology_dept': 'https://www.winona.edu/academics/colleges/science-engineering/biology-department/faculty/',
    'chemistry_dept': 'https://www.winona.edu/academics/colleges/science-engineering/chemistry-department/faculty/',
    'computer_science_dept': 'https://www.winona.edu/academics/colleges/science-engineering/computer-science-department/faculty/',
    'mathematics_and_statistics_dept': 'https://www.winona.edu/academics/colleges/science-engineering/mathematics-statistics-department/faculty/',
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
 * Parse professor name from contact card
 */
function parseProfessorName(text) {
    // Look for patterns like "Email John Doe" or just a heading with a name
    const emailMatch = text.match(/Email\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/);
    if (emailMatch) return emailMatch[1].trim();

    // Try to extract from heading
    const nameMatch = text.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/);
    if (nameMatch) return nameMatch[1].trim();

    return null;
}

/**
 * Scrape faculty from a department faculty page
 */
async function scrapeDepartmentFaculty(deptId, url) {
    try {
        console.log(`  📖 ${deptId}...`);

        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const $ = cheerio.load(response.data);
        const faculty = [];

        // Look for contact cards (same structure as accounting page)
        $('.contact-card').each((i, elem) => {
            const $card = $(elem);
            const name = $card.find('.contact-card__title').text().trim();
            const title = $card.find('.contact-card__subtitle').text().trim();

            // Filter to professors/instructors only
            if (name && title && title.match(/Professor|Instructor|Lecturer/i)) {
                faculty.push({ name, title });
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
 * Main scraper
 */
async function scrapeFacultyPages() {
    console.log('🎓 Scraping WSU Faculty Pages + Rate My Professor\n');

    const professorsByDepartment = {};
    let totalScraped = 0;
    let totalWithRatings = 0;

    for (const [deptId, url] of Object.entries(FACULTY_PAGES)) {
        const faculty = await scrapeDepartmentFaculty(deptId, url);

        if (faculty.length === 0) {
            continue;
        }

        // Search RMP for each professor
        const facultyWithRatings = [];
        for (const prof of faculty) {
            await delay(300); // Rate limiting

            const rmpData = await searchRateMyProfessor(prof.name);

            facultyWithRatings.push({
                name: prof.name,
                title: prof.title,
                ...rmpData
            });

            totalScraped++;
            if (rmpData && rmpData.avg_rating > 0) {
                totalWithRatings++;
                console.log(`     ⭐ ${prof.name}: ${rmpData.avg_rating}/5.0`);
            }
        }

        // Sort by rating (highest first)
        facultyWithRatings.sort((a, b) => {
            if (a.avg_rating && b.avg_rating) {
                if (b.avg_rating !== a.avg_rating) return b.avg_rating - a.avg_rating;
                return (b.num_ratings || 0) - (a.num_ratings || 0);
            }
            if (a.avg_rating) return -1;
            if (b.avg_rating) return 1;
            return 0;
        });

        // Select top 3
        professorsByDepartment[deptId] = facultyWithRatings.slice(0, 3);
        console.log(`     ✅ Top 3 selected\n`);

        await delay(500);
    }

    // Save
    const outputPath = path.join(__dirname, '..', 'data', 'professors_data.json');
    fs.writeFileSync(outputPath, JSON.stringify(professorsByDepartment, null, 2));

    console.log(`\n✅ Complete!`);
    console.log(`   Departments: ${Object.keys(professorsByDepartment).length}`);
    console.log(`   Professors: ${totalScraped}`);
    console.log(`   With RMP ratings: ${totalWithRatings} (${Math.round(totalWithRatings / totalScraped * 100)}%)`);
    console.log(`   Saved to: ${outputPath}\n`);

    return professorsByDepartment;
}

if (require.main === module) {
    scrapeFacultyPages().catch(console.error);
}

module.exports = { scrapeFacultyPages };
