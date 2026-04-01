# Product Drafter — 设计文档

## 概述

新增 product-drafter skill，为没有 PRD 的用户提供轻量的需求收集流程，通过对话直接输出 Product-Spec.md。

**解决的核心问题：** 现有 /launch 要求先跑 /write-prd 生成 PRD，但 write-prd 是一个 3-4 天的重流程（problem-statement → proto-persona → prd-development → user-story → user-story-splitting），对于目标用户（一个人 + AI 做产品）来说过重。用户脑子里已经有想法，不需要用户画像、用户故事这套 PM 方法论，需要的是快速把想法结构化、查漏补缺。

**为什么独立成 skill 而不是放在 product-launcher 里：**
- skill 按需加载，做一件事只需要那件事的指令
- product-launcher 已有 3 个模式（/launch, /check, /sync），都是文档操作，加入交互式需求收集会让职责模糊
- product-drafter 需要 100-150 行详细的提问方法论，放在 product-launcher 里会稀释其他模式的指令密度

**不替代的东西：**
- 不替代 /write-prd。需要正式 PRD 文档的场景（团队协作、存档合规）仍然用 /write-prd
- 不替代 product-launcher。product-drafter 只做需求收集和 Product-Spec.md 生成，不做完整度检查（/check）和迭代同步（/sync）
- 输出的是 Product-Spec.md，不是 PRD

---

## 架构

### 文件结构

```
skills/product-drafter/
├── SKILL.md                    ← 主技能文件：流程 + 每步的核心指导
└── references/
    └── questioning-guide.md    ← 详细提问方法论（参考 write-prd 提炼）
```

### 与 product-launcher 的衔接

/launch 的入口逻辑改为：
- 找到 PRD（≥ 200 字）→ 走现有的审查转化流程（不变）
- 找到 PRD（< 200 字）→ 告诉用户 PRD 内容不足，提供选择：a. 补充 PRD 后重新运行；b. 调用 product-drafter
- 没找到 PRD → 调用 product-drafter skill

链式调用对用户透明：用户输入 /launch → 模型检测没有 PRD → 自动加载 product-drafter → 对话收集 → 输出 Product-Spec.md → 引导 brainstorming。用户不需要知道背后换了 skill。

### 触发词分配

product-launcher 保留："/launch", "/check", "/sync", "转化PRD", "convert prd", "检查完整度", "同步产品文档" 等文档操作相关触发词。

product-drafter 接收："我要做一个产品", "新产品", "start a product", "new product", "product-drafter" 等从想法开始的触发词。

---

## product-drafter 对话流程

进入后按以下顺序逐个提问。每次只问一个问题，等用户回答后再问下一个。进入时读取 `<skill-path>/references/questioning-guide.md` 获取每步的详细提问方法论。

### 第 1 步：检查已有 Product-Spec.md

如果项目根目录已存在 Product-Spec.md，询问用户：是在现有基础上更新，还是重新生成？

### 第 2 步：做什么、给谁用

**目标：** 拿到一句话描述和目标用户，对应 Product-Spec.md 的"产品说明"章节。

**提问：** "你要做什么产品？给谁用的？"

**核心方法（参考 write-prd Executive Summary）：**
- 引导用户形成"给 [谁] 做 [什么]"的完整定位
- 用户只说了"做什么"没说"给谁" → 追问
- 用户说的是一个解决方案而不是产品（solution smuggling）→ 先退一步问"你想解决什么问题？"
- 目标用户太笼统（"所有人""用户"）→ 追问具体人群
- 定位清晰后进入下一步，不纠结措辞的完美程度

### 第 3 步：解决什么问题

**目标：** 搞清楚产品解决的核心问题，确保不是在做"没人需要的东西"。

**提问：** "这个产品解决什么问题？用户现在怎么处理的？"

**核心方法（参考 write-prd Problem Statement）：**
- 用户说的"问题"可能是功能描述而不是真正的痛点 → 追问"为什么需要这个功能？没有它会怎样？"
- 追问现有方案："用户现在怎么解决这个问题？"（手动处理、用别的工具、根本没解决）
- 追问不足："现有方案哪里不够好？"（太慢、太贵、太复杂、精度不够）
- 如果用户说"没有现有方案" → 追问"那用户现在是怎么应对的？完全忍受着？"
- 避免接受"因为没有 XX 功能"作为问题陈述（这是 solution smuggling）
- 问题清晰后进入下一步，不需要 write-prd 那套 5 段式框架

