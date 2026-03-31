# Product Launcher — 设计文档

## 概述

Product Launcher 是 sps-harness 的新模块，补上现有工作流中从 PRD 到可运行产品之间的缺失环节。不替代任何现有 Skill，只做串联和桥接。

**解决的核心问题：** 现有 Skill 体系（PM Skills + Superpowers）覆盖了需求收集和代码迭代，但中间缺少：
- 将传统 PRD 转化为开发可用的轻量文档（挑刺审查 + 提取核心信息）
- AI 产品的系统提示词生成
- 原型策略的标注（告知 Superpowers 用什么工具和技术栈）
- PRD 与代码的完整度检查
- 迭代时产品文档的自动同步

**目标用户：** 开发新手，一个人 + AI 完成所有环节（PM + 设计 + 开发）。

---

## 完整工作流程

### 第零步：初始化项目

```
创建项目文件夹
  → /init（Claude Code 官方，生成 CLAUDE.md）
  → /harness-audit（补全 .claude/ 目录结构）
```

### 第一步：需求

```
/discover（可选，想法模糊时用）
  → /write-prd
  → 完整 PRD（传统格式，归档留底）
```

### 第二步：转化（新 Skill — product-launcher）

```
读取完整 PRD
  → 挑刺审查（逐项检查 PRD 中模糊、矛盾、遗漏的地方）
    - 功能描述含糊的：追问具体行为和边界
    - 用户流程有断点的：追问衔接逻辑
    - 功能之间有矛盾的：指出并要求澄清
    - 关键信息缺失的：比如数据怎么存、离线怎么办、错误怎么处理
    - 一个问题一个问题问，不一次性甩一堆
    - 语气直接，不客气，不放过任何"应该""大概""可能"这类模糊词
  → 全部澄清后，提取核心信息（产品说明、功能清单、用户流程）
  → 如果是 AI 产品：根据 PRD 内容自动生成系统提示词草稿，用户确认或修改
  → 如果不是 AI 产品：跳过系统提示词
  → 确定原型策略（根据产品类型推荐，用户确认）：
    - 普通 Web 应用 → Claude Code 直接写
    - 多模态 AI 应用（生图、图像分析等）→ Google AI Studio（可选）
    - AI Agent 产品（工具调用、子代理）→ Claude Code + Agent SDK
  → 输出轻量 Product-Spec.md
  → 完整 PRD 归档留底，后续不再频繁读取
```

### 第三步：设计与规划（现有 Superpowers）

```
3a. brainstorming（技术设计，定产品逻辑、架构、基本布局）
    → 读取 Product-Spec.md 中的原型策略，据此做技术选型
    → 输出设计文档

3b. hooks 提醒：产品有前端界面吗？是否需要跑 ui-ux-pro-max？
    → 调用 ui-ux-pro-max：定专业 UI 方案（配色、字体、组件库、视觉风格）
    → 跳过：直接进入 writing-plans

3c. writing-plans（把产品逻辑 + 技术架构 + UI 方案整合成实现计划）
    → 计划文件生成
```

注：ui-ux-pro-max 必须在 writing-plans 之前，否则实现计划中不会包含 UI 相关任务。

### 第四步：生成原型（仅第一次触发）

```
hooks 自动检测：计划文件存在 + Product-Spec.md 存在 + 项目 app/ 目录为空或不存在
  → 读取 Product-Spec.md 的"原型策略"章节，按既定策略执行

Claude Code 路径（默认）：
  → 直接进入 executing-plans，按计划写代码

Google AI Studio 路径（多模态 AI 应用可选）：
  → 整合 Product-Spec.md + 设计文档 + 实现计划为一份可粘贴文本
  → 将设计文档中的 UI 方案转化成 AI Studio 能理解的 UI 提示词
  → 推荐 AI Studio 该选的 Gemini 能力（生图、对话、图像分析等）
  → 一步步引导用户在 AI Studio 中操作
  → 用户下载代码后放入 app/ 目录

Claude Code + Agent SDK 路径（AI Agent 产品）：
  → 直接进入 executing-plans，计划中已包含 Agent SDK 的集成
```

### 第五步：验收

