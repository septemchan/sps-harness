# /launch 轻量收集模式 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 /launch 新增轻量收集路径，当没有 PRD 时通过对话直接生成 Product-Spec.md

**Architecture:** 修改 SKILL.md 的模式 1 流程，将现有 PRD 转化逻辑保留为路径 A，新增对话收集作为路径 B。两条路径共享入口检测和输出模板。同步更新 workflow-map.md 的编号和路由。

**Tech Stack:** Markdown（prompt engineering）

---

### Task 1: 更新 SKILL.md frontmatter

**Files:**
- Modify: `skills/product-launcher/SKILL.md:1-13`

- [ ] **Step 1: 替换 frontmatter**

将 SKILL.md 的 frontmatter（第 1-13 行）替换为：

```yaml
---
name: product-launcher
description: >
  Use when creating a Product-Spec.md from an idea or PRD (/launch),
  checking feature completeness against code (/check),
  or syncing product docs after design changes (/sync).
  Trigger on: "product-launcher", "转化PRD", "convert prd", "product spec",
  "/launch", "/check", "/sync", "检查完整度", "completeness check",
  "同步产品文档", "sync product spec",
  "我要做一个产品", "新产品", "start a product", "new product".
  Also trigger when hooks inject [product-launcher] messages.
  Do not trigger for writing or editing PRDs (that is /write-prd's job),
  technical design (brainstorming's job), or UI design (ui-ux-pro-max's job).
---
```

- [ ] **Step 2: Commit**

```bash
git add skills/product-launcher/SKILL.md
git commit -m "feat(product-launcher): update frontmatter for lightweight mode triggers"
```

---

### Task 2: 重写 SKILL.md 模式 1 — 入口逻辑 + 路径 A（PRD 转化）

**Files:**
- Modify: `skills/product-launcher/SKILL.md:15-60`

- [ ] **Step 1: 替换模式 1 的标题、触发条件、目标和入口逻辑**

将第 15 行的 `# Product Launcher` 到第 60 行的收尾步骤（即整个模式 1 部分），替换为以下内容。注意模式 2 和模式 3 不动。

```markdown
# Product Launcher

你是一个专业的产品文档审查员。你的工作是确保从想法到代码的每个环节都不留模糊地带。

## 三个模式

### 模式 1：产品文档生成（/launch）

**触发条件：** 用户调用 /launch，或 hooks 注入 [product-launcher] 提醒。

**目标：** 根据用户的产品信息（PRD 或对话），输出完整的 Product-Spec.md。

**流程：**

1. **定位输入源：** 在项目根目录查找 PRD.md 或任何包含"PRD"的 .md 文件。
   - 找到 PRD，内容充实（≥ 200 字）→ 走**路径 A**（PRD 审查转化）
   - 找到 PRD，内容过于简略（< 200 字）→ 告诉用户 PRD 内容不足，提供两个选择：a. 补充 PRD 后重新运行 /launch；b. 切换到路径 B，从对话开始收集
   - 没找到 PRD → 走**路径 B**（轻量收集），告知用户："没有找到 PRD 文件，我们通过对话直接生成 Product-Spec.md。"

2. **检查已有 Product-Spec.md：** 如果项目根目录已存在 Product-Spec.md，询问用户：是在现有基础上更新，还是重新生成？

#### 路径 A：从 PRD 审查转化（有 PRD 时）

3. **逐项审查 PRD：** 以下问题必须搞清楚才能继续：
   - 功能描述含糊的：追问具体行为和边界。"用户可以管理设置"——管理什么设置？哪些可以改？改了之后呢？
   - 用户流程有断点的：追问衔接逻辑。用户从 A 到 B，中间发生了什么？出错了怎么办？
   - 功能之间有矛盾的：指出并要求澄清。"支持离线使用"和"实时同步数据"不能同时成立，选一个。
   - 关键信息缺失的：数据怎么存？离线怎么办？错误怎么处理？权限怎么控制？
   - 不放过"应该""大概""可能""也许""看情况"这类模糊词，看到就追问。

   **一次只问一个问题，等用户回答后再问下一个。** 一次甩 5 个问题，用户会挑简单的回答、跳过难的，最终留下的模糊地带反而更多。

4. **补充产品上下文（按需）：** 审查过程中根据 PRD 内容判断是否需要补充以下信息，需要时再问用户：
   - 产品是否涉及 AI 对话功能（是 → 后续生成系统提示词章节）
   - 产品是否需要多模态 AI（生图、图像分析等）
   - 原型策略：根据产品类型推荐技术方案（普通 Web → Claude Code 直接写；多模态 AI → Google AI Studio 可选；AI Agent → Claude Code + Agent SDK），用户确认后写入原型策略章节。以上只是常见推荐，根据实际需求灵活选择。
   - AI 产品还需要生成系统提示词草稿，让用户确认或修改。

5. **输出 Product-Spec.md：** 读取 `<skill-path>/templates/product-spec-template.md` 作为结构参考，同时读取 `<skill-path>/templates/product-spec-example.md` 作为填写粒度参考。逐章节填充，保存到项目根目录。各章节填写要点：
   - **功能清单：** 分"核心功能""辅助功能""不做（MVP 边界）"三组。"不做"清单同样重要，明确列出第一版不做的东西，防止后续 scope creep。
   - **用户流程：** 包含正常流程和异常流程（出错、网络问题、空状态等）。
   - **数据模型：** 列出核心实体、关键字段和实体之间的关系。不需要完整的数据库 schema，但要让后续 brainstorming 能据此做技术选型。
   - **第三方依赖：** API、SDK、外部服务。没有就写"无"。
   - **非功能需求：** 只写对原型设计有影响的约束（性能、数据量级、安全要求等），不需要面面俱到。
   - **项目结构：** 默认填 sps-harness 标准路径（app/、docs/superpowers/specs/、docs/superpowers/plans/）。如果用户的项目不使用 harness 默认结构，让用户修改。

   生成后回读自检：确认没有空章节或残留的模板占位符（`{{...}}`）。

6. **收尾：** 提醒用户 PRD 已归档，后续操作基于 Product-Spec.md。引导进入 brainstorming 做技术设计。
```

