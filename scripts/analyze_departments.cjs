const fs = require('fs');
const path = require('path');

const MASTER_PATH = path.join(__dirname, '..', 'data', 'professor_courses_full.json');
const WSU_DATA_PATH = path.join(__dirname, '..', 'data', 'wsuData.ts');
// Note: wsuData.ts is TS file, I can't require it directly. I'll use grep or regex to extract IDs.
// Or read professors_data.json keys.
const PROFS_DATA_PATH = path.join(__dirname, '..', 'data', 'professors_data.json');

const master = JSON.parse(fs.readFileSync(MASTER_PATH, 'utf8'));
const rmpDepts = new Set(master.map(p => p.department));

console.log(`RMP Departments (${rmpDepts.size}):`);
console.log([...rmpDepts].sort());

if (fs.existsSync(PROFS_DATA_PATH)) {
    const profsData = JSON.parse(fs.readFileSync(PROFS_DATA_PATH, 'utf8'));
    console.log(`\nExisting Keys in professors_data.json (${Object.keys(profsData).length}):`);
    console.log(Object.keys(profsData).sort());
}
