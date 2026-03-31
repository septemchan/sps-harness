const fs = require('fs');
const path = require('path');
const { readStdin, fileExists, getTempDir, hashCwd, log, respond } = require('./lib/utils');

const BATCH_THRESHOLD = 10;
const WINDOW_MS = 30 * 1000; // 30 seconds

try {
  const input = readStdin();
  const filePath = input?.tool_input?.file_path || input?.tool_input?.path || '';
  if (!filePath) process.exit(0);

  const cwd = process.cwd();

  // Only trigger for files in app/
  const appDir = path.join(cwd, 'app');
  const normalizedPath = path.resolve(filePath);
  if (!normalizedPath.startsWith(appDir)) process.exit(0);

  // Only trigger if Product-Spec.md exists
  if (!fileExists(path.join(cwd, 'Product-Spec.md'))) process.exit(0);

  // Count recent writes to app/ using a counter file
  const counterFile = path.join(getTempDir(), `sps-check-${hashCwd(cwd)}.json`);
  let data = { count: 0, timestamp: Date.now(), prompted: false };
  try {
    const raw = fs.readFileSync(counterFile, 'utf8');
    data = JSON.parse(raw);
    // Reset if window expired
    if (Date.now() - data.timestamp > WINDOW_MS) {
      data = { count: 0, timestamp: Date.now(), prompted: false };
    }
  } catch {}

  data.count++;
  fs.writeFileSync(counterFile, JSON.stringify(data));

  if (data.count >= BATCH_THRESHOLD && !data.prompted) {
    data.prompted = true;
    fs.writeFileSync(counterFile, JSON.stringify(data));
    respond(
      '[product-launcher] 检测到大量代码文件写入。建议运行 /check 进行完整度检查。'
    );
  }
} catch (e) {
  log(`check-prompt error: ${e.message}`);
}
process.exit(0);
