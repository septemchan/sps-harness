const fs = require('fs');
const path = require('path');
const { getTempDir, hashCwd, log, respond } = require('./lib/utils');

const THRESHOLD = parseInt(process.env.COMPACT_THRESHOLD || '50', 10);
const REMIND_INTERVAL = 25;
const STALE_MS = 30 * 60 * 1000; // 30 minutes

try {
  const counterFile = path.join(getTempDir(), `sps-harness-${hashCwd(process.cwd())}.json`);

  let data = { count: 0, timestamp: Date.now() };
  try {
    const raw = fs.readFileSync(counterFile, 'utf8');
    data = JSON.parse(raw);
    // Reset if stale
    if (Date.now() - data.timestamp > STALE_MS) {
      data = { count: 0, timestamp: Date.now() };
    }
  } catch {}

  data.count++;
  data.timestamp = Date.now();
  fs.writeFileSync(counterFile, JSON.stringify(data));

  if (data.count === THRESHOLD || (data.count > THRESHOLD && (data.count - THRESHOLD) % REMIND_INTERVAL === 0)) {
    respond('Context is getting long. If Claude starts forgetting steps, run /save-compact.');
  }
} catch (e) {
  log(`suggest-compact error: ${e.message}`);
}
process.exit(0);