```
代码完成后（executing-plans 写完 或 AI Studio 下载后 executing-plans 补全）
  → /check 完整度检查（Product-Spec.md 对比代码）
  → 输出报告：已完成 / 部分完成 / 未完成
```

### 后续迭代

```
发现要改需求
  → /check 看当前状态（可选）
  → brainstorming（搞清楚要改什么）
  → hooks 检测到设计文档变更 + Product-Spec.md 存在
    → 提醒同步 Product-Spec.md + 追加 Product-Changelog.md
  → writing-plans → executing-plans
  → /check 验收
```

---

## 项目目录结构规范

```
项目文件夹/
  .claude/                  ← 项目配置
    CLAUDE.md               ← 项目规则（/init 生成，/harness-audit 补全）
    rules/                  ← 项目规则文件
    settings.json           ← 权限配置
    settings.local.json     ← 本地权限覆盖
  docs/
    superpowers/
      specs/                ← brainstorming 的设计文档
      plans/                ← writing-plans 的计划文件
  PRD.md                    ← /write-prd 的完整产出（归档，不频繁读取）
  Product-Spec.md           ← 轻量版产品文档（日常操作基于这份）
  Product-Changelog.md      ← 变更日志（迭代时自动追加）
  app/                      ← 所有产品代码放这里
```

**关键规则：** 所有产品代码必须放在 `app/` 目录下，不允许在项目根目录创建代码文件。这条规则需要写入项目的 `.claude/rules/` 中。

---

## Product-Spec.md 结构

从完整 PRD 转化而来的轻量文档，只保留开发需要的信息。

```markdown
# [产品名称] Product Spec

## 产品说明
- 一句话描述：做什么、给谁用
- 核心价值

## 功能清单
- [ ] 功能 1：描述
- [ ] 功能 2：描述
- [ ] ...
（方括号用于 /check 标注完成状态）

## 用户流程
- 用户打开产品 → 第一步 → 第二步 → ...

## AI 系统提示词（仅 AI 产品）
- 角色定义
- 工作流程规则
- 回复规范
- 约束条件

## 原型策略
- 原型工具：Claude Code / Google AI Studio / Claude Code + Agent SDK
- 技术约束：（如走 AI Studio 需兼容 React + Gemini 生态，如走 Agent SDK 需基于 Claude Agent SDK）
- 说明：brainstorming 和 writing-plans 请参照此策略进行技术选型，确保原型代码可作为成品基础持续迭代，不被推翻重来
```

注：UI 风格和详细技术选型由 brainstorming 阶段决定，记录在设计文档中。Product-Spec 的"原型策略"章节用于告知 Superpowers 原型工具的技术约束，确保选型兼容，原型代码不会被推翻重来。

---

## Hooks 设计

新增 hooks 脚本，集成到 sps-harness 的 hooks.json 中。

### Hook 1：UI 方案提醒

**触发条件：** PostToolUse（Edit|Write），检测到 `docs/superpowers/specs/` 下有新文件写入（brainstorming 完成）
**检查逻辑：**
- Product-Spec.md 存在
- `app/` 目录不存在或为空（说明是首次开发，不是迭代）

**输出：**
```
[product-launcher] 设计文档已完成。产品如果有前端界面，建议先调用 ui-ux-pro-max 做专业的 UI 方案（配色、字体、组件库）再进入 writing-plans。
输入 "跳过" 直接进入 writing-plans，或调用 ui-ux-pro-max 开始 UI 设计。
```

### Hook 2：原型执行提醒

**触发条件：** PostToolUse（Edit|Write），检测到 `docs/superpowers/plans/` 下有新文件写入
**检查逻辑：**
- Product-Spec.md 存在
- `app/` 目录不存在或为空
- 这是该项目第一次触发（用标记文件 `.claude/.launch-prompted` 防止重复）

**输出（根据 Product-Spec.md 原型策略动态生成）：**

Claude Code 路径：
```
[product-launcher] 实现计划已完成。原型策略为 Claude Code，直接进入 executing-plans 开始写代码。
```

AI Studio 路径：
```
[product-launcher] 实现计划已完成。原型策略为 Google AI Studio。
请调用 product-launcher skill 生成 AI Studio 输入文本和操作引导。
```

