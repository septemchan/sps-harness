const fs = require('fs');
const path = require('path');
const { readStdin, ensureDir, getSessionId, log } = require('./lib/utils');

const MAX_FIELD_LEN = 5000;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const SCRUB_PATTERNS = /\b(api[_-]?key|api[_-]?secret|auth[_-]?token|access[_-]?token|refresh[_-]?token|bearer\s+\S+|password|passwd|secret[_-]?key|credential|authorization:\s*\S+)\b[=:]\s*["']?[^\s"',}]{8,}/gi;

try {
  const input = readStdin();
  const toolName = input?.tool_name || input?.tool || 'unknown';
  const toolInput = JSON.stringify(input?.tool_input || '').slice(0, MAX_FIELD_LEN);
  const toolOutput = JSON.stringify(input?.tool_output || '').slice(0, MAX_FIELD_LEN);

  // Scrub sensitive data
  const scrub = (s) => s.replace(SCRUB_PATTERNS, '[SCRUBBED]');

  const cwd = process.cwd();
  const record = {
    timestamp: new Date().toISOString(),
    session_id: process.env.CLAUDE_SESSION_ID || getSessionId(cwd),
    event: 'tool_complete',
    tool: toolName,
    input: scrub(toolInput),
    output: scrub(toolOutput)
  };

  const instinctsDir = path.join(cwd, '.claude', 'instincts');
  const obsFile = path.join(instinctsDir, '.observations.jsonl');
  ensureDir(instinctsDir);

  // Add observations to project root .gitignore
  const rootGitignore = path.join(cwd, '.gitignore');
  const ignoreEntry = '.claude/instincts/.observations.jsonl';
  try {
    const existing = fs.existsSync(rootGitignore) ? fs.readFileSync(rootGitignore, 'utf8') : '';
    if (!existing.includes(ignoreEntry)) {
      fs.appendFileSync(rootGitignore, `\n# superpowers-harness observation logs\n${ignoreEntry}\n`);
    }
  } catch {}

  // Archive if too large
  if (fs.existsSync(obsFile)) {
    const stats = fs.statSync(obsFile);
    if (stats.size > MAX_FILE_SIZE) {
      const archiveName = `.observations-${new Date().toISOString().slice(0, 10)}.jsonl`;
      fs.renameSync(obsFile, path.join(instinctsDir, archiveName));
    }
  }

  // Append record
  fs.appendFileSync(obsFile, JSON.stringify(record) + '\n');
} catch (e) {
  log(`observe error: ${e.message}`);
}
process.exit(0);
