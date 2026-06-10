const fs = require('fs');
const path = require('path');

// Read or initialize version
const versionFile = path.join(__dirname, 'version.json');
let versionData = { version: "1.0.0" };

if (fs.existsSync(versionFile)) {
  try {
    versionData = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
  } catch (err) {
    console.error('Error reading version.json, resetting to 1.0.0');
  }
}

// Increment patch version (major.minor.patch)
const parts = versionData.version.split('.').map(Number);
if (parts.length === 3 && !parts.some(isNaN)) {
  parts[2] += 1; // Increment patch
  versionData.version = parts.join('.');
} else {
  versionData.version = "1.0.0";
}

const newVersion = versionData.version;
fs.writeFileSync(versionFile, JSON.stringify(versionData, null, 2), 'utf8');

console.log(`\n🚀 Bumping version to: v${newVersion}`);

// HTML files to update in this directory
const htmlFiles = [
  'index.html',
  'about.html',
  'contact.html',
  'privacy.html',
  'terms.html'
];

htmlFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if span placeholder exists
  const spanRegex = /<span id="app-version">v\d+\.\d+\.\d+<\/span>/;
  if (spanRegex.test(content)) {
    content = content.replace(spanRegex, `<span id="app-version">v${newVersion}</span>`);
    console.log(`✅ Updated version to v${newVersion} in ${file}`);
  } else {
    // Inject it for the first time next to copyright notice
    const copyrightString = 'All rights reserved.</p>';
    if (content.includes(copyrightString)) {
      content = content.replace(copyrightString, `All rights reserved. <span id="app-version" style="margin-left: 8px; opacity: 0.6; font-size: 0.85em;">v${newVersion}</span></p>`);
      console.log(`➕ Injected version v${newVersion} in ${file}`);
    } else {
      console.log(`❌ Could not inject version in ${file} (Copyright text mismatch)`);
    }
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
});
console.log('🎉 Version bump completed successfully!\n');
