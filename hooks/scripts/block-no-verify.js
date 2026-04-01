const { readStdin, log, deny } = require('./lib/utils');

try {
  const input = readStdin();
  const command = input?.tool_input?.command || '';

  if (!command.includes('git commit')) process.exit(0);

  if (command.includes('--no-verify') || / -n\b/.test(command)) {
    deny('Blocked: --no-verify bypasses safety hooks. Remove the flag and commit normally.');
    process.exit(0);
  }
} catch (e) {
  log(`block-no-verify error: ${e.message}`);
}
process.exit(0);
