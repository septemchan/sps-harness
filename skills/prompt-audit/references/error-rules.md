# ERROR Rules (E1-E5)

Hard rules backed by official A/B comparisons or explicit guidance from Anthropic. These are issues where documentation provides direct evidence that fixing them improves results on Claude Opus 4.6.

---

## E1: Aggressive emphasis

Check for all-caps emphasis words: `CRITICAL`, `IMPORTANT`, `YOU MUST`, `ALWAYS` (all-caps), `NEVER` (all-caps), and excessive punctuation like `!!!`.

Claude 4.5 and 4.6 are significantly more responsive to the system prompt than earlier models. Language that was needed to prevent undertriggering on older models now causes overtriggering. Normal, conversational phrasing works better.

**Anthropic says**: "Claude Opus 4.5 and Claude Opus 4.6 are also more responsive to the system prompt than previous models. If your prompts were designed to reduce undertriggering on tools or skills, these models may now overtrigger. The fix is to dial back any aggressive language. Where you might have said 'CRITICAL: You MUST use this tool when...', you can use more normal prompting like 'Use this tool when...'"

**Source**: Anthropic Prompting Best Practices

**False positive check**: If the surrounding context is clearly about security or safety (contains words like "security", "安全", "vulnerability", "injection", "production data", "credentials"), downgrade to WARNING. In safety-critical contexts, strong emphasis may be justified.

---

## E2: Bare negative instructions without positive alternative

Check for instructions that say "don't do X" without specifying what to do instead. Patterns to look for: `不要...`, `禁止...`, `Do not...`, `Never...`, `Don't...`, `切勿...` that are not followed by a positive instruction within the same sentence or the next sentence.

Claude responds better to being told what to do than what not to do. A negative instruction activates attention on the forbidden behavior, which can paradoxically increase its occurrence.

**Anthropic says**: "Tell Claude what to do instead of what not to do. Instead of: 'Do not use markdown in your response' → Try: 'Your response should be composed of smoothly flowing prose paragraphs.'"

**Source**: Anthropic Prompting Best Practices

**False positive check**: If the negative instruction is immediately followed by a positive alternative (e.g., "不要用列表，用段落叙述" or "Don't use markdown, write in plain prose"), do not flag it. The pair together is actually the recommended pattern.

---

## E3: Negative instructions without reasoning

Check whether negative instructions explain why the constraint exists. Bare prohibitions without context are less effective because Claude cannot generalize the principle to related situations.

**Anthropic says**: "Providing context or motivation behind your instructions, such as explaining to Claude why such behavior is important, can help Claude better understand your goals and deliver more targeted responses. Instead of 'NEVER use ellipses' → 'Your response will be read aloud by a text-to-speech engine, so never use ellipses since the text-to-speech engine will not know how to pronounce them.'"

**Source**: Anthropic Prompting Best Practices

**Relationship to E2**: E2 checks "is there a positive alternative?" while E3 checks "is there a reason given?" A single negative instruction can trigger both. Report them separately so the user understands both dimensions.

**False positive check**: If a negative instruction appears within a list that collectively provides sufficient context (e.g., "注意事项：- 不要删除文件"), and the list's framing makes the reasoning self-evident, downgrade to INFO.

---

## E4: Quotes as primary delimiters instead of XML tags

Check whether the prompt relies on quotation marks (`""`, `「」`, `『』`) as its main mechanism for separating instructions from data, examples, or context. Claude was specifically trained to recognize XML tags as a prompt organizing mechanism, making them far more reliable as boundaries.

**Anthropic says**: "XML tags help Claude parse complex prompts unambiguously, especially when your prompt mixes instructions, context, examples, and variable inputs. Wrapping each type of content in its own tag (e.g. `<instructions>`, `<context>`, `<input>`) reduces misinterpretation."

**Source**: Anthropic Prompting Best Practices

**Criteria**: Flag as ERROR only if the entire prompt uses no XML tags for structural separation. If the prompt primarily uses XML tags but occasionally uses quotes (e.g., for inline emphasis or quoting external sources), do not flag.

**False positive check**: Distinguish between quotes used for citation (quoting official docs, referencing external text) and quotes used as delimiters (separating "this is an instruction" from "this is data"). Only the delimiter usage is problematic.

---

## E5: Prescriptive thinking steps that constrain model reasoning

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
