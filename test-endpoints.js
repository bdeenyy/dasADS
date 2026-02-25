const fs = require('fs');
const doc = JSON.parse(fs.readFileSync('Справочные_материалы/swagger', 'utf8'));
const paths = Object.keys(doc.paths).filter(p => p.includes('{vacancy_id}'));
console.log('Endpoints with {vacancy_id}:', paths);
