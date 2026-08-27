import { createClient } from '@insforge/sdk';

const insforge = createClient({
  baseUrl: 'https://ys3vu493.us-east.insforge.app',
  anonKey: 'ik_e6c7c7db10d459ccb2771fa3d3dba57f'
});

async function run() {
  const { data, error } = await insforge.auth.getProfile('aa660cf8-2c0d-4b2e-81ce-bbcf4ac411ac');
  console.log('GetProfile Data:', data);
  console.log('Is Array?', Array.isArray(data));
  console.log('Error:', error);
}

run();
