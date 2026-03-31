# Product Launcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a product-launcher skill + hooks to sps-harness that bridges the gap between PRD and working product.

**Architecture:** One SKILL.md with three modes (convert PRD, check completeness, sync iteration). Four hook scripts detect workflow events and inject reminders. Two templates define Product-Spec and Changelog formats. One rule enforces project directory structure.

**Tech Stack:** Node.js (hooks scripts), Markdown (skill + templates + rules)

**Spec:** `docs/superpowers/specs/2026-03-31-product-launcher-design.md`

---

### Task 1: Product-Spec Template

**Files:**
- Create: `skills/product-launcher/templates/product-spec-template.md`

- [ ] **Step 1: Create directory and template file**

```markdown
# {{PRODUCT_NAME}} Product Spec

## 产品说明
- 一句话描述：{{DESCRIPTION}}
- 核心价值：{{CORE_VALUE}}

## 功能清单
- [ ] {{FEATURE_1}}
- [ ] {{FEATURE_2}}

（方括号用于 /check 标注完成状态：[ ] 未完成，[x] 已完成，[~] 部分完成）

## 用户流程
{{USER_FLOW}}

## AI 系统提示词
<!-- 仅 AI 产品需要此章节。非 AI 产品删除此章节。 -->

### 角色定义
{{AI_ROLE}}

### 工作流程规则
{{AI_WORKFLOW}}

### 回复规范
{{AI_RESPONSE_RULES}}

### 约束条件
{{AI_CONSTRAINTS}}

## 原型策略
- 原型工具：{{PROTOTYPE_TOOL}}
- 技术约束：{{TECH_CONSTRAINTS}}
- 说明：brainstorming 和 writing-plans 请参照此策略进行技术选型，确保原型代码可作为成品基础持续迭代，不被推翻重来
```

- [ ] **Step 2: Verify file exists and format is correct**

Run: `cat skills/product-launcher/templates/product-spec-template.md`
Expected: Template with all placeholder sections visible.

- [ ] **Step 3: Commit**

```bash
git add skills/product-launcher/templates/product-spec-template.md
git commit -m "feat(product-launcher): add Product-Spec template"
```

---

### Task 2: Changelog Template

**Files:**
- Create: `skills/product-launcher/templates/changelog-template.md`

- [ ] **Step 1: Create changelog template**

```markdown
# {{PRODUCT_NAME}} Changelog

格式说明：每次迭代时追加一条记录，最新的在最上面。

---

## [YYYY-MM-DD] 变更标题

**变更类型：** 新增功能 / 功能修改 / Bug 修复 / UI 调整

**变更内容：**
- 具体变更描述 1
- 具体变更描述 2

**影响范围：**
- 修改的功能清单项：功能 X、功能 Y
- Product-Spec.md 已同步更新：是/否
```

- [ ] **Step 2: Verify file exists**

Run: `cat skills/product-launcher/templates/changelog-template.md`
Expected: Template with date and section placeholders.

- [ ] **Step 3: Commit**

```bash
git add skills/product-launcher/templates/changelog-template.md
git commit -m "feat(product-launcher): add Changelog template"
```

---

### Task 3: SKILL.md — Core Skill Definition

**Files:**
- Create: `skills/product-launcher/SKILL.md`
- Reference: `docs/superpowers/specs/2026-03-31-product-launcher-design.md`
- Reference: `skills/harness-audit/SKILL.md` (for frontmatter format)

- [ ] **Step 1: Create SKILL.md with frontmatter and overview**