### 第 4 步：核心功能

**目标：** 收集功能清单，区分核心功能和辅助功能。

**提问：** "这个产品的核心功能有哪些？"

**核心方法（参考 write-prd Solution Overview + 现有 /launch 挑刺逻辑）：**
- 用户可能一口气说好几个功能，也可能只说一个大方向
- 对每个功能，追问具体行为和边界："用户怎么操作？操作完之后发生什么？"
- 不放过模糊词："应该""大概""可能""也许""看情况"——看到就追问具体含义
- 功能之间有矛盾的：指出并要求澄清
- 帮用户区分核心功能和辅助功能："这个功能如果第一版没有，产品还能用吗？"能用 → 辅助功能
- 功能描述要具体到行为层面，不能停留在"用户管理"这种抽象层级

### 第 5 步：不做什么

**目标：** 明确 MVP 边界，对应 Product-Spec.md 的"不做（MVP 边界）"清单。

**核心方法（参考 write-prd Out of Scope）：**
- 根据已收集的功能，主动推测用户可能想做但第一版不该做的东西，列出来让用户确认或补充
- 对每个排除项，确认"为什么现在不做"，确保是有意识的决策而不是遗漏
- 如果用户对某个排除项犹豫，帮助判断：加上这个功能会增加多少复杂度？没有它产品能验证核心假设吗？
- "不做"清单同样重要，明确边界可以防止后续 scope creep

### 第 6 步：AI 产品判断

**目标：** 决定是否需要 AI 系统提示词章节。

**提问：** "这个产品是否涉及 AI 功能（比如 AI 聊天、AI 生成内容、AI 分析等）？"

**后续：**
- 是 → 追问 AI 的角色定义、工作流程规则、回复规范、约束条件，生成系统提示词草稿让用户确认
- 是，且涉及多模态 AI（生图、图像分析等）→ 记录到原型策略
- 不是 → 跳过，Product-Spec.md 中删除 AI 系统提示词章节

### 第 7 步：技术约束

**目标：** 收集原型策略相关信息，对应 Product-Spec.md 的"原型策略"章节。

**提问：** "技术上有没有硬约束？比如纯前端还是需要后端、数据怎么存、有没有必须用的技术栈或平台？"

**推荐策略：**
- 普通 Web 应用 → 推荐 Claude Code 直接写
- 多模态 AI 应用 → 推荐 Google AI Studio（可选）
- AI Agent 产品 → 推荐 Claude Code + Agent SDK
- 以上只是常见推荐，根据实际需求灵活选择
- 用户没有技术偏好 → 原型策略中"技术栈偏好"留空，由 brainstorming 决定

### 第 8 步：自动推导 + 输出

**目标：** 根据前 7 步收集的信息，自动推导剩余章节并输出 Product-Spec.md。

**自动推导的章节：**
- **用户流程：** 根据核心功能和辅助功能，推导正常流程和异常流程（出错、网络问题、空状态等）
- **数据模型：** 根据功能描述，推导核心实体、关键字段和实体关系
- **第三方依赖：** 根据功能和技术约束，推导需要的 API、SDK、外部服务。没有就写"无"
- **非功能需求：** 根据产品类型和技术约束，推导性能、安全、兼容性等约束
- **项目结构：** 默认填 sps-harness 标准路径（app/、docs/superpowers/specs/、docs/superpowers/plans/）。如果用户的项目不使用 harness 默认结构，让用户修改

**输出流程：**
1. 读取 product-launcher 的 `templates/product-spec-template.md` 作为结构参考
2. 读取 product-launcher 的 `templates/product-spec-example.md` 作为填写粒度参考
3. 逐章节填充，保存到项目根目录
4. 回读自检：确认没有空章节或残留的 `{{...}}` 占位符
5. 让用户审核，有问题就改

注：product-drafter 不自带模板文件，复用 product-launcher 的模板。这确保两条路径（PRD 转化 / 对话收集）输出格式完全一致。

### 收尾

提醒用户后续操作基于 Product-Spec.md。引导进入 brainstorming 做技术设计。

---

## questioning-guide.md 内容规划

从 write-prd 的 5 个子 skill 中提炼的提问方法论，按主题组织（不按 write-prd 的原始结构）。

### 一、识别伪问题

