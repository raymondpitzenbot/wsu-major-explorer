/**
 * COMPREHENSIVE PROFESSOR SCRAPER
 * Scrapes all 35 departments and adds RMP ratings for everyone
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const RMP_GRAPHQL_URL = 'https://www.ratemyprofessors.com/graphql';
const WSU_SCHOOL_ID = '1214';
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Complete URL mapping for all 35 departments
const FACULTY_PAGE_URLS = {
    // Liberal Arts - all confirmed working
    'psychology_dept': 'https://www.winona.edu/psychology/faculty.asp',
    'art_and_design_dept': 'https://www.winona.edu/academics/colleges/liberal-arts/art-design-department/faculty/',
    'english_dept': 'https://www.winona.edu/academics/colleges/liberal-arts/english-department/faculty-staff/',
    'communication_studies_dept': 'https://www.winona.edu/academics/colleges/liberal-arts/communication-studies-department/faculty/',
    'history_and_legal_studies_dept': 'https://www.winona.edu/academics/colleges/liberal-arts/history-legal-studies-department/faculty/',
    'mass_communication_dept': 'https://www.winona.edu/academics/colleges/liberal-arts/mass-communication-department/faculty-staff/',
    'music_dept': 'https://www.winona.edu/academics/colleges/liberal-arts/music-department/faculty-staff/',
    'philosophy_dept': 'https://www.winona.edu/academics/colleges/liberal-arts/philosophy-department/faculty/',
    'global_studies_and_world_languages_dept': 'https://www.winona.edu/academics/colleges/liberal-arts/global-studies-world-languages-department/faculty/',
    'sociology_and_criminal_justice_dept': 'https://www.winona.edu/academics/colleges/liberal-arts/sociology-criminal-justice-department/faculty/',
    'theatre_and_dance_dept': 'https://www.winona.edu/academics/colleges/liberal-arts/theatre-dance-department/faculty-staff/',
    'political_science_public_administration_and_ethnic_studies_dept': 'https://www.winona.edu/academics/colleges/liberal-arts/political-science-public-administration-ethnic-studies-department/faculty/',

    // Business
    'accounting_dept': 'https://www.winona.edu/accounting/faculty-staff.asp',
    'business_administration_dept': 'https://www.winona.edu/businessadministration/faculty-staff.asp',
    'economics_dept': 'https://www.winona.edu/economics/faculty.asp',
    'finance_dept': 'https://www.winona.edu/finance/faculty.asp',
    'marketing_dept': 'https://www.winona.edu/marketing/faculty.asp',

    // Science & Engineering
    'biology_dept': 'https://www.winona.edu/academics/colleges/science-engineering/biology-department/faculty-staff/',
    'chemistry_dept': 'https://www.winona.edu/academics/colleges/science-engineering/chemistry-department/faculty-staff/',
    'computer_science_dept': 'https://www.winona.edu/computerscience/faculty.asp',
    'mathematics_and_statistics_dept': 'https://www.winona.edu/math/faculty.asp',
    'physics_dept': 'https://www.winona.edu/academics/colleges/science-engineering/physics-department/faculty-staff/',
    'geoscience_dept': 'https://www.winona.edu/academics/colleges/science-engineering/geoscience-department/faculty/',
    'composite_materials_engineering_dept': 'https://www.winona.edu/compmat/faculty-staff.asp',

    // Nursing & Health Sciences  
    'nursing_dept': 'https://www.winona.edu/nursing/bsn-faculty.asp',
    'social_work_dept': 'https://www.winona.edu/socialwork/bsw-faculty-staff.asp',
    'health_exercise_and_rehabilitative_sciences_dept': 'https://www.winona.edu/academics/colleges/nursing-health-sciences/health-exercise-rehabilitative-sciences-department/faculty-staff/',
    'recreation_tourism_and_therapeutic_recreation_dept': 'https://www.winona.edu/academics/colleges/nursing-health-sciences/recreation-tourism-therapeutic-recreation-department/faculty/',

    // Education
    'early_childhood_and_elementary_education_dept': 'https://www.winona.edu/education/ecee/faculty-staff.asp',
    'physical_education_and_sport_science_dept': 'https://www.winona.edu/education/pessdepartment/faculty.asp',
    'special_education_dept': 'https://www.winona.edu/academics/colleges/education/special-education-department/faculty-staff/',
    'counselor_education_dept': 'https://www.winona.edu/counseloreducation/faculty.asp',
    'leadership_education_dept': 'https://www.winona.edu/leadershipeducation/faculty-staff.asp',
    'education_studies_dept': 'https://www.winona.edu/educationstudies/faculty.asp',
    'child_advocacy_studies_dept': 'https://www.winona.edu/childadvocacystudies/faculty-staff.asp',
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

        // Scrape contact cards (new format)
        $('.contact-card').each((i, elem) => {
            const $card = $(elem);
            const name = $card.find('.contact-card__title').text().trim();
            const title = $card.find('.contact-card__subtitle').text().trim();

            if (name && title && title.match(/Professor|Instructor|Lecturer|Chair/i)) {
                faculty.push({ name, title });
            }
        });

        // If no contact cards, try old format
        if (faculty.length === 0) {
            $('h3, h4').each((i, elem) => {
                const text = $(elem).text().trim();
                const nextText = $(elem).next('p').text().trim();

                if (nextText && nextText.match(/Professor|Instructor|Lecturer|Chair/i)) {
                    faculty.push({ name: text, title: nextText });
                }
            });
        }

        console.log(`     Found ${faculty.length} professors`);
        return faculty;

    } catch (error) {
        console.error(`     ❌ Error: ${error.message}`);
        return [];
    }
}

async function scrapeAllDepartments() {
    console.log('🎓 Scraping ALL Faculty with RMP Ratings\n');

    const professorsByDepartment = {};
    let totalScraped = 0;
    let totalWithRatings = 0;

    for (const [deptId, url] of Object.entries(FACULTY_PAGE_URLS)) {
        const faculty = await scrapeDepartmentFaculty(deptId, url);

        if (faculty.length === 0) {
            console.log(`     ⚠️  No faculty found, skipping\n`);
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
    scrapeAllDepartments().catch(console.error);
}