```markdown
---
name: product-launcher
description: >
  Bridge the gap between PRD and working product. Three modes:
  (1) Convert: read a PRD, review it critically, output a lightweight Product-Spec.md.
  (2) Check: compare Product-Spec.md feature list against code in app/, report completeness.
  (3) Sync: update Product-Spec.md and Product-Changelog.md after design changes.
  Trigger on: "product-launcher", "转化PRD", "convert prd", "product spec",
  "/launch", "/check", "/sync", "检查完整度", "completeness check",
  "同步产品文档", "sync product spec".
  Also trigger when hooks inject [product-launcher] messages.
  Do not trigger for writing or editing PRDs (that is /write-prd's job),
  technical design (brainstorming's job), or UI design (ui-ux-pro-max's job).
---

# Product Launcher

你是一个毒舌但专业的产品文档审查员。你的工作是确保从 PRD 到代码的每个环节都不留模糊地带。

## 三个模式

### 模式 1：转化（/launch）

读取项目中的 PRD 文件，挑刺审查后输出轻量的 Product-Spec.md。

**触发条件：** 用户调用 /launch，或 hooks 注入 [product-launcher] 提醒。

**流程：**

1. **定位 PRD 文件：** 在项目根目录查找 PRD.md 或任何包含"PRD"的 .md 文件。找不到则提醒用户先跑 /write-prd。

2. **挑刺审查：** 逐项检查 PRD，以下问题必须搞清楚才能继续：
   - 功能描述含糊的：追问具体行为和边界。"用户可以管理设置"——管理什么设置？哪些可以改？改了之后呢？
   - 用户流程有断点的：追问衔接逻辑。用户从 A 到 B，中间发生了什么？出错了怎么办？
   - 功能之间有矛盾的：指出并要求澄清。"支持离线使用"和"实时同步数据"不能同时成立，选一个。
   - 关键信息缺失的：数据怎么存？离线怎么办？错误怎么处理？权限怎么控制？
   - **一个问题一个问题问，不一次性甩一堆。**
   - **语气直接，不客气。** 不放过任何"应该""大概""可能""也许""看情况"这类模糊词。看到就追问。

3. **判断产品类型：** 问用户确认：
   - 这个产品有 AI 对话功能吗？（是 → 生成系统提示词章节）
   - 这个产品需要多模态 AI 吗？（生图、图像分析等）

4. **确定原型策略：** 根据产品类型推荐，用户确认：
   - 普通 Web 应用 → Claude Code 直接写
   - 多模态 AI 应用（生图、图像分析等）→ Google AI Studio（可选）
   - AI Agent 产品（工具调用、子代理）→ Claude Code + Agent SDK
   写入原型策略章节，包含技术约束说明。

5. **生成系统提示词（仅 AI 产品）：** 根据 PRD 中的功能清单和用户流程，自动生成系统提示词草稿。让用户确认或修改。

6. **输出 Product-Spec.md：** 读取 `<skill-path>/templates/product-spec-template.md`，填充所有章节。保存到项目根目录。

7. **归档 PRD：** 提醒用户完整 PRD 已归档，后续操作基于 Product-Spec.md。

8. **引导下一步：** 提醒用户进入 brainstorming 做技术设计。brainstorming 会读取 Product-Spec.md 中的原型策略进行选型。

### 模式 2：完整度检查（/check）

对比 Product-Spec.md 的功能清单和 app/ 目录下的代码，输出完整度报告。

**触发条件：** 用户调用 /check，或 hooks 注入完整度检查提醒。

**流程：**

1. **读取 Product-Spec.md：** 提取功能清单（所有 `- [ ]`、`- [x]`、`- [~]` 开头的行）。
2. **扫描 app/ 目录：** 读取代码文件，理解每个文件的功能。
3. **逐项对比：** 对每个功能判断：
   - [x] 已完成：找到对应的完整实现
   - [~] 部分完成：找到部分实现，说明缺什么
   - [ ] 未完成：代码中未找到相关实现
4. **输出报告：** 按已完成/部分完成/未完成分组，给出完成度百分比和优先处理建议。
5. **更新文档：** 把检查结果写回 Product-Spec.md 的功能清单（更新方括号状态）。
6. **更新计划：** 如果 `docs/superpowers/plans/` 下有实现计划文件，同步标注已完成的任务。

### 模式 3：迭代同步（/sync）

将最近的设计变更同步到 Product-Spec.md 和 Product-Changelog.md。

**触发条件：** hooks 注入迭代同步提醒后，用户确认执行。

**流程：**

1. **读取最近的设计文档变更：** 检查 `docs/superpowers/specs/` 下最近修改的文件。
2. **对比 Product-Spec.md：** 找出哪些功能被新增、修改或删除。
3. **更新 Product-Spec.md：** 把变更同步到功能清单和相关章节。
4. **追加 Changelog：** 读取 `<skill-path>/templates/changelog-template.md` 的格式，在 Product-Changelog.md 顶部追加一条变更记录。如果 Product-Changelog.md 不存在，基于模板创建。

## 关键原则

- **一个问题一个问题问。** 不要一次甩 5 个问题给用户。
- **不放过模糊词。** "应该""大概""可能""也许""看情况"——看到就追问。
- **不替代其他 Skill。** 不做技术设计（brainstorming 的事）、不做 UI 设计（ui-ux-pro-max 的事）、不写代码（executing-plans 的事）。
- **Product-Spec.md 是唯一真相源。** /check 和 /sync 都基于这份文档。
```

- [ ] **Step 2: Verify SKILL.md structure**

