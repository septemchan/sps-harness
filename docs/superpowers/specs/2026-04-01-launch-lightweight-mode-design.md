# /launch 轻量收集模式 — 设计文档

## 概述

为 product-launcher 的 /launch 模式新增"轻量收集"路径。当项目中没有 PRD 文件时，通过对话逐步收集产品信息，直接输出 Product-Spec.md，跳过 PRD 这个中间产物。

**解决的核心问题：** 现有 /launch 要求先跑 /write-prd 生成 PRD，但 write-prd 是一个 3-4 天的重流程（problem-statement → proto-persona → prd-development → user-story → user-story-splitting），对于目标用户（一个人 + AI 做产品）来说过重。用户脑子里已经有想法，不需要用户画像、用户故事这套 PM 方法论，需要的是快速把想法结构化、查漏补缺。

**不替代的东西：**
- 不替代 /write-prd。需要正式 PRD 文档留底的场景（比如团队协作、存档合规）仍然用 /write-prd。
- 不替代现有 /launch 的 PRD 转化路径。有 PRD 时走挑刺审查，逻辑不变。
- 轻量收集模式输出的是 Product-Spec.md，不是 PRD。

---

## 改动范围

### 改动的文件
- `skills/product-launcher/SKILL.md` — /launch 流程加入轻量收集分支
- `rules/workflow-map.md` — 重新编号，/discover 和 /write-prd 标注为可选

### 不改动的文件
- `skills/product-launcher/templates/` — 模板不变，两条路径共用
- 模式 2（/check）和模式 3（/sync）— 不受影响
- hooks 脚本 — 只检测文件是否存在，不关心来源
- plugin.json — 版本号视情况更新

---

## /launch 入口逻辑改造

```
/launch 启动
  │
  ├─ 1. 在项目根目录查找 PRD 文件（PRD.md 或包含"PRD"的 .md 文件）
  │
  ├─ [找到 PRD]
  │   ├─ PRD 内容充实（≥ 200 字）→ 走现有的"挑刺审查 + 转化"路径（不变）
  │   └─ PRD 内容过于简略（< 200 字）→ 提供选择：
  │       a. 补充 PRD 后重新运行 /launch
  │       b. 切换到轻量收集模式，从对话开始
  │
  └─ [没找到 PRD] → 进入轻量收集模式
      └─ 告知用户："没有找到 PRD 文件，我们通过对话直接生成 Product-Spec.md。"

两条路径进入各自流程后，第一步都是检查已有 Product-Spec.md：
  ├─ 已存在 → 问用户：在现有基础上更新，还是重新生成？
  └─ 不存在 → 继续
```

---

## 轻量收集模式：对话流程

进入轻量收集模式后，按以下顺序逐个提问。每次只问一个问题，等用户回答后再问下一个。

### 第 1 步：定位

**目标：** 拿到一句话描述和核心价值，对应 Product-Spec.md 的"产品说明"章节。

**提问：** "做什么、给谁用、解决什么问题？"

**追问策略（参考 write-prd Executive Summary）：**
- 引导用户形成"给 [谁] 做 [什么]，解决 [什么问题]"的完整定位
- 用户只说了"做什么"但没说"给谁"或"解决什么问题" → 追问缺失的部分
- 用户说的"问题"其实是功能描述而不是真正的痛点 → 追问"用户现在怎么解决这个问题？为什么现有方案不够好？"（参考 write-prd Problem Statement 的核心思路：区分"功能"和"问题"）
- 定位清晰后进入下一步，不纠结措辞的完美程度

### 第 2 步：核心功能

**目标：** 收集功能清单，区分核心功能和辅助功能。

**提问：** "这个产品的核心功能有哪些？"

**追问策略（参考 write-prd Solution Overview + 现有 /launch 挑刺逻辑）：**
- 用户可能一口气说好几个功能，也可能只说一个大方向
- 对每个功能，追问具体行为和边界："用户怎么操作？操作完之后发生什么？"（参考 write-prd Solution Overview 的"How does it work?"）
- 不放过模糊词："应该""大概""可能""也许""看情况"——看到就追问具体含义
- 功能之间有矛盾的：指出并要求澄清
- 帮用户区分核心功能和辅助功能："这个功能如果第一版没有，产品还能用吗？"能用 → 辅助功能

### 第 3 步：不做什么

**目标：** 明确 MVP 边界，对应 Product-Spec.md 的"不做（MVP 边界）"清单。

**提问策略（参考 write-prd Out of Scope）：**
- 根据已收集的功能，主动推测用户可能想做但第一版不该做的东西，列出来让用户确认或补充
- 对每个排除项，确认"为什么现在不做"，确保是有意识的决策而不是遗漏
- 如果用户对某个排除项犹豫，帮助判断：加上这个功能会增加多少复杂度？没有它产品能验证核心假设吗？

### 第 4 步：AI 产品判断

