const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
    });
}

const apiDir = path.join(__dirname, 'src/app/api');
let filesModified = 0;

walkDir(apiDir, (filePath) => {
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Regular expression to match imports from @clerk/nextjs/server that include auth
    // Examples: 
    // import { auth } from "@clerk/nextjs/server";
    // import { auth, clerkClient } from "@clerk/nextjs/server";
    // import { clerkClient, auth } from "@clerk/nextjs/server";
    
    const importRegex = /import\s*\{\s*([^}]+)\s*\}\s*from\s*["']@clerk\/nextjs\/server["'];?/g;
    
    content = content.replace(importRegex, (match, importsStr) => {
        // Check if auth is in the list
        if (!importsStr.includes('auth')) return match;
        
        // Remove auth from the list
        const imports = importsStr.split(',').map(s => s.trim());
        const filteredImports = imports.filter(i => i !== 'auth' && i !== 'auth as clerkAuthFn');
        
        let newLines = [];
        if (filteredImports.length > 0) {
            newLines.push(`import { ${filteredImports.join(', ')} } from "@clerk/nextjs/server";`);
        }
        newLines.push(`import { auth } from "@/lib/auth-utils";`);
        
        return newLines.join('\n');
    });

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log("Modified:", filePath);
        filesModified++;
    }
});

console.log("Total files modified:", filesModified);