Run: `head -20 skills/product-launcher/SKILL.md`
Expected: Frontmatter with name, description, trigger phrases.

- [ ] **Step 3: Commit**

```bash
git add skills/product-launcher/SKILL.md
git commit -m "feat(product-launcher): add core SKILL.md with three modes"
```

---

### Task 4: Hook Script — UI Prompt

**Files:**
- Create: `hooks/scripts/ui-prompt.js`
- Reference: `hooks/scripts/lib/utils.js` (for `readStdin`, `fileExists`, `log`, `respond`)

- [ ] **Step 1: Create ui-prompt.js**

```javascript
const fs = require('fs');
const path = require('path');
const { readStdin, fileExists, log, respond } = require('./lib/utils');

try {
  const input = readStdin();
  const filePath = input?.tool_input?.file_path || input?.tool_input?.path || '';
  if (!filePath) process.exit(0);

  const cwd = process.cwd();

  // Only trigger for files in docs/superpowers/specs/
  const specsDir = path.join(cwd, 'docs', 'superpowers', 'specs');
  const normalizedPath = path.resolve(filePath);
  if (!normalizedPath.startsWith(specsDir)) process.exit(0);

  // Only trigger if Product-Spec.md exists (product-launcher workflow active)
  if (!fileExists(path.join(cwd, 'Product-Spec.md'))) process.exit(0);

  // Only trigger on first-time development (app/ doesn't exist or is empty)
  const appDir = path.join(cwd, 'app');
  if (fs.existsSync(appDir)) {
    const contents = fs.readdirSync(appDir);
    if (contents.length > 0) process.exit(0); // Already has code = iteration, not first time
  }

  // Only trigger once per session (use marker file)
  const markerFile = path.join(cwd, '.claude', '.ui-prompted');
  if (fileExists(markerFile)) process.exit(0);
  fs.writeFileSync(markerFile, new Date().toISOString());

  respond(
    '[product-launcher] 设计文档已完成。产品如果有前端界面，建议先调用 ui-ux-pro-max 做专业的 UI 方案（配色、字体、组件库）再进入 writing-plans。\n' +
    '输入 "跳过" 直接进入 writing-plans，或调用 ui-ux-pro-max 开始 UI 设计。'
  );
} catch (e) {
  log(`ui-prompt error: ${e.message}`);
}
process.exit(0);
```

- [ ] **Step 2: Test the script manually**

