/**
 * Discover Faculty Page URLs from WSU College Pages
 * 
 * This script:
 * 1. Scrapes all college department listing pages
 * 2. Finds faculty page URLs
 * 3. Maps them to department IDs
 * 4. Outputs a complete URL mapping
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// College department listing pages
const COLLEGE_PAGES = {
    'business': 'https://www.winona.edu/academics/colleges/business/business-academic-departments/',
    'liberal-arts': 'https://www.winona.edu/academics/colleges/liberal-arts/liberal-arts-academic-departments/',
    'education': 'https://www.winona.edu/academics/colleges/education/education-academic-departments/',
    'nursing': 'https://www.winona.edu/academics/colleges/nursing-health-sciences/nursing-health-sciences-academic-departments/',
    'science-engineering': 'https://www.winona.edu/academics/colleges/science-engineering/science-engineering-academic-departments/',
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Convert department name to our department_id format
 */
function nameToDepartmentId(name) {
    return name
        .toLowerCase()
        .replace(/\s*&\s*/g, '_and_')
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, '_')
        .trim() + '_dept';
}

/**
 * Scrape a college page for department links
 */
async function scrapeDepartmentLinks(collegeName, url) {
    try {
        console.log(`\n📚 Scraping ${collegeName}...`);
        console.log(`   URL: ${url}`);

        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const $ = cheerio.load(response.data);
        const departments = [];

        // Look for links to department pages
        $('a').each((i, elem) => {
            const href = $(elem).attr('href');
            const text = $(elem).text().trim();

            // Look for department page links
            if (href && (
                href.includes('/department/') ||
                href.includes('departments') ||
                text.includes('Department')
            )) {
                // Try to construct faculty page URL
                let facultyUrl = null;

                if (href.includes('/department/')) {
                    // Pattern: .../art-design-department/ → .../art-design-department/faculty/
                    facultyUrl = href.endsWith('/') ? href + 'faculty/' : href + '/faculty/';
                } else if (href.includes('.asp')) {
                    // Old pattern: keep as is
                    facultyUrl = href.replace('.asp', '/faculty-staff.asp');
                }

                if (facultyUrl) {
                    // Make absolute URL
                    if (!facultyUrl.startsWith('http')) {
                        facultyUrl = `https://www.winona.edu${facultyUrl}`;
                    }

                    departments.push({
                        name: text.replace(/Department|Faculty|&|Faculty & Staff/gi, '').trim(),
                        url: facultyUrl,
                        original_link: href
                    });
                }
            }
        });

        console.log(`   Found ${departments.length} potential department links`);
        return departments;

    } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        return [];
    }
}

/**
 * Test if a faculty URL actually exists
 */
async function testUrl(url) {
    try {
        await axios.head(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 5000
        });
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Main discovery function
 */
async function discoverFacultyUrls() {
    console.log('🔍 Discovering WSU Faculty Page URLs\n');

    const allDepartments = [];

    // Scrape all college pages
    for (const [collegeName, url] of Object.entries(COLLEGE_PAGES)) {
        const depts = await scrapeDepartmentLinks(collegeName, url);
        allDepartments.push(...depts);
        await delay(1000);
    }

    console.log(`\n✅ Found ${allDepartments.length} total department links`);

    // Test URLs and build mapping
    console.log('\n🧪 Testing URLs...\n');
    const urlMapping = {};
    const workingUrls = [];

    for (const dept of allDepartments) {
        const deptId = nameToDepartmentId(dept.name);
        const exists = await testUrl(dept.url);

        if (exists) {
            urlMapping[deptId] = dept.url;
            workingUrls.push({
                dept_id: deptId,
                name: dept.name,
                url: dept.url
            });
            console.log(`   ✅ ${deptId}: ${dept.url}`);
        } else {
            console.log(`   ❌ ${deptId}: ${dept.url} (404)`);
        }

        await delay(300);
    }

    // Save results
    const outputPath = path.join(__dirname, 'discovered_faculty_urls.json');
    fs.writeFileSync(outputPath, JSON.stringify({
        total_discovered: workingUrls.length,
        url_mapping: urlMapping,
        departments: workingUrls
    }, null, 2));

    console.log(`\n✅ Discovery Complete!`);
    console.log(`   Working URLs: ${workingUrls.length}`);
    console.log(`   Saved to: ${outputPath}\n`);

    // Print the URL mapping for the scraper
    console.log('📋 Add these to your scraper:\n');
    console.log('const FACULTY_PAGES = {');
    for (const [deptId, url] of Object.entries(urlMapping)) {
        console.log(`    '${deptId}': '${url}',`);
    }
    console.log('};\n');

    return { urlMapping, workingUrls };
}

if (require.main === module) {
    discoverFacultyUrls().catch(console.error);
}

module.exports = { discoverFacultyUrls };
