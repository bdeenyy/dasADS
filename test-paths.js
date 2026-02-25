const fs = require('fs');
const doc = JSON.parse(fs.readFileSync('Справочные_материалы/swagger', 'utf8'));
const paths = Object.keys(doc.paths).filter(p => p.startsWith('/job/v2/vacancies'));
console.log('Endpoints starting with /job/v2/vacancies:', paths);
