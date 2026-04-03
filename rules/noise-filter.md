## Review Output Control

When reviewing code, content, or .claude/ architecture:

- Only report findings with >80% confidence (skip uncertain observations), because unverified findings generate false-positive noise and erode trust in review output
- Merge similar findings into one item; consolidate repeated patterns into one finding, because repeated items waste context without adding signal
- Report only findings with an objective correctness dimension, because style opinions without objective correctness are noise, not findings
- Categorize: Critical (must fix) / Important (should fix) / Suggestion (nice to have)
