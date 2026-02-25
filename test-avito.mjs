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

  const vacRes = await fetch('https://api.avito.ru/job/v2/vacancies', { headers: { 'Authorization': 'Bearer ' + token } });
  const vacData = await vacRes.json();
  console.log(JSON.stringify(vacData, null, 2));
}
check();
