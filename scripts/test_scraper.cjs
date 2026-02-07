/**
 * Quick test of the professor scraper on one department
 */

const { scrapeAllProfessors } = require('./scrape_professors.cjs');
const axios = require('axios');
const cheerio = require('cheerio');

async function testOneDepartment() {
    console.log('🧪 Testing scraper on Accounting department...\n');

    const url = 'https://www.winona.edu/accounting/faculty-staff.asp';

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        const faculty = [];

        $('.contact-card').each((i, elem) => {
            const $card = $(elem);
            const name = $card.find('.contact-card__title').text().trim();
            const title = $card.find('.contact-card__subtitle').text().trim();
            const email = $card.find('.contact-card__link').attr('href') || '';

            if (name && title && title.match(/Professor|Instructor|Lecturer/i)) {
                faculty.push({
                    name: name,
                    title: title || 'Faculty',
                    email: email.replace('mailto:', ''),
                    department_id: 'accounting_dept'
                });
            }
        });

        console.log(`✅ Found ${faculty.length} faculty members:\n`);
        faculty.forEach((f, i) => {
            console.log(`${i + 1}. ${f.name}`);
            console.log(`   Title: ${f.title}`);
            console.log(`   Email: ${f.email}\n`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testOneDepartment();
