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

  const res1 = await fetch('https://api.avito.ru/core/v1/items?status=active', { 
    headers: { 'Authorization': 'Bearer ' + token }
  });
  console.log('Core V1 Active Items:', await res1.json());

  const res2 = await fetch('https://api.avito.ru/core/v1/items?status=old', { 
    headers: { 'Authorization': 'Bearer ' + token }
  });
  console.log('Core V1 Old Items:', await res2.json());
}
check();
