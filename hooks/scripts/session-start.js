const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { fileExists, readFile, inject, log } = require('./lib/utils');

try {
  const cwd = process.cwd();
  const claudeDir = path.join(cwd, '.claude');
  const specsDir = path.join(cwd, 'docs', 'superpowers', 'specs');
  const claudeMd = path.join(claudeDir, 'CLAUDE.md');
  const rootClaudeMd = path.join(cwd, 'CLAUDE.md');

  const hasClaudeDir = fileExists(claudeDir);
  const hasSpecs = fileExists(specsDir) && fs.readdirSync(specsDir).some(f => f.endsWith('.md'));
  const hasClaudeMd = fileExists(claudeMd) || fileExists(rootClaudeMd);
  const hasProductSpec = fileExists(path.join(cwd, 'Product-Spec.md'));
  const hasCode = (fs.existsSync(path.join(cwd, 'app')) && fs.readdirSync(path.join(cwd, 'app')).length > 0)
    || (fs.existsSync(path.join(cwd, 'src')) && fs.readdirSync(path.join(cwd, 'src')).length > 0);

  // Priority-ranked checks — output only the first match
  const checks = [
    {
      condition: () => !hasClaudeDir,
      message: 'New project detected. Run /harness-audit for setup guidance.'
    },
    {
      condition: () => hasSpecs && !hasClaudeMd,
      message: 'Design docs found but no CLAUDE.md. Run /harvest to generate.'
    },
    {
      condition: () => hasProductSpec && !hasCode,
      message: 'Ready for development. Start with brainstorming → writing-plans.'
    },
    {
      condition: () => {
        if (!fs.existsSync(path.join(cwd, '.git'))) return false;
        const r = spawnSync('git', ['diff', '--name-only', 'HEAD~3', 'HEAD'], { cwd, timeout: 5000, encoding: 'utf8' });
        if (!r.stdout) return false;
        const securityPattern = /\b(auth|login|password|payment|token|secret|credential|session|jwt|oauth)\b/i;
        return r.stdout.split('\n').some(f => securityPattern.test(f));
      },
      message: 'Security-sensitive files changed recently. Consider /security-review.'
    },
    {
      condition: () => {
        const obsFile = path.join(claudeDir, 'instincts', '.observations.jsonl');
        if (!fileExists(obsFile)) return false;
        const content = readFile(obsFile);
        if (!content) return false;
        const count = content.split('\n').filter(l => l.trim()).length;
        return count > 100;
      },
      message: () => {
        const obsFile = path.join(claudeDir, 'instincts', '.observations.jsonl');
        const content = readFile(obsFile);
        const count = content.split('\n').filter(l => l.trim()).length;
        return `${count} operations recorded. Run /learn to discover patterns.`;
      }
    },
    {
      condition: () => {
        const activeMd = fileExists(claudeMd) ? claudeMd : (fileExists(rootClaudeMd) ? rootClaudeMd : null);
        if (!activeMd) return false;
        const content = readFile(activeMd);
        if (!content) return false;
        const dateMatch = content.match(/Last updated:\s*(\d{4}-\d{2}-\d{2})/);
        if (!dateMatch) return false;
        const daysSince = Math.floor((Date.now() - new Date(dateMatch[1]).getTime()) / (1000 * 60 * 60 * 24));
        return daysSince > 30;
      },
      message: 'CLAUDE.md may be stale. Consider re-running /harvest.'
    },
    {
      condition: () => {
        const rulesDir = path.join(cwd, '.claude', 'rules');
        if (!fileExists(rulesDir)) return false;
        try {
          const ruleFiles = fs.readdirSync(rulesDir).filter(f => f.endsWith('.md'));
          if (ruleFiles.length === 0) return true;
          const sixMonthsAgo = Date.now() - (180 * 24 * 60 * 60 * 1000);
          return ruleFiles.some(f => {
            try { return fs.statSync(path.join(rulesDir, f)).mtimeMs < sixMonthsAgo; }
            catch { return false; }
          });
        } catch { return false; }
      },
      message: 'Rules need attention. Run /rules to review.'
    }
  ];

  for (const check of checks) {
    if (check.condition()) {
      const msg = typeof check.message === 'function' ? check.message() : check.message;
      inject(`[sps-harness] ${msg}`);
      break;
    }
  }
} catch (e) {
  log(`session-start error: ${e.message}`);
}
process.exit(0);
