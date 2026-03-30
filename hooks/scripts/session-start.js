const fs = require('fs');
const path = require('path');
const { fileExists, readFile, respond, log } = require('./lib/utils');

try {
  const cwd = process.cwd();
  const claudeDir = path.join(cwd, '.claude');
  const specsDir = path.join(cwd, 'docs', 'superpowers', 'specs');
  const claudeMd = path.join(claudeDir, 'CLAUDE.md');
  // Also check project root for CLAUDE.md
  const rootClaudeMd = path.join(cwd, 'CLAUDE.md');

  const hasClaudeDir = fileExists(claudeDir);
  const hasSpecs = fileExists(specsDir) && fs.readdirSync(specsDir).some(f => f.endsWith('.md'));
  const hasClaudeMd = fileExists(claudeMd) || fileExists(rootClaudeMd);

  // Case 1: Has design docs but no CLAUDE.md → suggest /harvest
  if (hasSpecs && !hasClaudeMd) {
    respond('Design docs found but no CLAUDE.md. Run /harvest to generate project configuration.');
    process.exit(0);
  }

  // Case 2: No .claude/ at all → suggest /harness-audit
  if (!hasClaudeDir) {
    respond('This project has no .claude/ architecture yet. Run /harness-audit to see what\'s missing and get setup guidance.');
    process.exit(0);
  }

  // Case 3: CLAUDE.md exists but may be stale → check age
  const activeMd = fileExists(claudeMd) ? claudeMd : (fileExists(rootClaudeMd) ? rootClaudeMd : null);
  if (activeMd) {
    const content = readFile(activeMd);
    if (content) {
      const dateMatch = content.match(/Last updated:\s*(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        const lastUpdated = new Date(dateMatch[1]);
        const daysSince = Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSince > 30) {
          respond(`CLAUDE.md last updated ${daysSince} days ago. Consider re-running /harvest to sync.`);
        }
      }
    }
  }

  // Case 4: Check observation count for /learn reminder
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
