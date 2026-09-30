const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

const regex = /\(\s*(?:String\()?([a-zA-Z0-9_\.]+)(?:\))?\.startsWith\('custom_'\)\s*\?\s*\{\s*id:\s*\1\s*,\s*emailAddresses:\s*\[\],\s*firstName:\s*'Custom',\s*lastName:\s*'User',\s*publicMetadata:\s*\{\},\s*privateMetadata:\s*\{\}\s*\}\s*as\s+any\s*:\s*await\s+(?:[a-zA-Z0-9_\.]+\.)?users\.getUser\(\1\)\s*\)/g;

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(directoryPath);

let totalReplaced = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // First, let's see if there are matches
    if (regex.test(content)) {
        // Reset regex state after test
        regex.lastIndex = 0;
        
        let fileModified = false;
        
        // Add import { getUserDetails } from "@/lib/auth-utils" if not present
        if (!content.includes('getUserDetails') && !content.includes('import { getUserDetails }')) {
            // Find the last import statement
            const lastImportIndex = content.lastIndexOf('import ');
            if (lastImportIndex !== -1) {
                const endOfLastImport = content.indexOf('\n', lastImportIndex);
                content = content.slice(0, endOfLastImport + 1) + 'import { getUserDetails } from "@/lib/auth-utils";\n' + content.slice(endOfLastImport + 1);
            } else {
                content = 'import { getUserDetails } from "@/lib/auth-utils";\n' + content;
            }
        }
        
        // Replace
        const newContent = content.replace(regex, '(await getUserDetails($1))');
        
        if (content !== newContent) {
            fs.writeFileSync(file, newContent, 'utf8');
            console.log(`Updated: ${file}`);
            totalReplaced++;
        }
    }
});

console.log(`Total files updated: ${totalReplaced}`);
