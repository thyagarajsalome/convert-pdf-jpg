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

// Dynamically read all HTML files recursively in the project
const getHtmlFiles = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    if (file === 'node_modules' || file === '.git') return;
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getHtmlFiles(filePath));
    } else if (file.endsWith('.html')) {
      results.push(filePath);
    }
  });
  return results;
};

const htmlFiles = getHtmlFiles(__dirname);

htmlFiles.forEach(filePath => {
  const file = path.relative(__dirname, filePath);
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if span placeholder exists (supports optional style attributes)
  const spanRegex = /<span id="app-version"[^>]*>v\d+\.\d+\.\d+<\/span>/;
  if (spanRegex.test(content)) {
    content = content.replace(spanRegex, `<span id="app-version" style="margin-left: 8px; opacity: 0.6; font-size: 0.85em;">v${newVersion}</span>`);
    console.log(`✅ Updated version to v${newVersion} in ${file}`);
  } else {
    // Inject it next to copyright notice (supports English and Hindi copyright texts)
    const copyrightRegex = /(All rights reserved\.|सभी अधिकार सुरक्षित।)<\/p>/;
    if (copyrightRegex.test(content)) {
      content = content.replace(copyrightRegex, (match, p1) => {
        return `${p1} <span id="app-version" style="margin-left: 8px; opacity: 0.6; font-size: 0.85em;">v${newVersion}</span></p>`;
      });
      console.log(`➕ Injected version v${newVersion} in ${file}`);
    } else {
      console.log(`❌ Could not inject version in ${file} (Copyright text mismatch)`);
    }
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
});
console.log('🎉 Version bump completed successfully!\n');
