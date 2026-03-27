const path = require('path');
const { fileExists, readFile, respond, log } = require('./lib/utils');

try {
  const cwd = process.cwd();
  const claudeDir = path.join(cwd, '.claude');

  if (!fileExists(claudeDir)) {
    respond('This project has no .claude/ architecture yet. Run /harness-audit to see what\'s missing and get setup guidance.');
    process.exit(0);
  }

  // Check observation count for /learn reminder
  const obsFile = path.join(claudeDir, 'instincts', '.observations.jsonl');
  if (fileExists(obsFile)) {
    const content = readFile(obsFile);
    if (content) {
      const lineCount = content.split('\n').filter(l => l.trim()).length;
      if (lineCount > 100) {
        respond(`${lineCount} operations recorded. Run /learn to discover patterns.`);
      }
    }
  }
} catch (e) {
  log(`session-start error: ${e.message}`);
}
process.exit(0);
