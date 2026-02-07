const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'professors_data.json');

if (fs.existsSync(DATA_PATH)) {
    const data = require(DATA_PATH);
    const titles = new Set();
    const suspicious = [];

    Object.values(data).flat().forEach(p => {
        titles.add(p.title);
        if (/assistant|manager|staff|secretary|coordinator|specialist/i.test(p.title) && !/professor|lecturer|instructor|faculty/i.test(p.title)) {
            suspicious.push(`${p.name} (${p.title})`);
        }
    });

    console.log("--- Unique Titles ---");
    [...titles].sort().forEach(t => console.log(t));

    console.log("\n--- Suspicious Entries (Non-Instructional?) ---");
    suspicious.forEach(s => console.log(s));
} else {
    console.log("Data file not found.");
}
