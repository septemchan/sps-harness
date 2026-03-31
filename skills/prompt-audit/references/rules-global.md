# Global Rules (G-E1 to G-E5, G-W1 to G-W10, G-I1 to G-I4)

These rules apply to all file types (system prompts, SKILL.md, CLAUDE.md, agent configurations). File-type-specific rules are defined separately.

**Severity standard**: ERROR = official Anthropic documentation provides direct evidence that this pattern degrades results. WARNING = Boris Cherny (Claude Code creator) or Thariq (Anthropic) first-hand experience, or official docs provide indirect support.

---

## ERROR Rules (G-E1 to G-E5)

Hard rules backed by official A/B comparisons or explicit guidance from Anthropic. These are issues where documentation provides direct evidence that fixing them improves results on Claude Opus 4.6.

---

## G-E1: Aggressive emphasis

Check for all-caps emphasis words: `CRITICAL`, `IMPORTANT`, `YOU MUST`, `ALWAYS` (all-caps), `NEVER` (all-caps), and excessive punctuation like `!!!`.

Claude 4.5 and 4.6 are significantly more responsive to the system prompt than earlier models. Language that was needed to prevent undertriggering on older models now causes overtriggering. Normal, conversational phrasing works better.

**Anthropic says**: "Claude Opus 4.5 and Claude Opus 4.6 are also more responsive to the system prompt than previous models. If your prompts were designed to reduce undertriggering on tools or skills, these models may now overtrigger. The fix is to dial back any aggressive language. Where you might have said 'CRITICAL: You MUST use this tool when...', you can use more normal prompting like 'Use this tool when...'"

**Source**: Anthropic Prompting Best Practices

**False positive check**: If the surrounding context is clearly about security or safety (contains words like "security", "安全", "vulnerability", "injection", "production data", "credentials"), downgrade to WARNING. In safety-critical contexts, strong emphasis may be justified.

---

## G-E2: Bare negative instructions without positive alternative

Check for instructions that say "don't do X" without specifying what to do instead. Patterns to look for: `不要...`, `禁止...`, `Do not...`, `Never...`, `Don't...`, `切勿...` that are not followed by a positive instruction within the same sentence or the next sentence.

Claude responds better to being told what to do than what not to do. A negative instruction activates attention on the forbidden behavior, which can paradoxically increase its occurrence.

**Anthropic says**: "Tell Claude what to do instead of what not to do. Instead of: 'Do not use markdown in your response' → Try: 'Your response should be composed of smoothly flowing prose paragraphs.'"

**Source**: Anthropic Prompting Best Practices

**False positive check**: If the negative instruction is immediately followed by a positive alternative (e.g., "不要用列表，用段落叙述" or "Don't use markdown, write in plain prose"), do not flag it. The pair together is actually the recommended pattern.

---

## G-E3: Negative instructions without reasoning

Check whether negative instructions explain why the constraint exists. Bare prohibitions without context are less effective because Claude cannot generalize the principle to related situations.

**Anthropic says**: "Providing context or motivation behind your instructions, such as explaining to Claude why such behavior is important, can help Claude better understand your goals and deliver more targeted responses. Instead of 'NEVER use ellipses' → 'Your response will be read aloud by a text-to-speech engine, so never use ellipses since the text-to-speech engine will not know how to pronounce them.'"

**Source**: Anthropic Prompting Best Practices

**Relationship to E2**: E2 checks "is there a positive alternative?" while E3 checks "is there a reason given?" A single negative instruction can trigger both. Report them separately so the user understands both dimensions.

**False positive check**: If a negative instruction appears within a list that collectively provides sufficient context (e.g., "注意事项：- 不要删除文件"), and the list's framing makes the reasoning self-evident, downgrade to INFO.

---

## G-E4: Quotes as primary delimiters instead of XML tags

Check whether the prompt relies on quotation marks (`""`, `「」`, `『』`) as its main mechanism for separating instructions from data, examples, or context. Claude was specifically trained to recognize XML tags as a prompt organizing mechanism, making them far more reliable as boundaries.

**Anthropic says**: "XML tags help Claude parse complex prompts unambiguously, especially when your prompt mixes instructions, context, examples, and variable inputs. Wrapping each type of content in its own tag (e.g. `<instructions>`, `<context>`, `<input>`) reduces misinterpretation."

**Source**: Anthropic Prompting Best Practices

**Criteria**: Flag as ERROR only if the entire prompt uses no XML tags for structural separation. If the prompt primarily uses XML tags but occasionally uses quotes (e.g., for inline emphasis or quoting external sources), do not flag.

