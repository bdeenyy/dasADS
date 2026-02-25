const fs = require('fs');
const doc = JSON.parse(fs.readFileSync('Справочные_материалы/swagger', 'utf8'));

const endpoints = [];
for (const [path, methods] of Object.entries(doc.paths)) {
  for (const [method, operation] of Object.entries(methods)) {
    if (path.includes('status')) {
      endpoints.push(${method.toUpperCase()} );
    }
  }
}
console.log('Endpoints with status in path:', endpoints);
