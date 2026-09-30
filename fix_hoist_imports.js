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
    if (filePath.includes('ClientLayout.tsx') || filePath.includes('useUnifiedAuth.ts')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    let hasUseUser = false;
    let hasUseAuth = false;

    // Regex to aggressively remove all injected imports (including trailing semicolons)
    // Matches: import { useUnifiedAuth as useUser } from "@/lib/useUnifiedAuth";;
    content = content.replace(/import\s*\{\s*useUnifiedAuth\s+as\s+useUser\s*\}\s*from\s*['"]@\/lib\/useUnifiedAuth['"];*/g, () => {
        hasUseUser = true;
        return '';
    });

    content = content.replace(/import\s*\{\s*useAuth\s*\}\s*from\s*['"]@\/lib\/useUnifiedAuth['"];*/g, () => {
        hasUseAuth = true;
        return '';
    });

    // Clean up empty clerk imports
    content = content.replace(/\/\/\s*import\s*\{\s*\}\s*from\s*['"]@clerk\/nextjs['"];*/g, '');
    content = content.replace(/import\s*\{\s*\}\s*from\s*['"]@clerk\/nextjs['"];*/g, '');
    
    // Clean up any remaining double semicolons or weird blank lines if needed, but not strictly necessary

    if (hasUseUser || hasUseAuth) {
        const usesUseUser = /useUser\s*\(/.test(content);
        const usesUseAuth = /useAuth\s*\(/.test(content);

        let importsToAdd = [];
        if (usesUseUser) importsToAdd.push('useUnifiedAuth as useUser');
        if (usesUseAuth) importsToAdd.push('useAuth');

        if (importsToAdd.length > 0) {
            const importStatement = `import { ${importsToAdd.join(', ')} } from "@/lib/useUnifiedAuth";\n`;
            // Add to the top of the file
            content = importStatement + content;
        }
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log("Modified:", filePath);
        filesModified++;
    }
});

console.log("Total files modified:", filesModified);
