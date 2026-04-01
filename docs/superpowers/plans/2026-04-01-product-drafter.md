# Product Drafter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新建 product-drafter skill 并回退 product-launcher 中的 Path B 内联代码，改为链式调用

**Architecture:** product-drafter 作为独立 skill（SKILL.md + references/questioning-guide.md），product-launcher 通过入口逻辑链式调用。两者共用 product-launcher 的 Product-Spec.md 模板。

**Tech Stack:** Markdown（prompt engineering）

---

### Task 1: 回退 product-launcher SKILL.md

**Files:**
- Modify: `skills/product-launcher/SKILL.md`

- [ ] **Step 1: 替换整个 SKILL.md 内容（lines 1-155）**

将 `skills/product-launcher/SKILL.md` 的全部内容替换为以下内容（注意：frontmatter 去掉了 drafter 触发词，Path B 替换为链式调用，关键原则和已知问题回退）：

```markdown
---
name: product-launcher
description: >
  Use when converting a PRD into a lightweight Product-Spec.md (/launch),
  checking feature completeness against code (/check),
  or syncing product docs after design changes (/sync).
  Trigger on: "product-launcher", "转化PRD", "convert prd", "product spec",
  "/launch", "/check", "/sync", "检查完整度", "completeness check",
  "同步产品文档", "sync product spec".
  Also trigger when hooks inject [product-launcher] messages.
  Do not trigger for writing or editing PRDs (that is /write-prd's job),
  technical design (brainstorming's job), or UI design (ui-ux-pro-max's job).
  Do not trigger for collecting product requirements from scratch (that is product-drafter's job).
---

# Product Launcher

你是一个专业的产品文档审查员。你的工作是确保从 PRD 到代码的每个环节都不留模糊地带。

## 三个模式

### 模式 1：转化（/launch）

读取项目中的 PRD 文件，审查后输出轻量的 Product-Spec.md。

**触发条件：** 用户调用 /launch，或 hooks 注入 [product-launcher] 提醒。

**目标：** 从 PRD 中提取所有模糊地带，逐一澄清后输出完整的 Product-Spec.md。

**流程：**

1. **定位 PRD 文件：** 在项目根目录查找 PRD.md 或任何包含"PRD"的 .md 文件。
   - 找到 PRD，内容充实（≥ 200 字）→ 继续步骤 2
   - 找到 PRD，内容过于简略（< 200 字）→ 告诉用户 PRD 内容不足，提供两个选择：a. 补充 PRD 后重新运行 /launch；b. 调用 product-drafter，从对话收集产品信息
   - 没找到 PRD → 调用 product-drafter skill，告知用户："没有找到 PRD 文件，切换到 product-drafter 通过对话直接生成 Product-Spec.md。"

2. **检查已有 Product-Spec.md：** 如果项目根目录已存在 Product-Spec.md，询问用户：是在现有基础上更新，还是从 PRD 重新生成？

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

### 模式 2：完整度检查（/check）

对比 Product-Spec.md 的功能清单和代码目录下的实现，输出完整度报告。

**触发条件：** 用户调用 /check，或 hooks 注入完整度检查提醒。

**流程：**

1. **读取 Product-Spec.md：** 提取功能清单（所有 `- [ ]`、`- [x]`、`- [~]` 开头的行）。同时读取"项目结构"章节，确定代码目录和文档目录的路径。如果没有"项目结构"章节，使用 harness 默认路径（app/、docs/superpowers/plans/）。如果声明的路径不存在，提醒用户检查路径是否正确。
2. **针对性扫描代码：** 根据功能清单的每一项，在代码目录中搜索相关的文件和实现。不要试图读取所有代码文件，而是根据功能描述中的关键词定向搜索（用 Grep/Glob），然后读取相关文件确认实现程度。
3. **逐项对比：** 对每个功能判断：
   - [x] 已完成：找到对应的完整实现
   - [~] 部分完成：找到部分实现，说明缺什么
   - [ ] 未完成：代码中未找到相关实现
4. **输出报告：** 按已完成/部分完成/未完成分组，给出完成度百分比和优先处理建议。
5. **更新文档：** 把检查结果写回 Product-Spec.md 的功能清单（更新方括号状态）。
6. **更新计划：** 如果实现计划目录下有计划文件，同步标注已完成的任务。

### 模式 3：迭代同步（/sync）

将最近的设计变更同步到 Product-Spec.md 和 Product-Changelog.md。

**触发条件：** hooks 注入迭代同步提醒后，用户确认执行。

**流程：**

1. **读取 Product-Spec.md 的项目结构声明：** 确定设计文档目录路径。如果没有声明，使用 harness 默认路径（docs/superpowers/specs/）。如果路径不存在，提醒用户。
2. **读取最近的设计文档变更：** 检查设计文档目录下最近修改的文件。
3. **对比 Product-Spec.md：** 找出哪些功能被新增、修改或删除。
4. **更新 Product-Spec.md：** 把变更同步到功能清单和相关章节。
5. **追加 Changelog：** 读取 `<skill-path>/templates/changelog-template.md` 的格式，在 Product-Changelog.md 顶部追加一条变更记录。如果 Product-Changelog.md 不存在，基于模板创建。

## 关键原则

- **一次问一个问题。** 用户面对一堆问题会挑简单的答、跳过难的，最终模糊地带反而更多。一个一个问，每个都得到明确答案。
- **不放过模糊词。** "应该""大概""可能""也许""看情况"——这些词出现在 PRD 里，到了代码实现阶段就会变成 bug 或返工。看到就追问。
- **不替代其他 Skill。** 不做技术设计（brainstorming 的事）、不做 UI 设计（ui-ux-pro-max 的事）、不写代码（executing-plans 的事）、不从零收集需求（product-drafter 的事）。
- **Product-Spec.md 是唯一真相源。** /check 和 /sync 都基于这份文档。
- **路径以声明为准。** /check 和 /sync 优先读取 Product-Spec.md 中"项目结构"章节声明的路径，读不到就用 harness 默认路径。

## 已知问题

- /launch 生成的 Product-Spec.md 对简单产品可能偏重（80+ 行）。如果用户的产品功能很少（3 个以内），适当精简数据模型和异常流程的粒度。
- 非交互模式下（subagent 执行），"一次问一个问题"的规则无法生效，模型会自行假设所有答案。这在自动化场景中是预期行为。
```