**目标：** 决定是否需要 AI 系统提示词章节。

**提问：** "这个产品是否涉及 AI 对话功能（比如 AI 聊天、AI 生成内容、AI 分析等）？"

**后续（和现有 /launch 一致）：**
- 是 → 追问 AI 的角色定义、工作流程规则、回复规范、约束条件，生成系统提示词草稿让用户确认
- 是，且涉及多模态 AI（生图、图像分析等）→ 记录到原型策略
- 不是 → 跳过，Product-Spec.md 中删除 AI 系统提示词章节

### 第 5 步：技术约束

**目标：** 收集原型策略相关信息，对应 Product-Spec.md 的"原型策略"章节。

**提问：** "技术上有没有硬约束？比如纯前端还是需要后端、数据怎么存、有没有必须用的技术栈或平台？"

**推荐策略（和现有 /launch 一致）：**
- 普通 Web 应用 → 推荐 Claude Code 直接写
- 多模态 AI 应用 → 推荐 Google AI Studio（可选）
- AI Agent 产品 → 推荐 Claude Code + Agent SDK
- 以上只是常见推荐，根据实际需求灵活选择
- 用户没有技术偏好 → 原型策略中"技术栈偏好"留空，由 brainstorming 决定

### 第 6 步：自动推导 + 输出

**目标：** 根据前 5 步收集的信息，填充 Product-Spec.md 的剩余章节并输出。

**自动推导的章节：**
- **用户流程：** 根据核心功能和辅助功能，推导正常流程和异常流程（出错、网络问题、空状态等）
- **数据模型：** 根据功能描述，推导核心实体、关键字段和实体关系
- **第三方依赖：** 根据功能和技术约束，推导需要的 API、SDK、外部服务
- **非功能需求：** 根据产品类型和技术约束，推导性能、安全、兼容性等约束
- **项目结构：** 默认填 sps-harness 标准路径（app/、docs/superpowers/specs/、docs/superpowers/plans/）

**输出流程：**
1. 读取 `<skill-path>/templates/product-spec-template.md` 作为结构参考
2. 读取 `<skill-path>/templates/product-spec-example.md` 作为填写粒度参考
3. 逐章节填充，保存到项目根目录
4. 回读自检：确认没有空章节或残留的 `{{...}}` 占位符
5. 让用户审核，有问题就改

### 收尾

和现有 /launch 一致：提醒用户后续操作基于 Product-Spec.md，引导进入 brainstorming 做技术设计。

---

## 共享原则

两条路径（PRD 转化 / 轻量收集）共享以下原则：

- **一次只问一个问题。** 用户面对一堆问题会挑简单的答、跳过难的，最终模糊地带反而更多。
- **不放过模糊词。** "应该""大概""可能""也许""看情况"——看到就追问。
- **非交互模式例外。** subagent 执行时"一次问一个问题"的规则无法生效，模型会自行假设所有答案。这在自动化场景中是预期行为。

---

## SKILL.md frontmatter 更新

现有：
```yaml
description: >
  Use when converting a PRD into a lightweight Product-Spec.md (/launch),
  checking feature completeness against code (/check),
  or syncing product docs after design changes (/sync).
  Trigger on: "product-launcher", "转化PRD", "convert prd", "product spec",
  "/launch", "/check", "/sync", "检查完整度", "completeness check",
  "同步产品文档", "sync product spec".
```

改为：
```yaml
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
```

---

## workflow-map.md 更新

重新编号，/discover 和 /write-prd 标注为可选：

```markdown
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
- Code edited → auto-format hook → typecheck hook → quality-gate hook
- .claude/ .md edited → quality-gate hook (prompt-audit reminder)
- git commit attempted → commit-guard hook
- git commit --no-verify attempted → block-no-verify hook (blocked)
- Session ending → completion-guard hook (security check)
- ~50 tool calls → suggest-compact hook
- All operations → observe hook

### 7. Security Review
- Auth/payment/user data changes → /security-review

### 8. Learning & Health
- Extract patterns → /learn
- Manage rules → /rules
- Compress context → /save-compact
```

Work Mode Routing 更新：
```markdown
### Work Mode Routing
- Building .claude/ architecture: harness-audit → /rules → prompt-audit → /harness-audit (iterate)
- Writing code/products: /launch → brainstorming → writing-plans → SDD → verification-loop → /security-review (if needed)
```

---

## 不做的事情

- 不替代 /write-prd。轻量模式跳过 PRD 直接输出 Product-Spec.md，不是在"生成 PRD"。/write-prd 在需要正式 PRD 文档的场景下仍然有价值。
- 不修改 Product-Spec.md 的模板结构。输出格式和现有 /launch 完全一致。
- 不修改 /check 和 /sync 的逻辑。
- 不修改 hooks 脚本。
- 不替代 brainstorming、writing-plans、ui-ux-pro-max。
