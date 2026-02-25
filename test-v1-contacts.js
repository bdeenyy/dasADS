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

  // Check /job/v1/vacancies/{id}
  const res2 = await fetch('https://api.avito.ru/job/v1/vacancies/7931154562', { 
    headers: { 'Authorization': 'Bearer ' + token }
  });
  console.log('job/v1/vacancies/{id}:', await res2.text());
}
check();