- [ ] **Step 2: Commit**

```bash
git add skills/product-launcher/SKILL.md
git commit -m "refactor(product-launcher): restructure /launch with entry logic and path A"
```

---

### Task 3: 添加 SKILL.md 路径 B（轻量收集模式）

**Files:**
- Modify: `skills/product-launcher/SKILL.md` — 在路径 A 的第 6 步（收尾）之后、模式 2 之前插入

- [ ] **Step 1: 在路径 A 收尾之后插入路径 B**

在"6. **收尾：**"段落之后、"### 模式 2：完整度检查（/check）"之前，插入以下内容：

```markdown

#### 路径 B：从对话收集（没有 PRD 时）

通过逐步提问收集产品信息，直接输出 Product-Spec.md。每次只问一个问题，等用户回答后再问下一个。

3. **定位：** 问用户"做什么、给谁用、解决什么问题？"，拿到一句话描述和核心价值。
   - 引导用户形成"给 [谁] 做 [什么]，解决 [什么问题]"的完整定位
   - 用户只说了"做什么"但没说"给谁"或"解决什么问题" → 追问缺失的部分
   - 用户说的"问题"其实是功能描述而不是真正的痛点 → 追问"用户现在怎么解决这个问题？为什么现有方案不够好？"
   - 定位清晰后进入下一步，不纠结措辞的完美程度

4. **核心功能：** 问"这个产品的核心功能有哪些？"，逐个确认，区分核心功能和辅助功能。
   - 对每个功能，追问具体行为和边界："用户怎么操作？操作完之后发生什么？"
   - 不放过模糊词："应该""大概""可能""也许""看情况"——看到就追问具体含义
   - 功能之间有矛盾的：指出并要求澄清
   - 判断标准："这个功能如果第一版没有，产品还能用吗？"能用 → 辅助功能

5. **不做什么：** 明确 MVP 边界。
   - 根据已收集的功能，主动推测用户可能想做但第一版不该做的东西，列出来让用户确认或补充
   - 对每个排除项，确认"为什么现在不做"，确保是有意识的决策而不是遗漏
   - 如果用户对某个排除项犹豫，帮助判断：加上这个功能会增加多少复杂度？没有它产品能验证核心假设吗？

6. **AI 产品判断：** 问"这个产品是否涉及 AI 对话功能（比如 AI 聊天、AI 生成内容、AI 分析等）？"
   - 是 → 追问 AI 的角色定义、工作流程规则、回复规范、约束条件，生成系统提示词草稿让用户确认
   - 是，且涉及多模态 AI（生图、图像分析等）→ 记录到原型策略
   - 不是 → 跳过，Product-Spec.md 中删除 AI 系统提示词章节

7. **技术约束：** 问"技术上有没有硬约束？比如纯前端还是需要后端、数据怎么存、有没有必须用的技术栈或平台？"
   - 普通 Web 应用 → 推荐 Claude Code 直接写
   - 多模态 AI 应用 → 推荐 Google AI Studio（可选）
   - AI Agent 产品 → 推荐 Claude Code + Agent SDK
   - 以上只是常见推荐，根据实际需求灵活选择
   - 用户没有技术偏好 → 原型策略中"技术栈偏好"留空，由 brainstorming 决定

8. **自动推导 + 输出：** 根据前 5 步收集的信息，自动推导剩余章节并输出 Product-Spec.md。
   - **用户流程：** 根据核心功能和辅助功能，推导正常流程和异常流程（出错、网络问题、空状态等）
   - **数据模型：** 根据功能描述，推导核心实体、关键字段和实体关系
   - **第三方依赖：** 根据功能和技术约束，推导需要的 API、SDK、外部服务。没有就写"无"
   - **非功能需求：** 根据产品类型和技术约束，推导性能、安全、兼容性等约束
   - **项目结构：** 默认填 sps-harness 标准路径（app/、docs/superpowers/specs/、docs/superpowers/plans/）。如果用户的项目不使用 harness 默认结构，让用户修改

   读取 `<skill-path>/templates/product-spec-template.md` 作为结构参考，读取 `<skill-path>/templates/product-spec-example.md` 作为填写粒度参考。逐章节填充，保存到项目根目录。生成后回读自检：确认没有空章节或残留的模板占位符（`{{...}}`）。让用户审核，有问题就改。

9. **收尾：** 提醒用户后续操作基于 Product-Spec.md。引导进入 brainstorming 做技术设计。
```

