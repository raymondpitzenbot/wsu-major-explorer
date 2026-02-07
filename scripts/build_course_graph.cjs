const axios = require('axios');
const fs = require('fs');
const path = require('path');

const RMP_GRAPHQL_URL = 'https://www.ratemyprofessors.com/graphql';
const MASTER_LIST_PATH = path.join(__dirname, '..', 'data', 'rmp_wsu_master_list.json');
const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'professor_courses_full.json');
const DELAY_MS = 200;

async function getProfessorCourses(legacyId) {
    if (!legacyId) return [];

    const globalId = Buffer.from(`Teacher-${legacyId}`).toString('base64');

    const query = `
        query TeacherCourses($id: ID!) {
            node(id: $id) {
                ... on Teacher {
                    ratings(first: 100) {
                        edges {
                            node {
                                class
                            }
                        }
                    }
                }
            }
        }
    `;

    try {
        const response = await axios.post(RMP_GRAPHQL_URL, {
            query,
            variables: { id: globalId }
        }, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0',
                'Authorization': 'Basic dGVzdDp0ZXN0'
            }
        });

        const teacher = response.data?.data?.node;
        if (teacher && teacher.ratings) {
            const courses = new Set();
            teacher.ratings.edges.forEach(e => {
                const code = e.node.class;
                if (code) {
                    // Normalize: remove spaces, uppercase
                    const norm = code.toUpperCase().replace(/\s+/g, '');
                    // Basic sanity check
                    if (norm.length >= 3) {
                        courses.add(norm);
                    }
                }
            });
            return Array.from(courses);
        }
        return [];
    } catch (e) {
        return [];
    }
}

const delay = ms => new Promise(r => setTimeout(r, ms));

async function run() {
    if (!fs.existsSync(MASTER_LIST_PATH)) {
        console.error("Master list not found.");
        return;
    }

    const masterList = JSON.parse(fs.readFileSync(MASTER_LIST_PATH, 'utf8'));
    console.log(`Loaded ${masterList.length} professors from Master List.`);

    // Load existing progress if any
    let db = [];
    if (fs.existsSync(OUTPUT_PATH)) {
        try {
            db = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'));
            console.log(`Resuming... Loaded ${db.length} existing entries.`);
        } catch (e) { }
    }

    const processedIds = new Set(db.map(p => p.legacyId));
    let count = 0;

    for (const prof of masterList) {
        if (processedIds.has(prof.legacyId)) continue;

        process.stdout.write(`Fetching ${prof.firstName} ${prof.lastName}... `);
        await delay(DELAY_MS);

        const courses = await getProfessorCourses(prof.legacyId);

        const entry = {
            name: `${prof.firstName} ${prof.lastName}`,
            legacyId: prof.legacyId,
            avgRating: prof.avgRating,
            numRatings: prof.numRatings,
            department: prof.department,
            courses // [PESS237, ...]
        };

        db.push(entry);
        processedIds.add(prof.legacyId);
        count++;

        if (courses.length > 0) {
            process.stdout.write(`✅ Found ${courses.length}\n`);
        } else {
            console.log("❌ No courses");
        }

        // Save frequently
        if (count % 10 === 0) {
            fs.writeFileSync(OUTPUT_PATH, JSON.stringify(db, null, 2));
        }
    }

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(db, null, 2));
    console.log(`\n🎉 Completed! DB Size: ${db.length}`);
}

run();
