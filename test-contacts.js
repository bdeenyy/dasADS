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

  // Let's see what /core/v1/accounts/self or similar gives us
  const res1 = await fetch('https://api.avito.ru/core/v1/accounts/self', { 
    headers: { 'Authorization': 'Bearer ' + token }
  });
  console.log('accounts/self status:', res1.status);
  console.log('accounts/self data:', await res1.text());

  // Let's check /core/v1/items/{id} directly
  const res2 = await fetch('https://api.avito.ru/core/v1/items/7931154562', { 
    headers: { 'Authorization': 'Bearer ' + token }
  });
  console.log('items/{id} status:', res2.status);
  console.log('items/{id} data:', await res2.text());
}
check();
