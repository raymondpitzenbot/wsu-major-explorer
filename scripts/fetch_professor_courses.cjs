const axios = require('axios');
const fs = require('fs');
const path = require('path');

const RMP_GRAPHQL_URL = 'https://www.ratemyprofessors.com/graphql';
const DATA_PATH = path.join(__dirname, '..', 'data', 'professors_data.json');
const BATCH_SAVE_SIZE = 10;
const DELAY_MS = 300; // Delay between requests

async function getProfessorCourses(legacyId) {
    if (!legacyId) return [];

    // Construct Global ID
    // ID must be base64 encoded "Teacher-<ExampleID>"
    // E.g. Teacher-3048580
    const globalId = Buffer.from(`Teacher-${legacyId}`).toString('base64');

    const query = `
        query TeacherCourses($id: ID!) {
            node(id: $id) {
                ... on Teacher {
                    id
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
                    // Start normalization: remove spaces, uppercase
                    const norm = code.toUpperCase().replace(/\s+/g, '');
                    // Only keep alphanumeric valid-ish codes (e.g. at least 1 letter, 1 number, length > 3)
                    if (norm.length >= 3 && /[A-Z]/.test(norm) && /[0-9]/.test(norm)) {
                        courses.add(norm); // Store normalized e.g. PESS237
                    } else if (code.length > 2) {
                        // Keep original if it looks like a meaningful string (e.g. "Cap stone")
                        courses.add(code.trim());
                    }
                }
            });
            return Array.from(courses);
        }
        return [];
    } catch (e) {
        // console.error(`Error fetching for ID ${legacyId}: ${e.message}`);
        return [];
    }
}

const delay = ms => new Promise(r => setTimeout(r, ms));

async function run() {
    if (!fs.existsSync(DATA_PATH)) {
        console.error("Data file not found.");
        return;
    }

    const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    let count = 0;
    let updated = 0;

    console.log("🚀 Starting Course Code Fetch...");

    for (const deptId in data) {
        const profs = data[deptId];
        console.log(`Processing ${deptId} (${profs.length} professors)...`);

        for (let i = 0; i < profs.length; i++) {
            const prof = profs[i];

            // Skip if already has courses (unless force refresh? User said "take our library... and take codes", implying fill missing)
            // But to be safe, let's always fetch to ensure completeness.

            if (prof.rmp_id) {
                process.stdout.write(`   Fetching courses for ${prof.name} (${prof.rmp_id})... `);
                await delay(DELAY_MS);

                const courses = await getProfessorCourses(prof.rmp_id);

                if (courses.length > 0) {
                    prof.courses_taught = courses;
                    updated++;
                    process.stdout.write(`✅ Found ${courses.length} courses: ${courses.slice(0, 3).join(', ')}...\n`);
                } else {
                    process.stdout.write(`❌ No courses found.\n`);
                    prof.courses_taught = [];
                }
            } else {
                process.stdout.write(`   Skipping ${prof.name} (No RMP ID)\n`);
            }

            count++;
            if (count % BATCH_SAVE_SIZE === 0) {
                fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
                // console.log("   (Saved batch)");
            }
        }
    }

    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
    console.log(`\n🎉 Done! Updated ${updated} professors with course codes.`);
}

run();
