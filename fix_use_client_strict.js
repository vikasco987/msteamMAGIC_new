const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
    });
}

const appDir = path.join(__dirname, 'src/app');
let filesModified = 0;

walkDir(appDir, (filePath) => {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    const lines = content.split('\n');
    let activeIndex = -1;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // Skip empty lines and comments
        if (line === '' || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) continue;
        
        if (line === '"use client"' || line === "'use client'" || line === '"use client";' || line === "'use client';") {
            activeIndex = i;
            break;
        }
        
        // If we hit any other active code (except the imports we injected at the top), we should ideally stop.
        // But let's just scan the whole file for the first active "use client" if it's placed weirdly.
        if (line.startsWith('export default') || line.startsWith('function ') || line.startsWith('const ')) {
            break;
        }
    }

    if (activeIndex !== -1) {
        // Only modify if it's not already at the very top (line 0)
        if (activeIndex > 0) {
            // Remove the line
            lines.splice(activeIndex, 1);
            // Prepend it
            content = '"use client";\n' + lines.join('\n');
            fs.writeFileSync(filePath, content, 'utf8');
            console.log("Modified to hoist use client:", filePath);
            filesModified++;
        }
    }
});

console.log("Total files modified:", filesModified);
