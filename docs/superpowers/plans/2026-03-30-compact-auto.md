# Compact Auto-Save/Restore Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically save git working state before context compaction and restore it after, so Claude doesn't lose track of what it was doing.

**Architecture:** PreCompact hook saves state to `.compact/state-{branch}.md`, SessionStart (matcher: "compact") reads it back via additionalContext. suggest-compact.js updated to reflect auto-save behavior.

**Tech Stack:** Node.js (hooks), JSON (hooks.json config)

---

### Task 1: Create pre-compact.js

**Files:**
- Create: `hooks/scripts/pre-compact.js`

- [ ] **Step 1: Write the hook script**

```javascript
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { readStdin, ensureDir, log } = require('./lib/utils');

function gitCmd(args, cwd) {
  const r = spawnSync('git', args, { cwd, timeout: 3000, encoding: 'utf8' });
  if (r.status !== 0 || r.error) return null;
  return (r.stdout || '').trim();
}

try {
  const input = readStdin();
  const trigger = input?.trigger || 'unknown';
  const cwd = process.cwd();

  // Get branch name (fallback to 'default' for non-git repos)
  const branch = gitCmd(['branch', '--show-current'], cwd) || 'default';

  // Collect git state
  const commits = gitCmd(['log', '--oneline', '-5'], cwd) || '(not a git repository)';
  const status = gitCmd(['status', '--short'], cwd) || '(not a git repository)';
  const diffStat = gitCmd(['diff', '--stat'], cwd) || '(no changes)';

  // Build state file content
  const timestamp = new Date().toISOString();
  const content = `# Compact State

Saved: ${timestamp}
Trigger: ${trigger}
Branch: ${branch}
Working directory: ${cwd}

## Recent commits
${commits}

## Uncommitted changes
${status || '(clean)'}

## Changed files detail
${diffStat}
`;

  // Save to .compact/state-{branch}.md
  const compactDir = path.join(cwd, '.compact');
  ensureDir(compactDir);
  const stateFile = path.join(compactDir, `state-${branch}.md`);
  fs.writeFileSync(stateFile, content, 'utf8');

  // Add .compact/ to .gitignore if not present
  const gitignorePath = path.join(cwd, '.gitignore');
  const ignoreEntry = '.compact/';
  try {
    const existing = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf8') : '';
    if (!existing.includes(ignoreEntry)) {
      fs.appendFileSync(gitignorePath, `\n# sps-harness compact state\n${ignoreEntry}\n`);
    }
  } catch { /* gitignore write failed, not critical */ }

  log(`pre-compact: saved state to ${stateFile}`);
} catch (e) {
  log(`pre-compact error: ${e.message}`);
}
process.exit(0);
```

- [ ] **Step 2: Verify the script runs without errors**

Run: `echo '{"trigger":"manual"}' | node hooks/scripts/pre-compact.js; echo "exit: $?"`
Expected: `exit: 0`

Run: `ls .compact/`
Expected: `state-master.md` (or current branch name) exists

- [ ] **Step 3: Verify the state file content**

Run: `cat .compact/state-*.md`
Expected: Markdown file with Saved timestamp, Branch, Recent commits, Uncommitted changes, Changed files detail sections

---

### Task 2: Create compact-restore.js

**Files:**
- Create: `hooks/scripts/compact-restore.js`

- [ ] **Step 1: Write the hook script**

```javascript
const path = require('path');
const { spawnSync } = require('child_process');
const { readFile, fileExists, log } = require('./lib/utils');

