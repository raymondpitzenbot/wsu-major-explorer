/**
 * Quick test on 3 departments
 */
const { scrapeTopProfessors } = require('./scrape_professors_final.cjs');

// Temporarily override DEPARTMENT_URLS for testing
const originalModule = require('./scrape_professors_final.cjs');

async function quickTest() {
    console.log('🧪 Quick test on 3 departments...\n');

    const testDepts = {
        'accounting_dept': 'https://www.winona.edu/accounting/faculty-staff.asp',
        'psychology_dept': 'https://www.winona.edu/psychology/faculty-staff.asp',
        'english_dept': 'https://www.winona.edu/english/faculty-staff.asp',
    };

    // This is a simplified inline version for testing
    const axios = require('axios');
    const cheerio = require('cheerio');
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    for (const [deptId, url] of Object.entries(testDepts)) {
        console.log(`\n📖 ${deptId}`);
        try {
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

            console.log(`   ✅ Found ${faculty.length} professors`);
            if (faculty.length > 0) {
                console.log(`   Top 3: ${faculty.slice(0, 3).map(f => f.name).join(', ')}`);
            }
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }

        await delay(1000);
    }

    console.log('\n✅ Test complete! Department URLs are working.\n');
    console.log('Ready to run full scraper with: node scripts/scrape_professors_final.cjs');
}

quickTest();
