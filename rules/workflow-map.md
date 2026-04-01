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
