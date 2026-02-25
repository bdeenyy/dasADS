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
  
  const req1 = await fetch('https://api.avito.ru/job/v1/applications/get_ids?updatedAtFrom=2024-01-01', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token }
  });
  const data1 = await req1.json();
  
  const ids = data1.result || [];
  if (ids.length > 0) {
      console.log(Found  applications);
      const allIds = ids.slice(0, 10).map(x => x.id); // take first 10
      const req2 = await fetch('https://api.avito.ru/job/v1/applications/get_by_ids', {
          method: 'POST',
          headers: {
              'Authorization': 'Bearer ' + token,
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ ids: allIds })
      });
      const data2 = await req2.json();
      console.log('get_by_ids candidate data preview:', JSON.stringify(data2.result[0], null, 2));
  } else {
      console.log('No applications found in get_ids');
  }
}
check();
