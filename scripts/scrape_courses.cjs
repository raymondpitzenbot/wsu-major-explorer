
const fs = require('fs');
const https = require('https');
const cheerio = require('cheerio');
const path = require('path');

// Configuration
const DELAY_MS = 300; // 0.3s delay between requests
const WSU_DATA_PATH = path.join(__dirname, '../data/wsuData.ts');
const OUTPUT_PATH = path.join(__dirname, '../data/course_requirements.json');

async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchHtml(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, (res) => {
            let data = '';
            // Handle redirects
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                // console.log(`  Following redirect to ${res.headers.location}`);
                fetchHtml(res.headers.location).then(resolve).catch(reject);
                return;
            }

            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => { resolve(data); });
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timed out'));
        });
    });
}

function parseCatalogPage(html) {
    const $ = cheerio.load(html);
    const courseGroups = [];

    $('.acalog-core').each((i, el) => {
        const groupRaw = $(el);

        // 1. Get Group Title - more robustly lookup different header levels
        let title = groupRaw.find('h2').text().trim();
        if (!title) title = groupRaw.find('h3').text().trim();
        if (!title) title = groupRaw.find('h4').text().trim();
        if (!title) title = groupRaw.find('strong').first().text().trim();

        // Filter out irrelevant sections or empty titles
        if (!title || title === 'Legend' || title === 'Graduate School Recommendations') return;

        // 2. Parse items (courses or text)
        // Look for ul > li
        const listItems = groupRaw.find('ul > li');
        const items = [];

        listItems.each((j, li) => {
            const liEl = $(li);

            // Check if it's a course (has class 'acalog-course' or contains a link matching course pattern)
            // Acalog usually puts class="acalog-course" on the li
            if (liEl.hasClass('acalog-course')) {
                const text = liEl.text().trim();
                // Extract code and credits
                // Format often: "ACCT 211 - Financial Accounting Principles (3 credits)"
                // Or "ACCT 211 - Financial Accounting Principles 3 credits"

                const codeMatch = text.match(/^([A-Z]{2,4}\s+\d{3}[A-Z]?)/);
                const creditsMatch = text.match(/\(([^)]+credits?)\)/i) || text.match(/(\d+\s+credits?)/i);

                const courseCode = codeMatch ? codeMatch[1] : '';
                let courseTitle = text;
                if (courseCode) {
                    courseTitle = text.replace(courseCode, '').replace(/^-?\s*/, '').trim();
                    // Remove credits from title if at end
                    if (creditsMatch) {
                        courseTitle = courseTitle.replace(/\(?\d+\s+credits?\)?/i, '').trim();
                        courseTitle = courseTitle.replace(/^-\s*/, '').replace(/-\s*$/, '');
                    }
                }

                items.push({
                    type: 'course',
                    course_id: courseCode,
                    course_title: courseTitle,
                    credits: creditsMatch ? creditsMatch[1] : '?'
                });
            } else {
                // Just text
                items.push({
                    type: 'text',
                    content: liEl.text().trim()
                });
            }
        });

        // Only add group if it has items
        if (items.length > 0) {
            courseGroups.push({
                group_name: title,
                credits_required: null,
                display_type: 'list',
                items: items,
                notes: []
            });
        }
    });

    return courseGroups;
}

function extractProgramsFromTs() {
    try {
        const content = fs.readFileSync(WSU_DATA_PATH, 'utf8');
        const programs = [];
        // Regex to find objects with program_id and program_page_url
        // Matches: { program_id: 'foo', ... program_page_url: 'bar', ... }
        // We'll iterate through the string to be robust

        // Simpler approach: Split by "program_id:"
        const parts = content.split('program_id:');
        for (let i = 1; i < parts.length; i++) {
            const chunk = parts[i];

            // Extract ID
            const idMatch = chunk.match(/^\s*['"]([^'"]+)['"]/);
            if (!idMatch) continue;
            const programId = idMatch[1];

            // Extract URL
            const urlMatch = chunk.match(/program_page_url:\s*['"]([^'"]+)['"]/);
            if (!urlMatch) continue;
            const url = urlMatch[1];

            programs.push({
                program_id: programId,
                marketing_url: url
            });
        }
        return programs;
    } catch (e) {
        console.error("Failed to read wsuData.ts:", e);
        return [];
    }
}

async function run() {
    console.log("Starting bulk scraper...");

    const targetProgramId = process.argv[2]; // Optional: run for single program

    let programs = extractProgramsFromTs();
    console.log(`Found ${programs.length} programs in wsuData.ts`);

    if (targetProgramId) {
        console.log(`Filtering for program: ${targetProgramId}`);
        programs = programs.filter(p => p.program_id === targetProgramId);
    }

    console.log(`Processing ${programs.length} programs...`);

    // Load existing results to merge
    let results = {};
    if (fs.existsSync(OUTPUT_PATH)) {
        try {
            results = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'));
        } catch (e) {
            console.error("Error reading existing results, starting fresh.");
        }
    }

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < programs.length; i++) {
        const prog = programs[i];
        console.log(`[${i + 1}/${programs.length}] Processing ${prog.program_id}...`);

        try {
            // Rate limit
            await wait(DELAY_MS);

            const marketingHtml = await fetchHtml(prog.marketing_url);
            const catalogLinkMatch = marketingHtml.match(/href="([^"]*DataServices\/WSUCatalog[^"]*)"/);

            if (!catalogLinkMatch) {
                console.log(`  - Skipped: No catalog link found on marketing page.`);
                failCount++;
                continue;
            }
            const catalogUrl = catalogLinkMatch[1];

            const catalogHtml = await fetchHtml(catalogUrl);
            const courseStructure = parseCatalogPage(catalogHtml);

            if (courseStructure.length > 0) {
                results[prog.program_id] = courseStructure;
                console.log(`  + Success: Found ${courseStructure.length} groups.`);
                successCount++;
            } else {
                console.log(`  - Empty: No course data found (parsed 0 groups).`);
                failCount++;
            }

        } catch (e) {
            console.error(`  ! Error scraping ${prog.program_id}: ${e.message}`);
            failCount++;
        }
    }

    console.log(`\nScraping complete.`);
    console.log(`Success: ${successCount}`);
    console.log(`Failed/Skipped: ${failCount}`);

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
    console.log(`Saved results to ${OUTPUT_PATH}`);
}

run();
