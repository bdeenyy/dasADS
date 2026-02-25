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

  // Let's check user self info
  const res1 = await fetch('https://api.avito.ru/core/v1/accounts/self', { 
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const data1 = await res1.json();
  console.log('Self Info:', data1);
  
  if (data1.id) {
    const res2 = await fetch('https://api.avito.ru/core/v1/accounts/' + data1.id + '/items', { 
      headers: { 'Authorization': 'Bearer ' + token }
    });
    console.log('Items:', await res2.json());
  }
}
check();
