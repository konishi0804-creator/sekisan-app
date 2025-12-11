const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

const WATCH_DIR = process.cwd();
const DEBOUNCE_MS = 3000;
const IGNORE_DIRS = ['.git', '.next', 'node_modules', '.agent'];

let timeoutId = null;

console.log(`Starting Auto Git Sync...`);
console.log(`Watching: ${WATCH_DIR}`);

function runGitSequence() {
    console.log('Changes detected. Starting Git sequence...');

    const cmd = `git add . && git commit -m "auto: file saved" && git push`;

    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.error(`Git Error: ${error.message}`);
            // Check for specific known errors
            if (stderr.includes('Author identity unknown')) {
                console.error('CRITICAL: Git user identity is not set. Please run:');
                console.error('git config --global user.email "you@example.com"');
                console.error('git config --global user.name "Your Name"');
            }
            return;
        }
        if (stderr) {
            console.log(`Git Stderr: ${stderr}`);
        }
        console.log(`Git Stdout: ${stdout}`);
        console.log('Sync complete.');
    });
}

const watcher = fs.watch(WATCH_DIR, { recursive: true }, (eventType, filename) => {
    if (!filename) return;

    // Simple ignore check
    const parts = filename.split(path.sep);
    if (parts.some(part => IGNORE_DIRS.includes(part))) {
        return;
    }

    // Debounce
    if (timeoutId) clearTimeout(timeoutId);

    console.log(`File changed: ${filename}`);
    timeoutId = setTimeout(() => {
        runGitSequence();
    }, DEBOUNCE_MS);
});

watcher.on('error', (err) => {
    console.error(`Watcher error: ${err}`);
});

console.log('Watcher is active. Press Ctrl+C to stop.');