- [ ] **Step 2: Commit**

```bash
git add skills/product-launcher/SKILL.md
git commit -m "refactor(product-launcher): remove inline path B, delegate to product-drafter"
```

---

### Task 2: 创建 product-drafter SKILL.md

**Files:**
- Create: `skills/product-drafter/SKILL.md`

- [ ] **Step 1: 创建目录和 SKILL.md**

创建 `skills/product-drafter/SKILL.md`，内容即设计文档中"product-drafter 对话流程"章节的完整实现。SKILL.md 包含 frontmatter + 角色定义 + 8 步流程 + 关键原则。具体内容从设计文档 `docs/superpowers/specs/2026-04-01-launch-lightweight-mode-design.md` 的"product-drafter 对话流程"章节提取，frontmatter 如下：

```yaml
---
name: product-drafter
description: >
  Use when collecting product requirements through conversation to generate
  a Product-Spec.md, without needing a formal PRD first.
  Trigger on: "product-drafter", "我要做一个产品", "新产品",
  "start a product", "new product", "做个产品", "产品想法".
  Also triggered by product-launcher when no PRD is found.
  Do not trigger for PRD conversion (product-launcher's job),
  completeness checking (/check), or design syncing (/sync).
---
```

SKILL.md 正文结构：

```markdown
# Product Drafter

你是一个轻量的产品经理。你的工作是通过对话帮用户把脑子里的产品想法变成结构化的 Product-Spec.md，确保每个关键问题都有明确答案。

进入时读取 `<skill-path>/references/questioning-guide.md` 获取详细的提问方法论。

## 对话流程

[第 1-8 步 + 收尾，内容从设计文档提取]

## 关键原则

- **一次问一个问题。** 用户面对一堆问题会挑简单的答、跳过难的。一个一个问，每个都得到明确答案。
- **不放过模糊词。** "应该""大概""可能""也许""看情况"——看到就追问。详见 questioning-guide.md 的模糊词狩猎表。
- **追问到行为层面。** 抽象描述无法指导实现。标准：能根据描述画出界面原型吗？不能就继续追问。
- **不替代其他 Skill。** 不做技术设计（brainstorming 的事）、不做 UI 设计（ui-ux-pro-max 的事）、不审查 PRD（product-launcher 的事）。
- **轻量但专业。** 流程比 write-prd 轻，但提问质量向 write-prd 看齐。识别伪问题、追问到行为层面、主动推测 MVP 边界。
```

