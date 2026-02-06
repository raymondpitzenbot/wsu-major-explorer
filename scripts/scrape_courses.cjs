
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
    const topLevelGroups = [];
    const stack = [];

    $('.acalog-core').each((i, el) => {
        const groupRaw = $(el);

        // Identify heading level and title
        let title = '';
        let level = 5; // Default low level

        const h2 = groupRaw.find('h2');
        const h3 = groupRaw.find('h3');
        const h4 = groupRaw.find('h4');
        const strong = groupRaw.find('strong').first();

        if (h2.length) { title = h2.text().trim(); level = 2; }
        else if (h3.length) { title = h3.text().trim(); level = 3; }
        else if (h4.length) { title = h4.text().trim(); level = 3; } // Flattened from 4
        else if (strong.length) { title = strong.text().trim(); level = 3; } // Flattened from 5

        // Ignore headers that look like course codes (e.g. "MATH 110") or are excluded
        if (!title || /Legend|Graduate School Recommendations/i.test(title) || /^[A-Z]{2,4}\s+\d{3,4}/.test(title)) return;

        // Parse items (courses or text)
        const items = [];

        // Strategy: Look for UL/LI items first
        const listItems = groupRaw.find('ul > li');
        if (listItems.length > 0) {
            listItems.each((j, li) => {
                const liEl = $(li);
                const text = liEl.text().trim();

                // Clean common symbols from the start of the text immediately
                const cleanedText = text.replace(/^[△*^†‡§#◆◇♦\s]+/, '');

                // Better Course Detection on the CLEANED text
                let isCourse = liEl.hasClass('acalog-course') ||
                    liEl.find('.acalog-course').length > 0 ||
                    /^([A-Z]{2,4}\s+\d{3,4}[A-Z]?)/.test(cleanedText);

                let codeMatch = null;
                let creditsMatch = null;

                if (isCourse) {
                    codeMatch = cleanedText.match(/^([A-Z]{2,4}\s+\d{3,4}[A-Z]?)/);
                    creditsMatch = cleanedText.match(/\(([^)]+credits?)\)/i) ||
                        cleanedText.match(/(\d+(-\d+)?\s+credits?)/i) ||
                        cleanedText.match(/(\d+(-\d+)?\s+cr\.)/i);

                    // Validation: If it looks like a course but has no credits and contains sentence-like text, demote it.
                    if (!creditsMatch) {
                        if (cleanedText.length > 50 ||
                            /\b(is a|require|or)\b/i.test(cleanedText) ||
                            /300\s*\/\s*400/.test(cleanedText)) {
                            isCourse = false;
                        }
                    }
                }

                if (isCourse) {
                    const courseCode = codeMatch ? codeMatch[1].trim() : '';
                    let courseTitle = cleanedText;

                    if (courseCode) {
                        courseTitle = cleanedText.replace(courseCode, '').trim();
                        // Clean up separators like " - "
                        courseTitle = courseTitle.replace(/^[-–—]\s*/, '').trim();

                        if (creditsMatch) {
                            courseTitle = courseTitle.replace(creditsMatch[0], '').trim();
                            // Final cleanup of trailing separators
                            courseTitle = courseTitle.replace(/\s*[-–—]$/, '').trim();
                        }
                    }

                    items.push({
                        type: 'course',
                        course_id: courseCode,
                        course_title: courseTitle,
                        credits: creditsMatch ? creditsMatch[1] : '?'
                    });
                } else if (text) {
                    items.push({
                        type: 'text',
                        content: text
                    });
                }
            });
        } else {
            // Fallback: Check for paragraphs or direct text if no list items found
            // This captures "6 credits of..." style requirements
            groupRaw.find('p').each((j, p) => {
                const pText = $(p).text().trim();
                if (pText && pText !== title && !/^[A-Z]{2,4}\s+\d{3,4}/.test(pText)) {
                    // Check if it's not just a repeat of the title
                    items.push({ type: 'text', content: pText });
                }
            });

            // If still empty, try to get anything that's not a heading
            if (items.length === 0) {
                const cloned = groupRaw.clone();
                cloned.find('h2, h3, h4, strong').remove();
                const rawText = cloned.text().trim();
                if (rawText && rawText.length > 5) {
                    items.push({ type: 'text', content: rawText });
                }
            }
        }

        const newGroup = {
            group_name: title,
            display_type: 'list',
            items: items,
            subgroups: [],
            level: level
        };

        // Build hierarchy
        while (stack.length > 0 && stack[stack.length - 1].level >= level) {
            stack.pop();
        }

        if (stack.length > 0) {
            stack[stack.length - 1].subgroups.push(newGroup);
        } else {
            topLevelGroups.push(newGroup);
        }
        stack.push(newGroup);
    });

    // Post-process to clean up empty groups or flatten if possible
    const clean = (groups) => {
        return groups.filter(g => {
            if (g.items.length === 0 && g.subgroups.length === 0) return false;

            // Clean level internal property
            delete g.level;

            if (g.subgroups.length === 0) {
                delete g.subgroups;
            } else {
                g.subgroups = clean(g.subgroups);
            }
            return true;
        });
    };

    return clean(topLevelGroups);
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

async function getCatalogUrl(url, depth = 0) {
    if (depth > 1) return null;
    try {
        const html = await fetchHtml(url);
        // 1. Check for standard DataServices redirector
        const dsMatch = html.match(/href="([^"]*DataServices\/WSUCatalog[^"]*)"/);
        if (dsMatch) return dsMatch[1];

        // 2. Check for direct catalog links
        const catMatch = html.match(/href="([^"]*catalog\.winona\.edu\/preview_program\.php[^"]*)"/);
        if (catMatch) return catMatch[1];

        // 3. Try to follow "Learn More" links which often lead to the department page with the real link
        const $ = cheerio.load(html);
        const candidates = [];
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (!href) return;

            const text = $(el).text().toLowerCase();
            const fullHref = href.startsWith('http') ? href : new URL(href, url).toString();

            if ((text.includes('learn more') || text.includes('program details')) && fullHref.includes('winona.edu')) {
                candidates.push(fullHref);
            }
        });

        for (const cand of candidates) {
            // Avoid infinite loops if links point to same page
            if (cand === url) continue;
            const res = await getCatalogUrl(cand, depth + 1);
            if (res) return res;
        }
    } catch (e) {
        // console.error(`      Error fetching ${url}: ${e.message}`);
    }
    return null;
}

