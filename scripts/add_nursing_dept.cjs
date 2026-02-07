/**
 * Quick script to add Nursing department professors
 * Based on web search results
 */

const fs = require('fs');
const path = require('path');

const existingData = require('../data/professors_data.json');

// Add nursing department with top faculty (from search results)
existingData.nursing_dept = [
    {
        name: "Amy Reitmaier",
        title: "Department Chair, Professor",
        // Will need RMP search
    },
    {
        name: "Kimberly Langer",
        title: "Professor",
    },
    {
        name: "Sandra Paddock",
        title: "Professor",
    }
];

// Save updated data
const outputPath = path.join(__dirname, '..', 'data', 'professors_data.json');
fs.writeFileSync(outputPath, JSON.stringify(existingData, null, 2));

console.log('✅ Added Nursing department!');
console.log(`   Total departments: ${Object.keys(existingData).length}`);
