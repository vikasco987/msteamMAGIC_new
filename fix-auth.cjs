const fs = require('fs');
const glob = require('glob');

const files = glob.sync('/Users/vikas/msteamMAGIC_new/src/app/api/stats/user-performance/**/*.ts');

const oldStr = `    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    
    const role = String(clerkUser.publicMetadata?.role || dbUser?.role || "user").toLowerCase();`;

const newStr = `    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    let rawRole = dbUser?.role;
    if (!rawRole) {
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(userId);
      rawRole = clerkUser.publicMetadata?.role || "user";
    }
    const role = String(rawRole).toLowerCase();`;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes(oldStr)) {
        content = content.replace(oldStr, newStr);
        fs.writeFileSync(file, content);
        console.log(`Updated ${file}`);
    } else {
        // Try relaxed whitespace matching
        const relaxedOld = /const client = await clerkClient\(\);\s*const clerkUser = await client\.users\.getUser\(userId\);\s*const dbUser = await prisma\.user\.findUnique\(\{ where: \{ clerkId: userId \} \}\);\s*const role = String\(clerkUser\.publicMetadata\?\.role \|\| dbUser\?\.role \|\| "user"\)\.toLowerCase\(\);/m;
        
        if (relaxedOld.test(content)) {
            content = content.replace(relaxedOld, newStr);
            fs.writeFileSync(file, content);
            console.log(`Updated (relaxed) ${file}`);
        } else {
            console.log(`Skipped ${file}`);
        }
    }
});
