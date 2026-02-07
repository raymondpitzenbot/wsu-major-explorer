/**
 * FINAL - Complete Faculty Scraper with Manual URLs
 * Scrapes full faculty lists from actual department faculty pages
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const RMP_GRAPHQL_URL = 'https://www.ratemyprofessors.com/graphql';
const WSU_SCHOOL_ID = '1214';
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Manual URL list for top departments
const FACULTY_PAGE_URLS = {
    // Liberal Arts
    'psychology_dept': 'https://www.winona.edu/academics/colleges/liberal-arts/psychology-department/faculty/',
    'art_and_design_dept': 'https://www.winona.edu/academics/colleges/liberal-arts/art-design-department/faculty/',
    'english_dept': 'https://www.winona.edu/academics/colleges/liberal-arts/english-department/faculty/',
    'communication_studies_dept': 'https://www.winona.edu/academics/colleges/liberal-arts/communication-studies-department/faculty/',
    'history_and_legal_studies_dept': 'https://www.winona.edu/academics/colleges/liberal-arts/history-legal-studies-department/faculty/',
    'mass_communication_dept': 'https://www.winona.edu/academics/colleges/liberal-arts/mass-communication-department/faculty/',
    'music_dept': 'https://www.winona.edu/academics/colleges/liberal-arts/music-department/faculty/',
    'philosophy_dept': 'https://www.winona.edu/academics/colleges/liberal-arts/philosophy-department/faculty/',
    'global_studies_and_world_languages_dept': 'https://www.winona.edu/academics/colleges/liberal-arts/global-studies-world-languages-department/faculty/',
    'sociology_and_criminal_justice_dept': 'https://www.winona.edu/academics/colleges/liberal-arts/sociology-criminal-justice-department/faculty/',
    'theatre_and_dance_dept': 'https://www.winona.edu/academics/colleges/liberal-arts/theatre-dance-department/faculty/',

    // Business
    'accounting_dept': 'https://www.winona.edu/academics/colleges/business/accounting-department/faculty/',
    'business_administration_dept': 'https://www.winona.edu/academics/colleges/business/business-administration-department/faculty/',
    'economics_dept': 'https://www.winona.edu/academics/colleges/business/economics-department/faculty/',
    'finance_dept': 'https://www.winona.edu/academics/colleges/business/finance-department/faculty/',
    'marketing_dept': 'https://www.winona.edu/academics/colleges/business/marketing-department/faculty/',

    // Science & Engineering
    'biology_dept': 'https://www.winona.edu/academics/colleges/science-engineering/biology-department/faculty/',
    'chemistry_dept': 'https://www.winona.edu/academics/colleges/science-engineering/chemistry-department/faculty/',
    'computer_science_dept': 'https://www.winona.edu/academics/colleges/science-engineering/computer-science-department/faculty/',
    'mathematics_and_statistics_dept': 'https://www.winona.edu/academics/colleges/science-engineering/mathematics-statistics-department/faculty/',
    'physics_dept': 'https://www.winona.edu/academics/colleges/science-engineering/physics-department/faculty/',
    'geoscience_dept': 'https://www.winona.edu/academics/colleges/science-engineering/geoscience-department/faculty/',
    'composite_materials_engineering_dept': 'https://www.winona.edu/academics/colleges/science-engineering/composite-materials-engineering-department/faculty/',

    // Nursing & Health Sciences  
    'nursing_dept': 'https://www.winona.edu/academics/colleges/nursing-health-sciences/nursing-department/faculty/',
    'social_work_dept': 'https://www.winona.edu/academics/colleges/nursing-health-sciences/social-work-department/faculty/',
    'health_exercise_and_rehabilitative_sciences_dept': 'https://www.winona.edu/academics/colleges/nursing-health-sciences/health-exercise-rehabilitative-sciences-department/faculty/',
    'recreation_tourism_and_therapeutic_recreation_dept': 'https://www.winona.edu/academics/colleges/nursing-health-sciences/recreation-tourism-therapeutic-recreation-department/faculty/',

    // Education
    'early_childhood_and_elementary_education_dept': 'https://www.winona.edu/academics/colleges/education/early-childhood-elementary-education-department/faculty/',
    'physical_education_and_sport_science_dept': 'https://www.winona.edu/academics/colleges/education/physical-education-sport-science-department/faculty/',
    'special_education_dept': 'https://www.winona.edu/academics/colleges/education/special-education-department/faculty/',
    'counselor_education_dept': 'https://www.winona.edu/academics/colleges/education/counselor-education-department/faculty/',
    'leadership_education_dept': 'https://www.winona.edu/academics/colleges/education/leadership-education-department/faculty/',
    'education_studies_dept': 'https://www.winona.edu/academics/colleges/education/education-studies-department/faculty/',
};

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

async function scrapeDepartmentFaculty(deptId, url) {
    try {
        console.log(`  📖 ${deptId}...`);

        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });

        const $ = cheerio.load(response.data);
        const faculty = [];

        // Scrape contact cards
        $('.contact-card').each((i, elem) => {
            const $card = $(elem);
            const name = $card.find('.contact-card__title').text().trim();
            const title = $card.find('.contact-card__subtitle').text().trim();

            if (name && title && title.match(/Professor|Instructor|Lecturer/i)) {
                faculty.push({ name, title });
            }
        });

        console.log(`     Found ${faculty.length} professors`);
        return faculty;

    } catch (error) {
        console.error(`     ❌ Error: ${error.message} `);
        return [];
    }
}

async function scrapeAllFaculty() {
    console.log('🎓 Scraping Complete Faculty Lists\n');

    const professorsByDepartment = {};
    let totalScraped = 0;
    let totalWithRatings = 0;

    for (const [deptId, url] of Object.entries(FACULTY_PAGE_URLS)) {
        const faculty = await scrapeDepartmentFaculty(deptId, url);

        if (faculty.length === 0) {
            continue;
        }

        // Search RMP for each
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
            if (rmpData && rmpData.avg_rating > 0) {
                totalWithRatings++;
                console.log(`     ⭐ ${prof.name}: ${rmpData.avg_rating}/5.0`);
            }
        }

        // Sort and select top 3
        facultyWithRatings.sort((a, b) => {
            if (a.avg_rating && b.avg_rating) {
                if (b.avg_rating !== a.avg_rating) return b.avg_rating - a.avg_rating;
                return (b.num_ratings || 0) - (a.num_ratings || 0);
            }
            if (a.avg_rating) return -1;
            if (b.avg_rating) return 1;
            return 0;
        });

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
}

if (require.main === module) {
    scrapeAllFaculty().catch(console.error);
}