用户描述的"问题"经常不是真正的问题：

**Solution Smuggling（解决方案伪装成问题）：**
- 坏："问题是我们没有 AI 分析功能"
- 好："销售团队每天花 3 小时手动整理 50+ 条线索，经常漏掉高价值客户"
- 追问技巧：用户说"需要 XX 功能"时，问"为什么需要？没有它会怎样？"

**功能描述伪装成问题：**
- 坏："用户需要一个 dashboard"
- 好："用户需要在 10 秒内了解今天的关键指标，现在要打开 3 个不同的页面"
- 追问技巧：用户说的是名词（dashboard、报告、通知）→ 追问"这个东西帮用户做什么？"

**商业指标伪装成用户问题：**
- 坏："我们的留存率太低了"
- 好："新用户注册后不知道第一步该做什么，60% 的人 24 小时内就走了"
- 追问技巧：商业指标 → 追问"用户为什么会这样？从用户的角度看发生了什么？"

### 二、追问到行为层面

抽象描述无法指导实现。每个功能都要追问到用户能看到、能操作的行为层面。

**追问链：**
- "用户可以管理设置" → "管理什么设置？" → "怎么改？" → "改了之后发生什么？" → "改错了怎么办？"
- "支持导出" → "导出什么格式？" → "导出到哪里？" → "数据量大的时候呢？"

**判断够不够具体：** 能不能根据这段描述直接画出界面原型？如果不能，还需要继续追问。

### 三、模糊词狩猎

以下词出现在用户回答中就必须追问：

| 模糊词 | 追问 |
|---|---|
| "应该""大概" | 是还是不是？具体是什么？ |
| "可能""也许" | 确定要做吗？还是可以不做？ |
| "看情况" | 什么情况下怎样？列出具体场景 |
| "比较""相对" | 和什么比？具体数字是多少？ |
| "等等""之类的" | 具体还有哪些？全部列出来 |
| "用户""所有人" | 具体哪类用户？ |
| "简单""轻量" | 你说的简单是什么意思？具体限制在哪？ |

### 四、MVP 边界判断

帮用户决定一个功能该不该放进第一版：

**三个判断问题：**
1. 没有这个功能，产品能验证核心假设吗？（能 → 第一版不做）
2. 加上这个功能，开发时间会增加多少？（翻倍 → 认真考虑砍掉）
3. 这个功能能在第一版发布后再加吗？（能 → 推迟）

**常见的"应该砍掉但用户不舍得"：**
- 多人协作和权限系统
- 复杂的通知和提醒体系
- 完整的设置和个性化选项
- 多端适配（先做一个端）
- 第三方集成

### 五、回答质量判断

**好回答的特征：**
- 能直接指导实现（可以据此画原型、写代码）
- 有具体的数字、场景、边界
- 描述行为而不是概念

**需要继续追问的信号：**
- 用户回答里出现上述模糊词
- 用户描述的是概念（"我们需要好的用户体验"）而不是行为
- 用户跳过了异常情况（"出错了怎么办？"没回答）
- 用户用技术术语回避产品问题（"用 WebSocket 就行了"——但 WebSocket 解决什么用户问题？）

---

## product-launcher SKILL.md 改动

### 需要改的部分

1. **frontmatter：** 去掉"我要做一个产品""新产品""start a product""new product"等触发词（这些归 product-drafter）
2. **模式 1 入口逻辑：** 路径 B 改为"调用 product-drafter skill"，去掉路径 B 的内联流程
3. **关键原则：** 去掉"不生成 PRD（write-prd 的事）"（这条属于 product-drafter 的职责声明）

### 不改的部分

- 路径 A（PRD 审查转化）不变
- 模式 2（/check）不变
- 模式 3（/sync）不变
- 模板文件不变（product-drafter 复用）
- hooks 脚本不变

---

## workflow-map.md 改动

第 3 步 Product Spec 改为：

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

---

## 不做的事情

- 不替代 /write-prd。轻量模式跳过 PRD 直接输出 Product-Spec.md，不是在"生成 PRD"
- 不修改 Product-Spec.md 的模板结构。输出格式和 /launch 完全一致
- 不修改 /check 和 /sync 的逻辑
- 不修改 hooks 脚本
- 不替代 brainstorming、writing-plans、ui-ux-pro-max
- 不做用户画像（proto-persona）、用户故事（user-story）、成功指标（success metrics）
