const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

function fileExists(p) {
  try { fs.accessSync(p); return true; } catch { return false; }
}

function readFile(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return null; }
}

function readStdin() {
  // Use fd 0 instead of /dev/stdin for Windows compatibility
  try { return JSON.parse(fs.readFileSync(0, 'utf8')); }
  catch { return {}; }
}

function getTempDir() {
  return os.tmpdir();
}

function hashCwd(cwd) {
  return crypto.createHash('sha256').update(cwd || process.cwd()).digest('hex').slice(0, 16);
}

function getSessionId(cwd) {
  // Read session timestamp from suggest-compact counter file for consistency
  const counterFile = path.join(os.tmpdir(), `sps-harness-${hashCwd(cwd)}.json`);
  try {
    const data = JSON.parse(fs.readFileSync(counterFile, 'utf8'));
    return new Date(data.timestamp).toISOString().slice(0, 19).replace(/[:.]/g, '-');
  } catch {
    return new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
  }
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function log(msg) {
  process.stderr.write(`[sps-harness] ${msg}\n`);
}

function respond(message) {
  // Claude Code hook response format
  console.log(JSON.stringify({ message }));
}

function deny(reason) {
  console.log(JSON.stringify({ permissionBehavior: 'deny', message: reason }));
}

function inject(context, message) {
  const result = { additionalContext: context };
  if (message) result.message = message;
  console.log(JSON.stringify(result));
}

function prevent(reason) {
  console.log(JSON.stringify({ preventContinuation: true, message: reason }));
}

function stop(reason) {
  console.log(JSON.stringify({ stopReason: reason }));
}

function guard(condition, denyReason, passContext) {
  if (condition) {
    deny(denyReason);
    return true;
  }
  if (passContext) inject(passContext);
  return false;
}

module.exports = { fileExists, readFile, readStdin, getTempDir, getSessionId, hashCwd, ensureDir, log, respond, deny, inject, prevent, stop, guard };
