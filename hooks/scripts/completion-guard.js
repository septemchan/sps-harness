const { readStdin, log, respond } = require('./lib/utils');

const SECURITY_PATTERNS = /auth|login|password|payment|token|secret|credential|session|jwt|oauth|encrypt|decrypt|hash|salt|cookie/i;

try {
  const input = readStdin();

  // Check tool outputs for security-sensitive file paths
  const toolOutput = JSON.stringify(input?.tool_output || '');
  const toolInput = JSON.stringify(input?.tool_input || '');
  const combined = toolOutput + toolInput;

  // Extract file paths from recent tool activity
  const filePatterns = combined.match(/[\w\/\\.-]+\.(ts|js|py|go|rb|java|md)/g) || [];
  const securityFiles = filePatterns.filter(f => SECURITY_PATTERNS.test(f));

  if (securityFiles.length > 0) {
    respond(`Security-sensitive files detected: ${securityFiles.slice(0, 3).join(', ')}. Consider running /security-review.`);
  }
} catch (e) {
  log(`completion-guard error: ${e.message}`);
}
process.exit(0);
