# SKILL.md Rules

Rules specific to SKILL.md files (Claude Code skill definitions). These rules check skill design best practices in addition to the global rules.

File type detection: file named `SKILL.md` under `.claude/skills/` or `~/.claude/skills/` directories.

---

## S-W1: Description written as summary instead of trigger condition (WARNING)

**What to check:** The frontmatter `description` field reads like a content summary aimed at humans ("This skill helps with X", "A skill for doing Y") instead of a trigger condition aimed at the model ("Use when the user asks to X, mentions Y, or is working on Z").

**Why it matters:** The description field controls when Claude autonomously invokes a skill. If it reads like documentation rather than a trigger, the model cannot reliably decide when to fire. Thariq (Anthropic) says: "The description field is a trigger, not a summary. Write it for the model: 'when should I fire?' Not for a human reader."

**Source:** Thariq, Skills deep-dive tips (March 2026)

**When to fix:** The description uses passive or summary language ("This skill handles…", "Helps users with…", "A tool for…") instead of conditional trigger language ("Use when…", "Trigger when…", "Use this skill when the user…").

**When to ignore:** Skills with `disable-model-invocation: true` are manual-only (invoked explicitly by the user via slash command). Their description serves as documentation, not a trigger condition, so summary language is acceptable.

**False positive checks:**
- Verify `disable-model-invocation` is not set to `true` before flagging.
- A description that starts with summary language but includes trigger conditions later ("Helps with X. Use when the user asks to…") should still be flagged, but with a note that partial trigger language exists.

---

## S-W2: Over-prescriptive execution steps (WARNING)

**What to check:** The skill body contains rigid numbered execution sequences that constrain Claude's autonomy by dictating internal execution order (e.g., "Step 1: Read the file. Step 2: Parse the JSON. Step 3: Extract the field. Step 4: Format the output.").

**Why it matters:** Claude adapts better when given goals and constraints rather than step-by-step recipes. Over-prescribing execution steps prevents Claude from using its judgment to handle edge cases, skip unnecessary steps, or reorder operations based on context. Thariq (Anthropic) says: "Don't over-prescribe. Give goals and constraints, not step-by-step recipes. Claude adapts better when you tell it what success looks like rather than dictating every move."

**Source:** Thariq, Skills deep-dive tips (March 2026)

**When to fix:** The skill contains numbered or ordered steps that dictate Claude's internal execution sequence, especially when the steps are mechanical ("Step 1: Open the file. Step 2: Find the function. Step 3: Add the line.") rather than describing goals.

**When to ignore:** The steps describe a user-visible workflow or output structure, not Claude's internal execution. For example, a skill that produces a multi-phase deliverable ("Phase 1: gather requirements → Phase 2: produce report") is describing output structure, not constraining Claude's reasoning.

**False positive checks:**
- Do NOT flag user-visible workflow phases ("Phase 1: gather requirements → Phase 2: produce report"). Only flag steps dictating Claude's internal execution.
- Do NOT flag constraint lists that happen to be numbered ("1. Never modify production files. 2. Always run tests."). These are constraints, not execution sequences.
- Do NOT flag steps that describe genuinely sequential external operations where order matters for correctness (e.g., "create the database before running migrations").

**Relationship to G-E5:** G-E5 flags constraints on Claude's internal reasoning process ("think step by step", "first analyze, then decide"). S-W2 flags constraints on Claude's execution autonomy ("Step 1: read file, Step 2: parse, Step 3: output"). Both can trigger on the same content but address different concerns: G-E5 is about reasoning freedom, S-W2 is about execution freedom.

---

## S-W3: Missing Gotchas section (WARNING)

**What to check:** The skill has no section named "Gotchas", "Known issues", "Common mistakes", "Pitfalls", "注意事项", "常见问题", or similar headings that document Claude's known failure patterns in this skill's domain.

**Why it matters:** The Gotchas section is the highest-signal content in any skill because it encodes hard-won knowledge about where Claude actually fails. Without it, the same mistakes repeat across sessions. Thariq (Anthropic) says: "Build a Gotchas section. This is the highest signal content in any skill. Every time Claude gets something wrong, add it. This section alone can transform a mediocre skill into a great one."

**Source:** Thariq, Skills deep-dive tips (March 2026)

**When to fix:** The skill has been used multiple times and has known failure patterns that are not documented. Any skill with operational history should accumulate gotchas over time.

**When to ignore:** Brand new skills without usage data. You cannot write meaningful gotchas before observing actual failures. Flag as INFO instead of WARNING for skills that appear to be newly created (no evidence of iteration or version history).

**False positive checks:**
- Check for equivalent sections under different names. A section called "Important notes", "Warnings", "Things to watch out for", or "Edge cases" may serve the same purpose as Gotchas.
- A skill that has scattered warnings throughout its body (rather than a dedicated section) partially addresses this concern but should still be flagged with a suggestion to consolidate into a dedicated section.

