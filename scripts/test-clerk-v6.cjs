require('dotenv').config();
const { createClerkClient } = require('@clerk/backend');

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
});

async function test() {
  const users = await clerkClient.users.getUserList({ limit: 500 });
  console.log('Total fetched:', users.data.length);
  const banned = users.data.filter(u => u.banned);
  console.log('Banned users:', banned.length);
  if (banned.length > 0) {
      console.log('Banned user emails:', banned.map(u => u.emailAddresses[0]?.emailAddress));
  }
}

test().catch(console.error);
