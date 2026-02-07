// Add these URLs to existing professors_data.json manually based on web search results

const fs = require('fs');
const path = require('path');

const current = require('../data/professors_data.json');

// Manually adding critical departments with faculty from web search results
const additionalDepts = {
    'psychology_dept': [
        { name: 'Dr. Amanda Brouwer', title: 'Professor' },
        { name: 'Dr. Carrie Fried', title: 'Professor' },
        { name: 'Dr. John Johanson', title: 'Department Chair, Professor' },
    ],
    'nursing_dept': [
        { name: 'Kimberly Langer', title: 'Professor' },
        { name: 'Sandra Paddock', title: 'Professor' },
        { name: 'Amy Reitmaier', title: 'Department Chair, Professor' },
    ],
    'computer_science_dept': [
        { name: 'Dr. Mingrui Zhang', title: 'Department Chair, Professor' },
        { name: 'Dr. Gerald Cichanowski', title: 'Professor' },
        { name: 'Dr. Chi-Cheng Lin', title: 'Professor' },
    ],
    'biology_dept': [
        { name: 'Dr. Amy Runck', title: 'Department Chair, Professor' },
        { name: 'Dr. Ted Wilson', title: 'Professor' },
        { name: 'Dr. Kimberly Bates', title: 'Professor' },
    ],
    'accounting_dept': [
        { name: 'Scott Chiu', title: 'Professor' },
        { name: 'Jodi Olson', title: 'Professor' },
        { name: 'William Ortega', title: 'Department Chair, Professor' },
    ],
};

// Merge with existing
const merged = { ...current, ...additionalDepts };

// Save
const outputPath = path.join(__dirname, '..', 'data', 'professors_data.json');
fs.writeFileSync(outputPath, JSON.stringify(merged, null, 2));

console.log('✅ Added 5 critical departments manually!');
console.log(`   Total departments now: ${Object.keys(merged).length}`);
console.log('   Added: Psychology, Nursing, Computer Science, Biology, Accounting');
