const fs = require('fs');
const path = require('path');

const nextDir = path.join(__dirname, '.next');

console.log('🧹 Cleaning up build cache (.next folder)...');

try {
    if (fs.existsSync(nextDir)) {
        fs.rmSync(nextDir, { recursive: true, force: true });
        console.log('✅ Deleted .next folder successfully.');
    } else {
        console.log('ℹ️  .next folder was already gone.');
    }
} catch (e) {
    console.error('❌ Failed to delete .next folder:', e.message);
    console.log('Try closing your VS Code running terminal first!');
}

console.log('\n🚀 NOW RUN: npm run dev');
