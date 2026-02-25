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
  
  // Hardcoded known apply IDs from the old output log
  const hardcodedIds = ["69957c4a3bb0bbc3920f25ba", "69957b823bb0bbc3920a9086", "6995768b3bb0bbc392ed1679"];
  
  const req2 = await fetch('https://api.avito.ru/job/v1/applications/get_by_ids', {
      method: 'POST',
      headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ids: hardcodedIds })
  });
  const data2 = await req2.json();
  console.log('get_by_ids payload:', JSON.stringify(data2, null, 2));
}
check();
