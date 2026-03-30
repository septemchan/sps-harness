## Harness Engineering Method

Core methodology for writing and maintaining .claude/ rules, skills, and hooks.

### Rule Writing Standards

1. **Positive language**: State what to do, not what to avoid.
   - Good: "Write titles in 15-25 characters"
   - Bad: "Don't exceed 25 characters"

2. **Include reasoning**: Every rule states why, because Claude follows reasoned rules more reliably.
   - Format: `Do X because Y`

3. **Range constraints**: Use ranges to give Claude calibration room.
   - Good: "25-35 frames per scene"
   - Bad: "max 35 frames"

4. **Origin tracking**: Tag each rule so future audits know the source.
   - Format: `<!-- Added: YYYY-MM-DD | Reason: ... -->`

5. **One rule, one behavior**: Each rule targets a single observable output. Compound rules dilute compliance.

### Escalation Chain

When a rule fails to produce the desired behavior, escalate in order:

1. **Rewrite** the rule (clearer language, add reasoning, add example)
2. **Reposition** the rule (move to top or bottom of file for primacy/recency effect)
3. **Upgrade to hook** (automated enforcement replaces passive guidance)

Follow all three steps in order, because each level is more costly to maintain.

### Behavioral Triggers

Claude should proactively suggest actions when these patterns appear:

| Signal | Action |
|---|---|
| Same problem appears twice | Suggest `/rules add` to codify the fix |
| Rule exists but output still wrong | Suggest escalation chain (rewrite → reposition → hook) |
| Security-sensitive change detected | Suggest `/security-review` before proceeding |
| .claude/ files edited manually | Suggest `/harness-audit` to verify consistency |

### File Placement Principles

- **Rules** (always loaded): Only concise, high-frequency guidance. Keep each file under 50 lines.
- **Skills** (loaded on demand): Detailed procedures, templates, multi-step workflows.
- **Hooks** (event-driven): Automated checks that run without user intervention.

Move anything lengthy or situational out of rules/ into skills/.
