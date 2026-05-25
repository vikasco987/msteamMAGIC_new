require('dotenv').config();
const { clerkClient } = require('@clerk/clerk-sdk-node');

async function test() {
  const users = await clerkClient.users.getUserList({ limit: 500 });
  console.log('Total users fetched:', users.length);
  // also get total count
  const count = await clerkClient.users.getCount();
  console.log('Total users in Clerk:', count);
}

test().catch(console.error);
