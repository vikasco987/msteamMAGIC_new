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
    
    const getUserRegex = /await\s+([a-zA-Z0-9_\.]+)\.getUser\((userId|id|assignerId|assigneeId)\)/g;
    
    content = content.replace(getUserRegex, (match, clientStr, idVar) => {
        // If it's already wrapped, skip
        if (original.includes(`(${idVar}.startsWith('custom_')`)) {
            return match;
        }
        return `(${idVar}.startsWith('custom_') ? { id: ${idVar}, emailAddresses: [], firstName: 'Custom', lastName: 'User', publicMetadata: {}, privateMetadata: {} } as any : await ${clientStr}.getUser(${idVar}))`;
    });

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log("Modified:", filePath);
        filesModified++;
    }
});

console.log("Total files modified:", filesModified);
