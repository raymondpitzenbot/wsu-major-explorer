const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'professors_data.json');

if (!fs.existsSync(DATA_PATH)) {
    console.error("Data file missing.");
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
let totalProfs = 0;
let zeroRatings = 0;
let missingIds = 0;
let weirdRatings = 0;

console.log("🔍 Validating Professor Data...");

for (const dept in data) {
    const profs = data[dept];
    if (!Array.isArray(profs)) continue;

    profs.forEach(p => {
        totalProfs++;

        if (!p.rmp_id) {
            console.log(`⚠️  ${p.name} (${dept}) missing RMP ID.`);
            missingIds++;
        }

        if (p.num_ratings === 0) {
            zeroRatings++;
        }

        if (p.avg_rating > 5.0 || p.avg_rating < 0) {
            console.log(`⚠️  ${p.name} has invalid rating ${p.avg_rating}`);
            weirdRatings++;
        }

        // Check inconsistencies
        if (p.avg_rating > 0 && p.num_ratings === 0) {
            console.log(`⚠️  ${p.name} has rating ${p.avg_rating} but 0 reviews!`);
        }
    });
}

console.log("\n📊 Summary:");
console.log(`Total Professors: ${totalProfs}`);
console.log(`Zero Ratings/N/A: ${zeroRatings}`);
console.log(`Missing IDs: ${missingIds}`);
console.log(`Invalid Ratings: ${weirdRatings}`);
console.log("✅ Data check complete.");
