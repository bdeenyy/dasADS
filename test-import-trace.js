const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const org = await prisma.organization.findFirst();
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', org.avitoClientId);
  params.append('client_secret', org.avitoClientSecret);

  const tokenRes = await fetch('https://api.avito.ru/token/', { method: 'POST', body: params });
  const tokenData = await tokenRes.json();
  const token = tokenData.access_token;

  // GET /job/v2/vacancies
  const res1 = await fetch('https://api.avito.ru/job/v2/vacancies', { 
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const data1 = await res1.json();
  const vacancies = data1.vacancies || data1.items || data1;
  if (Array.isArray(vacancies)) {
     console.log('Vacancies count:', vacancies.length);
     vacancies.forEach(v => {
        const match = String(v.link||'').match(/_(\d+)$/);
        const id = match ? match[1] : null;
        if (id === '7931154562') console.log('Found 7931154562 in /job/v2/vacancies!');
     });
  }
}
check();
