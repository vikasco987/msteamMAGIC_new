const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const targetStr = 'import { auth } from "@/lib/auth-utils";';

walkDir('./src/app/api', function(filePath) {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Count exact matches (excluding commented ones like // import ...)
    const lines = content.split('\n');
    let authImportSeen = false;
    let modified = false;
    
    const regex = /^import\s+\{\s*auth\s*\}\s+from\s+['"]@\/lib\/auth-utils['"];?/;
    const newLines = lines.filter(line => {
      if (regex.test(line.trim())) {
        if (authImportSeen) {
          modified = true;
          return false; // remove duplicate
        }
        authImportSeen = true;
      }
      return true;
    });

    if (modified) {
      fs.writeFileSync(filePath, newLines.join('\n'), 'utf-8');
      console.log(`Fixed duplicates in ${filePath}`);
    }
  }
});