async function run() {
    console.log("Starting bulk scraper (Enhanced Discovery)...");

    const targetProgramId = process.argv[2];

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

            // Skip if we already have data for this program
            if (results[prog.program_id] && results[prog.program_id].length > 0) {
                // console.log(`  - Skipping ${prog.program_id} (already scraped).`);
                successCount++; // Count as success since we have data
                continue;
            }

            await wait(DELAY_MS);

            const catalogUrl = await getCatalogUrl(prog.marketing_url);

            if (!catalogUrl) {
                console.log(`  - No catalog link found.`);
                failCount++;
                continue;
            }

            const catalogHtml = await fetchHtml(catalogUrl);
            const courseStructure = parseCatalogPage(catalogHtml);

            if (courseStructure.length > 0) {
                results[prog.program_id] = courseStructure;
                console.log(`  + Success: Found ${countGroups(courseStructure)} groups.`);
                successCount++;
            } else {
                console.log(`  - Empty: No course data found.`);
                failCount++;
            }

            // Periodic save every 5 programs to provide feedback
            if (i % 5 === 0) {
                fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
            }

        } catch (e) {
            console.error(`  ! Error: ${e.message}`);
            failCount++;
        }
    }

    console.log(`\nScraping complete.`);
    console.log(`Success: ${successCount}`);
    console.log(`Failed/Skipped: ${failCount}`);

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
    console.log(`Saved results to ${OUTPUT_PATH}`);
}

function countGroups(groups) {
    let count = groups.length;
    groups.forEach(g => {
        if (g.subgroups) count += countGroups(g.subgroups);
    });
    return count;
}

run();
