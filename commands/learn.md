Analyze .claude/instincts/.observations.jsonl for repeated patterns to discover work instincts.

Only report patterns that appear 3+ times in the observation log. Do not invent patterns from insufficient data.

For each pattern found, present it to the user with:
- Trigger condition
- Confidence level
- Domain

Show each instinct file content to the user before saving. Save only user-confirmed patterns as instinct files in .claude/instincts/.

Each instinct file uses this frontmatter format:

<example>
```yaml
---
trigger: ""
confidence: 0.0
domain: code-style | testing | workflow | architecture | content | other
source: ""
created: YYYY-MM-DD
---
```
</example>
