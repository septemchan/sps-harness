# sps-harness v0.3.0 设计文档：Compact 自动化

## 背景

用户在长对话中频繁遇到上下文压缩后 Claude 失忆的问题：忘记项目架构、忘记任务进度、忘记之前达成的决策。

v0.2.0 的 strategic-compact skill 提供了手动保存/恢复机制（/save-compact），但用户经常忘记跑，或者不知道什么时候该跑。压缩往往在对话中途自动触发，用户来不及手动保存。

Claude Code 新增了 PreCompact 和 PostCompact hook 事件，可以在压缩前后的精确时机自动执行脚本。

## 设计目标

用 PreCompact + PostCompact hooks 实现压缩状态的自动保存和恢复，用户完全不需要操作。

## 不做的事

- 不替代 strategic-compact skill（保留作为手动深度保存选项）
- 不保存对话内容本身（对话中的决策依赖 Claude 自己的压缩摘要）
- 不保存 CLAUDE.md 和 rules（压缩后 SessionStart 会自动重新加载这些文件）

---

## 一、PreCompact hook

### 触发时机

上下文压缩即将发生时自动触发。载荷包含 `trigger` 字段（"manual" 或 "auto"）。

### 保存内容

从 git 命令和文件系统确定性提取，不依赖 AI 总结：

1. **分支信息**：`git branch --show-current`
2. **未提交的改动**：`git status --short`
3. **最近 5 条 commit**：`git log --oneline -5`
4. **文件改动统计**：`git diff --stat`
5. **工作目录路径**：`process.cwd()`

### 保存路径

`.compact/state-{branch}.md`，branch 为当前 git 分支名。如果不在 git 仓库中，使用 `state-default.md`。

### 保存文件格式

```markdown
# Compact State

Saved: {ISO timestamp}
Trigger: {manual|auto}
Branch: {branch name}
Working directory: {cwd}

## Recent commits
{git log --oneline -5 output}

## Uncommitted changes
{git status --short output}

## Changed files detail
{git diff --stat output}
```

预计文件大小：40-50 行，约 1500-2000 字符。

### .gitignore 处理

首次保存时检查项目根目录的 .gitignore，如果未包含 `.compact/` 则自动追加：

```
# sps-harness compact state
.compact/
```

### 超时和错误处理

- timeout: 5000ms
- git 命令单个超时: 3000ms
- 任何 git 命令失败则跳过该项，不阻断保存流程
- 不在 git 仓库中时只保存工作目录路径，其他项跳过
- 始终 exit 0（不阻断压缩）

---

## 二、compact-restore.js（SessionStart，matcher: "compact"）

### 为什么不用 PostCompact

PostCompact hook 文档标注「No decision control」，不确定是否支持 additionalContext 注入。而 SessionStart 在压缩后会以 source="compact" 重新触发，且明确支持 additionalContext。

### 触发时机

压缩完成后，SessionStart 以 source="compact" 触发。通过 matcher 限定只在压缩后运行，不影响正常启动。

### 恢复逻辑

1. 从 git 获取当前分支名
2. 读取 `.compact/state-{branch}.md`
3. 如果文件不存在，静默退出
4. 通过 stdout 输出 JSON，使用 `additionalContext` 字段将状态内容注入 Claude 的上下文
5. additionalContext 内容以提示语开头："Context was just compacted. Here is the saved working state from before compaction. Use this to resume work seamlessly."，后接状态文件全文

### 和现有 session-start.js 的关系

现有 session-start.js 没有 matcher，所有 SessionStart 事件都触发（包括 compact）。compact-restore.js 使用 matcher "compact"，只在压缩后触发。两者独立运行，不冲突。

### 超时和错误处理

- timeout: 3000ms
- 文件不存在或读取失败则静默退出
- 始终 exit 0

---

## 三、suggest-compact.js 调整

### 当前行为

50 次工具调用时提醒用户跑 /save-compact。

### 新行为

50 次工具调用时提示："Context is getting long. State will be auto-saved when compaction occurs — you can keep working."

不再建议手动操作，因为 PreCompact hook 会自动处理。

---

## 四、和 strategic-compact skill 的关系

| | hooks（自动） | strategic-compact skill（手动） |
|---|---|---|
| 触发方式 | 压缩前后自动执行 | 用户跑 /save-compact |
| 保存内容 | git 状态（轻量，确定性） | Claude 分析总结（深度，含上下文理解） |
| 保存路径 | .compact/state-{branch}.md | .compact/state-{branch}.md（共用） |
| 适用场景 | 日常自动保护 | 关键节点主动保存（大重构前、方向转变时） |

两者共存，不冲突。hooks 是安全网（自动兜底），skill 是主动选择（需要时手动用）。

手动保存（/save-compact）产生的文件会被 PostCompact hook 同样读取和注入，因为路径格式一致。

---

## 五、hooks.json 变更

新增两个 hook 条目：

```json
"PreCompact": [
  {
    "hooks": [
      { "type": "command", "command": "node hooks/scripts/pre-compact.js", "timeout": 5000 }
    ]
  }
]

在现有 SessionStart 数组中新增一项（不影响已有的 session-start.js）：

"SessionStart": [
  { 现有的 session-start.js 条目保持不变 },
  {
    "matcher": "compact",
    "hooks": [
      { "type": "command", "command": "node hooks/scripts/compact-restore.js", "timeout": 3000 }
    ]
  }
]
```

---

## 六、组件清单变更

### v0.2.0 → v0.3.0 对比

| 类型 | v0.2.0 | v0.3.0 | 变化 |
|---|---|---|---|
| Agents | 1 | 1 | 不变 |
| Skills | 5 | 5 | 不变 |
| Hooks | 9 | 11 | +pre-compact, +compact-restore |
| Commands | 6 | 6 | 不变 |
| Rules | 7 | 7 | 不变 |

### 新增文件

```
hooks/scripts/
  pre-compact.js               ← 新增
  compact-restore.js           ← 新增
```

### 修改文件

```
hooks/hooks.json               ← 新增 PreCompact 条目 + SessionStart compact-restore 条目
hooks/scripts/suggest-compact.js ← 修改提示语
.claude-plugin/plugin.json     ← 版本号 0.2.0 → 0.3.0
.claude-plugin/marketplace.json ← 版本号 0.2.0 → 0.3.0
```

---

## 七、技术约束

- **Windows 兼容**：所有 hook 脚本使用 Node.js，git 命令通过 spawnSync 调用
- **无外部依赖**：只用 Node.js 标准库 + git
- **超时保护**：PreCompact 5s，PostCompact 3s，单个 git 命令 3s
- **幂等性**：PreCompact 每次覆盖写入同一文件，不累积
- **向后兼容**：v0.2.0 的所有功能保持不变
- **非 git 项目**：只保存工作目录路径，不报错
