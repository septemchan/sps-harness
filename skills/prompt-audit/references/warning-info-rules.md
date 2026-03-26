# WARNING Rules (W1-W8) and INFO Rules (I1-I4)

## WARNING rules (soft rules that depend on context)

Patterns that are often suboptimal but may be justified in specific use cases. Each WARNING includes guidance on when to fix and when to leave it alone.

---

### W1: Long-form data placed after instructions

In prompts longer than 2000 characters, check whether large blocks of data or document content appear after the main query or instructions.

**Anthropic says**: "Put longform data at the top. Place your long documents and inputs near the top of your prompt, above your query, instructions, and examples. Queries at the end can improve response quality by up to 30% in tests, especially with complex, multi-document inputs."

**Source**: Anthropic Prompting Best Practices

**When to fix**: Prompts that embed reference documents, knowledge bases, or large context blocks together with instructions.
**When to ignore**: Short prompts under 2000 characters, or prompts where the data is dynamically injected at a fixed position by application code.

---

### W2: Overly elaborate role definition

Check whether the role description exceeds 3 sentences or uses superlative modifiers like "世界顶级", "从不犯错", "最权威的", "world-renowned", "never makes mistakes", "the absolute best".

**Anthropic says**: "Even a single sentence makes a difference." (The official example uses exactly one sentence: "You are a helpful coding assistant specializing in Python.")

**Source**: Anthropic Prompting Best Practices

**When to fix**: Most system prompts and skill definitions benefit from a concise role statement.
**When to ignore**: Roleplay scenarios, creative writing contexts, or situations where a detailed persona is the core functionality.

---

### W3: Few-shot examples not wrapped in tags

Check whether example content exists in the prompt but is not enclosed in `<example>` or `<examples>` tags. Without tags, Claude may not clearly distinguish examples from instructions, potentially treating example content as directives.

**Anthropic says**: "Wrap examples in `<example>` tags (multiple examples in `<examples>` tags) so Claude can distinguish them from instructions."

**Source**: Anthropic Prompting Best Practices

---

### W4: No hallucination safeguard

For prompts that involve knowledge Q&A, code analysis, document processing, or any task where factual accuracy matters, check whether there is a "verify before answering" or "say you're unsure if you don't know" type constraint.

**Anthropic says**: "Never speculate about code you have not opened. If the user references a specific file, you MUST read the file before answering. Make sure to investigate and read relevant files BEFORE answering questions about the codebase. Never make any claims about code before investigating unless you are certain of the correct answer."

**Source**: Anthropic Prompting Best Practices

**When to fix**: Any prompt where factual accuracy or grounding in source material is important.
**When to ignore**: Creative writing, brainstorming, ideation, or tasks where speculation is the point.

---

### W5: Agent prompt missing destructive action safeguards

For prompts that give Claude autonomous agency (running commands, editing files, interacting with external systems), check whether there is a mechanism requiring confirmation before destructive or irreversible operations.

**Anthropic says**: "Without guidance, Claude Opus 4.6 may take actions that are difficult to reverse or affect shared systems, such as deleting files, force-pushing, or posting to external services. If you want Claude Opus 4.6 to confirm before taking potentially risky actions, add guidance to your prompt."

**Source**: Anthropic Prompting Best Practices

**When to fix**: Any prompt that gives the model tool access, file system access, or the ability to interact with external services.
**When to ignore**: Pure question-answering prompts with no tool use or agency.

---

### W6: No explicit output format specification

Check whether the prompt describes what the output should look like in positive terms (format, length, style, structure).

**Anthropic says**: "Being specific about your desired output can help enhance results."

**Source**: Anthropic Prompting Best Practices

**When to fix**: System prompts and skill definitions should describe the expected output format.
**When to ignore**: Simple one-off queries where the format is self-evident.

---

### W7: Output constraints expressed as negations

Check whether output-related constraints are expressed entirely in negative form (e.g., "不要超过 500 字", "不要用列表", "don't exceed 500 words") without being converted to positive descriptions.

**Anthropic says**: "Tell Claude what to do instead of what not to do."

**Source**: Anthropic Prompting Best Practices

**Suggested fix**: Convert "不要超过 500 字，不要用列表" to "用 300-500 字的连续段落叙述" (positive framing that implicitly sets the constraints).

---

### W8: Prompt formatting contradicts desired output formatting

Check whether the prompt's own formatting style (heavy Markdown, bullet lists, bold text) contradicts its stated output format requirements. For example, a prompt written entirely in bullet lists that asks for prose paragraphs.

**Anthropic says**: "The formatting style used in your prompt may influence Claude's response style. If you are still experiencing steerability issues with output formatting, try matching your prompt style to your desired output style as closely as possible. For example, removing markdown from your prompt can reduce the volume of markdown in the output."

**Source**: Anthropic Prompting Best Practices

**When to fix**: When the prompt contains explicit output format requirements that conflict with its own formatting.
**When to ignore**: When there are no explicit output format requirements, or when the prompt format and output format naturally align.

---

## INFO rules (observations, no judgment)

These provide useful context but do not recommend changes. The user decides whether to act on them.

---

### I1: Few-shot example count

Count the number of `<example>` tags in the prompt. Report the count. Anthropic recommends 3-5 examples for best results, but Claude Opus 4.6 has strong zero-shot capabilities and may not need examples for simpler tasks. This is informational only.

---

### I2: Prompt total length

Report the character count and estimated token count (characters / 4 for English, characters / 1.5 for Chinese as a rough estimate). This helps the user gauge whether the prompt might benefit from trimming.

---

### I3: XML tag inventory

List all XML tags used in the prompt and their nesting structure. This gives the user a quick structural overview of how the prompt is organized.

---

### I4: Instruction density

Estimate the proportion of imperative sentences (commands, directives) versus explanatory/contextual content. A very high instruction density may make it hard for the model to identify priorities. This is observational and context-dependent.
