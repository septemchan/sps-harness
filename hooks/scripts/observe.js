const fs = require('fs');
const path = require('path');
const { readStdin, ensureDir, getSessionId, log } = require('./lib/utils');

const MAX_FIELD_LEN = 5000;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const SCRUB_PATTERNS = /\b(api[_-]?key|api[_-]?secret|auth[_-]?token|access[_-]?token|refresh[_-]?token|password|passwd|secret[_-]?key|private[_-]?key|client[_-]?secret|x-api-key|credential|session[_-]?secret)\b[=:]\s*["']?[^\s"',}]{4,}/gi;
const BEARER_PATTERN = /bearer\s+[A-Za-z0-9._\-]{20,}/gi;
const AUTH_HEADER_PATTERN = /authorization:\s*(Bearer|Basic)\s+[A-Za-z0-9._\-]{20,}/gi;

try {
  // Only record in git repositories to avoid writing in system/temp directories
  const cwd = process.cwd();
  if (!fs.existsSync(path.join(cwd, '.git'))) process.exit(0);

  const input = readStdin();
  const toolName = input?.tool_name || input?.tool || 'unknown';

  // Scrub before truncate so sensitive data at the boundary isn't missed
  const scrub = (s) => s
    .replace(SCRUB_PATTERNS, '[SCRUBBED]')
    .replace(BEARER_PATTERN, '[SCRUBBED]')
    .replace(AUTH_HEADER_PATTERN, '[SCRUBBED]');

  const toolInput = scrub(JSON.stringify(input?.tool_input || '')).slice(0, MAX_FIELD_LEN);
  const toolOutput = scrub(JSON.stringify(input?.tool_output || '')).slice(0, MAX_FIELD_LEN);

  const record = {
    timestamp: new Date().toISOString(),
    session_id: process.env.CLAUDE_SESSION_ID || getSessionId(cwd),
    event: 'tool_complete',
    tool: toolName,
    input: toolInput,
    output: toolOutput
  };

  const instinctsDir = path.join(cwd, '.claude', 'instincts');
  const obsFile = path.join(instinctsDir, '.observations.jsonl');
  ensureDir(instinctsDir);

  // Add observations to project root .gitignore
  const rootGitignore = path.join(cwd, '.gitignore');
  const ignoreEntry = '.claude/instincts/.observations*.jsonl';
  try {
    const existing = fs.existsSync(rootGitignore) ? fs.readFileSync(rootGitignore, 'utf8') : '';
    if (!existing.includes(ignoreEntry)) {
      fs.appendFileSync(rootGitignore, `\n# sps-harness observation logs\n${ignoreEntry}\n`);
      log('added observation log entry to .gitignore');
    }
  } catch {}

  // Archive if too large
  if (fs.existsSync(obsFile)) {
    const stats = fs.statSync(obsFile);
    if (stats.size > MAX_FILE_SIZE) {
      const archiveName = `.observations-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.jsonl`;
      fs.renameSync(obsFile, path.join(instinctsDir, archiveName));
    }
  }

  // Append record
  fs.appendFileSync(obsFile, JSON.stringify(record) + '\n');
} catch (e) {
  log(`observe error: ${e.message}`);
}
process.exit(0);