**False positive check**: Distinguish between quotes used for citation (quoting official docs, referencing external text) and quotes used as delimiters (separating "this is an instruction" from "this is data"). Only the delimiter usage is problematic.

---

## G-E5: Prescriptive thinking steps that constrain model reasoning

Check for instructions that force the model through a fixed internal reasoning sequence, such as "Before answering, analyze: 1) the core intent, 2) possible solutions, 3) edge cases" or "第一步分析 X，第二步评估 Y，第三步...".

Claude Opus 4.6 has strong native reasoning capabilities. Prescribing a fixed thinking sequence often produces worse results than letting the model reason freely, because the model's own reasoning can adapt to the specific problem at hand.

**Anthropic says**: "Prefer general instructions over prescriptive steps. A prompt like 'think thoroughly' often produces better reasoning than a hand-written step-by-step plan. Claude's reasoning frequently exceeds what a human would prescribe."

**Source**: Anthropic Prompting Best Practices

**Criteria**: Only flag instructions that meet ALL of these conditions:
1. They constrain the model's *internal thinking process*, not the *output workflow* (e.g., "first read the file, then edit it" is an action sequence, not a thinking constraint — do not flag it).
2. They impose a *fixed sequential order* (numbered steps, "第一步...第二步..."). A list of principles or heuristics to "keep in mind" is guidance, not a fixed sequence — do not flag it.
3. They leave no room for the model to skip or reorder steps based on the specific problem.

If the instructions read more like "here are principles to consider" than "follow these steps in order," do not flag them.

**Suggested fix**: Replace rigid step sequences with a general instruction like "Think carefully about this problem" or "Consider whether there are boundary conditions or edge cases to handle." If the content is valuable as principles, reframe from numbered steps to an unordered list of considerations.

---

## WARNING Rules (G-W1 to G-W10)

Patterns that are often suboptimal but may be justified in specific use cases. Each WARNING includes guidance on when to fix and when to leave it alone.

---

### G-W1: Long-form data placed after instructions

In prompts longer than 2000 characters, check whether large blocks of data or document content appear after the main query or instructions.

**Anthropic says**: "Put longform data at the top. Place your long documents and inputs near the top of your prompt, above your query, instructions, and examples. Queries at the end can improve response quality by up to 30% in tests, especially with complex, multi-document inputs."

**Source**: Anthropic Prompting Best Practices

**When to fix**: Prompts that embed reference documents, knowledge bases, or large context blocks together with instructions.
**When to ignore**: Short prompts under 2000 characters, or prompts where the data is dynamically injected at a fixed position by application code.

---

### G-W2: Overly elaborate role definition

Check whether the role description exceeds 3 sentences or uses superlative modifiers like "世界顶级", "从不犯错", "最权威的", "world-renowned", "never makes mistakes", "the absolute best".

**Anthropic says**: "Even a single sentence makes a difference." (The official example uses exactly one sentence: "You are a helpful coding assistant specializing in Python.")

**Source**: Anthropic Prompting Best Practices

**When to fix**: Most system prompts and skill definitions benefit from a concise role statement.
**When to ignore**: Roleplay scenarios, creative writing contexts, or situations where a detailed persona is the core functionality.

---

### G-W3: Few-shot examples not wrapped in tags

Check whether example content exists in the prompt but is not enclosed in `<example>` or `<examples>` tags. Without tags, Claude may not clearly distinguish examples from instructions, potentially treating example content as directives.

**Anthropic says**: "Wrap examples in `<example>` tags (multiple examples in `<examples>` tags) so Claude can distinguish them from instructions."

**Source**: Anthropic Prompting Best Practices

---

### G-W4: No hallucination safeguard

For prompts that involve knowledge Q&A, code analysis, document processing, or any task where factual accuracy matters, check whether there is a "verify before answering" or "say you're unsure if you don't know" type constraint.

**Anthropic says**: "Never speculate about code you have not opened. If the user references a specific file, you MUST read the file before answering. Make sure to investigate and read relevant files BEFORE answering questions about the codebase. Never make any claims about code before investigating unless you are certain of the correct answer."

**Source**: Anthropic Prompting Best Practices

**When to fix**: Any prompt where factual accuracy or grounding in source material is important.
**When to ignore**: Creative writing, brainstorming, ideation, or tasks where speculation is the point.

---

### G-W5: Agent prompt missing destructive action safeguards