try {
  const cwd = process.cwd();

  // Get current branch
  const r = spawnSync('git', ['branch', '--show-current'], { cwd, timeout: 3000, encoding: 'utf8' });
  const branch = (r.stdout || '').trim() || 'default';

  // Read saved state
  const stateFile = path.join(cwd, '.compact', `state-${branch}.md`);
  if (!fileExists(stateFile)) process.exit(0);

  const content = readFile(stateFile);
  if (!content) process.exit(0);

  // Output additionalContext for SessionStart hook
  const context = `Context was just compacted. Here is the saved working state from before compaction. Use this to resume work seamlessly.\n\n${content}`;
  console.log(JSON.stringify({ additionalContext: context }));
} catch (e) {
  log(`compact-restore error: ${e.message}`);
}
process.exit(0);
```

- [ ] **Step 2: Verify the script runs without errors (with state file present)**

First ensure a state file exists from Task 1, then run:
`echo '{}' | node hooks/scripts/compact-restore.js; echo "exit: $?"`
Expected: stdout contains JSON with `additionalContext` field, `exit: 0`

- [ ] **Step 3: Verify the script exits silently when no state file**

Run: `echo '{}' | node hooks/scripts/compact-restore.js 2>/dev/null; echo "exit: $?"`
(After removing .compact/ directory or on a different branch with no state file)
Expected: no stdout output, `exit: 0`

---

### Task 3: Update hooks.json

**Files:**
- Modify: `hooks/hooks.json`

- [ ] **Step 1: Add PreCompact and compact-restore entries**

Replace the entire hooks.json with:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          { "type": "command", "command": "node hooks/scripts/session-start.js", "timeout": 5000 }
        ]
      },
      {
        "matcher": "compact",
        "hooks": [
          { "type": "command", "command": "node hooks/scripts/compact-restore.js", "timeout": 3000 }
        ]
      }
    ],
    "PreCompact": [
      {
        "hooks": [
          { "type": "command", "command": "node hooks/scripts/pre-compact.js", "timeout": 5000 }
        ]
      }
    ],
    "PreToolUse": [
      {
        "hooks": [
          { "type": "command", "command": "node hooks/scripts/suggest-compact.js", "timeout": 3000 }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "command": "node hooks/scripts/block-no-verify.js", "timeout": 3000 }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "command": "node hooks/scripts/commit-guard.js", "timeout": 10000 }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          { "type": "command", "command": "node hooks/scripts/auto-format.js", "timeout": 10000 }
        ]
      },
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          { "type": "command", "command": "node hooks/scripts/typecheck.js", "timeout": 15000 }
        ]
      },
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          { "type": "command", "command": "node hooks/scripts/quality-gate.js", "timeout": 10000 }
        ]
      },
      {
        "hooks": [
          { "type": "command", "command": "node hooks/scripts/observe.js", "timeout": 3000 }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          { "type": "command", "command": "node hooks/scripts/completion-guard.js", "timeout": 5000 }
        ]
      }
    ]
  }
}
```

- [ ] **Step 2: Validate JSON syntax**

Run: `node -e "JSON.parse(require('fs').readFileSync('hooks/hooks.json','utf8')); console.log('valid')"`
Expected: `valid`

---

### Task 4: Update suggest-compact.js

**Files:**
- Modify: `hooks/scripts/suggest-compact.js:27`

- [ ] **Step 1: Change the reminder message**

Replace line 27:
```javascript
    respond('Context is getting long. If Claude starts forgetting steps, run /save-compact.');
```

With:
```javascript
    respond('Context is getting long. State will be auto-saved when compaction occurs — you can keep working.');
```

- [ ] **Step 2: Verify the script still runs**

Run: `echo '{}' | node hooks/scripts/suggest-compact.js; echo "exit: $?"`
Expected: `exit: 0`

---

### Task 5: Version bump

**Files:**
- Modify: `.claude-plugin/plugin.json`
- Modify: `.claude-plugin/marketplace.json`

- [ ] **Step 1: Update plugin.json version**

Replace:
```json
"version": "0.2.0",
```
With:
```json
"version": "0.3.0",
```

- [ ] **Step 2: Update marketplace.json version**

Replace:
```json
"version": "0.2.0",
```
With:
```json
"version": "0.3.0",
```

---

### Task 6: Commit and verify

- [ ] **Step 1: Stage and commit all changes**

```bash
cd "c:/Users/SEPTEM/Documents/Workspace/sps-harness"
git add hooks/scripts/pre-compact.js hooks/scripts/compact-restore.js hooks/hooks.json hooks/scripts/suggest-compact.js .claude-plugin/plugin.json .claude-plugin/marketplace.json
git commit -m "$(cat <<'EOF'
feat: auto-save/restore state across context compaction

PreCompact hook saves git working state to .compact/state-{branch}.md.
SessionStart (matcher: compact) restores state via additionalContext.
User does nothing — memory survives compaction automatically.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 2: Verify all new files are committed**

Run: `git status`
Expected: working tree clean

- [ ] **Step 3: Verify hook script count**

Run: `ls hooks/scripts/*.js | wc -l`
Expected: 11 (9 existing + 2 new)
