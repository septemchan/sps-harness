## Project Structure Rule

When a Product-Spec.md file exists in the project root, this is a product development project. Follow this directory structure:

```
项目文件夹/
  .claude/           ← 项目配置（rules, settings, hooks）
  docs/              ← 设计文档和计划
  PRD.md             ← 完整 PRD（归档）
  Product-Spec.md    ← 轻量产品文档（日常操作基于这份）
  Product-Changelog.md ← 变更日志
  app/               ← 所有产品代码
```

**Rules:**
- All product source code goes in `app/`, because keeping the root clean makes it easier to distinguish config from implementation.
- `Product-Spec.md` is the single source of truth for what the product should do.
- When iterating, update `Product-Spec.md` and `Product-Changelog.md` before or alongside code changes.