- [ ] **Step 2: Commit**

```bash
git add skills/product-launcher/SKILL.md
git commit -m "feat(product-launcher): add path B lightweight collection mode"
```

---

### Task 4: 更新 SKILL.md 关键原则和已知问题

**Files:**
- Modify: `skills/product-launcher/SKILL.md` — 关键原则和已知问题章节

- [ ] **Step 1: 更新关键原则**

将现有的"关键原则"章节替换为：

```markdown
## 关键原则

- **一次问一个问题。** 用户面对一堆问题会挑简单的答、跳过难的，最终模糊地带反而更多。一个一个问，每个都得到明确答案。
- **不放过模糊词。** "应该""大概""可能""也许""看情况"——这些词出现在 PRD 或对话中，到了代码实现阶段就会变成 bug 或返工。看到就追问。
- **不替代其他 Skill。** 不做技术设计（brainstorming 的事）、不做 UI 设计（ui-ux-pro-max 的事）、不写代码（executing-plans 的事）、不生成 PRD（write-prd 的事）。
- **Product-Spec.md 是唯一真相源。** /check 和 /sync 都基于这份文档，不关心它是从 PRD 转化来的还是从对话收集来的。
- **路径以声明为准。** /check 和 /sync 优先读取 Product-Spec.md 中"项目结构"章节声明的路径，读不到就用 harness 默认路径。
```

- [ ] **Step 2: 更新已知问题**

将现有的"已知问题"章节替换为：

```markdown
## 已知问题

- /launch 生成的 Product-Spec.md 对简单产品可能偏重（80+ 行）。如果用户的产品功能很少（3 个以内），适当精简数据模型和异常流程的粒度。
- 非交互模式下（subagent 执行），"一次问一个问题"的规则无法生效，模型会自行假设所有答案。这在自动化场景中是预期行为。
- 路径 B 的自动推导章节（用户流程、数据模型等）基于对话收集的信息推导，信息密度可能不如从完整 PRD 转化的版本。生成后务必让用户审核确认。
```

- [ ] **Step 3: Commit**