---

## S-W4: All content in single SKILL.md without folder structure (WARNING)

**What to check:** The SKILL.md file exceeds 300 lines and the skill directory contains no subdirectories (such as `references/`, `scripts/`, `examples/`, `steps/`, `templates/`).

**Why it matters:** Long monolithic SKILL.md files force Claude to load everything into context at invocation time, even content that may not be relevant to the current task. Using the filesystem for progressive disclosure lets Claude read detailed specs, examples, and reference material only when needed. Thariq (Anthropic) says: "Use the filesystem for progressive disclosure. Your skill is a folder — put detailed specs in references/, reusable scripts in scripts/, examples in examples/. Claude will read them when it needs them." Anthropic says: "Skills are directories containing a SKILL.md file and optional supporting files."

**Source:** Thariq, Skills deep-dive tips (March 2026); Anthropic documentation

**When to fix:** The SKILL.md exceeds 300 lines and contains large blocks of reference material, examples, templates, or detailed specifications that could be extracted into supporting files. The core skill logic (trigger, constraints, output format) should stay in SKILL.md; everything else should be in subdirectories.

**When to ignore:** The skill is under 300 lines, or the content is genuinely indivisible (a single coherent set of instructions that would lose clarity if split across files). Simple skills that are just a page of constraints and a format spec do not need folder structure.

**False positive checks:**
- Count actual lines, not just estimate. A skill at 280 lines with no folder structure is below the threshold and should not be flagged.
- Check whether subdirectories already exist but are empty. Empty subdirectories do not count as meaningful folder structure.
- A skill that is long but consists entirely of tightly-coupled constraints (no extractable reference blocks) may not benefit from splitting. Note this in the finding.

---

## S-W5: Contains default behavior descriptions (WARNING)

**What to check:** The skill contains instructions for behaviors Claude already performs by default, such as: "think carefully", "check for errors", "read the file before editing", "be thorough", "consider edge cases", "make sure to handle errors", "write clean code", "test your work", "pay attention to detail".

**Why it matters:** Every token in a skill should push Claude away from its defaults or toward domain-specific behavior. Instructions that describe what Claude already does waste context and dilute the signal of instructions that actually matter. Thariq (Anthropic) says: "Don't say obvious things. Focus on what pushes Claude away from its defaults. If Claude would do it anyway without being told, don't tell it."

**Source:** Thariq, Skills deep-dive tips (March 2026)

**When to fix:** The skill contains generic good practices that Claude already follows without being told. Common examples: "be careful", "think step by step", "double-check your work", "handle edge cases", "write clean, maintainable code", "follow best practices", "be thorough in your analysis".

**When to ignore:** The instruction addresses a specific, documented failure pattern in this skill's domain. For example, "always check that the API response has a `data` field before accessing it" is specific enough to be meaningful, even though it sounds like generic error handling. These domain-specific instructions should ideally be in the Gotchas section (see S-W3) rather than scattered in the main body.

**False positive checks:**
- Distinguish between genuinely generic instructions ("be careful with edge cases") and domain-specific instructions that happen to sound generic ("check for null values in the response" in a skill that has hit null pointer errors).
- If the instruction references a specific failure mode or includes a concrete example, it is likely meaningful and should not be flagged.
- Instructions that override Claude's defaults ("do NOT read the entire file, only read the first 50 lines") are the opposite of this rule and should never be flagged.

---

## S-I1: Frontmatter field completeness (INFO)

**What to check:** List all frontmatter fields present in the SKILL.md and identify which supported fields are used and which are not.

**Why it matters:** Awareness of available frontmatter fields helps skill authors take advantage of features they may not know about. This is informational only and does not indicate a problem.

**Supported frontmatter fields (13 total):**
- `name` — display name for the skill
- `description` — trigger condition or summary (see S-W1)
- `argument-hint` — placeholder text shown in the slash command input
- `disable-model-invocation` — prevents autonomous invocation (`true`/`false`)
- `user-invocable` — whether the skill appears as a slash command (`true`/`false`)
- `allowed-tools` — list of tools the skill is permitted to use
- `model` — model to use when executing this skill
- `effort` — effort level for the model (`low`/`medium`/`high`)
- `context` — additional context files to load
- `agent` — whether to run as a sub-agent (`true`/`false`)
- `hooks` — lifecycle hooks for the skill
- `paths` — file paths relevant to the skill
- `shell` — shell to use for bash commands

**Output format:** List used fields with their values, then list unused fields. Do not recommend adding fields unless the audit finds a specific reason (e.g., a skill that should restrict tools but has no `allowed-tools` field).

**Source:** Anthropic documentation, Claude Code skill schema

**When to fix:** Not applicable. This is informational only.

**When to ignore:** Not applicable. Always include this in the audit output for SKILL.md files.

**False positive checks:** Not applicable for an INFO-level rule. Ensure the field list stays current with the latest Claude Code skill schema.
