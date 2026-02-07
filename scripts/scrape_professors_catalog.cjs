/**
 * Scrape Professors from WSU Catalog Pages
 * 
 * This scraper uses the official WSU catalog which lists faculty for each department
 * in a structured format. Much more reliable than scraping individual faculty pages!
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const RMP_GRAPHQL_URL = 'https://www.ratemyprofessors.com/graphql';
const WSU_SCHOOL_ID = '1214';
const CATALOG_BASE = 'https://catalog.winona.edu';
const DEPARTMENTS_PAGE = `${CATALOG_BASE}/content.php?catoid=38&navoid=6729`;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
 * Extract professor names from catalog faculty text
 * Format: "Name, Title; degrees...; year -"
 */
function parseFacultyText(text) {
    const professors = [];

    // Split by " - " which separates each professor
    const entries = text.split(' - ').filter(e => e.trim());

    for (const entry of entries) {
        // Extract name and title (before first semicolon)
        const match = entry.match(/^([^,]+),\s*([^;]+)/);
        if (match) {
            const name = match[1].trim();
            const title = match[2].trim();

            // Only include professors, instructors, lecturers
            if (title.match(/Professor|Instructor|Lecturer/i)) {
                professors.push({ name, title });
            }
        }
    }

    return professors;
}

/**
 * Scrape faculty from a catalog department page
 */
async function scrapeDepartmentFaculty(deptName, deptUrl) {
    try {
        const response = await axios.get(deptUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const $ = cheerio.load(response.data);
        const faculty = [];

        // Find the Faculty section
        $('h3').each((i, elem) => {
            if ($(elem).text().trim() === 'Faculty') {
                // Get the text immediately following the Faculty heading
                const facultyText = $(elem).next('p').text() || $(elem).parent().next('p').text();
                const professors = parseFacultyText(facultyText);
                faculty.push(...professors);
            }
        });

        return faculty;

    } catch (error) {
        console.error(`     Error: ${error.message}`);
        return [];
    }
}

/**
 * Get all department links from main catalog page
 */
async function getAllDepartmentLinks() {
    try {
        const response = await axios.get(DEPARTMENTS_PAGE, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const $ = cheerio.load(response.data);
        const departments = [];

        // Find all department links (pattern: "Go to information for X")
        $('a').each((i, elem) => {
            const text = $(elem).text();
            const href = $(elem).attr('href');

            if (text.startsWith('Go to information for') && href && href.includes('preview_entity.php')) {
                const deptName = text.replace('Go to information for ', '').replace('.', '').trim();
                const fullUrl = href.startsWith('http') ? href : `${CATALOG_BASE}/${href}`;
                departments.push({ name: deptName, url: fullUrl });
            }
        });

        return departments;

    } catch (error) {
        console.error('Error fetching departments:', error.message);
        return [];
    }
}

/**
 * Main scraper
 */
async function scrapeFromCatalog() {
    console.log('🎓 Scraping Professors from WSU Catalog\n');

    // Step 1: Get all department links
    console.log('📚 Finding all departments...');
    const departments = await getAllDepartmentLinks();
    console.log(`   Found ${departments.length} departments\n`);

    const professorsByDepartment = {};
    let totalScraped = 0;
    let totalWithRatings = 0;

    // Step 2: Scrape each department
    for (const dept of departments) {
        console.log(`  📖 ${dept.name}...`);

        const faculty = await scrapeDepartmentFaculty(dept.name, dept.url);

        if (faculty.length === 0) {
            console.log(`     No faculty found\n`);
            continue;
        }

        console.log(`     Found ${faculty.length} professors`);

        // Step 3: Search RMP for each professor
        const facultyWithRatings = [];
        for (const prof of faculty) {
            await delay(300);

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
            }
        }

        // Sort by rating and select top 3
        facultyWithRatings.sort((a, b) => {
            if (a.avg_rating && b.avg_rating) {
                if (b.avg_rating !== a.avg_rating) return b.avg_rating - a.avg_rating;
                return (b.num_ratings || 0) - (a.num_ratings || 0);
            }
            if (a.avg_rating) return -1;
            if (b.avg_rating) return 1;
            return 0;
        });

        // Convert department name to ID format and store top 3
        const deptId = dept.name.toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, '') + '_dept';
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
    console.log(`   With RMP: ${totalWithRatings} (${Math.round(totalWithRatings / totalScraped * 100)}%)`);
    console.log(`   Saved to: ${outputPath}\n`);

    return professorsByDepartment;
}

if (require.main === module) {
    scrapeFromCatalog().catch(console.error);
}

module.exports = { scrapeFromCatalog };
