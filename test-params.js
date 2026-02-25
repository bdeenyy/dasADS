const fs = require('fs');
const doc = JSON.parse(fs.readFileSync('Справочные_материалы/swagger', 'utf8'));
console.log(JSON.stringify(doc.paths['/job/v2/vacancies'].get.parameters, null, 2));
