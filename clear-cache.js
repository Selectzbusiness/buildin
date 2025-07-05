const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 Clearing TypeScript and Node.js cache...');

// Clear TypeScript cache
try {
  const tsCachePath = path.join(__dirname, 'node_modules', '.cache');
  if (fs.existsSync(tsCachePath)) {
    fs.rmSync(tsCachePath, { recursive: true, force: true });
    console.log('✅ TypeScript cache cleared');
  }
} catch (error) {
  console.log('⚠️  Could not clear TypeScript cache:', error.message);
}

// Clear node_modules cache
try {
  execSync('npm cache clean --force', { stdio: 'inherit' });
  console.log('✅ npm cache cleared');
} catch (error) {
  console.log('⚠️  Could not clear npm cache:', error.message);
}

// Remove node_modules and reinstall
try {
  console.log('🗑️  Removing node_modules...');
  fs.rmSync(path.join(__dirname, 'node_modules'), { recursive: true, force: true });
  console.log('✅ node_modules removed');
  
  console.log('📦 Reinstalling dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies reinstalled');
} catch (error) {
  console.log('⚠️  Could not reinstall dependencies:', error.message);
}

console.log('🎉 Cache clearing complete! Try running "npm start" again.'); 