For prompts that give Claude autonomous agency (running commands, editing files, interacting with external systems), check whether there is a mechanism requiring confirmation before destructive or irreversible operations.

**Anthropic says**: "Without guidance, Claude Opus 4.6 may take actions that are difficult to reverse or affect shared systems, such as deleting files, force-pushing, or posting to external services. If you want Claude Opus 4.6 to confirm before taking potentially risky actions, add guidance to your prompt."

**Source**: Anthropic Prompting Best Practices

**When to fix**: Any prompt that gives the model tool access, file system access, or the ability to interact with external services.
**When to ignore**: Pure question-answering prompts with no tool use or agency.

---

### G-W6: No explicit output format specification

Check whether the prompt describes what the output should look like in positive terms (format, length, style, structure).

**Anthropic says**: "Being specific about your desired output can help enhance results."

**Source**: Anthropic Prompting Best Practices

**When to fix**: System prompts and skill definitions should describe the expected output format.
**When to ignore**: Simple one-off queries where the format is self-evident.

---

### G-W7: Output constraints expressed as negations

Check whether output-related constraints are expressed entirely in negative form (e.g., "不要超过 500 字", "不要用列表", "don't exceed 500 words") without being converted to positive descriptions.

**Anthropic says**: "Tell Claude what to do instead of what not to do."

**Source**: Anthropic Prompting Best Practices

**Suggested fix**: Convert "不要超过 500 字，不要用列表" to "用 300-500 字的连续段落叙述" (positive framing that implicitly sets the constraints).

---

### G-W8: Prompt formatting contradicts desired output formatting

Check whether the prompt's own formatting style (heavy Markdown, bullet lists, bold text) contradicts its stated output format requirements. For example, a prompt written entirely in bullet lists that asks for prose paragraphs.

**Anthropic says**: "The formatting style used in your prompt may influence Claude's response style. If you are still experiencing steerability issues with output formatting, try matching your prompt style to your desired output style as closely as possible. For example, removing markdown from your prompt can reduce the volume of markdown in the output."

**Source**: Anthropic Prompting Best Practices

**When to fix**: When the prompt contains explicit output format requirements that conflict with its own formatting.
**When to ignore**: When there are no explicit output format requirements, or when the prompt format and output format naturally align.

---

### G-W9: File location mismatch

Check whether file content features (frontmatter fields, structural patterns) match the filesystem location per Claude Code conventions.

**Content feature detection**:
- YAML frontmatter with `tools`, `permissionMode`, or `maxTurns` fields → Agent features (expected in agent config files)
- Frontmatter with `context`, `allowed-tools`, or `user-invocable` fields → Skill features (expected in SKILL.md files)
- File named CLAUDE.md but not on a standard loading path (project root, `.claude/` directory, or parent directories) → may not be loaded by Claude Code

**Source**: Anthropic Claude Code documentation

---

### G-W10: Missing verification feedback mechanism

For prompts that give Claude autonomous agency (running commands, editing files, generating output), check whether there is a way for Claude to verify output quality. This includes test commands, expected output descriptions, screenshot verification, or any explicit feedback loop.

**Boris says**: "Give Claude ways to verify. This is the most important tip. With a feedback loop, quality goes up 2-3x."

**Source**: Boris Cherny, 13 Tips for Claude Code (January 2026)

**When to fix**: Any prompt that gives the model autonomous agency without specifying how to verify results.
**When to ignore**: Pure question-answering prompts, or prompts where verification is inherently part of the workflow (e.g., test-driven development prompts that already run tests).

---

## INFO Rules (G-I1 to G-I4)

These provide useful context but do not recommend changes. The user decides whether to act on them.

---

### G-I1: Few-shot example count

Count the number of `<example>` tags in the prompt. Report the count. Anthropic recommends 3-5 examples for best results, but Claude Opus 4.6 has strong zero-shot capabilities and may not need examples for simpler tasks. This is informational only.

---

### G-I2: Prompt total length

Report the character count and estimated token count (characters / 4 for English, characters / 1.5 for Chinese as a rough estimate). This helps the user gauge whether the prompt might benefit from trimming.

---

### G-I3: XML tag inventory

List all XML tags used in the prompt and their nesting structure. This gives the user a quick structural overview of how the prompt is organized.

---

### G-I4: Instruction density

Estimate the proportion of imperative sentences (commands, directives) versus explanatory/contextual content. A very high instruction density may make it hard for the model to identify priorities. This is observational and context-dependent.
