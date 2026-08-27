import { createClient } from '@insforge/sdk';

const insforge = createClient({
  baseUrl: 'https://ys3vu493.us-east.insforge.app',
  anonKey: 'ik_e6c7c7db10d459ccb2771fa3d3dba57f'
});

async function run() {
  // Try to insert a dummy coin and delete it to test RLS
  const dummy = { name: 'Test', year: '2000', condition: 'Mint', country: 'US', description: 'test' };
  
  // We can't insert without a logged in user unless RLS allows anon inserts
  // Let's just log something
  console.log('Testing...');
}

run();
