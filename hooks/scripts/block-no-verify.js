const { readStdin, log } = require('./lib/utils');

try {
  const input = readStdin();
  const command = input?.tool_input?.command || '';

  // Only check git commit commands
  if (!command.includes('git commit')) process.exit(0);

  // Block --no-verify and -n (short flag for --no-verify in git commit)
  if (command.includes('--no-verify') || / -n\b/.test(command)) {
    process.stderr.write('Blocked: --no-verify bypasses safety hooks. Remove the flag and commit normally.\n');
    process.exit(2);
  }
} catch (e) {
  log(`block-no-verify error: ${e.message}`);
}
process.exit(0);
