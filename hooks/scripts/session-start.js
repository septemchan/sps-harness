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
  const appDir = path.join(cwd, 'app');
  const hasAppCode = fs.existsSync(appDir) && fs.readdirSync(appDir).length > 0;
  const srcDir = path.join(cwd, 'src');
  const hasSrcCode = fs.existsSync(srcDir) && fs.readdirSync(srcDir).length > 0;
  const hasCode = hasAppCode || hasSrcCode;

  const guidance = [];

  // Signal 1: Has design docs but no CLAUDE.md
  if (hasSpecs && !hasClaudeMd) {
    guidance.push('Design docs found but no CLAUDE.md. Run /harvest to generate project configuration.');
  }

  // Signal 2: No .claude/ at all
  if (!hasClaudeDir) {
    guidance.push('No .claude/ architecture yet. Run /harness-audit for setup guidance.');
  }

  // Signal 3: Has Product-Spec but no code
  if (hasProductSpec && !hasCode) {
    guidance.push('Product-Spec.md exists but no app/ or src/ code yet. Project is ready for development (brainstorming → writing-plans → execution).');
  }

  // Signal 4: Has code but no test files
  if (hasCode) {
    const hasTests = fs.existsSync(path.join(cwd, 'tests')) || fs.existsSync(path.join(cwd, '__tests__'));
    if (!hasTests) {
      guidance.push('Code exists but no test directory found. Consider using TDD workflow (testing-standards rule).');
    }
  }

  // Signal 5: Observations > 100
  const obsFile = path.join(claudeDir, 'instincts', '.observations.jsonl');
  if (fileExists(obsFile)) {
    const content = readFile(obsFile);
    if (content) {
      const lineCount = content.split('\n').filter(l => l.trim()).length;
      if (lineCount > 100) {
        guidance.push(`${lineCount} operations recorded. Run /learn to discover work patterns.`);
      }
    }
  }

  // Signal 6: .compact/state file exists
  if (fs.existsSync(path.join(cwd, '.compact'))) {
    try {
      const compactFiles = fs.readdirSync(path.join(cwd, '.compact')).filter(f => f.startsWith('state-'));
      if (compactFiles.length > 0) {
        guidance.push('Previous compaction state found. Context restoration will happen automatically.');
      }
    } catch {}
  }

  // Signal 7: Security-related files changed recently
  if (fs.existsSync(path.join(cwd, '.git'))) {
    const r = spawnSync('git', ['diff', '--name-only', 'HEAD~3', 'HEAD'], { cwd, timeout: 5000, encoding: 'utf8' });
    if (r.stdout) {
      const securityPattern = /\b(auth|login|password|payment|token|secret|credential|session|jwt|oauth)\b/i;
      const changedFiles = r.stdout.split('\n').filter(f => securityPattern.test(f));
      if (changedFiles.length > 0) {
        guidance.push(`Security-sensitive files changed recently: ${changedFiles.slice(0, 3).join(', ')}. Consider running /security-review.`);
      }
    }
  }

  // Signal 8: Rules stale or missing
  const rulesDir = path.join(cwd, '.claude', 'rules');
  if (fileExists(rulesDir)) {
    try {
      const ruleFiles = fs.readdirSync(rulesDir).filter(f => f.endsWith('.md'));
      if (ruleFiles.length === 0) {
        guidance.push('Rules directory exists but is empty. Run /rules to add project rules.');
      } else {
        const sixMonthsAgo = Date.now() - (180 * 24 * 60 * 60 * 1000);
        const staleRules = ruleFiles.filter(f => {
          try {
            const stat = fs.statSync(path.join(rulesDir, f));
            return stat.mtimeMs < sixMonthsAgo;
          } catch { return false; }
        });
        if (staleRules.length > 0) {
          guidance.push(`${staleRules.length} rule file(s) not updated in 6+ months. Run /rules to review.`);
        }
      }
    } catch {}
  }

  // Signal 9: CLAUDE.md stale
  const activeMd = fileExists(claudeMd) ? claudeMd : (fileExists(rootClaudeMd) ? rootClaudeMd : null);
  if (activeMd) {
    const content = readFile(activeMd);
    if (content) {
      const dateMatch = content.match(/Last updated:\s*(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        const lastUpdated = new Date(dateMatch[1]);
        const daysSince = Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSince > 30) {
          guidance.push(`CLAUDE.md last updated ${daysSince} days ago. Consider re-running /harvest to sync.`);
        }
      }
    }
  }

  // Output
  if (guidance.length > 0) {
    const context = '[sps-harness project status]\n' + guidance.map((g, i) => `${i + 1}. ${g}`).join('\n');
    inject(context);
  }
} catch (e) {
  log(`session-start error: ${e.message}`);
}
process.exit(0);
