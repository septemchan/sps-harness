# {{PRODUCT_NAME}} Product Spec

## 产品说明
- 一句话描述：{{DESCRIPTION}}
- 核心价值：{{CORE_VALUE}}

## 项目结构
- 代码目录：app/
- 设计文档：docs/superpowers/specs/
- 实现计划：docs/superpowers/plans/

（如果项目不使用 sps-harness 默认结构，修改上面的路径。/check 和 /sync 会读取这些声明。）

## 功能清单

### 核心功能
- [ ] {{FEATURE_1}}
- [ ] {{FEATURE_2}}

### 辅助功能
- [ ] {{FEATURE_3}}

### 不做（MVP 边界）
- {{NOT_DOING_1}}
- {{NOT_DOING_2}}

（方括号用于 /check 标注完成状态：[ ] 未完成，[x] 已完成，[~] 部分完成）
（"不做"清单同样重要，明确边界可以防止 scope creep）

## 用户流程
{{USER_FLOW}}

**异常流程：**
{{ERROR_FLOWS}}

## 数据模型

### 核心实体
{{ENTITIES}}

### 关键关系
{{RELATIONS}}

（列出主要实体、字段和关系即可，不需要完整的数据库 schema）

## 第三方依赖
{{DEPENDENCIES}}

（API、SDK、外部服务。没有就写"无"。）

## 非功能需求
{{NON_FUNCTIONAL}}

（性能、安全、兼容性、数据量级等。只写对原型设计有影响的约束。）

## AI 系统提示词
<!-- 仅 AI 产品需要此章节。非 AI 产品删除此章节。 -->

### 角色定义
{{AI_ROLE}}

### 工作流程规则
{{AI_WORKFLOW}}

### 回复规范
{{AI_RESPONSE_RULES}}

### 约束条件
{{AI_CONSTRAINTS}}

## 原型策略
- 原型工具：{{PROTOTYPE_TOOL}}
- 技术栈偏好：{{TECH_PREFERENCE}}（留空则由 brainstorming 决定）
- 技术约束：{{TECH_CONSTRAINTS}}
- 说明：brainstorming 和 writing-plans 请参照此策略进行技术选型，确保原型代码可作为成品基础持续迭代，不被推翻重来
