const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'professors_data.json');

if (fs.existsSync(DATA_PATH)) {
    console.log("Loading professors data...");
    const data = require(DATA_PATH);
    let removedCount = 0;

    for (const dept in data) {
        const originalLength = data[dept].length;
        // Filter out Administrative Assistants and specific incorrect entries
        data[dept] = data[dept].filter(p => !p.title.includes("Administrative Assistant") &&
            p.name !== "Kristin Holtan" &&
            p.name !== "Michael Brennan" &&
            p.name !== "Joe Allar");

        if (data[dept].length < originalLength) {
            removedCount += (originalLength - data[dept].length);
            console.log(`Removed ${originalLength - data[dept].length} entries from ${dept}`);
        }
    }

    if (removedCount > 0) {
        fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
        console.log(`\n✅ Removed ${removedCount} non-faculty entries.`);
    } else {
        console.log("\n✅ No non-faculty entries found.");
    }
} else {
    console.error("❌ Data file not found.");
}