- [ ] **Step 2: Commit**

```bash
git add skills/product-drafter/SKILL.md
git commit -m "feat(product-drafter): create skill for lightweight requirements collection"
```

---

### Task 3: 创建 questioning-guide.md

**Files:**
- Create: `skills/product-drafter/references/questioning-guide.md`

- [ ] **Step 1: 创建目录和 questioning-guide.md**

创建 `skills/product-drafter/references/questioning-guide.md`，内容从设计文档的"questioning-guide.md 内容规划"章节提取。包含 5 个主题：

1. 识别伪问题（Solution Smuggling、功能描述伪装、商业指标伪装）
2. 追问到行为层面（追问链示例、判断标准）
3. 模糊词狩猎（模糊词表 + 追问方式）
4. MVP 边界判断（三个判断问题 + 常见砍掉清单）
5. 回答质量判断（好回答特征 + 需要追问的信号）

从 `docs/superpowers/specs/2026-04-01-launch-lightweight-mode-design.md` 的对应章节提取完整内容。

- [ ] **Step 2: Commit**

```bash
git add skills/product-drafter/references/questioning-guide.md
git commit -m "docs(product-drafter): add questioning methodology guide"
```

---

### Task 4: 更新 workflow-map.md

**Files:**
- Modify: `rules/workflow-map.md:15-21`

- [ ] **Step 1: 更新第 3 步 Product Spec**

将 workflow-map.md 的第 3 步（lines 15-21）替换为：

```markdown
### 3. Product Spec（产品开发时）
- 有 PRD，需要转化 → /launch（从 PRD 审查转化）
- 没有 PRD，从想法开始 → /launch（自动链式调用 product-drafter）
- 也可以直接调用 product-drafter
- Has Product-Spec.md, needs design → brainstorming（Superpowers）
- Brainstorming done, has frontend → consider ui-ux-pro-max before writing-plans
- Code exists, need status → /check（product-launcher）
- Design changed during iteration → /sync（product-launcher）
```

- [ ] **Step 2: Commit**

```bash
git add rules/workflow-map.md
git commit -m "docs(workflow-map): add product-drafter to routing"
```

---

### Task 5: 验证

**Files:**
- Read: `skills/product-launcher/SKILL.md`
- Read: `skills/product-drafter/SKILL.md`
- Read: `skills/product-drafter/references/questioning-guide.md`
- Read: `rules/workflow-map.md`

- [ ] **Step 1: 通读 product-launcher SKILL.md，检查以下项**

1. frontmatter 不含 product-drafter 的触发词（"我要做一个产品"等已移除）
2. frontmatter 包含"Do not trigger for collecting product requirements from scratch"
3. 模式 1 步骤 1 的三个分支：PRD 充实 → 继续；PRD 简略 → 提供选择含调用 product-drafter；没找到 PRD → 调用 product-drafter
4. 没有路径 B 的内联流程代码
5. 模式 2 和模式 3 内容和原始版本一致
6. 关键原则包含"不从零收集需求（product-drafter 的事）"
7. 已知问题不含路径 B 相关条目

- [ ] **Step 2: 通读 product-drafter SKILL.md，检查以下项**

1. frontmatter 包含正确的触发词
2. 包含"进入时读取 questioning-guide.md"的指令
3. 8 步流程完整（检查 Spec → 做什么给谁 → 解决什么问题 → 核心功能 → 不做什么 → AI 判断 → 技术约束 → 自动推导输出）
4. 第 8 步引用 product-launcher 的模板文件路径
5. 收尾引导 brainstorming
6. 关键原则包含"轻量但专业"

- [ ] **Step 3: 通读 questioning-guide.md，检查以下项**

1. 5 个主题完整（识别伪问题、追问到行为层面、模糊词狩猎、MVP 边界判断、回答质量判断）
2. 每个主题有具体的好/坏示例
3. 模糊词表完整（7 类）
4. MVP 三个判断问题在位

- [ ] **Step 4: 通读 workflow-map.md，检查以下项**

1. 第 3 步包含"也可以直接调用 product-drafter"
2. 没有 PRD 的路由写的是"自动链式调用 product-drafter"而不是"从对话收集"

- [ ] **Step 5: 最终 commit（如有修正）**

```bash
git add -A
git commit -m "fix: post-review corrections for product-drafter"
```
