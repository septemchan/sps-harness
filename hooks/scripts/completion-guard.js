const { readStdin, log, stop, inject } = require('./lib/utils');

const SECURITY_PATTERNS = /\b(auth|login|password|payment|token|secret|credential|session|jwt|oauth|encrypt|decrypt)\b/i;

try {
  const input = readStdin();

  const toolOutput = JSON.stringify(input?.tool_output || '');
  const toolInput = JSON.stringify(input?.tool_input || '');
  const combined = toolOutput + toolInput;

  // Extract file paths from recent tool activity
  const filePatterns = combined.match(/[\w\/\\.-]+\.(ts|js|py|go|rb|java|md)/g) || [];
  const allFiles = [...new Set(filePatterns)];
  const securityFiles = allFiles.filter(f => SECURITY_PATTERNS.test(f));

  // Security files → hard stop
  if (securityFiles.length > 0) {
    stop(`Security-sensitive files were edited: ${securityFiles.slice(0, 3).join(', ')}. Run /security-review before finishing.`);
    process.exit(0);
  }

  // Many code files edited → suggest /verify
  const codeFiles = allFiles.filter(f => /\.(ts|js|py|go|rb|java)$/.test(f));
  if (codeFiles.length >= 3) {
    inject(`[sps-harness] ${codeFiles.length} code files were touched this session. Consider running /verify for adversarial verification before finishing.`);
  }
} catch (e) {
  log(`completion-guard error: ${e.message}`);
}
process.exit(0);
