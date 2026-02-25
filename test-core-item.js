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

  // Let's test core v1 item
  const res1 = await fetch('https://api.avito.ru/core/v1/items/7931154562', { 
    headers: { 'Authorization': 'Bearer ' + token }
  });
  console.log('Core V1 Item 7931154562:', await res1.json());
}
check();