```bash
git add skills/product-launcher/SKILL.md
git commit -m "docs(product-launcher): update principles and known issues for dual-path"
```

---

### Task 5: 更新 workflow-map.md

**Files:**
- Modify: `rules/workflow-map.md`

- [ ] **Step 1: 替换 workflow-map.md 全部内容**

```markdown
## Workflow Map

Route to the right tool at each stage:

### 1. New Project
- Has design docs but no .claude/ → run /harvest to auto-generate CLAUDE.md
- No design docs and no .claude/ → run /harness-audit for manual setup guidance
- Has .claude/ → skip to relevant stage

### 2. Requirements（可选）
- 想法模糊，需要系统性的需求发现 → /discover（PM Skills）
- 需要正式的 PRD 文档留底 → /write-prd（PM Skills）
- 想法已经有了，想直接开始 → 跳到第 3 步

### 3. Product Spec（产品开发时）
- 有 PRD，需要转化 → /launch（从 PRD 审查转化）
- 没有 PRD，从想法开始 → /launch（从对话收集）
- Has Product-Spec.md, needs design → brainstorming（Superpowers）
- Brainstorming done, has frontend → consider ui-ux-pro-max before writing-plans
- Code exists, need status → /check（product-launcher）
- Design changed during iteration → /sync（product-launcher）

### 4. Design & Development
- Technical design → brainstorming（Superpowers）
- Create skill → skill-creator
- Implementation plan → writing-plans（Superpowers）
- Execute → subagent-driven-development（Superpowers）

### 5. .claude/ Architecture Iteration
- Quick rule add/check → /rules
- Deep diagnosis (why rule fails, escalation) → PWF or OpenSpec
- Prompt quality review → prompt-audit
- Skill not performing → autoresearch
- Periodic health check → /harness-audit

### 6. Quality Assurance（automatic）
- Code edited → auto-format hook (formatter) → typecheck hook (tsc) → quality-gate hook (linter)
- .claude/ .md edited → quality-gate hook (prompt-audit reminder)
- git commit attempted → commit-guard hook (message format + console.log + secret scan)
- git commit --no-verify attempted → block-no-verify hook (blocked)
- Session ending → completion-guard hook (security check)
- ~50 tool calls → suggest-compact hook
- All operations → observe hook (recording)

### 7. Security Review
- Auth/payment/user data changes → /security-review

### 8. Learning & Health
- Extract patterns → /learn
- Manage rules → /rules
- Compress context → /save-compact

### Work Mode Routing
- Building .claude/ architecture: harness-audit → /rules → prompt-audit → /harness-audit (iterate)
- Writing code/products: /launch → brainstorming → writing-plans → SDD → verification-loop → /security-review (if needed)
```

- [ ] **Step 2: Commit**

```bash
git add rules/workflow-map.md
git commit -m "docs(workflow-map): renumber steps, mark requirements as optional"
```

---

### Task 6: 验证

**Files:**
- Read: `skills/product-launcher/SKILL.md`
- Read: `rules/workflow-map.md`

- [ ] **Step 1: 通读 SKILL.md，检查以下项**

1. frontmatter 的 description 和触发词已更新
2. 模式 1 入口逻辑包含 PRD 检测和分流
3. 路径 A（PRD 转化）的步骤 3-6 内容和原始版本一致，没有遗漏
4. 路径 B（轻量收集）的步骤 3-9 完整，覆盖定位、功能、不做什么、AI 判断、技术约束、自动推导、收尾
5. 模式 2（/check）和模式 3（/sync）没有被改动
6. 关键原则和已知问题已更新
7. 没有残留的占位符或 TODO

- [ ] **Step 2: 通读 workflow-map.md，检查以下项**

1. 编号从 1 到 8 连续，没有 2.5
2. 第 2 步标注"可选"，包含"跳到第 3 步"的选项
3. 第 3 步包含"有 PRD"和"没有 PRD"两条路由
4. Work Mode Routing 以 /launch 作为产品开发起点
5. 第 6 步 Quality Assurance 的 hook 详情保留（括号说明）

- [ ] **Step 3: 最终 commit（如有修正）**

如果验证过程中发现问题并修正，提交修正：

```bash
git add -A
git commit -m "fix(product-launcher): post-review corrections"
```