Run: `echo '{"tool_input":{"file_path":"docs/superpowers/specs/test.md"}}' | node hooks/scripts/ui-prompt.js`
Expected: No output (Product-Spec.md doesn't exist in sps-harness project itself). No crash.

- [ ] **Step 3: Commit**

```bash
git add hooks/scripts/ui-prompt.js
git commit -m "feat(product-launcher): add ui-prompt hook script"
```

---

### Task 5: Hook Script — Launch Prompt

**Files:**
- Create: `hooks/scripts/launch-prompt.js`

- [ ] **Step 1: Create launch-prompt.js**

```javascript
const fs = require('fs');
const path = require('path');
const { readStdin, fileExists, readFile, log, respond } = require('./lib/utils');

try {
  const input = readStdin();
  const filePath = input?.tool_input?.file_path || input?.tool_input?.path || '';
  if (!filePath) process.exit(0);

  const cwd = process.cwd();

  // Only trigger for files in docs/superpowers/plans/
  const plansDir = path.join(cwd, 'docs', 'superpowers', 'plans');
  const normalizedPath = path.resolve(filePath);
  if (!normalizedPath.startsWith(plansDir)) process.exit(0);

  // Only trigger if Product-Spec.md exists
  const specPath = path.join(cwd, 'Product-Spec.md');
  if (!fileExists(specPath)) process.exit(0);

  // Only trigger on first-time development (app/ doesn't exist or is empty)
  const appDir = path.join(cwd, 'app');
  if (fs.existsSync(appDir)) {
    const contents = fs.readdirSync(appDir);
    if (contents.length > 0) process.exit(0);
  }

  // Only trigger once (use marker file)
  const markerFile = path.join(cwd, '.claude', '.launch-prompted');
  if (fileExists(markerFile)) process.exit(0);
  fs.writeFileSync(markerFile, new Date().toISOString());

  // Read prototype strategy from Product-Spec.md
  const specContent = readFile(specPath) || '';
  const strategyMatch = specContent.match(/原型工具：(.+)/);
  const strategy = strategyMatch ? strategyMatch[1].trim() : '';

  if (strategy.includes('AI Studio')) {
    respond(
      '[product-launcher] 实现计划已完成。原型策略为 Google AI Studio。\n' +
      '请调用 product-launcher skill 生成 AI Studio 输入文本和操作引导。'
    );
  } else if (strategy.includes('Agent SDK')) {
    respond(
      '[product-launcher] 实现计划已完成。原型策略为 Claude Code + Agent SDK，直接进入 executing-plans 开始写代码。'
    );
  } else {
    respond(
      '[product-launcher] 实现计划已完成。原型策略为 Claude Code，直接进入 executing-plans 开始写代码。'
    );
  }
} catch (e) {
  log(`launch-prompt error: ${e.message}`);
}
process.exit(0);
```

- [ ] **Step 2: Test the script manually**

Run: `echo '{"tool_input":{"file_path":"docs/superpowers/plans/test.md"}}' | node hooks/scripts/launch-prompt.js`
Expected: No output (no Product-Spec.md). No crash.

- [ ] **Step 3: Commit**

```bash
git add hooks/scripts/launch-prompt.js
git commit -m "feat(product-launcher): add launch-prompt hook script"
```

---

### Task 6: Hook Script — Spec Sync Prompt

**Files:**
- Create: `hooks/scripts/spec-sync-prompt.js`

- [ ] **Step 1: Create spec-sync-prompt.js**

```javascript
const fs = require('fs');
const path = require('path');
const { readStdin, fileExists, log, respond } = require('./lib/utils');

try {
  const input = readStdin();
  const filePath = input?.tool_input?.file_path || input?.tool_input?.path || '';
  if (!filePath) process.exit(0);

  const cwd = process.cwd();

  // Only trigger for files in docs/superpowers/specs/
  const specsDir = path.join(cwd, 'docs', 'superpowers', 'specs');
  const normalizedPath = path.resolve(filePath);
  if (!normalizedPath.startsWith(specsDir)) process.exit(0);

  // Only trigger if Product-Spec.md exists
  if (!fileExists(path.join(cwd, 'Product-Spec.md'))) process.exit(0);

  // Only trigger during iteration phase (app/ has code)
  const appDir = path.join(cwd, 'app');
  if (!fs.existsSync(appDir)) process.exit(0);
  const contents = fs.readdirSync(appDir);
  if (contents.length === 0) process.exit(0);

  respond(
    '[product-launcher] 检测到设计文档变更。请同步更新 Product-Spec.md 和 Product-Changelog.md。\n' +
    '调用 /sync 自动同步，或手动更新。'
  );
} catch (e) {
  log(`spec-sync-prompt error: ${e.message}`);
}
process.exit(0);
```

- [ ] **Step 2: Test the script manually**

Run: `echo '{"tool_input":{"file_path":"docs/superpowers/specs/test.md"}}' | node hooks/scripts/spec-sync-prompt.js`
Expected: No output (no Product-Spec.md). No crash.

- [ ] **Step 3: Commit**

```bash
git add hooks/scripts/spec-sync-prompt.js
git commit -m "feat(product-launcher): add spec-sync-prompt hook script"
```

---

### Task 7: Hook Script — Check Prompt

**Files:**
- Create: `hooks/scripts/check-prompt.js`

- [ ] **Step 1: Create check-prompt.js**

```javascript
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
```

- [ ] **Step 2: Test the script manually**

Run: `echo '{"tool_input":{"file_path":"app/test.js"}}' | node hooks/scripts/check-prompt.js`
Expected: No output (no Product-Spec.md). No crash.

- [ ] **Step 3: Commit**

```bash
git add hooks/scripts/check-prompt.js
git commit -m "feat(product-launcher): add check-prompt hook script"
```

---

### Task 8: Register Hooks in hooks.json

**Files:**
- Modify: `hooks/hooks.json`

- [ ] **Step 1: Add new hooks to PostToolUse section**

Add four new hook entries to the existing `PostToolUse` array in `hooks/hooks.json`. Insert them after the existing `observe.js` entry (the last one in PostToolUse):

```json
{
  "matcher": "Edit|Write",
  "hooks": [
    { "type": "command", "command": "node hooks/scripts/ui-prompt.js", "timeout": 3000 }
  ]
},
{
  "matcher": "Edit|Write",
  "hooks": [
    { "type": "command", "command": "node hooks/scripts/launch-prompt.js", "timeout": 3000 }
  ]
},
{
  "matcher": "Edit|Write",
  "hooks": [
    { "type": "command", "command": "node hooks/scripts/spec-sync-prompt.js", "timeout": 3000 }
  ]
},
{
  "matcher": "Write",
  "hooks": [
    { "type": "command", "command": "node hooks/scripts/check-prompt.js", "timeout": 3000 }
  ]
}
```

- [ ] **Step 2: Validate JSON syntax**

Run: `node -e "JSON.parse(require('fs').readFileSync('hooks/hooks.json','utf8')); console.log('Valid JSON')"`
Expected: `Valid JSON`

- [ ] **Step 3: Commit**

```bash
git add hooks/hooks.json
git commit -m "feat(product-launcher): register 4 new hooks in hooks.json"
```

---

### Task 9: Project Structure Rule

**Files:**
- Create: `rules/project-structure.md`

- [ ] **Step 1: Create project-structure.md**

```markdown
## Project Structure Rule

When a Product-Spec.md file exists in the project root, this is a product development project. Follow this directory structure:

```
项目文件夹/
  .claude/           ← 项目配置（rules, settings, hooks）
  docs/              ← 设计文档和计划
  PRD.md             ← 完整 PRD（归档）
  Product-Spec.md    ← 轻量产品文档（日常操作基于这份）
  Product-Changelog.md ← 变更日志
  app/               ← 所有产品代码
```

**Rules:**
- All product source code MUST go in `app/`. Never create code files in the project root.
- `Product-Spec.md` is the single source of truth for what the product should do.
- When iterating, update `Product-Spec.md` and `Product-Changelog.md` before or alongside code changes.
```

- [ ] **Step 2: Verify file exists**

Run: `cat rules/project-structure.md`
Expected: Rule content with directory structure.

- [ ] **Step 3: Commit**

```bash
git add rules/project-structure.md
git commit -m "feat(product-launcher): add project structure rule"
```

---

### Task 10: Update Workflow Map

**Files:**
- Modify: `rules/workflow-map.md`

- [ ] **Step 1: Add product development section**

Add the following section between "### 2. Requirements" and "### 3. Design & Development":

```markdown
### 2.5. Product Spec (when building a product)
- Has PRD but no Product-Spec.md → /launch (product-launcher) to convert PRD
- Has Product-Spec.md, needs design → brainstorming (Superpowers)
- Brainstorming done, has frontend → consider ui-ux-pro-max before writing-plans
- Code exists, need status → /check (product-launcher)
- Design changed during iteration → /sync (product-launcher)
```

- [ ] **Step 2: Verify the section was added correctly**

Run: `cat rules/workflow-map.md`
Expected: New section 2.5 appears between sections 2 and 3.

- [ ] **Step 3: Commit**

```bash
git add rules/workflow-map.md
git commit -m "feat(product-launcher): add product dev stage to workflow map"
```

---

### Task 11: Add .claude Marker Files to .gitignore

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Add marker files to .gitignore**

Append these lines to `.gitignore`:

```
# product-launcher hook markers
.claude/.ui-prompted
.claude/.launch-prompted
```

- [ ] **Step 2: Verify**

Run: `cat .gitignore`
Expected: New entries at the bottom.

- [ ] **Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore: add product-launcher hook markers to gitignore"
```

---

### Task 12: Final Verification

- [ ] **Step 1: Verify all new files exist**

Run:
```bash
ls skills/product-launcher/SKILL.md skills/product-launcher/templates/product-spec-template.md skills/product-launcher/templates/changelog-template.md hooks/scripts/ui-prompt.js hooks/scripts/launch-prompt.js hooks/scripts/spec-sync-prompt.js hooks/scripts/check-prompt.js rules/project-structure.md
```
Expected: All 8 files listed without errors.

- [ ] **Step 2: Validate hooks.json**

Run: `node -e "const h = JSON.parse(require('fs').readFileSync('hooks/hooks.json','utf8')); console.log('PostToolUse hooks:', h.hooks.PostToolUse.length)"`
Expected: `PostToolUse hooks: 8` (4 existing + 4 new)

- [ ] **Step 3: Verify no broken requires in hook scripts**

Run:
```bash
node -e "require('./hooks/scripts/ui-prompt.js')" 2>&1 || true
node -e "require('./hooks/scripts/launch-prompt.js')" 2>&1 || true
node -e "require('./hooks/scripts/spec-sync-prompt.js')" 2>&1 || true
node -e "require('./hooks/scripts/check-prompt.js')" 2>&1 || true
echo "All scripts loaded without module errors"
```
Expected: Scripts exit cleanly (they may output nothing since stdin is empty). No `MODULE_NOT_FOUND` errors.

- [ ] **Step 4: Commit final state**

```bash
git add -A
git status
```
Expected: Nothing to commit if all previous commits were clean. Or a clean working tree message.