Agent SDK 路径：
```
[product-launcher] 实现计划已完成。原型策略为 Claude Code + Agent SDK，直接进入 executing-plans 开始写代码。
```

### Hook 3：迭代同步提醒

**触发条件：** PostToolUse（Edit|Write），检测到 `docs/superpowers/specs/` 下的文件被修改
**检查逻辑：**
- Product-Spec.md 存在
- `app/` 目录非空（已有代码，说明在迭代阶段）

**输出：**
```
[product-launcher] 检测到设计文档变更。请同步更新 Product-Spec.md 和 Product-Changelog.md。
```

### Hook 4：完整度检查提醒

**触发条件：** PostToolUse（Write），检测到 `app/` 目录下短时间内写入大量文件（>10 个）
**检查逻辑：**
- Product-Spec.md 存在

**输出：**
```
[product-launcher] 检测到大量代码文件写入。建议运行 /check 进行完整度检查。
```

---

## /check 完整度检查设计

### 功能

读取 Product-Spec.md 的功能清单，扫描 `app/` 目录下的代码，判断每个功能的实现状态。

### 输出格式

```markdown
# 完整度检查报告

## 已完成
- [x] 功能 1：在 app/components/xxx.tsx 中实现

## 部分完成
- [~] 功能 3：UI 已实现，但缺少后端逻辑

## 未完成
- [ ] 功能 5：代码中未找到相关实现

## 总结
完成度：6/10（60%）
建议优先处理：功能 5（核心功能）、功能 3（补全后端）
```

### 附加动作

- 更新 Product-Spec.md 中功能清单的方括号状态
- 如果存在实现计划文件，同步标注已完成的任务
- 输出可直接喂给 executing-plans 的剩余任务列表

---

## 与现有模块的关系

| 现有模块 | product-launcher 怎么配合 |
|---|---|
| `/init` | 第零步，先于一切 |
| `/harness-audit` | 第零步，补全 .claude/ 结构 |
| `/discover` | 可选的第一步，想法模糊时用 |
| `/write-prd` | 第一步，产出完整 PRD，product-launcher 读取并转化 |
| `brainstorming` | 第三步，读取 Product-Spec.md 原型策略做技术选型。迭代时 hooks 提醒同步 |
| `writing-plans` | 第三步，基于兼容原型策略的技术选型出实现计划 |
| `ui-ux-pro-max` | 可选。brainstorming 后 hooks 提醒，用户决定是否调用 |
| `executing-plans` | 第四步/第五步，按计划写代码或补全 |
| workflow-map.md | 需要更新，加入产品转化和验收阶段 |

---

## 新增文件清单

### Skill 文件
- `skills/product-launcher/SKILL.md` — 主技能文件（挑刺审查、转化 PRD、完整度检查、迭代同步）
- `skills/product-launcher/templates/product-spec-template.md` — Product-Spec 模板
- `skills/product-launcher/templates/changelog-template.md` — 变更日志模板

### Hooks 脚本
- `hooks/scripts/ui-prompt.js` — UI 方案提醒（brainstorming 后）
- `hooks/scripts/launch-prompt.js` — 原型执行提醒（writing-plans 后，根据原型策略动态输出）
- `hooks/scripts/spec-sync-prompt.js` — 迭代同步提醒
- `hooks/scripts/check-prompt.js` — 完整度检查提醒

### Rules
- `rules/project-structure.md` — 项目目录结构规范（代码放 app/）

### 更新的文件
- `hooks/hooks.json` — 注册新的 hooks
- `rules/workflow-map.md` — 加入产品转化和验收阶段

---

## 不做的事情

- 不替代 `/write-prd`，不自己生成 PRD
- 不替代 `brainstorming`、`writing-plans`、`executing-plans`
- 不替代 `ui-ux-pro-max`
- 不自动调用 Google AI Studio API（AI Studio 没有 API，需要用户手动操作）
- 不管理产品的部署和发布
- 不做 AI 系统提示词的深度优化（那是 `prompt-audit` 的事）
- 不控制 Superpowers 的内部行为，只通过 Product-Spec.md 传递信息
