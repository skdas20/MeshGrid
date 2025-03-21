// Run this script to update your frontend script.js with the backend URL
// Usage: node update-backend-url.js [BACKEND_URL]

const fs = require('fs');
const path = require('path');

// Get backend URL from command line argument or use default
const backendUrl = process.argv[2] || 'https://web-production-f35ee.up.railway.app';

// Path to script.js file
const scriptPath = path.join('public', 'script.js');

try {
    // Read the current script.js file
    let scriptContent = fs.readFileSync(scriptPath, 'utf8');
    
    // Replace the Socket.IO connection line
    const originalLine = /const socket = io\(.*\);/;
    const newLine = `const socket = io('${backendUrl}');`;
    
    if (originalLine.test(scriptContent)) {
        scriptContent = scriptContent.replace(originalLine, newLine);
        console.log(`Replaced Socket.IO connection with: ${newLine}`);
    } else {
        // If the original format is not found, find a fallback initialization
        const fallbackOriginal = /const socket = io;|const socket = io\(\);/;
        if (fallbackOriginal.test(scriptContent)) {
            scriptContent = scriptContent.replace(fallbackOriginal, newLine);
            console.log(`Replaced Socket.IO connection with: ${newLine}`);
        } else {
            console.error('Could not find Socket.IO connection line to replace.');
            process.exit(1);
        }
    }
    
    // Write the updated content back to script.js
    fs.writeFileSync(scriptPath, scriptContent);
    console.log(`Successfully updated ${scriptPath} with the backend URL: ${backendUrl}`);
    
} catch (err) {
    console.error(`Error updating file: ${err.message}`);
    process.exit(1);
} 