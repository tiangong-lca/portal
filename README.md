---
title: tiangong-lca-portal
docType: guide
scope: repo
status: active
authoritative: false
owner: tiangong-lca-portal
language: zh-CN
whenToUse:
  - when entering the Portal repository
  - when checking the concise product boundary and primary implementation plan
whenToUpdate:
  - when repository purpose, non-goals, implementation status, or primary documentation changes
checkPaths:
  - README.md
  - AGENTS.md
  - docs/design-plan.md
  - package.json
lastReviewedAt: 2026-08-26
lastReviewedCommit: 012bd05588b5dc1102fad708efa4a4e08c2e5eae
related:
  - AGENTS.md
  - docs/design-plan.md
---

# tiangong-lca-portal

天工 LCA 公共数据门户 —— 面向**匿名用户**的全球 LCA 数据发现、理解与比较入口。

## 定位

一个只读的公共检索层：

- **匿名优先**：零注册即可使用全部公共查询与展示能力，用户状态保存在 URL 与浏览器本地。
- **元数据无墙**：公共读取契约内 `state_code=100/200` 数据的允许元数据（存在性、适用性、来源、版本、许可、引用方式）匿名可见；数值能力由明确的公开 publication/许可契约决定。
- **可比性优先于排序**：不输出笼统相关度排名，而是给出匹配理由、代理关系与可比性判定。

## 技术形态

Next.js App Router 前后端同构，React Server Components 优先，部署到 EdgeOne Makers。终端用户没有登录态；EdgeOne 后端以 Portal 专用 HMAC 请求签名调用专用 Supabase Edge Functions（如 `portal_hybrid_search_v1`）。数据库读取使用 server-only 的公共只读契约，不使用 service-role；MVP 分享只使用 URL fragment 与 JSON，不写 Redis。默认浅色/深色主色与 `tiangong-lca-next` 一致，其余颜色遵循 shadcn/ui + Tailwind v4 最佳实践，并支持部署级主色、Logo 与 favicon 替换。

## 非目标（与其他项目的边界）

| 不做                                | 归属                                          |
| ----------------------------------- | --------------------------------------------- |
| 数据导入 / 转换 / 规范化生产        | tiangong-lca-cli · tiangong-lca-data-foundry  |
| 过程规范化合并的政策与人工复核队列  | 上游管线，portal 仅透明呈现聚合结果           |
| 登录体系、购买交易闭环              | 不在本项目范围                                |
| 开发者 API / GraphQL / MCP / Skills | 登录后的 tiangong-lca-next 及既有机器调用项目 |
| 桌面应用 / 文档站                   | tiangong-lca-release · tiangong-lca-next-docs |

## 文档

- [产品与技术方案](docs/design-plan.md) —— 产品、UI、权限、数据契约、SEO、EdgeOne、测试、跨仓交付与仓库 onboarding 的主方案。
- [R0 compatibility matrix](docs/r0/compatibility-matrix.md) 与 [strict CSP/ISR evidence](docs/r0/csp-isr-spike.md) —— 当前发布门及可复现的平台兼容性证据。

## 状态

本地 `main` 已实现 R1 Public Catalog 产品闭环：`zh-CN`/`en` 首页与 Browse、lexical/identifier Search、Process/Flow 精确版本详情、Versions、Exchanges、publication-bound LCIA、确定性比较、引用与本地候选集均通过匿名 public façade；品牌替换、SEO/JSON-LD、分片 sitemap、键盘/主题/200% zoom、隔离上游 fixture、unit/integration 测试、production Playwright 与浏览器 secret scan 已建立。它仍不是公开发布证据：canonical 远端写权限、真实 EdgeOne Preview、跨仓 required main SHA/integration，以及 Next inline Flight script 与严格 CSP/ISR 的 R0 兼容性门尚未完成；详见 [R0 compatibility matrix](docs/r0/compatibility-matrix.md) 与 [R1 release checklist](docs/design-plan.md#235-r1-public-catalog-mvp-release-checklist)。
