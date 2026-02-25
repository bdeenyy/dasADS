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

  // Let's test with various headers
  const res1 = await fetch('https://api.avito.ru/job/v2/vacancies/7547286411?fields=is_active', { 
    headers: { 'Authorization': 'Bearer ' + token, 'X-Is-Employee': 'true' }
  });
  console.log('With true:', await res1.json());

  const res2 = await fetch('https://api.avito.ru/job/v2/vacancies/7547286411?fields=is_active', { 
    headers: { 'Authorization': 'Bearer ' + token, 'X-Is-Employee': 'false' }
  });
  console.log('With false:', await res2.json());
}
check();
