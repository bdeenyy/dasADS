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

  // Let's check status for one of the IDs we previously saw
  const reqBody = { ids: ['7547286411', '8001264132', '7970789184'] };
  const statRes = await fetch('https://api.avito.ru/job/v2/vacancies/statuses', { 
    method: 'POST', 
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify(reqBody)
  });
  const statData = await statRes.json();
  console.log(JSON.stringify(statData, null, 2));
}
check();
