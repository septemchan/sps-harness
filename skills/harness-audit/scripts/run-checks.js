#!/usr/bin/env node

/**
 * Harness Audit — automated checks
 *
 * Runs all 23 deterministic checks against the project's .claude/ directory
 * and outputs a JSON report. Claude reads this report and focuses on
 * interpretation, recommendations, and init guidance.
 *
 * Usage: node run-checks.js [project-root]
 *        Defaults to current working directory if no argument given.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = process.argv[2] || process.cwd();
const claudeDir = path.join(projectRoot, '.claude');

// --- helpers ---

function exists(p) {
  return fs.existsSync(p);
}

function isDir(p) {
  return exists(p) && fs.statSync(p).isDirectory();
}

function mdFilesIn(dir) {
  if (!isDir(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.toLowerCase().endsWith('.md'));
}

function filesIn(dir) {
  if (!isDir(dir)) return [];
  return fs.readdirSync(dir).filter(f => !f.startsWith('.'));
}

function lineCount(filePath) {
  if (!exists(filePath)) return 0;
  return fs.readFileSync(filePath, 'utf8').split('\n').length;
}

function fileContains(filePath, pattern) {
  if (!exists(filePath)) return false;
  const content = fs.readFileSync(filePath, 'utf8');
  if (pattern instanceof RegExp) return pattern.test(content);
  return content.includes(pattern);
}

function anyFileContains(dir, pattern, ext) {
  if (!isDir(dir)) return false;
  const files = ext ? fs.readdirSync(dir).filter(f => f.endsWith(ext)) : fs.readdirSync(dir);
  return files.some(f => fileContains(path.join(dir, f), pattern));
}

function gitLastCommitDays(filePath) {
  try {
    const out = execSync(`git log -1 --format=%ci -- "${filePath}"`, {
      cwd: projectRoot, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
    if (!out) return Infinity;
    const commitDate = new Date(out);
    return (Date.now() - commitDate.getTime()) / (1000 * 60 * 60 * 24);
  } catch {
    return Infinity;
  }
}

// --- paths ---

const claudeMd = exists(path.join(claudeDir, 'CLAUDE.md'))
  ? path.join(claudeDir, 'CLAUDE.md')
  : exists(path.join(projectRoot, 'CLAUDE.md'))
    ? path.join(projectRoot, 'CLAUDE.md')
    : null;

const rulesDir = path.join(claudeDir, 'rules');
const agentsDir = path.join(claudeDir, 'agents');
const commandsDir = path.join(claudeDir, 'commands');
const docsDir = path.join(claudeDir, 'docs');
const skillsDir = path.join(claudeDir, 'skills');
const instinctsDir = path.join(claudeDir, 'instincts');
const settingsJson = path.join(claudeDir, 'settings.json');
const iterateLog = path.join(docsDir, 'iterate-log.md');

// --- dimension 1: structure completeness ---

const check_1_1 = claudeMd !== null && lineCount(claudeMd) < 100;
const check_1_2 = mdFilesIn(rulesDir).length > 0;
const check_1_3 = filesIn(agentsDir).length > 0 || filesIn(commandsDir).length > 0;
const check_1_4 = (() => {
  if (!isDir(docsDir)) return false;
  const files = fs.readdirSync(docsDir).map(f => f.toLowerCase());
  return files.includes('spec.md') || files.includes('iterate-log.md');
})();

// --- dimension 2: architecture constraints ---

const check_2_1 = (() => {
  if (!isDir(rulesDir)) return false;
  return mdFilesIn(rulesDir).some(f =>
    fileContains(path.join(rulesDir, f), /^paths:/m)
  );
})();

const check_2_2 = (() => {
  const dirs = [agentsDir, commandsDir];
  return dirs.some(d => anyFileContains(d, 'allowedTools'));
})();

const check_2_3 = (() => {
  const pattern = /tech\s*stack|stack:|constraints:|技术栈|dependencies/i;
  if (claudeMd && fileContains(claudeMd, pattern)) return true;
  return anyFileContains(rulesDir, pattern, '.md');
})();

// --- dimension 3: agent design ---

const check_3_1 = mdFilesIn(agentsDir).length > 0;

const check_3_2 = (() => {
  if (!isDir(agentsDir)) return false;
  return mdFilesIn(agentsDir).some(f => {
    const content = fs.readFileSync(path.join(agentsDir, f), 'utf8');
    if (!content.includes('allowedTools')) return false;
    // Check that none of the destructive tools are listed
    const toolSection = content.split('allowedTools')[1] || '';
    const hasWrite = /\bWrite\b/.test(toolSection.split('---')[0]);
    const hasEdit = /\bEdit\b/.test(toolSection.split('---')[0]);
    return !hasWrite && !hasEdit;
  });
})();

const check_3_3 = (() => {
  if (!isDir(agentsDir)) return false;
  const pattern = /you are|role:|scope:|你是|职责/i;
  return mdFilesIn(agentsDir).some(f =>
    fileContains(path.join(agentsDir, f), pattern)
  );
})();

// --- dimension 4: quality gates ---

const check_4_1 = exists(settingsJson) && fileContains(settingsJson, '"hooks"');
const check_4_2 = exists(settingsJson) && fileContains(settingsJson, 'PostToolUse');
const check_4_3 = exists(settingsJson) && fileContains(settingsJson, '"Stop"');

const check_4_4 = (() => {
  if (!isDir(skillsDir)) return false;
  return fs.readdirSync(skillsDir).some(d =>
    /audit|review/i.test(d) && isDir(path.join(skillsDir, d))
  );
})();

// --- dimension 5: eval coverage ---

const check_5_1 = (() => {
  if (!isDir(skillsDir)) return false;
  return fs.readdirSync(skillsDir).some(skillName => {
    const skillDir = path.join(skillsDir, skillName);
    if (!isDir(skillDir)) return false;
    if (exists(path.join(skillDir, 'evals'))) return true;
    return fs.readdirSync(skillDir).some(f => /eval|test/i.test(f));
  });
})();

const check_5_2 = exists(iterateLog) && fileContains(iterateLog, /verified|已验证/i);

const check_5_3 = (() => {
  if (!isDir(rulesDir)) return false;
  const pattern = /source:|来源:|ref:|reference:|https?:\/\//i;
  return mdFilesIn(rulesDir).some(f =>
    fileContains(path.join(rulesDir, f), pattern)
  );
})();

// --- dimension 6: evolution tracking ---

const check_6_1 = exists(iterateLog) && lineCount(iterateLog) > 5;

const check_6_2 = (() => {
  if (!isDir(instinctsDir)) return false;
  return filesIn(instinctsDir).length > 0;
})();

const check_6_3 = exists(iterateLog) && fileContains(iterateLog,
  /escalat|升级|instinct\s*→\s*rule|promoted|提升/i
);

// --- dimension 7: health maintenance ---

const check_7_1 = (() => {
  if (!isDir(rulesDir)) return true; // no rules = no oversized rules
  return mdFilesIn(rulesDir).every(f =>
    lineCount(path.join(rulesDir, f)) < 300
  );
})();

const check_7_2 = (() => {
  // Conservative: check for duplicate heading names across rule files
  if (!isDir(rulesDir)) return true;
  const headings = [];
  for (const f of mdFilesIn(rulesDir)) {
    const content = fs.readFileSync(path.join(rulesDir, f), 'utf8');
    const fileHeadings = content.match(/^#{1,3}\s+.+$/gm) || [];
    headings.push(...fileHeadings.map(h => ({ file: f, heading: h.replace(/^#+\s+/, '').trim().toLowerCase() })));
  }
  const seen = {};
  for (const { file, heading } of headings) {
    if (seen[heading] && seen[heading] !== file) return false;
    seen[heading] = file;
  }
  return true;
})();

const check_7_3 = (() => {
  if (!isDir(docsDir)) return true;
  const docFiles = fs.readdirSync(docsDir).filter(f =>
    fs.statSync(path.join(docsDir, f)).isFile()
  );
  if (docFiles.length === 0) return true;
  return docFiles.every(f => gitLastCommitDays(path.join(docsDir, f)) <= 90);
})();

// --- build report ---

const dimensions = [
  {
    name: 'Structure Completeness',
    checks: [
      { id: '1.1', name: 'CLAUDE.md exists and is concise', passed: check_1_1 },
      { id: '1.2', name: 'rules/ has content', passed: check_1_2 },
      { id: '1.3', name: 'agents/ or commands/ has content', passed: check_1_3 },
      { id: '1.4', name: 'docs/ has spec or iterate-log', passed: check_1_4 },
    ]
  },
  {
    name: 'Architecture Constraints',
    checks: [
      { id: '2.1', name: 'Path-scoped rules exist', passed: check_2_1 },
      { id: '2.2', name: 'Tool restrictions on agents', passed: check_2_2 },
      { id: '2.3', name: 'Tech stack declared', passed: check_2_3 },
    ]
  },
  {
    name: 'Agent Design',
    checks: [
      { id: '3.1', name: 'Has agent definitions', passed: check_3_1 },
      { id: '3.2', name: 'Has a read-only agent', passed: check_3_2 },
      { id: '3.3', name: 'Agents have role descriptions', passed: check_3_3 },
    ]
  },
  {
    name: 'Quality Gates',
    checks: [
      { id: '4.1', name: 'Hooks configured', passed: check_4_1 },
      { id: '4.2', name: 'PostToolUse hook', passed: check_4_2 },
      { id: '4.3', name: 'Stop hook', passed: check_4_3 },
      { id: '4.4', name: 'Review skill present', passed: check_4_4 },
    ]
  },
  {
    name: 'Eval Coverage',
    checks: [
      { id: '5.1', name: 'Skills have evals', passed: check_5_1 },
      { id: '5.2', name: 'Verified entries in iterate-log', passed: check_5_2 },
      { id: '5.3', name: 'Rules have source annotations', passed: check_5_3 },
    ]
  },
  {
    name: 'Evolution Tracking',
    checks: [
      { id: '6.1', name: 'Iterate-log has content', passed: check_6_1 },
      { id: '6.2', name: 'Instincts directory has content', passed: check_6_2 },
      { id: '6.3', name: 'Escalation records exist', passed: check_6_3 },
    ]
  },
  {
    name: 'Health Maintenance',
    checks: [
      { id: '7.1', name: 'No oversized rule files', passed: check_7_1 },
      { id: '7.2', name: 'No obvious contradictions', passed: check_7_2 },
      { id: '7.3', name: 'Docs are current', passed: check_7_3 },
    ]
  },
];

const report = {
  project_root: projectRoot,
  claude_dir_exists: isDir(claudeDir),
  dimensions: dimensions.map(d => ({
    name: d.name,
    score: d.checks.filter(c => c.passed).length,
    max: d.checks.length,
    checks: d.checks,
  })),
};

report.total_score = report.dimensions.reduce((s, d) => s + d.score, 0);
report.max_score = report.dimensions.reduce((s, d) => s + d.max, 0);

const level =
  report.total_score >= 20 ? { code: 'L4', name: 'Mature' } :
  report.total_score >= 16 ? { code: 'L3', name: 'Systematic' } :
  report.total_score >= 11 ? { code: 'L2', name: 'Guided' } :
  report.total_score >= 6  ? { code: 'L1', name: 'Basic' } :
                             { code: 'L0', name: 'Manual' };

report.level = level;

console.log(JSON.stringify(report, null, 2));
