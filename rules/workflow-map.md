## Workflow Map

Route to the right tool at each stage:

### 1. New Project
- Has design docs but no .claude/ → run /harvest to auto-generate CLAUDE.md
- No design docs and no .claude/ → run /harness-audit for manual setup guidance
- Has .claude/ → skip to relevant stage

### 2. Requirements
- Fuzzy idea → /discover (PM Skills)
- Requirements clear → /write-prd (PM Skills)

### 2.5. Product Spec (when building a product)
- Has PRD but no Product-Spec.md → /launch (product-launcher) to convert PRD
- Has Product-Spec.md, needs design → brainstorming (Superpowers)
- Brainstorming done, has frontend → consider ui-ux-pro-max before writing-plans
- Code exists, need status → /check (product-launcher)
- Design changed during iteration → /sync (product-launcher)

### 3. Design & Development
- Technical design → brainstorming (Superpowers)
- Create skill → skill-creator
- Implementation plan → writing-plans (Superpowers)
- Execute → subagent-driven-development (Superpowers)

### 4. .claude/ Architecture Iteration
- Quick rule add/check → /rules
- Deep diagnosis (why rule fails, escalation) → PWF or OpenSpec
- Prompt quality review → prompt-audit
- Skill not performing → autoresearch
- Periodic health check → /harness-audit

### 5. Quality Assurance (automatic)
- Code edited → auto-format hook (formatter) → typecheck hook (tsc) → quality-gate hook (linter)
- .claude/ .md edited → quality-gate hook (prompt-audit reminder)
- git commit attempted → commit-guard hook (message format + console.log + secret scan)
- git commit --no-verify attempted → block-no-verify hook (blocked)
- Session ending → completion-guard hook (security check)
- ~50 tool calls → suggest-compact hook
- All operations → observe hook (recording)

### 6. Security Review
- Auth/payment/user data changes → /security-review

### 7. Learning & Health
- Extract patterns → /learn
- Manage rules → /rules
- Compress context → /save-compact

### Work Mode Routing
- Building .claude/ architecture: harness-audit → /rules → prompt-audit → /harness-audit (iterate)
- Writing code/products: brainstorming → writing-plans → SDD → verification-loop → /security-review (if needed)
