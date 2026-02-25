const fs = require('fs');
const doc = JSON.parse(fs.readFileSync('Справочные_материалы/swagger', 'utf8'));
console.log('Methods for /job/v1/vacancies:', Object.keys(doc.paths['/job/v1/vacancies']));
console.log('Methods for /job/v1/vacancies/{vacancy_id}:', Object.keys(doc.paths['/job/v1/vacancies/{vacancy_id}']));
